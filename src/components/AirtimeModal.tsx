import React, { useState } from 'react';
import { X, Smartphone, Check, Sparkles } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, collection, addDoc, setDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { formatNaira } from '../utils/format';
import { normalizePhoneNumber } from '../utils/account';
import { generatePalmPayTransactionId, generatePalmPaySessionId, generatePalmPayRemark } from '../utils/transactionFormat';
import LoadingExecutionOverlay from './LoadingExecutionOverlay';

interface AirtimeModalProps {
  balance: number;
  setBalance: (b: number) => void;
  setUserProfile?: React.Dispatch<React.SetStateAction<any>>;
  userProfile: any;
  onClose: () => void;
  onSuccessTransaction?: (tx: any) => void;
}

export default function AirtimeModal({
  balance,
  setBalance,
  setUserProfile,
  userProfile,
  onClose,
  onSuccessTransaction,
}: AirtimeModalProps) {
  const [network, setNetwork] = useState('MTN');
  const [phoneNumber, setPhoneNumber] = useState(userProfile.phoneNumber || '');
  const [amount, setAmount] = useState('500');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const networks = [
    { name: 'MTN', color: 'bg-amber-400 text-black' },
    { name: 'Airtel', color: 'bg-red-500 text-white' },
    { name: 'Glo', color: 'bg-emerald-500 text-white' },
    { name: '9mobile', color: 'bg-lime-500 text-black' },
  ];

  const presets = ['100', '200', '500', '1000', '2000', '5000'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(amount);
    if (amt <= 0) return alert('Enter a valid amount');
    if (amt > balance) return alert('Insufficient balance in your account');

    setIsProcessing(true);
    try {
      const cashback = Math.round(amt * 0.03); // 3% cashback bonus
      const netDeduction = amt - cashback;
      const rawUserId = userProfile?.phoneNumber;
      const userId = normalizePhoneNumber(rawUserId) || rawUserId;
      const now = new Date();
      const txRef = `AIR-${Date.now()}`;
      const authenticTxId = generatePalmPayTransactionId(now, txRef);
      const authenticSessionId = generatePalmPaySessionId(now, '999991', txRef);
      const remarkLine = generatePalmPayRemark({
        type: 'airtime',
        network,
        senderBank: `${network} Telecom`,
        recipientAccount: phoneNumber,
        accountNumber: phoneNumber,
      });

      const newTx = {
        amount: amt,
        formattedAmount: `-₦${amt.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
        type: 'airtime',
        category: 'airtime',
        title: `${network} Airtime Top up`,
        network: network,
        senderBank: `${network} Telecom`,
        recipient: `${network} Airtime (${phoneNumber})`,
        accountNumber: phoneNumber,
        narration: remarkLine,
        remark: remarkLine,
        reference: txRef,
        txId: authenticTxId,
        transactionId: authenticTxId,
        sessionId: authenticSessionId,
        status: 'successful',
        timestamp: { seconds: Math.floor(Date.now() / 1000) },
      };

      // Debit transaction handled by App.tsx

      const newBal = balance - netDeduction;
      setBalance(newBal);
      if (setUserProfile) {
        setUserProfile((prev: any) => prev ? { ...prev, balance: newBal } : prev);
      }
      if (onSuccessTransaction) {
        onSuccessTransaction(newTx);
      }

      // Trigger real SMS alert
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
      console.error('Airtime recharge failed:', err);
      alert('Airtime recharge failed. Please retry.');
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
          <h2 className="text-xl font-bold text-white font-script mb-1">Recharge Successful!</h2>
          <p className="text-xs text-white/60 mb-4">₦{amount} airtime sent to {phoneNumber}</p>
          <div className="p-3 bg-purple-500/10 rounded-xl text-xs text-purple-300 font-bold mb-4 border border-purple-500/20">
            🎉 +3% Instant Cashback Earned!
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
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
            <Smartphone size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white font-script">Airtime Top-Up</h2>
            <p className="text-[11px] text-amber-300 font-semibold flex items-center gap-1">
              <Sparkles size={12} /> Up to 3% Instant Cashback
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Network Selector */}
          <div>
            <span className="text-xs text-white/70 block mb-1.5">Choose Network</span>
            <div className="grid grid-cols-4 gap-2">
              {networks.map((net) => (
                <button
                  type="button"
                  key={net.name}
                  onClick={() => setNetwork(net.name)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    network === net.name
                      ? 'border-purple-400 bg-purple-600/30 text-white shadow-sm'
                      : 'mirror-glass border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >
                  {net.name}
                </button>
              ))}
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="text-xs text-white/70 block mb-1">Recipient Mobile</label>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
              className="w-full p-3 rounded-xl mirror-glass border border-white/10 text-white text-sm focus:outline-none focus:border-purple-400"
            />
          </div>

          {/* Preset amounts */}
          <div>
            <div className="flex justify-between items-center mb-1 text-xs">
              <span className="text-white/70">Amount (₦)</span>
              <span className="text-white/50">Bal: {formatNaira(balance)}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {presets.map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => setAmount(preset)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    amount === preset
                      ? 'bg-[#7846f7] text-white border-purple-400'
                      : 'mirror-glass border-white/10 text-white/80 hover:bg-white/10'
                  }`}
                >
                  ₦{preset}
                </button>
              ))}
            </div>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-3 rounded-xl mirror-glass border border-white/10 text-white text-sm focus:outline-none focus:border-purple-400"
              placeholder="Or enter custom amount"
            />
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full py-3 rounded-xl bg-[#7846f7] hover:bg-[#6836ea] text-white font-bold text-sm shadow-md active:scale-95 transition-all"
          >
            {isProcessing ? 'Recharging...' : `Pay ₦${amount} with 3% Cashback`}
          </button>
        </form>

        {isProcessing && (
          <LoadingExecutionOverlay
            title="Processing Airtime Top-Up..."
            subtitle={`Recharging ${network} airtime for ${phoneNumber}. Connecting to telecom provider.`}
            amount={Number(amount) || undefined}
            variant="purple"
          />
        )}
      </div>
    </div>
  );
}
