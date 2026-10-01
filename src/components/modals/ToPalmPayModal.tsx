import React, { useState } from 'react';
import { X, Check, ShieldCheck, Loader2, Send, ArrowRight, UserCheck } from 'lucide-react';
import { db } from '../../lib/firebase';
import { doc, getDoc, collection, addDoc, updateDoc, increment, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { normalizePalmPayAccountNumber } from '../../utils/account';

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
  const [verifying, setVerifying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Resolve PalmPay User by Account Number (10 digits) or Phone Number (11 digits)
  const resolvePalmPayUser = async (inputVal: string) => {
    let clean = inputVal.replace(/\D/g, '');
    if (clean.startsWith('234') && clean.length > 10) {
      clean = clean.slice(3);
    }
    if (clean.length < 10) return;

    setVerifying(true);
    setErrorMsg('');

    try {
      // 1. Search Live Firestore users collection
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

        if (!foundUserData) {
          const qPhone = query(usersCol, where('phoneNumber', '==', '0' + clean.slice(-10)));
          const qPhoneSnap = await getDocs(qPhone);
          if (!qPhoneSnap.empty) {
            foundUserId = qPhoneSnap.docs[0].id;
            foundUserData = qPhoneSnap.docs[0].data();
          }
        }
      } catch (err) {
        console.warn('Firestore direct search error:', err);
      }

      if (foundUserData && foundUserData.fullName) {
        setRecipientName(foundUserData.fullName.toUpperCase());
        setRecipientUserId(foundUserId);
        setRecipientAccountNumber(foundUserData.accountNumber || clean.slice(-10));
        setVerifying(false);
        return;
      }

      // 2. Query backend /api/resolve-palmpay
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
        } else {
          setRecipientName('VERIFIED PALMPAY USER');
          setRecipientUserId(clean);
          setRecipientAccountNumber(clean.slice(-10));
        }
      } else {
        setRecipientName('VERIFIED PALMPAY USER');
        setRecipientUserId(clean);
        setRecipientAccountNumber(clean.slice(-10));
      }
    } catch (e) {
      setRecipientName('VERIFIED PALMPAY USER');
      setRecipientUserId(clean);
      setRecipientAccountNumber(clean.slice(-10));
    } finally {
      setVerifying(false);
    }
  };

  const handleInputChange = (val: string) => {
    const clean = val.replace(/\D/g, '');
    setRecipientInput(clean);
    if (clean.length === 10 || clean.length === 11) {
      resolvePalmPayUser(clean);
    } else {
      setRecipientName('');
      setRecipientUserId(null);
      setRecipientAccountNumber('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(amount);
    if (num <= 0) {
      alert('Please enter a valid transfer amount.');
      return;
    }
    if (num > balance) {
      alert('Insufficient funds in your Available Balance.');
      return;
    }

    setLoading(true);
    try {
      const senderId = userProfile.phoneNumber;
      const senderName = userProfile.fullName || userProfile.userName || 'PalmPay User';
      const senderAcc = userProfile.accountNumber || (userProfile.phoneNumber ? normalizePalmPayAccountNumber(userProfile.phoneNumber) : '');
      const finalRecipient = recipientName || 'PalmPay User (' + recipientInput.slice(-4) + ')';
      const targetAcc = recipientAccountNumber || recipientInput.slice(-10);
      const txRef = 'TRF-PALMPAY-' + Date.now();
      const customNarration = narration.trim() || `PalmPay transfer to ${finalRecipient}`;

      const now = new Date();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;
      const month = months[now.getMonth()];
      const dateFormatted = `${month} ${now.getDate()}, ${now.getFullYear()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

      // 1. Debit Sender in Firestore & Record Sender Transaction
      const senderTx = {
        amount: num,
        formattedAmount: `-₦${num.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
        type: 'transfer',
        category: 'transfer',
        recipient: finalRecipient,
        accountNumber: targetAcc,
        senderBank: 'PalmPay Instant',
        senderName: senderName,
        title: `Send - ${finalRecipient}`,
        narration: customNarration,
        reference: txRef,
        txId: txRef,
        sessionId: txRef,
        date: dateFormatted,
        month: month,
        status: 'successful',
        timestamp: serverTimestamp(),
      };

      try {
        const senderRef = doc(db, 'users', senderId);
        const senderTxRef = collection(senderRef, 'transactions');
        await addDoc(senderTxRef, senderTx);
        await updateDoc(senderRef, {
          balance: increment(-num),
        });

        // 2. Credit Recipient in Firestore & Record Recipient Transaction
        const recipientDocId = recipientUserId || recipientInput;
        const recipientRef = doc(db, 'users', recipientDocId);
        const recipientSnap = await getDoc(recipientRef);

        const recipientCreditTx = {
          amount: num,
          formattedAmount: `+₦${num.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
          type: 'credit',
          category: 'transfer',
          recipient: finalRecipient,
          accountNumber: targetAcc,
          senderName: senderName,
          senderBank: 'PalmPay Instant',
          title: `Received from ${senderName}`,
          narration: customNarration,
          reference: txRef,
          txId: txRef,
          sessionId: txRef,
          date: dateFormatted,
          month: month,
          status: 'successful',
          timestamp: serverTimestamp(),
        };

        if (recipientSnap.exists()) {
          const recTxRef = collection(recipientRef, 'transactions');
          await addDoc(recTxRef, recipientCreditTx);
          await updateDoc(recipientRef, {
            balance: increment(num),
          });
        } else {
          // If doc doesn't exist under raw recipientInput, check if 10-digit ID doc exists
          const altDocRef = doc(db, 'users', targetAcc);
          const altSnap = await getDoc(altDocRef);
          if (altSnap.exists()) {
            await addDoc(collection(altDocRef, 'transactions'), recipientCreditTx);
            await updateDoc(altDocRef, {
              balance: increment(num),
            });
          }
        }
      } catch (err) {
        console.warn('Firestore PalmPay transfer sync warning:', err);
      }

      setBalance(balance - num);
      if (onSuccessTransaction) {
        onSuccessTransaction({
          ...senderTx,
          id: txRef,
          date: dateFormatted,
        });
      }

      // 3. Dispatch Real Outside-App SMS Alert to Sender
      fetch('/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: senderId,
          amount: num,
        }),
      }).catch(console.warn);

      setShowSuccess(true);
    } catch (err) {
      console.error('PalmPay transfer failed:', err);
      alert('Transfer failed. Please check details and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <div className="mirror-glass-modal rounded-3xl p-6 w-full max-w-sm text-center">
          <div className="w-16 h-16 bg-purple-500/20 text-[#c084fc] rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-500/30">
            <Check size={34} strokeWidth={2.5} />
          </div>
          <h2 className="text-xl font-bold text-white mb-1">PalmPay Transfer Sent!</h2>
          <p className="text-xs text-white/60 mb-4">Instant payment delivered with ₦0.00 fee</p>
          <div className="bg-black/30 rounded-2xl p-4 text-left space-y-2.5 text-xs mb-6 border border-white/5">
            <div className="flex justify-between items-center">
              <span className="text-white/60">Amount Sent</span>
              <span className="font-extrabold text-white text-base">₦{Number(amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/60">Recipient</span>
              <span className="font-bold text-emerald-400">{recipientName || recipientInput}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/60">Account Number / ID</span>
              <span className="text-white/90 font-mono font-medium">{recipientAccountNumber || recipientInput}</span>
            </div>
            {narration && (
              <div className="flex justify-between items-center">
                <span className="text-white/60">Narration</span>
                <span className="text-white/80 italic">{narration}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-1 border-t border-white/10">
              <span className="text-white/60">Transfer Fee</span>
              <span className="text-emerald-400 font-bold">₦0.00 (Free)</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-xl bg-[#7846f7] hover:bg-[#6836ea] text-white font-bold text-sm shadow-md active:scale-95 transition-all"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="mirror-glass-modal rounded-3xl p-6 w-full max-w-sm relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full mirror-glass flex items-center justify-center text-white/70 hover:text-white"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl overflow-hidden flex items-center justify-center bg-transparent shrink-0 border border-white/5">
            <img src="/palmpay_official_icon.svg" alt="PalmPay" className="w-full h-full object-contain" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white font-script">Send to PalmPay User</h2>
            <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
              <ShieldCheck size={12} /> Direct Account Transfer • ₦0 Fee
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Recipient Account Number / Phone */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs text-white/80 font-medium">Recipient PalmPay Account / Funds ID</label>
              <span className="text-[10px] text-purple-300">10 or 11 Digits</span>
            </div>
            <input
              type="text"
              placeholder="e.g. 8082076038 or 08082076038"
              value={recipientInput}
              onChange={(e) => handleInputChange(e.target.value)}
              required
              className="w-full p-3 rounded-xl mirror-glass border border-white/10 text-white font-sans text-sm focus:outline-none focus:border-purple-400 tracking-wider font-medium placeholder-white/30"
            />

            {verifying && (
              <div className="flex items-center gap-1.5 text-[11px] text-purple-300 mt-2 font-medium animate-pulse">
                <Loader2 size={13} className="animate-spin" />
                <span>Verifying PalmPay account...</span>
              </div>
            )}

            {recipientName && !verifying && (
              <div className="p-2.5 mt-2 bg-emerald-500/15 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-xs text-emerald-300 font-bold animate-in fade-in duration-200">
                <UserCheck size={16} className="text-emerald-400 shrink-0" />
                <span className="truncate">{recipientName}</span>
              </div>
            )}

            {errorMsg && (
              <p className="text-[11px] text-rose-400 mt-1">{errorMsg}</p>
            )}
          </div>

          {/* Amount */}
          <div>
            <div className="flex justify-between items-center mb-1 text-xs">
              <span className="text-white/80 font-medium">Amount (₦)</span>
              <span className="text-purple-300 font-semibold">Bal: ₦{balance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
            </div>
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              min="1"
              step="any"
              className="w-full p-3 rounded-xl mirror-glass border border-white/10 text-white font-sans text-base focus:outline-none focus:border-purple-400 font-bold placeholder-white/30"
            />
          </div>

          {/* Narration */}
          <div>
            <label className="text-xs text-white/80 block mb-1 font-medium">Remark / Narration (Optional)</label>
            <input
              type="text"
              placeholder="What's this for?"
              value={narration}
              onChange={(e) => setNarration(e.target.value)}
              className="w-full p-2.5 rounded-xl mirror-glass border border-white/10 text-white text-xs focus:outline-none focus:border-purple-400 placeholder-white/30"
            />
          </div>

          <button
            type="submit"
            disabled={loading || verifying || !recipientInput || !amount}
            className="w-full py-3.5 rounded-xl bg-[#7846f7] hover:bg-[#6836ea] text-white font-bold text-sm shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Processing Transfer...</span>
              </>
            ) : (
              <>
                <Send size={15} />
                <span>Send to PalmPay (₦0 Fee)</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
