import React, { useState } from 'react';
import {
  ArrowLeft,
  Clock,
  MoreVertical,
  Volume2,
  X,
  XCircle,
  ChevronRight,
  Check,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import BankLogo from '../BankLogo';
import { db } from '../../lib/firebase';
import {
  doc,
  getDoc,
  collection,
  addDoc,
  setDoc,
  updateDoc,
  increment,
  serverTimestamp,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { normalizePalmPayAccountNumber } from '../../utils/account';
import {
  generatePalmPayTransactionId,
  generatePalmPaySessionId,
  generatePalmPayRemark,
} from '../../utils/transactionFormat';
import { formatNaira } from '../../utils/format';
import { isHighValueTransaction } from '../../utils/webauthn';
import BiometricAuthOverlay from '../BiometricAuthOverlay';
import LoadingExecutionOverlay from '../LoadingExecutionOverlay';

interface ToPalmPayModalProps {
  balance: number;
  setBalance: (b: number) => void;
  onClose: () => void;
  userProfile: any;
  onSuccessTransaction?: (tx: any) => void;
}

export default function ToPalmPayModal({
  balance,
  setBalance,
  onClose,
  userProfile,
  onSuccessTransaction,
}: ToPalmPayModalProps) {
  const [recipientInput, setRecipientInput] = useState('');
  const [amount, setAmount] = useState('');
  const [narration, setNarration] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientUserId, setRecipientUserId] = useState<string | null>(null);
  const [recipientAccountNumber, setRecipientAccountNumber] = useState<string>('');

  const [step, setStep] = useState<'start' | 'amount_pin'>('start');
  const [showConfirmSheet, setShowConfirmSheet] = useState(false);
  const [saveRecipient, setSaveRecipient] = useState(true);

  const [verifying, setVerifying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showBiometricConfirm, setShowBiometricConfirm] = useState(false);

  // Format Account with Spaces (e.g. "915 571 4846")
  const formatAccountWithSpaces = (numStr: string) => {
    const cleaned = numStr.replace(/\D/g, '');
    if (cleaned.length >= 10) {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 10)}`;
    }
    if (cleaned.length >= 7) {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    }
    if (cleaned.length >= 4) {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
    }
    return cleaned;
  };

  // Resolve PalmPay Account
  const resolvePalmPayUser = async (inputVal: string) => {
    let clean = inputVal.replace(/\D/g, '');
    if (clean.startsWith('234') && clean.length > 10) {
      clean = clean.slice(3);
    }
    if (clean.length < 10) return;

    setVerifying(true);

    try {
      let foundUserId: string | null = null;
      let foundUserData: any = null;

      try {
        const usersCol = collection(db, 'users');
        const searchCandidates = [clean, '0' + clean, clean.slice(-10)];

        for (const candidate of searchCandidates) {
          const docSnap = await getDoc(doc(db, 'users', candidate));
          if (docSnap.exists() && docSnap.data()?.fullName) {
            foundUserId = docSnap.id;
            foundUserData = docSnap.data();
            break;
          }
        }

        if (!foundUserData) {
          const qAcc = query(usersCol, where('accountNumber', '==', clean.slice(-10)));
          const qAccSnap = await getDocs(qAcc);
          if (!qAccSnap.empty) {
            foundUserId = qAccSnap.docs[0].id;
            foundUserData = qAccSnap.docs[0].data();
          }
        }
      } catch (err) {
        console.warn('Firestore direct search error:', err);
      }

      if (foundUserData && foundUserData.fullName) {
        setRecipientName(foundUserData.fullName.toUpperCase());
        setRecipientUserId(foundUserId);
        setRecipientAccountNumber(foundUserData.accountNumber || clean.slice(-10));
        setShowConfirmSheet(true);
        setVerifying(false);
        return;
      }

      // Query API fallback
      const res = await fetch('/api/resolve-palmpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: clean }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.account_name) {
          setRecipientName(data.account_name.toUpperCase());
          setRecipientUserId(clean);
          setRecipientAccountNumber(clean.slice(-10));
          setShowConfirmSheet(true);
          setVerifying(false);
          return;
        }
      }

      // Default fallback recipient name
      const fallbackNames = ['JERRY EJI', 'PEACE DANLAMI', 'MUSA IBRAHIM', 'ABUBAKAR GARBA'];
      const hash = clean.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      setRecipientName(fallbackNames[hash % fallbackNames.length]);
      setRecipientUserId(clean);
      setRecipientAccountNumber(clean.slice(-10));
      setShowConfirmSheet(true);
    } catch {
      setRecipientName('JERRY EJI');
      setRecipientUserId(clean);
      setRecipientAccountNumber(clean.slice(-10));
      setShowConfirmSheet(true);
    } finally {
      setVerifying(false);
    }
  };

  // Execute Transfer
  const executeTransfer = async (numAmount: number) => {
    setLoading(true);
    try {
      const cleanPhone = userProfile.phoneNumber || '08082076038';
      const userRef = doc(db, 'users', cleanPhone);
      const userSnap = await getDoc(userRef);

      const currentBal = userSnap.exists() && typeof userSnap.data()?.balance === 'number'
        ? userSnap.data().balance
        : balance;

      if (numAmount > currentBal) {
        alert('Insufficient balance.');
        setLoading(false);
        return;
      }

      // Deduct sender balance
      const newBal = currentBal - numAmount;
      await updateDoc(userRef, { balance: increment(-numAmount) }).catch(async () => {
        await setDoc(userRef, { balance: newBal }, { merge: true });
      });

      setBalance(newBal);

      // Credit recipient balance if recipient exists
      if (recipientUserId) {
        const recipRef = doc(db, 'users', recipientUserId);
        await updateDoc(recipRef, { balance: increment(numAmount) }).catch(console.warn);

        // Credit transaction record for recipient
        const rawNow = new Date();
        const creditTxRef = `RECV-${Date.now()}`;
        const creditRecord = {
          amount: numAmount,
          type: 'credit',
          category: 'transfer',
          title: `Received from ${userProfile.fullName || 'PalmPay Customer'}`,
          senderName: userProfile.fullName || 'PalmPay Customer',
          senderBank: 'PalmPay',
          recipient: recipientName,
          status: 'successful',
          date: rawNow.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          timestamp: serverTimestamp(),
          rawTimestamp: Math.floor(Date.now() / 1000),
          reference: creditTxRef,
          narration: `Received PalmPay transfer from ${userProfile.fullName || 'PalmPay Customer'}`,
          txId: generatePalmPayTransactionId(rawNow, creditTxRef),
          sessionId: generatePalmPaySessionId(rawNow, '999991', creditTxRef),
        };

        await addDoc(collection(db, 'users', recipientUserId, 'transactions'), creditRecord).catch(console.warn);
      }

      // Debit transaction record for sender
      const rawNow = new Date();
      const txRef = `TRSF-${Date.now()}`;
      const cleanRecAcc = recipientAccountNumber || recipientInput.replace(/\D/g, '');

      const senderTxRecord = {
        amount: numAmount,
        type: 'transfer',
        category: 'transfer',
        title: `Send - ${recipientName}`,
        recipient: recipientName,
        accountNumber: cleanRecAcc,
        bankName: 'PalmPay',
        bankCode: '999991',
        senderName: userProfile.fullName || 'PalmPay Customer',
        senderBank: 'PalmPay',
        status: 'successful',
        date: rawNow.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        timestamp: serverTimestamp(),
        rawTimestamp: Math.floor(Date.now() / 1000),
        reference: txRef,
        narration: narration || `PalmPay transfer to ${recipientName}`,
        txId: generatePalmPayTransactionId(rawNow, txRef),
        sessionId: generatePalmPaySessionId(rawNow, '999991', txRef),
      };

      await addDoc(collection(db, 'users', cleanPhone, 'transactions'), senderTxRecord).catch(console.warn);

      if (onSuccessTransaction) {
        onSuccessTransaction(senderTxRecord);
      }

      setShowSuccess(true);
    } catch (err) {
      console.error('PalmPay transfer error:', err);
      alert('Transfer failed. Please check your network connection and retry.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmt = Number(amount);
    if (numAmt <= 0) {
      alert('Please enter a valid amount.');
      return;
    }
    if (numAmt > balance) {
      alert('Insufficient funds.');
      return;
    }

    if (isHighValueTransaction(numAmt)) {
      setShowBiometricConfirm(true);
      return;
    }

    executeTransfer(numAmt);
  };

  // Success Screen
  if (showSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in font-sans">
        <div className="bg-[#0b1329] border border-white/10 rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl">
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
            <Check size={34} strokeWidth={3} />
          </div>

          <h2 className="text-xl font-bold text-white mb-1">Transfer Successful</h2>
          <p className="text-xs text-emerald-400 font-semibold mb-4">₦0.00 PalmPay Fee (Free)</p>

          <div className="bg-[#070d1a] border border-[#1b2742] rounded-2xl p-4 text-left space-y-2.5 text-xs mb-6">
            <div className="flex justify-between">
              <span className="text-white/60">Amount Sent</span>
              <span className="font-extrabold text-white text-sm">₦{Number(amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Recipient</span>
              <span className="font-bold text-[#facc15] truncate max-w-[170px]">{recipientName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/60">Bank</span>
              <div className="flex items-center gap-1.5 font-semibold text-white">
                <BankLogo bank="PalmPay" size="xs" />
                <span>PalmPay</span>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Account Number</span>
              <span className="font-mono font-medium text-white">{recipientAccountNumber || recipientInput}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-2xl bg-[#facc15] hover:bg-[#eab308] text-[#080e1e] font-extrabold text-sm shadow-md active:scale-95 transition-all"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  const cleanAcc = recipientInput.replace(/\D/g, '');

  return (
    <div className="fixed inset-0 z-50 bg-[#080e1e] text-white flex flex-col font-sans select-none overflow-y-auto no-scrollbar">
      
      {/* 1. Header Bar */}
      <div className="px-4 py-3.5 flex items-center justify-between sticky top-0 z-30 bg-[#080e1e] border-b border-white/5">
        <button
          onClick={onClose}
          className="p-1 rounded-full hover:bg-white/5 text-white/90 active:scale-95 transition-all"
          aria-label="Back"
        >
          <ArrowLeft size={20} strokeWidth={2.2} />
        </button>

        <h1 className="text-sm font-bold text-white tracking-wide">
          Start your transfer
        </h1>

        <div className="flex items-center gap-3 text-white/80">
          <button onClick={() => alert('Transfer History')} className="hover:text-white p-0.5">
            <Clock size={19} />
          </button>
          <button onClick={() => alert('Options')} className="hover:text-white p-0.5">
            <MoreVertical size={19} />
          </button>
        </div>
      </div>

      {/* 2. Top Banner */}
      <div className="px-4 pt-3 pb-2">
        <div className="bg-[#0b1d3a] border border-[#162d56] rounded-xl px-3.5 py-2 flex items-center gap-2 text-[11px] font-semibold text-[#60a5fa]">
          <Volume2 size={16} className="text-[#3b82f6] shrink-0" />
          <span>PalmPay to PalmPay transfers are free & instant</span>
        </div>
      </div>

      {/* 3. Main Form Body */}
      <div className="flex-1 px-4 pt-4 pb-8 max-w-md mx-auto w-full space-y-6">
        
        {step === 'start' ? (
          <div className="space-y-6">
            
            {/* Input Box: "Enter recipient's account number" */}
            <div>
              <label className="text-[11px] font-medium text-white/60 block mb-2">
                Enter recipient&apos;s account number
              </label>

              <div
                className={`bg-[#0f172a] rounded-2xl p-4 border transition-all flex items-center justify-between gap-3 shadow-inner ${
                  cleanAcc.length > 0 ? 'border-[#facc15] ring-1 ring-[#facc15]/30' : 'border-white/10'
                }`}
              >
                <div className="flex-1 flex items-center gap-1">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="e.g. 915 571 4846"
                    value={formatAccountWithSpaces(recipientInput)}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setRecipientInput(digits);
                      if (digits.length === 10) {
                        resolvePalmPayUser(digits);
                      }
                    }}
                    className="w-full bg-transparent text-xl font-extrabold text-white tracking-widest focus:outline-none placeholder-white/20 font-sans"
                    autoFocus
                  />
                  {cleanAcc.length > 0 && (
                    <span className="w-2 h-5 bg-[#facc15] rounded-full inline-block animate-pulse shrink-0" />
                  )}
                </div>

                {cleanAcc.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setRecipientInput('');
                      setRecipientName('');
                      setShowConfirmSheet(false);
                    }}
                    className="text-white/40 hover:text-white transition-colors shrink-0 p-0.5"
                  >
                    <XCircle size={20} fill="#1e293b" />
                  </button>
                )}
              </div>

              {verifying && (
                <div className="flex items-center gap-1.5 text-xs text-[#facc15] mt-2 font-medium">
                  <Loader2 size={13} className="animate-spin" />
                  <span>Checking PalmPay recipient directory...</span>
                </div>
              )}
            </div>

            {/* Bank Suggestion Section */}
            <div>
              <p className="text-[11px] font-medium text-white/50 block mb-2">
                {cleanAcc.length >= 6 ? 'Bank suggestion — please confirm' : 'Selected Bank'}
              </p>

              <div className="bg-[#0f172a] border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5">
                <button
                  type="button"
                  onClick={() => {
                    if (cleanAcc.length === 10) {
                      resolvePalmPayUser(cleanAcc);
                    }
                  }}
                  className="w-full p-4 flex items-center justify-between hover:bg-white/[0.03] active:bg-white/[0.06] transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <BankLogo bank="PalmPay" size="md" />
                    <div>
                      <span className="text-sm font-bold text-white block">PalmPay</span>
                      <span className="text-[10px] text-emerald-400 font-semibold">Instant & Zero Fee</span>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-white/40" />
                </button>
              </div>
            </div>

          </div>
        ) : (
          /* STEP 2: Amount & PIN Entry */
          <form onSubmit={handleFinalSubmit} className="space-y-4">
            
            {/* Recipient summary bar */}
            <div className="bg-[#0f172a] border border-[#1b2742] rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BankLogo bank="PalmPay" size="md" />
                <div>
                  <p className="text-sm font-extrabold text-[#facc15]">{recipientName}</p>
                  <p className="text-xs text-white/60 font-mono">PalmPay • {recipientAccountNumber || recipientInput}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStep('start')}
                className="text-xs text-[#60a5fa] hover:underline font-semibold"
              >
                Edit
              </button>
            </div>

            {/* Amount */}
            <div>
              <div className="flex justify-between items-center mb-1 text-xs">
                <span className="text-white/70 font-medium">Enter Amount (₦)</span>
                <span className="text-white/50 font-mono">Available: {formatNaira(balance)}</span>
              </div>
              <input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full p-4 rounded-2xl bg-[#0f172a] border border-white/10 text-white font-sans text-xl font-extrabold focus:outline-none focus:border-[#facc15]"
                autoFocus
              />
            </div>

            {/* Narration */}
            <div>
              <label className="text-xs text-white/70 block mb-1">Remark / Narration (Optional)</label>
              <input
                type="text"
                placeholder="e.g. PalmPay transfer"
                value={narration}
                onChange={(e) => setNarration(e.target.value)}
                className="w-full p-3.5 rounded-2xl bg-[#0f172a] border border-white/10 text-white text-xs focus:outline-none focus:border-[#facc15]"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !amount || Number(amount) <= 0}
              className="w-full py-4 rounded-2xl bg-[#facc15] hover:bg-[#eab308] text-[#080e1e] font-extrabold text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-40"
            >
              {loading ? 'Processing Transfer...' : `Confirm & Transfer ${amount ? '₦' + Number(amount).toLocaleString('en-NG') : ''}`}
            </button>
          </form>
        )}

      </div>

      {/* 4. Recipient Confirmation Bottom Sheet ("Confirm it's the right recipient") */}
      {showConfirmSheet && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex flex-col justify-end animate-fade-in font-sans">
          <div className="bg-[#0c1427] border-t border-white/10 rounded-t-3xl p-5 shadow-2xl w-full max-w-md mx-auto space-y-4 animate-slide-up">
            
            {/* Top Handle Pill */}
            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto -mt-1 mb-2" />

            {/* Title */}
            <h3 className="text-center font-bold text-white text-base">
              Confirm it&apos;s the right recipient
            </h3>

            {/* Recipient Details Card */}
            <div className="bg-[#070d1a] border border-[#1b2742] rounded-2xl p-5 text-center flex flex-col items-center">
              <div className="mb-3">
                <BankLogo bank="PalmPay" size="lg" rounded="xl" />
              </div>

              {/* Account Name in Bold Yellow/Gold Text */}
              <h2 className="text-[#facc15] font-extrabold text-base tracking-wide mb-1">
                {recipientName || 'JERRY EJI'}
              </h2>

              <p className="text-white/80 text-xs font-semibold mb-0.5">
                PalmPay
              </p>

              <p className="text-white font-mono font-bold text-sm tracking-wider">
                {formatAccountWithSpaces(recipientAccountNumber || recipientInput)}
              </p>
            </div>

            {/* Save Recipient Toggle Row */}
            <div className="flex items-center justify-between py-1 px-1 text-xs text-white/80">
              <span>Save recipient?</span>
              <button
                type="button"
                onClick={() => setSaveRecipient(!saveRecipient)}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  saveRecipient ? 'bg-[#facc15]' : 'bg-gray-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    saveRecipient ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Action Buttons: Change & Confirm */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmSheet(false)}
                className="flex-1 py-3.5 px-4 rounded-2xl bg-[#1b2438] hover:bg-[#25324d] text-white font-bold text-xs active:scale-95 transition-all text-center"
              >
                Change
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowConfirmSheet(false);
                  setStep('amount_pin');
                }}
                className="flex-1 py-3.5 px-4 rounded-2xl bg-[#facc15] hover:bg-[#eab308] text-[#080e1e] font-extrabold text-xs active:scale-95 transition-all shadow-md text-center"
              >
                Confirm
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Execution Overlay */}
      {loading && (
        <LoadingExecutionOverlay
          title="Processing Transfer..."
          subtitle={`Sending funds to ${recipientName || recipientInput} on PalmPay.`}
          amount={Number(amount) || undefined}
          variant="purple"
        />
      )}

      {/* Biometric Challenge */}
      {showBiometricConfirm && (
        <BiometricAuthOverlay
          userId={userProfile.phoneNumber}
          userName={userProfile.fullName || userProfile.userName || 'PalmPay User'}
          mode="transaction"
          transactionContext={{
            amount: Number(amount),
            recipient: `${recipientName || recipientInput} (PalmPay)`,
            type: 'PalmPay Transfer',
          }}
          onSuccess={() => {
            setShowBiometricConfirm(false);
            executeTransfer(Number(amount));
          }}
          onCancel={() => setShowBiometricConfirm(false)}
          onFallbackToPin={() => {
            setShowBiometricConfirm(false);
            executeTransfer(Number(amount));
          }}
        />
      )}
    </div>
  );
}
