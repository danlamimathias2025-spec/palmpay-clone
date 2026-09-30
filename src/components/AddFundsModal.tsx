import React, { useState } from 'react';
import { X, ArrowDownToLine, Check, Sparkles, Building2, User, CreditCard, Copy } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, addDoc, collection, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { normalizePalmPayAccountNumber } from '../utils/account';
import { formatNaira } from '../utils/format';

interface AddFundsModalProps {
  balance: number;
  setBalance: (b: number) => void;
  userProfile: any;
  onClose: () => void;
  onSuccessTransaction?: (tx: any) => void;
  onViewHistory?: () => void;
}

export default function AddFundsModal({
  balance,
  setBalance,
  userProfile,
  onClose,
  onSuccessTransaction,
  onViewHistory,
}: AddFundsModalProps) {
  const [amount, setAmount] = useState('2640');
  const [senderName, setSenderName] = useState('PEACE DANLAMI');
  const [senderBank, setSenderBank] = useState('Access Bank');
  const [paymentType, setPaymentType] = useState('Bank Transfer');
  const [narration, setNarration] = useState('Payment');
  const [isProcessing, setIsProcessing] = useState(false);
  const [createdTx, setCreatedTx] = useState<any>(null);
  const [copiedAcc, setCopiedAcc] = useState(false);

  const receivingAcc = normalizePalmPayAccountNumber(userProfile.accountNumber || userProfile.phoneNumber);

  const bankOptions = [
    'Access Bank',
    'Guaranty Trust Bank (GTBank)',
    'Zenith Bank',
    'United Bank for Africa (UBA)',
    'First Bank of Nigeria',
    'Kuda Bank',
    'OPay',
    'Moniepoint',
    'PalmPay Direct',
  ];

  const quickSenders = ['PEACE DANLAMI', 'JOHN JAMES AYAKA', 'ABUBAKAR GARBA', 'MUSA IBRAHIM'];
  const quickAmounts = ['1000', '2640', '5000', '10000', '25000'];

  const handleFundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(amount);
    if (!num || num <= 0) {
      alert('Please enter a valid amount.');
      return;
    }
    const cleanSender = (senderName.trim() || 'PEACE DANLAMI').toUpperCase();

    setIsProcessing(true);

    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthName = months[now.getMonth()];
    const dateFormatted = `${monthName} ${now.getDate()}, ${now.getFullYear()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const newTransaction = {
      id: `recv-${Date.now()}`,
      title: `Received from ${cleanSender}`,
      recipient: userProfile.fullName || 'Mathias Danlami',
      senderName: cleanSender,
      senderBank: senderBank,
      amount: num,
      formattedAmount: `+${num.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
      type: 'credit' as const,
      category: 'transfer' as const,
      status: 'successful' as const,
      month: 'Sep' as const,
      date: dateFormatted,
      narration: narration || 'Funds deposit',
      timestamp: { seconds: Math.floor(Date.now() / 1000) },
    };

    try {
      const userId = userProfile.phoneNumber || '08082076038';
      const userRef = doc(db, 'users', userId);
      const transactionsRef = collection(userRef, 'transactions');
      await addDoc(transactionsRef, {
        ...newTransaction,
        timestamp: serverTimestamp(),
      });
      await updateDoc(userRef, {
        balance: increment(num),
      });
    } catch (err) {
      console.warn('Firestore fallback sync:', err);
    }

    setBalance(balance + num);

    if (onSuccessTransaction) {
      onSuccessTransaction(newTransaction);
    }

    setIsProcessing(false);
    setCreatedTx(newTransaction);
  };

  if (createdTx) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <div className="mirror-glass-modal rounded-3xl p-6 w-full max-w-sm text-center relative animate-scale-up">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3 border border-emerald-500/40">
            <Check size={32} strokeWidth={2.5} />
          </div>

          <h3 className="text-xl font-bold text-white font-script mb-1">
            Deposit Successful!
          </h3>
          <p className="text-xs text-white/60 mb-4">
            Funds received & credited to your Available Balance
          </p>

          <div className="mirror-glass rounded-2xl p-4 text-left space-y-2 text-xs mb-5 border border-white/10">
            <div className="flex justify-between items-center">
              <span className="text-white/60">Amount Credited</span>
              <span className="text-base font-black text-emerald-400 font-sans">
                +₦{Number(createdTx.amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-white/60">Sender Name</span>
              <span className="font-bold text-white font-script">
                {createdTx.senderName}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-white/60">Sending Bank</span>
              <span className="text-white/90">{createdTx.senderBank}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-white/60">Transaction Title</span>
              <span className="text-purple-300 font-script font-semibold truncate max-w-[170px]">
                {createdTx.title}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-white/60">Date & Time</span>
              <span className="text-white/80">{createdTx.date}</span>
            </div>
          </div>

          <div className="space-y-2">
            {onViewHistory && (
              <button
                onClick={() => {
                  onClose();
                  onViewHistory();
                }}
                className="w-full py-3 rounded-xl bg-[#7846f7] hover:bg-[#6836ea] text-white font-bold text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <span>View in Transaction History</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl mirror-glass hover:bg-white/10 text-white/80 text-xs font-semibold"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="mirror-glass-modal rounded-3xl p-6 w-full max-w-sm relative max-h-[90vh] overflow-y-auto no-scrollbar">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full mirror-glass flex items-center justify-center text-white/70 hover:text-white"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-[#38bdf8] flex items-center justify-center">
            <ArrowDownToLine size={22} strokeWidth={2.4} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white font-script">Add Funds / Deposit</h2>
            <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
              <Sparkles size={12} /> Live Settlement & Receipt Generation
            </p>
          </div>
        </div>

        {/* Dedicated 10-Digit Unique Funds ID Receiving Card */}
        <div className="mirror-glass rounded-2xl p-3.5 mb-4 border border-emerald-500/30 bg-emerald-500/10 text-left">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1">
              <Sparkles size={11} /> 10-Digit Receiving Funds ID
            </span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
              PalmPay MFB
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl font-mono font-extrabold text-white tracking-widest">{receivingAcc}</p>
              <p className="text-[11px] text-white/70 font-medium">{userProfile.fullName || 'Mathias Danlami'}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(receivingAcc);
                setCopiedAcc(true);
                setTimeout(() => setCopiedAcc(false), 2000);
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs flex items-center gap-1 shadow-md transition-all active:scale-95"
            >
              {copiedAcc ? <Check size={13} /> : <Copy size={13} />}
              <span>{copiedAcc ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <p className="text-[10px] text-emerald-200/70 mt-1">
            Send deposits from PalmPay Cashback or any banking app to this 10-digit number to instantly credit your account.
          </p>
        </div>

        <form onSubmit={handleFundSubmit} className="space-y-3.5">
          {/* Amount */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="text-white/70">Deposit Amount (₦)</span>
              <span className="text-white/50">Bal: {formatNaira(balance)}</span>
            </div>

            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              placeholder="e.g. 2640"
              className="w-full p-3 rounded-xl mirror-glass border border-white/15 text-white font-sans text-base focus:outline-none focus:border-purple-400 font-bold"
            />

            {/* Quick amount chips */}
            <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1 no-scrollbar">
              {quickAmounts.map((q) => (
                <button
                  type="button"
                  key={q}
                  onClick={() => setAmount(q)}
                  className={`py-1 px-2.5 rounded-lg text-[11px] font-semibold transition-all shrink-0 border ${
                    amount === q
                      ? 'bg-[#7846f7] text-white border-purple-400'
                      : 'mirror-glass text-white/70 border-white/10 hover:bg-white/10'
                  }`}
                >
                  ₦{Number(q).toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Sender Full Name */}
          <div>
            <label className="text-xs text-white/70 block mb-1">
              Sender Full Name <span className="text-purple-400 font-bold">*</span>
            </label>
            <div className="relative">
              <User size={15} className="absolute left-3 top-3.5 text-white/40" />
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                required
                placeholder="e.g. PEACE DANLAMI"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl mirror-glass border border-white/15 text-white text-xs font-script tracking-wide focus:outline-none focus:border-purple-400 uppercase font-semibold"
              />
            </div>

            {/* Quick Sender Chips */}
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {quickSenders.map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setSenderName(s)}
                  className={`text-[10px] px-2 py-0.5 rounded-md border font-script transition-all ${
                    senderName === s
                      ? 'bg-purple-600/40 border-purple-400 text-purple-200'
                      : 'border-white/10 text-white/50 hover:bg-white/5'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Sender Bank */}
          <div>
            <label className="text-xs text-white/70 block mb-1">Sender Bank / Source</label>
            <div className="relative">
              <Building2 size={15} className="absolute left-3 top-3.5 text-white/40" />
              <select
                value={senderBank}
                onChange={(e) => setSenderBank(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl mirror-glass border border-white/15 text-white text-xs focus:outline-none focus:border-purple-400"
              >
                {bankOptions.map((b) => (
                  <option key={b} value={b} className="bg-[#121324] text-white">
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Payment Type */}
          <div>
            <label className="text-xs text-white/70 block mb-1">Deposit Channel</label>
            <div className="grid grid-cols-3 gap-1.5">
              {['Bank Transfer', 'POS Deposit', 'Card Transfer'].map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setPaymentType(m)}
                  className={`py-1.5 px-2 rounded-xl text-[10px] font-semibold border transition-all text-center ${
                    paymentType === m
                      ? 'bg-[#7846f7] text-white border-purple-400'
                      : 'mirror-glass text-white/60 border-white/10 hover:bg-white/10'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Narration */}
          <div>
            <label className="text-xs text-white/70 block mb-1">Narration / Remark</label>
            <input
              type="text"
              value={narration}
              onChange={(e) => setNarration(e.target.value)}
              placeholder="e.g. Payment"
              className="w-full p-2.5 rounded-xl mirror-glass border border-white/15 text-white text-xs focus:outline-none focus:border-purple-400"
            />
          </div>

          {/* Preview of Card Title */}
          <div className="p-3 bg-black/40 rounded-xl border border-white/10 text-xs">
            <span className="text-[10px] text-white/50 block">History Card Preview:</span>
            <p className="font-bold text-white font-script mt-0.5 flex items-center justify-between">
              <span>Received from {(senderName || 'PEACE DANLAMI').toUpperCase()}</span>
              <span className="text-emerald-400 font-sans font-bold">
                +₦{Number(amount || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </span>
            </p>
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#2563eb] to-[#7846f7] hover:brightness-110 text-white font-bold text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            {isProcessing ? 'Crediting Account...' : 'Confirm & Credit Available Balance'}
          </button>
        </form>
      </div>
    </div>
  );
}
