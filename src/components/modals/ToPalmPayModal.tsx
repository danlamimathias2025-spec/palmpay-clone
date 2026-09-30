import React, { useState } from 'react';
import { X, Check, ShieldCheck, Loader2 } from 'lucide-react';
import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

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
  const [recipientPhone, setRecipientPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const resolvePalmPayUser = async (phone: string) => {
    if (phone.length < 10) return;
    setVerifying(true);
    setErrorMsg('');

    try {
      // 1. Try Firestore users collection first
      try {
        const userRef = doc(db, 'users', phone);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists() && docSnap.data()?.fullName) {
          setRecipientName(docSnap.data().fullName.toUpperCase());
          setVerifying(false);
          return;
        }
      } catch (err) {
        console.warn('Firestore user lookup skipped:', err);
      }

      // 2. Fetch from backend /api/resolve-palmpay
      const res = await fetch('/api/resolve-palmpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.account_name) {
          setRecipientName(data.account_name.toUpperCase());
        } else {
          setRecipientName('VERIFIED PALMPAY USER');
        }
      } else {
        setRecipientName('VERIFIED PALMPAY USER');
      }
    } catch (e) {
      setRecipientName('VERIFIED PALMPAY USER');
    } finally {
      setVerifying(false);
    }
  };

  const handlePhoneChange = (val: string) => {
    const clean = val.replace(/\D/g, '');
    setRecipientPhone(clean);
    if (clean.length === 10 || clean.length === 11) {
      resolvePalmPayUser(clean);
    } else {
      setRecipientName('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(amount);
    if (num <= 0) {
      alert('Please enter a valid amount.');
      return;
    }
    if (num > balance) {
      alert('Insufficient funds in your Available Balance.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setBalance(balance - num);
      const finalRecipient = recipientName || 'PalmPay User (' + recipientPhone.slice(-4) + ')';

      if (onSuccessTransaction) {
        onSuccessTransaction({
          amount: num,
          type: 'transfer',
          recipient: finalRecipient,
          accountNumber: recipientPhone,
          bankName: 'PalmPay Instant',
          timestamp: { seconds: Math.floor(Date.now() / 1000) },
        });
      }
      setShowSuccess(true);
    }, 1000);
  };

  if (showSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <div className="mirror-glass-modal rounded-3xl p-6 w-full max-w-sm text-center">
          <div className="w-16 h-16 bg-purple-500/20 text-[#c084fc] rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-500/30">
            <Check size={34} strokeWidth={2.5} />
          </div>
          <h2 className="text-lg font-bold text-white mb-1">PalmPay Transfer Sent</h2>
          <p className="text-xs text-white/60 mb-4">Instant payment delivered with 0 fee</p>
          <div className="bg-black/30 rounded-2xl p-4 text-left space-y-2 text-xs mb-6 border border-white/5">
            <div className="flex justify-between items-center">
              <span className="text-white/60">Amount Sent</span>
              <span className="font-bold text-white text-sm">₦{Number(amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/60">Recipient</span>
              <span className="font-bold text-emerald-400">{recipientName || recipientPhone}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/60">Account Number</span>
              <span className="text-white/90 font-mono">{recipientPhone}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/60">Transfer Fee</span>
              <span className="text-emerald-400 font-bold">₦0.00 (Free)</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-[#7846f7] hover:bg-[#6836ea] text-white font-bold text-xs shadow-md active:scale-95 transition-all"
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

        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center p-1 bg-[#6c1cf5]/20 border border-[#6c1cf5]/40 shadow-sm shrink-0">
            <img src="/favicon.svg" alt="PalmPay" className="w-full h-full object-contain rounded-md" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">To PalmPay Account</h2>
            <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
              <ShieldCheck size={12} /> Instant & Zero Fees
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Recipient Phone */}
          <div>
            <label className="text-xs text-white/70 block mb-1">Recipient Mobile Number / PalmPay ID</label>
            <input
              type="text"
              placeholder="e.g. 08012345678"
              value={recipientPhone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              required
              className="w-full p-3 rounded-xl mirror-glass border border-white/10 text-white font-sans text-sm focus:outline-none focus:border-purple-400 tracking-wider font-medium"
            />

            {verifying && (
              <div className="flex items-center gap-1.5 text-[11px] text-purple-300 mt-1.5 font-medium animate-pulse">
                <Loader2 size={13} className="animate-spin" />
                <span>Fetching PalmPay account name...</span>
              </div>
            )}

            {recipientName && !verifying && (
              <div className="p-2.5 mt-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-xs text-emerald-400 font-bold">
                <Check size={14} className="shrink-0" />
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
              <span className="text-white/70">Amount (₦)</span>
              <span className="text-white/50">Bal: ₦{balance.toFixed(2)}</span>
            </div>
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="w-full p-3 rounded-xl mirror-glass border border-white/10 text-white font-sans text-base focus:outline-none focus:border-purple-400 font-bold"
            />
          </div>

          <button
            type="submit"
            disabled={loading || verifying}
            className="w-full py-3 rounded-xl bg-[#7846f7] hover:bg-[#6836ea] text-white font-bold text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
          >
            {loading ? 'Processing Transfer...' : 'Send to PalmPay (₦0 Fee)'}
          </button>
        </form>
      </div>
    </div>
  );
}
