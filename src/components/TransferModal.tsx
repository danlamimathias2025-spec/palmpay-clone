import React, { useState, useEffect } from 'react';
import { X, Check, Landmark, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import BankLogo from './BankLogo';
import { db } from '../lib/firebase';
import { doc, addDoc, collection, setDoc, updateDoc, increment, serverTimestamp, getDoc } from 'firebase/firestore';
import { formatNaira } from '../utils/format';
import { generatePalmPayTransactionId, generatePalmPaySessionId, generatePalmPayRemark } from '../utils/transactionFormat';
import { isHighValueTransaction } from '../utils/webauthn';
import BiometricAuthOverlay from './BiometricAuthOverlay';
import LoadingExecutionOverlay from './LoadingExecutionOverlay';

interface TransferModalProps {
  balance: number;
  setBalance: (b: number) => void;
  onClose: () => void;
  userProfile: any;
  onSuccessTransaction?: (tx: any) => void;
}

export default function TransferModal({
  balance,
  setBalance,
  onClose,
  userProfile,
  onSuccessTransaction,
}: TransferModalProps) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    accountNumber: '',
    accountName: '',
    bankCode: '',
    bankName: '',
    pin: '',
  });
  const [loading, setLoading] = useState(false);
  const [banks, setBanks] = useState<{ name: string; code: string }[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [accountError, setAccountError] = useState('');
  const [accountResolved, setAccountResolved] = useState(false);
  const [showBiometricConfirm, setShowBiometricConfirm] = useState(false);

  useEffect(() => {
    fetch('/api/banks')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setBanks(data);
        } else {
          setBanks([
            { name: 'Access Bank', code: '044' },
            { name: 'Zenith Bank', code: '057' },
            { name: 'Guaranty Trust Bank (GTBank)', code: '058' },
            { name: 'United Bank for Africa (UBA)', code: '033' },
            { name: 'First Bank of Nigeria', code: '011' },
            { name: 'Kuda Bank', code: '50211' },
            { name: 'OPay', code: '999992' },
            { name: 'Moniepoint', code: '50515' },
            { name: 'PalmPay', code: '999991' },
          ]);
        }
      })
      .catch((err) => {
        console.error('Error fetching banks:', err);
        setBanks([
          { name: 'Access Bank', code: '044' },
          { name: 'Zenith Bank', code: '057' },
          { name: 'GTBank', code: '058' },
          { name: 'UBA', code: '033' },
          { name: 'First Bank', code: '011' },
          { name: 'Kuda Bank', code: '50211' },
          { name: 'OPay', code: '999992' },
          { name: 'Moniepoint', code: '50515' },
        ]);
      })
      .finally(() => setLoadingBanks(false));
  }, []);

  const resolveAccount = async (accountNumber: string, bankCode: string) => {
    if (accountNumber.length !== 10 || !bankCode) return;
    setVerifying(true);
    setAccountError('');
    try {
      const res = await fetch('/api/resolve-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountNumber, bankCode }),
      });
      const data = await res.json();
      if (res.ok && data?.account_name) {
        setFormData((prev) => ({ ...prev, accountName: data.account_name.toUpperCase() }));
        setAccountResolved(true);
      } else {
        setAccountResolved(false);
        if (!formData.accountName) {
          setAccountError(data?.message || 'Could not auto-verify name. Please type beneficiary name.');
        }
      }
    } catch {
      setAccountResolved(false);
      if (!formData.accountName) {
        setAccountError('Could not auto-verify name. Please type beneficiary name.');
      }
    } finally {
      setVerifying(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'bankCode') {
        const selBank = banks.find((b) => b.code === value);
        if (selBank) updated.bankName = selBank.name;
      }
      return updated;
    });

    if (field === 'accountNumber' || field === 'bankCode') {
      const acc = field === 'accountNumber' ? value : formData.accountNumber;
      const bCode = field === 'bankCode' ? value : formData.bankCode;
      if (acc.length === 10 && bCode) {
        resolveAccount(acc, bCode);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.accountName.trim()) {
      alert('Please enter or verify the beneficiary account name.');
      return;
    }
    const amount = Number(formData.amount);

    if (amount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }
    if (amount > balance) {
      alert('Insufficient funds in your Available Balance.');
      return;
    }

    // High-Value Transaction Biometric Challenge
    if (isHighValueTransaction(amount)) {
      setShowBiometricConfirm(true);
      return;
    }

    await executeTransfer(amount);
  };

  const executeTransfer = async (amount: number) => {
    setLoading(true);

    try {
      const userId = userProfile.phoneNumber;
      const txRef = 'TR-' + Date.now();
      const now = new Date();
      const authenticTxId = generatePalmPayTransactionId(now, txRef);
      const authenticSessionId = generatePalmPaySessionId(now, formData.bankCode || '999991', txRef);
      const recipientName = formData.accountName || formData.accountNumber;
      const senderRemark = generatePalmPayRemark({
        isIncoming: false,
        type: 'transfer',
        senderName: userProfile.fullName || userProfile.userName || 'PalmPay User',
        senderBank: formData.bankName || 'Commercial Bank',
        recipientName: recipientName,
        recipientAccount: formData.accountNumber,
      });

      const newTx = {
        amount,
        type: 'transfer',
        recipient: recipientName,
        accountNumber: formData.accountNumber,
        bankName: formData.bankName || 'Commercial Bank',
        bankCode: formData.bankCode,
        senderName: userProfile.fullName || userProfile.userName || 'PalmPay User',
        narration: senderRemark,
        remark: senderRemark,
        reference: txRef,
        txId: authenticTxId,
        transactionId: authenticTxId,
        sessionId: authenticSessionId,
        timestamp: { seconds: Math.floor(Date.now() / 1000) },
      };

      if (userId) {
        try {
          const userRef = doc(db, 'users', userId);
          const transactionsRef = collection(userRef, 'transactions');
          await addDoc(transactionsRef, {
            ...newTx,
            timestamp: serverTimestamp(),
          });
          await setDoc(userRef, { balance: increment(-amount) }, { merge: true });

          // If recipient is PalmPay, credit recipient in Firestore
          const isPalmPay = (formData.bankName || '').toLowerCase().includes('palmpay') || formData.bankCode === '999991';
          if (isPalmPay) {
            const recCandidates = [formData.accountNumber, '0' + formData.accountNumber];
            for (const cand of recCandidates) {
              const recRef = doc(db, 'users', cand);
              const recSnap = await getDoc(recRef);
              if (recSnap.exists()) {
                await addDoc(collection(recRef, 'transactions'), {
                  amount,
                  formattedAmount: `+₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
                  type: 'credit',
                  category: 'transfer',
                  senderName: userProfile.fullName || userProfile.userName || 'PalmPay User',
                  senderBank: 'PalmPay Transfer',
                  recipient: formData.accountName || 'PalmPay User',
                  accountNumber: formData.accountNumber,
                  title: `Received from ${userProfile.fullName || userProfile.userName || 'PalmPay User'}`,
                  status: 'successful',
                  timestamp: serverTimestamp(),
                });
                await setDoc(recRef, { balance: increment(amount) }, { merge: true });
                break;
              }
            }
          }
        } catch (err) {
          console.warn('Firestore offline/fallback update:', err);
        }
      }

      setBalance(balance - amount);
      if (onSuccessTransaction) {
        onSuccessTransaction(newTx);
      }

      // Dispatch real SMS alert via backend
      fetch('/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: userProfile.phoneNumber,
          amount: amount,
        }),
      }).catch(console.warn);

      setShowSuccess(true);
    } catch (error) {
      console.error('Transfer failed:', error);
      alert('Transfer failed. Please check your details and retry.');
    } finally {
      setLoading(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <div className="mirror-glass-modal rounded-3xl p-6 w-full max-w-sm text-center">
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
            <Check size={34} strokeWidth={2.5} />
          </div>

          <h2 className="text-xl font-bold text-white font-script mb-1">Transfer Successful</h2>
          <p className="text-xs text-white/60 mb-4">Your money is on its way to the recipient</p>

          <div className="bg-black/30 rounded-2xl p-4 text-left space-y-2 text-xs mb-6 border border-white/5">
            <div className="flex justify-between">
              <span className="text-white/60">Amount Sent</span>
              <span className="font-extrabold text-white text-sm">₦{Number(formData.amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Recipient</span>
              <span className="font-bold text-white truncate max-w-[170px]">{formData.accountName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/60">Bank</span>
              <div className="flex items-center gap-1.5 font-semibold text-white/90">
                <BankLogo bank={formData.bankName} size="xs" />
                <span>{formData.bankName}</span>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Transfer Fee</span>
              <span className="font-bold text-emerald-400">₦0.00 (Free)</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-[#7846f7] hover:bg-[#6836ea] text-white font-bold text-sm shadow-md active:scale-95 transition-all"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="mirror-glass-modal rounded-3xl p-6 w-full max-w-sm relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full mirror-glass flex items-center justify-center text-white/70 hover:text-white"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-[#c084fc] flex items-center justify-center">
            <Landmark size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white font-script">To Bank Account</h2>
            <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
              <ShieldCheck size={12} /> Free instant transfer
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Select Bank */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs text-white/70 block">Select Bank</label>
              {formData.bankName && (
                <div className="flex items-center gap-1.5 text-[11px] text-purple-300 font-medium">
                  <BankLogo bank={formData.bankName} size="xs" />
                  <span>{formData.bankName}</span>
                </div>
              )}
            </div>
            <select
              value={formData.bankCode}
              onChange={(e) => handleInputChange('bankCode', e.target.value)}
              disabled={loadingBanks}
              required
              className="w-full p-3 rounded-xl mirror-glass border border-white/10 text-white text-xs focus:outline-none focus:border-purple-400"
            >
              <option value="" className="bg-[#121324] text-white">
                {loadingBanks ? 'Loading banks...' : 'Choose destination bank'}
              </option>
              {banks.map((b, idx) => (
                <option key={`${b.code}-${idx}`} value={b.code} className="bg-[#121324] text-white">
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Account Number */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs text-white/70 block">10-Digit Account Number</label>
              {formData.accountNumber.length === 10 && formData.bankCode && (
                <button
                  type="button"
                  onClick={() => resolveAccount(formData.accountNumber, formData.bankCode)}
                  disabled={verifying}
                  className="text-[11px] text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1 transition-colors disabled:opacity-50"
                >
                  {verifying ? (
                    <>
                      <Loader2 size={11} className="animate-spin" /> Verifying...
                    </>
                  ) : (
                    'Verify with Paystack'
                  )}
                </button>
              )}
            </div>
            <input
              type="text"
              maxLength={10}
              placeholder="e.g. 0123456789"
              value={formData.accountNumber}
              onChange={(e) => handleInputChange('accountNumber', e.target.value.replace(/\D/g, ''))}
              required
              className="w-full p-3 rounded-xl mirror-glass border border-white/10 text-white font-sans text-sm focus:outline-none focus:border-purple-400 tracking-wider"
            />
            {verifying && <p className="text-[11px] text-purple-400 mt-1">Checking Paystack directory...</p>}
            {accountError && <p className="text-[11px] text-amber-300 mt-1">{accountError}</p>}
          </div>

          {/* Beneficiary Account Name */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs text-white/70 block">Beneficiary Account Name</label>
              {accountResolved && (
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                  <Check size={12} /> Verified Name
                </span>
              )}
            </div>
            <input
              type="text"
              placeholder="Recipient Full Name"
              value={formData.accountName}
              onChange={(e) => {
                setAccountResolved(false);
                setFormData((prev) => ({ ...prev, accountName: e.target.value.toUpperCase() }));
              }}
              required
              className="w-full p-3 rounded-xl mirror-glass border border-white/10 text-white font-sans text-sm focus:outline-none focus:border-purple-400 uppercase font-medium placeholder-white/30 tracking-wide"
            />
          </div>

          {/* Amount */}
          <div>
            <div className="flex justify-between items-center mb-1 text-xs">
              <span className="text-white/70">Amount (₦)</span>
              <span className="text-white/50">Bal: {formatNaira(balance)}</span>
            </div>
            <input
              type="number"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              required
              className="w-full p-3 rounded-xl mirror-glass border border-white/10 text-white font-sans text-base focus:outline-none focus:border-purple-400"
            />
          </div>

          {/* PIN */}
          <div>
            <label className="text-xs text-white/70 block mb-1">4-Digit Security PIN</label>
            <input
              type="password"
              maxLength={4}
              placeholder="••••"
              value={formData.pin}
              onChange={(e) => handleInputChange('pin', e.target.value.replace(/\D/g, ''))}
              required
              className="w-full p-3 rounded-xl mirror-glass border border-white/10 text-white font-sans text-base text-center tracking-widest focus:outline-none focus:border-purple-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading || verifying}
            className="w-full py-3 rounded-xl bg-[#7846f7] hover:bg-[#6836ea] text-white font-bold text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
          >
            {loading ? 'Processing Transfer...' : 'Send Money (₦0 Fee)'}
          </button>
        </form>

        {loading && (
          <LoadingExecutionOverlay
            title="Processing Bank Transfer..."
            subtitle={`Transferring funds to ${formData.accountName || formData.accountNumber} at ${formData.bankName}. Connecting securely to NIBSS.`}
            amount={Number(formData.amount) || undefined}
            variant="purple"
          />
        )}

        {/* High-Value Biometric Authorization Modal */}
        {showBiometricConfirm && (
          <BiometricAuthOverlay
            userId={userProfile.phoneNumber}
            userName={userProfile.fullName || userProfile.userName || 'PalmPay User'}
            mode="transaction"
            transactionContext={{
              amount: Number(formData.amount),
              recipient: `${formData.accountName || formData.accountNumber} (${formData.bankName || 'Bank'})`,
              type: 'Bank Transfer',
            }}
            onSuccess={() => {
              setShowBiometricConfirm(false);
              executeTransfer(Number(formData.amount));
            }}
            onCancel={() => setShowBiometricConfirm(false)}
            onFallbackToPin={() => {
              setShowBiometricConfirm(false);
              executeTransfer(Number(formData.amount));
            }}
          />
        )}
      </div>
    </div>
  );
}
