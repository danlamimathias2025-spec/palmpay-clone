import React, { useState } from 'react';
import { X, Trophy, Check, Loader2 } from 'lucide-react';
import { db } from '../../lib/firebase';
import { doc, collection, addDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';

interface BettingModalProps {
  balance: number;
  setBalance: (b: number) => void;
  userProfile?: any;
  onClose: () => void;
  onSuccessTransaction?: (tx: any) => void;
}

export default function BettingModal({ balance, setBalance, userProfile, onClose, onSuccessTransaction }: BettingModalProps) {
  const [platform, setPlatform] = useState('SportyBet');
  const [customerId, setCustomerId] = useState('');
  const [amount, setAmount] = useState('1000');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const platforms = ['SportyBet', 'Bet9ja', '1xBet', 'BetKing', 'MSport'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(amount);
    if (amt <= 0) return alert('Enter valid amount');
    if (amt > balance) return alert('Insufficient balance');

    setIsProcessing(true);
    try {
      const userId = userProfile?.phoneNumber;
      const newTx = {
        amount: amt,
        formattedAmount: `-₦${amt.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
        type: 'betting',
        category: 'other',
        title: `Fund ${platform} Wallet`,
        recipient: `${platform} Wallet (${customerId || 'Direct'})`,
        status: 'successful',
        timestamp: { seconds: Math.floor(Date.now() / 1000) },
      };

      if (userId) {
        try {
          const userRef = doc(db, 'users', userId);
          const txRef = collection(userRef, 'transactions');
          await addDoc(txRef, {
            ...newTx,
            timestamp: serverTimestamp(),
          });
          await updateDoc(userRef, {
            balance: increment(-amt),
          });
        } catch (err) {
          console.warn('Firestore sync fallback:', err);
        }
      }

      setBalance(balance - amt);
      if (onSuccessTransaction) {
        onSuccessTransaction(newTx);
      }

      // Trigger SMS notification
      fetch('/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: userId,
          amount: amt,
        }),
      }).catch(console.warn);

      setShowSuccess(true);
    } catch (err) {
      console.error('Betting funding failed:', err);
      alert('Funding failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <div className="mirror-glass-modal rounded-3xl p-6 w-full max-w-sm text-center">
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
            <Check size={34} strokeWidth={2.5} />
          </div>
          <h2 className="text-xl font-bold text-white font-script mb-1">Wallet Funded!</h2>
          <p className="text-xs text-white/60 mb-4">₦{amount} sent to your {platform} account ({customerId})</p>
          <button onClick={onClose} className="w-full py-3 rounded-xl bg-[#7846f7] hover:bg-[#6836ea] text-white font-bold text-sm">
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="mirror-glass-modal rounded-3xl p-6 w-full max-w-sm relative">
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full mirror-glass flex items-center justify-center text-white/70 hover:text-white">
          <X size={18} />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-green-500/20 text-emerald-400 flex items-center justify-center">
            <Trophy size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white font-script">Betting & Gaming</h2>
            <p className="text-[11px] text-white/60">Instant funding with 0 convenience fees</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <span className="text-xs text-white/70 block mb-1">Bookmaker</span>
            <div className="grid grid-cols-3 gap-2">
              {platforms.map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPlatform(p)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    platform === p ? 'border-purple-400 bg-purple-600/30 text-white' : 'mirror-glass border-white/10 text-white/70'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-white/70 block mb-1">User ID / Customer Account Number</label>
            <input
              type="text"
              placeholder="e.g. 10293847"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              required
              className="w-full p-3 rounded-xl mirror-glass border border-white/10 text-white text-sm focus:outline-none focus:border-purple-400"
            />
          </div>

          <div>
            <label className="text-xs text-white/70 block mb-1">Amount (₦)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="w-full p-3 rounded-xl mirror-glass border border-white/10 text-white font-sans text-base focus:outline-none focus:border-purple-400"
            />
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full py-3 rounded-xl bg-[#7846f7] hover:bg-[#6836ea] text-white font-bold text-sm shadow-md active:scale-95 transition-all"
          >
            {isProcessing ? 'Funding...' : `Fund ${platform} (₦${amount})`}
          </button>
        </form>
      </div>
    </div>
  );
}
