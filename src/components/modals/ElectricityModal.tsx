import React, { useState } from 'react';
import { X, Zap, Check, Copy, Loader2 } from 'lucide-react';
import { db } from '../../lib/firebase';
import { doc, collection, addDoc, setDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { generatePalmPayTransactionId, generatePalmPaySessionId, generatePalmPayRemark } from '../../utils/transactionFormat';
import LoadingExecutionOverlay from '../LoadingExecutionOverlay';

interface ElectricityModalProps {
  balance: number;
  setBalance: (b: number) => void;
  userProfile?: any;
  onClose: () => void;
  onSuccessTransaction?: (tx: any) => void;
}

export default function ElectricityModal({ balance, setBalance, userProfile, onClose, onSuccessTransaction }: ElectricityModalProps) {
  const [disco, setDisco] = useState('IKEDC (Ikeja Electric)');
  const [meterNumber, setMeterNumber] = useState('');
  const [amount, setAmount] = useState('2000');
  const [isProcessing, setIsProcessing] = useState(false);
  const [tokenResult, setTokenResult] = useState<string | null>(null);

  const discos = [
    'IKEDC (Ikeja Electric)',
    'EKEDC (Eko Electric)',
    'AEDC (Abuja Electric)',
    'IBEDC (Ibadan Electric)',
    'PHED (Port Harcourt)',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(amount);
    if (amt <= 0) return alert('Enter valid amount');
    if (amt > balance) return alert('Insufficient balance');

    setIsProcessing(true);
    try {
      const generatedToken = `${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
      const userId = userProfile?.phoneNumber;
      const now = new Date();
      const txRef = `ELEC-${Date.now()}`;
      const authenticTxId = generatePalmPayTransactionId(now, txRef);
      const authenticSessionId = generatePalmPaySessionId(now, '999991', txRef);
      const remarkLine = generatePalmPayRemark({
        type: 'electricity',
        recipientAccount: meterNumber || '0129482910',
        accountNumber: meterNumber || '0129482910',
      });

      const newTx = {
        amount: amt,
        formattedAmount: `-₦${amt.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
        type: 'electricity',
        category: 'bill',
        title: `Electricity - ${disco.split(' ')[0]}`,
        recipient: `${disco} (Meter: ${meterNumber || '0129482910'})`,
        accountNumber: meterNumber || '0129482910',
        narration: remarkLine,
        remark: remarkLine,
        reference: txRef,
        txId: authenticTxId,
        transactionId: authenticTxId,
        sessionId: authenticSessionId,
        status: 'successful',
        token: generatedToken,
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
          await setDoc(userRef, { balance: increment(-amt) }, { merge: true });
        } catch (err) {
          console.warn('Firestore sync fallback:', err);
        }
      }

      setBalance(balance - amt);
      setTokenResult(generatedToken);

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

    } catch (err) {
      console.error('Electricity payment failed:', err);
      alert('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (tokenResult) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <div className="mirror-glass-modal rounded-3xl p-6 w-full max-w-sm text-center">
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
            <Check size={34} strokeWidth={2.5} />
          </div>
          <h2 className="text-xl font-bold text-white font-script mb-1">Electricity Token Generated</h2>
          <p className="text-xs text-white/60 mb-4">Enter this 20-digit token into your prepaid meter</p>
          <div className="p-4 bg-black/40 rounded-2xl border border-white/10 mb-4">
            <span className="text-white/60 text-xs block mb-1">Token Code:</span>
            <p className="text-lg font-black font-mono tracking-widest text-emerald-400 select-all">{tokenResult}</p>
          </div>
          <button onClick={onClose} className="w-full py-3 rounded-xl bg-[#7846f7] hover:bg-[#6836ea] text-white font-bold text-sm shadow-md">
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
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
            <Zap size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white font-script">Electricity Bill</h2>
            <p className="text-[11px] text-white/60">Instant Prepaid & Postpaid Meter Recharge</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-white/70 block mb-1">Electricity Provider (DISCO)</label>
            <select
              value={disco}
              onChange={(e) => setDisco(e.target.value)}
              className="w-full p-3 rounded-xl mirror-glass border border-white/10 text-white text-xs focus:outline-none focus:border-purple-400"
            >
              {discos.map((d) => (
                <option key={d} value={d} className="bg-[#121324] text-white">
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-white/70 block mb-1">Meter Number</label>
            <input
              type="text"
              placeholder="e.g. 04123456789"
              value={meterNumber}
              onChange={(e) => setMeterNumber(e.target.value)}
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
            {isProcessing ? 'Generating Token...' : `Buy Power (₦${amount})`}
          </button>
        </form>

        {isProcessing && (
          <LoadingExecutionOverlay
            title="Recharging Electricity Meter..."
            subtitle={`Generating prepaid recharge token for meter ${meterNumber || '0129482910'} on ${disco}.`}
            amount={Number(amount) || undefined}
            variant="emerald"
          />
        )}
      </div>
    </div>
  );
}
