import React, { useState } from 'react';
import { X, Check, Copy, ChevronRight, Headphones, Landmark, ArrowLeft, ArrowDownToLine, Sparkles, User, Building2, HelpCircle, Phone, ArrowLeftRight, CreditCard, Banknote } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, addDoc, collection, setDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { normalizePalmPayAccountNumber, normalizePhoneNumber } from '../utils/account';
import { formatNaira } from '../utils/format';
import { generatePalmPayTransactionId, generatePalmPaySessionId, generatePalmPayRemark } from '../utils/transactionFormat';
import LoadingExecutionOverlay from './LoadingExecutionOverlay';
import BankLogo from './BankLogo';

interface AddFundsModalProps {
  balance: number;
  setBalance: (b: number) => void;
  setUserProfile?: React.Dispatch<React.SetStateAction<any>>;
  userProfile: any;
  onClose: () => void;
  onSuccessTransaction?: (tx: any) => void;
  onViewHistory?: () => void;
}

export default function AddFundsModal({
  balance,
  setBalance,
  setUserProfile,
  userProfile,
  onClose,
  onSuccessTransaction,
  onViewHistory,
}: AddFundsModalProps) {
  // State for Sandbox Simulation
  const [showSandbox, setShowSandbox] = useState(false);
  const [amount, setAmount] = useState('2640');
  const [senderName, setSenderName] = useState('PEACE DANLAMI');
  const [senderBank, setSenderBank] = useState('Access Bank');
  const [narration, setNarration] = useState('Payment');
  const [isProcessing, setIsProcessing] = useState(false);
  const [createdTx, setCreatedTx] = useState<any>(null);
  const [copiedAcc, setCopiedAcc] = useState(false);

  const rawAccountNumber = userProfile.accountNumber || (userProfile.phoneNumber ? normalizePalmPayAccountNumber(userProfile.phoneNumber) : '');
  const receivingAcc = normalizePalmPayAccountNumber(rawAccountNumber);

  // Format account number with spaces as shown: "707 338 6737"
  const formatAccNoSpaces = (num: string) => {
    const cleaned = num.replace(/\s+/g, '');
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    }
    return cleaned;
  };

  const formattedAcc = formatAccNoSpaces(receivingAcc);

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
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;
    const monthName = months[now.getMonth()];
    const dateFormatted = `${monthName} ${now.getDate()}, ${now.getFullYear()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const txRef = `recv-${Date.now()}`;
    const authenticTxId = generatePalmPayTransactionId(now, txRef);
    const authenticSessionId = generatePalmPaySessionId(now, '999991', txRef);
    const recipientDisplayName = userProfile.fullName || userProfile.userName || 'PalmPay User';
    const recipientAcc = receivingAcc;

    const authenticRemark = generatePalmPayRemark({
      isIncoming: true,
      type: 'credit',
      senderName: cleanSender,
      senderBank: senderBank,
      recipientName: recipientDisplayName,
      recipientAccount: recipientAcc,
      narration: narration || `trsf from ${senderBank} / ${cleanSender} to ${recipientAcc} ${recipientDisplayName}`,
    });

    const newTransaction = {
      id: txRef,
      title: `Received from ${cleanSender}`,
      recipient: recipientDisplayName,
      accountNumber: recipientAcc,
      senderName: cleanSender,
      senderBank: senderBank,
      amount: num,
      formattedAmount: `+₦${num.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
      type: 'credit' as const,
      category: 'transfer' as const,
      status: 'successful' as const,
      month: monthName,
      date: dateFormatted,
      narration: authenticRemark,
      remark: authenticRemark,
      reference: txRef,
      txId: authenticTxId,
      transactionId: authenticTxId,
      sessionId: authenticSessionId,
      timestamp: { seconds: Math.floor(Date.now() / 1000) },
    };

    try {
      const rawUserId = userProfile?.phoneNumber;
      const userId = normalizePhoneNumber(rawUserId) || rawUserId;
      if (userId) {
        const userRef = doc(db, 'users', userId);
        const transactionsRef = collection(userRef, 'transactions');
        await addDoc(transactionsRef, {
          ...newTransaction,
          timestamp: serverTimestamp(),
        });
        await setDoc(userRef, { balance: increment(num) }, { merge: true });
      }
    } catch (err) {
      console.warn('Firestore fallback sync:', err);
    }

    const newBal = balance + num;
    setBalance(newBal);
    if (setUserProfile) {
      setUserProfile((prev: any) => prev ? { ...prev, balance: newBal } : prev);
    }

    if (onSuccessTransaction) {
      onSuccessTransaction(newTransaction);
    }

    setIsProcessing(false);
    setCreatedTx(newTransaction);
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(receivingAcc);
    setCopiedAcc(true);
    setTimeout(() => setCopiedAcc(false), 2000);
  };

  if (createdTx) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <div className="mirror-glass-modal rounded-3xl p-6 w-full max-w-sm text-center relative animate-scale-up">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3 border border-emerald-500/40">
            <Check size={32} strokeWidth={2.5} />
          </div>

          <h3 className="text-xl font-bold text-white font-sans mb-1">
            Deposit Successful!
          </h3>
          <p className="text-xs text-white/60 mb-4 font-sans">
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
              <span className="font-bold text-white font-sans">
                {createdTx.senderName}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-white/60">Sending Bank</span>
              <div className="flex items-center gap-1.5 text-white/90">
                <BankLogo bank={createdTx.senderBank} size="xs" />
                <span>{createdTx.senderBank}</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-white/60">Date & Time</span>
              <span className="text-white/80 font-sans">{createdTx.date}</span>
            </div>
          </div>

          <div className="space-y-2">
            {onViewHistory && (
              <button
                onClick={() => {
                  onClose();
                  onViewHistory();
                }}
                className="w-full py-3 rounded-xl bg-[#7c1cf5] hover:bg-[#6813d1] text-white font-bold text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 font-sans"
              >
                <span>View in Transaction History</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl mirror-glass hover:bg-white/10 text-white/80 text-xs font-semibold font-sans"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 bg-[#0d0e12] overflow-y-auto">
      {/* Container simulating a phone layout width for native app experience */}
      <div className="w-full max-w-md min-h-screen bg-[#0d0e12] text-white flex flex-col justify-between p-5 relative select-none">
        <div>
          {/* Header Bar */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-white/5 active:scale-95 transition-all"
            >
              <ArrowLeft size={22} className="text-white" />
            </button>
            <h1 className="text-lg font-bold font-sans">Add Money</h1>
            <button
              onClick={() => alert('Customer Support is active')}
              className="p-1 rounded-full hover:bg-white/5 active:scale-95 transition-all"
            >
              <Headphones size={22} className="text-white" />
            </button>
          </div>

          {/* Main Card (Bank Transfer Card) */}
          <div className="bg-[#191b22] border border-white/[0.03] rounded-3xl p-4.5 mb-5 shadow-xl text-left">
            {/* Top Row: Bank Transfer details */}
            <div
              onClick={() => setShowSandbox(!showSandbox)}
              className="flex items-center justify-between group cursor-pointer active:scale-[0.99] transition-all"
              title="Click to toggle sandbox credit simulator"
            >
              <div className="flex items-center gap-3.5">
                {/* Bank temple avatar */}
                <div className="w-12 h-12 rounded-full bg-white text-[#111217] flex items-center justify-center shrink-0 shadow-lg">
                  <Landmark size={22} strokeWidth={2.4} />
                </div>
                <div>
                  <h3 className="text-[15px] font-extrabold text-white font-sans flex items-center gap-1.5">
                    Bank Transfer
                    <span className="text-[9px] bg-purple-500/20 text-[#a78bfa] border border-purple-500/30 px-1.5 py-0.5 rounded font-mono font-medium">
                      Sandbox Credit Click
                    </span>
                  </h3>
                  <p className="text-[11px] text-[#8e929a] font-medium mt-0.5 font-sans">
                    FREE Instant bank funding within 10s
                  </p>
                </div>
              </div>
              <ChevronRight size={18} className="text-white/40 group-hover:text-white transition-all" />
            </div>

            {/* Dashed dividing line */}
            <div className="border-t border-dashed border-white/10 my-4" />

            {/* Bottom Row: PalmPay Account details */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#8e929a] font-medium font-sans">
                  PalmPay Account Number
                </span>
                {/* Tier 3 Pill */}
                <div className="flex items-center gap-1 bg-purple-500/25 border border-purple-500/30 text-[#a78bfa] text-[10px] font-bold px-2 py-0.5 rounded-full select-none">
                  <span>Tier 3</span>
                  <ChevronRight size={10} strokeWidth={3} />
                </div>
              </div>

              {/* Spaces Separated Account Number */}
              <p className="text-2xl font-extrabold text-white tracking-wide mb-4 select-all font-sans">
                {formattedAcc}
              </p>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleCopyText}
                  className="flex-1 py-3.5 rounded-2xl bg-[#22232c] hover:bg-[#2c2d38] border border-white/5 text-[#a78bfa] font-bold text-xs active:scale-95 transition-all text-center font-sans flex items-center justify-center gap-1.5"
                >
                  {copiedAcc ? <Check size={14} className="text-emerald-400 animate-bounce" /> : <Copy size={14} />}
                  <span>{copiedAcc ? 'Copied' : 'Copy Number'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => alert(`PalmPay Detail Shared:\nAccount: ${receivingAcc}\nName: ${userProfile.fullName || userProfile.userName || 'PalmPay User'}`)}
                  className="flex-1 py-3.5 rounded-2xl bg-[#7c1cf5] hover:bg-[#6813d1] text-white font-bold text-xs active:scale-95 transition-all text-center font-sans"
                >
                  Share Detail
                </button>
              </div>
            </div>
          </div>

          {/* Collapsible Sandbox Simulation Drawer */}
          {showSandbox && (
            <div className="bg-purple-600/10 border border-purple-500/30 rounded-3xl p-4.5 mb-5 text-left animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={12} className="animate-spin" /> Sandbox Deposit Simulator
                </span>
                <button
                  onClick={() => setShowSandbox(false)}
                  className="text-white/40 hover:text-white"
                >
                  <X size={15} />
                </button>
              </div>

              <form onSubmit={handleFundSubmit} className="space-y-3">
                <div>
                  <label className="text-[11px] text-white/70 block mb-1 font-sans">Deposit Amount (₦)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white font-bold font-sans text-sm"
                  />
                  <div className="flex gap-1 mt-1.5 overflow-x-auto no-scrollbar pb-1">
                    {quickAmounts.map((q) => (
                      <button
                        type="button"
                        key={q}
                        onClick={() => setAmount(q)}
                        className={`py-0.5 px-2 rounded text-[10px] border transition-all ${
                          amount === q
                            ? 'bg-[#7c1cf5] text-white border-purple-400'
                            : 'bg-black/20 text-white/60 border-white/5'
                        }`}
                      >
                        ₦{Number(q).toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-white/70 block mb-1 font-sans">Sender Name</label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    required
                    className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs uppercase font-sans"
                  />
                  <div className="flex gap-1 mt-1.5 flex-wrap">
                    {quickSenders.map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setSenderName(s)}
                        className="text-[9px] px-1.5 py-0.5 rounded border border-white/5 bg-black/10 text-white/50"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-white/70 block mb-1 font-sans">Source Bank</label>
                  <select
                    value={senderBank}
                    onChange={(e) => setSenderBank(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-sans"
                  >
                    {bankOptions.map((b) => (
                      <option key={b} value={b} className="bg-[#121324] text-white">{b}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-2.5 rounded-xl bg-[#7c1cf5] hover:bg-[#6813d1] text-white font-bold text-xs font-sans active:scale-95 transition-all"
                >
                  {isProcessing ? 'Processing...' : 'Simulate Inbound Deposit'}
                </button>
              </form>
            </div>
          )}

          {/* Center "OR" divider */}
          <div className="flex items-center gap-3 my-5 text-white/30 text-xs font-bold tracking-wider select-none font-sans">
            <div className="flex-1 h-[1px] bg-white/5" />
            <span>OR</span>
            <div className="flex-1 h-[1px] bg-white/5" />
          </div>

          {/* Secondary Option Cards List */}
          <div className="space-y-3.5 mb-6 text-left">
            {/* Option 1: Cash Deposit */}
            <div
              onClick={() => alert('Option: Cash Deposit is active')}
              className="flex items-center justify-between bg-[#14161c] hover:bg-white/[0.02] border border-white/[0.02] p-3.5 rounded-2xl cursor-pointer active:scale-[0.99] transition-all group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-white/5 text-white flex items-center justify-center shrink-0">
                  <Banknote size={18} className="text-white/80" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white font-sans">Cash Deposit</h4>
                  <p className="text-[10px] text-[#8e929a] font-medium font-sans mt-0.5">
                    Fund your account with nearby agents
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="text-white/20 group-hover:text-white transition-all" />
            </div>

            {/* Option 2: Top-up with Card/Account */}
            <div
              onClick={() => alert('Option: Top-up with Card/Account is active')}
              className="flex items-center justify-between bg-[#14161c] hover:bg-white/[0.02] border border-white/[0.02] p-3.5 rounded-2xl cursor-pointer active:scale-[0.99] transition-all group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-white/5 text-white flex items-center justify-center shrink-0">
                  <CreditCard size={18} className="text-white/80" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white font-sans">Top-up with Card/Account</h4>
                  <p className="text-[10px] text-[#8e929a] font-medium font-sans mt-0.5">
                    Add money from your bank card/account
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="text-white/20 group-hover:text-white transition-all" />
            </div>

            {/* Option 3: Receive Money */}
            <div
              onClick={() => alert('Option: Receive Money is active')}
              className="flex items-center justify-between bg-[#14161c] hover:bg-white/[0.02] border border-white/[0.02] p-3.5 rounded-2xl cursor-pointer active:scale-[0.99] transition-all group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-white/5 text-white flex items-center justify-center shrink-0">
                  <ArrowLeftRight size={18} className="text-white/80" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white font-sans">Receive Money</h4>
                  <p className="text-[10px] text-[#8e929a] font-medium font-sans mt-0.5">
                    Share your account and ask for transfer
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="text-white/20 group-hover:text-white transition-all" />
            </div>

            {/* Option 4: USSD */}
            <div
              onClick={() => alert('Option: USSD is active')}
              className="flex items-center justify-between bg-[#14161c] hover:bg-white/[0.02] border border-white/[0.02] p-3.5 rounded-2xl cursor-pointer active:scale-[0.99] transition-all group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-white/5 text-white flex items-center justify-center shrink-0">
                  <Phone size={18} className="text-white/80" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white font-sans">USSD</h4>
                  <p className="text-[10px] text-[#8e929a] font-medium font-sans mt-0.5">
                    Use your other bank’s USSD code
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="text-white/20 group-hover:text-white transition-all" />
            </div>
          </div>

          {/* Promotional Banner Card */}
          <div className="bg-[#7c1cf5] rounded-3xl p-4.5 text-left relative overflow-hidden shadow-xl mb-5 select-none">
            {/* Aesthetic circle shapes */}
            <div className="absolute -right-10 -bottom-10 w-36 h-36 bg-white/10 rounded-full blur-xl pointer-events-none" />
            <div className="absolute right-4 top-2 w-20 h-20 bg-purple-300/10 rounded-full blur-md pointer-events-none" />

            <div className="relative z-10 flex items-center justify-between gap-2.5">
              <div>
                <h4 className="text-base font-extrabold text-white tracking-wide uppercase font-sans">
                  ZERO Transfer Fees
                </h4>
                <p className="text-xs font-medium text-white/85 mt-0.5 font-sans">
                  Unlimited Free Transfers
                </p>
                <button
                  type="button"
                  onClick={() => alert('ZERO Transfer Fees promotion is active!')}
                  className="mt-3.5 px-4 py-1.5 rounded-full bg-[#fde047] hover:bg-yellow-400 text-black font-extrabold text-[10px] tracking-wider uppercase transition-all shadow-md active:scale-95"
                >
                  Go Now
                </button>
              </div>

              {/* Graphic container mimicking phones inside purple banner */}
              <div className="w-24 h-24 flex items-center justify-center shrink-0 bg-white/5 rounded-2xl border border-white/10 p-1">
                <div className="text-center">
                  <span className="text-[9px] font-extrabold uppercase text-yellow-300 tracking-wider">No Fees</span>
                  <div className="text-[15px] font-black text-white leading-tight mt-1">₦0</div>
                  <span className="text-[8px] text-white/65">Always</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating grid widget & Back button in footer area */}
        <div className="flex items-center justify-between border-t border-white/5 pt-3.5 mt-2 select-none">
          {/* Circular button with grid icon */}
          <div
            onClick={() => alert('Aesthetic Floating Widget clicked')}
            className="w-11 h-11 rounded-full bg-[#181920] border border-white/10 flex items-center justify-center text-white/80 cursor-pointer hover:bg-[#22242e] transition-all"
          >
            {/* Grid Icon */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
            </svg>
          </div>

          <button
            onClick={onClose}
            className="px-6 py-2 rounded-full border border-white/10 hover:bg-white/5 text-xs text-white/70 hover:text-white transition-all font-sans font-medium"
          >
            Close
          </button>
        </div>

        {isProcessing && (
          <LoadingExecutionOverlay
            title="Processing Deposit..."
            subtitle={`Crediting ₦${Number(amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })} directly to your 10-digit PalmPay account.`}
            amount={Number(amount) || undefined}
            variant="emerald"
          />
        )}
      </div>
    </div>
  );
}
