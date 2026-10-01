import React, { useState } from 'react';
import { X, ArrowDownUp, Check, Sparkles } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, collection, addDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { formatNaira } from '../utils/format';

interface DataModalProps {
  balance: number;
  setBalance: (b: number) => void;
  userProfile: any;
  onClose: () => void;
  onSuccessTransaction?: (tx: any) => void;
}

export default function DataModal({
  balance,
  setBalance,
  userProfile,
  onClose,
  onSuccessTransaction,
}: DataModalProps) {
  const [network, setNetwork] = useState('MTN');
  const [phoneNumber, setPhoneNumber] = useState(userProfile.phoneNumber || '');
  const [selectedPlan, setSelectedPlan] = useState({ plan: '2.5GB (2-Day)', price: 500 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const plans = [
    { plan: '1.2GB (Daily)', price: 300 },
    { plan: '2.5GB (2-Day)', price: 500 },
    { plan: '3.5GB (Weekly)', price: 1000 },
    { plan: '7GB (Weekly)', price: 1500 },
    { plan: '12GB (Monthly)', price: 3000 },
    { plan: '25GB (Monthly)', price: 5000 },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPlan.price > balance) return alert('Insufficient balance in your account');

    setIsProcessing(true);
    try {
      const userId = userProfile?.phoneNumber;
      const newTx = {
        amount: selectedPlan.price,
        formattedAmount: `-₦${selectedPlan.price.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
        type: 'data',
        category: 'other',
        title: `${network} Data ${selectedPlan.plan}`,
        network: network,
        senderBank: `${network} Telecom`,
        recipient: `${network} ${selectedPlan.plan} (${phoneNumber})`,
        accountNumber: phoneNumber,
        narration: `${network} ${selectedPlan.plan} Data to ${phoneNumber}`,
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
            balance: increment(-selectedPlan.price),
          });
        } catch (err) {
          console.warn('Firestore fallback sync:', err);
        }
      }

      setBalance(balance - selectedPlan.price);
      if (onSuccessTransaction) {
        onSuccessTransaction(newTx);
      }

      // Trigger SMS notification
      fetch('/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: userId,
          amount: selectedPlan.price,
        }),
      }).catch(console.warn);

      setShowSuccess(true);
    } catch (err) {
      console.error('Data purchase failed:', err);
      alert('Data purchase failed. Please retry.');
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
          <h2 className="text-xl font-bold text-white font-script mb-1">Data Activated!</h2>
          <p className="text-xs text-white/60 mb-4">{selectedPlan.plan} credited to {phoneNumber}</p>
          <div className="p-3 bg-purple-500/10 rounded-xl text-xs text-purple-300 font-bold mb-4 border border-purple-500/20">
            🎉 5% Instant Recharge Cashback applied!
          </div>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-[#7846f7] hover:bg-[#6836ea] text-white font-bold text-sm shadow-md"
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
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <ArrowDownUp size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white font-script">Buy Data Bundle</h2>
            <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
              <Sparkles size={12} /> High Speed 4G/5G Guaranteed
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <span className="text-xs text-white/70 block mb-1.5">Network</span>
            <div className="grid grid-cols-4 gap-2">
              {['MTN', 'Airtel', 'Glo', '9mobile'].map((net) => (
                <button
                  type="button"
                  key={net}
                  onClick={() => setNetwork(net)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    network === net
                      ? 'border-purple-400 bg-purple-600/30 text-white shadow-sm'
                      : 'mirror-glass border-white/10 text-white/70'
                  }`}
                >
                  {net}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-white/70 block mb-1">Mobile Number</label>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
              className="w-full p-3 rounded-xl mirror-glass border border-white/10 text-white text-sm focus:outline-none focus:border-purple-400"
            />
          </div>

          <div>
            <span className="text-xs text-white/70 block mb-1.5">Select Bundle</span>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
              {plans.map((p, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setSelectedPlan(p)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    selectedPlan.plan === p.plan
                      ? 'border-purple-400 bg-purple-600/30 text-white shadow-sm'
                      : 'mirror-glass border-white/10 text-white/80 hover:bg-white/10'
                  }`}
                >
                  <p className="text-xs font-bold">{p.plan}</p>
                  <p className="text-xs font-black text-emerald-400">₦{p.price}</p>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full py-3 rounded-xl bg-[#7846f7] hover:bg-[#6836ea] text-white font-bold text-sm shadow-md active:scale-95 transition-all"
          >
            {isProcessing ? 'Activating...' : `Pay ₦${selectedPlan.price} (Bal: ${formatNaira(balance)})`}
          </button>
        </form>
      </div>
    </div>
  );
}
