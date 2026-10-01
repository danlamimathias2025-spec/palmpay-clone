import React, { useState } from 'react';
import { TrendingUp, ShieldCheck, ChevronRight, Lock, Users, Sparkles, PlusCircle } from 'lucide-react';
import { formatNaira } from '../../utils/format';

interface WealthPageProps {
  balance: number;
  onDepositSuccess: (amount: number) => void;
}

export default function WealthPage({ balance, onDepositSuccess }: WealthPageProps) {
  const [savingsBalance, setSavingsBalance] = useState(() => {
    return Number(localStorage.getItem('palmpay_savings_balance') || 0);
  });
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('1000');

  const handleDeposit = () => {
    const amt = Number(depositAmount);
    if (amt > 0 && amt <= balance) {
      const nextBal = savingsBalance + amt;
      setSavingsBalance(nextBal);
      localStorage.setItem('palmpay_savings_balance', nextBal.toString());
      onDepositSuccess(amt);
      setShowDepositModal(false);
    } else {
      alert("Insufficient balance or invalid amount.");
    }
  };

  const cumulativeInterest = savingsBalance > 0 ? (savingsBalance * 0.0005).toFixed(2) : '0.00';

  return (
    <div className="flex flex-col min-h-screen pb-28 max-w-md mx-auto px-4 pt-3">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold font-script text-white">Wealth & Savings</h1>
          <p className="text-xs text-white/60">Grow your wealth with up to 20% annual yield</p>
        </div>
        <div className="flex items-center gap-1 bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2.5 py-1 rounded-full text-xs font-semibold">
          <ShieldCheck size={14} />
          <span>CBN Licensed</span>
        </div>
      </div>

      {/* Total Wealth Portfolio Card */}
      <div className="mirror-glass-card rounded-3xl p-6 relative overflow-hidden border border-purple-500/30 shadow-[0_12px_36px_rgba(110,50,240,0.3)] mb-4">
        <div className="absolute top-0 right-0 w-36 h-36 bg-purple-600/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <span className="text-xs text-white/70 font-script uppercase tracking-wider">
            Total Wealth Assets
          </span>
          <div className="flex items-baseline gap-1 my-1">
            <span className="text-3xl sm:text-4xl font-black text-white font-sans tabular-nums">
              ₦{savingsBalance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold mt-1">
            <TrendingUp size={14} />
            <span>Cumulative Interest: +₦{cumulativeInterest}</span>
          </div>

          <div className="mt-5 flex gap-2">
            <button
              onClick={() => setShowDepositModal(true)}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#7846f7] to-[#6335ea] hover:brightness-110 text-white font-bold text-sm shadow-md active:scale-95 transition-all text-center flex items-center justify-center gap-1.5"
            >
              <PlusCircle size={16} />
              <span>Save & Earn</span>
            </button>
            <button
              onClick={() => alert("Interest is calculated and paid to your account daily at 12:00 AM.")}
              className="py-3 px-4 rounded-xl mirror-glass hover:bg-white/10 text-white/90 text-xs font-semibold border border-white/10"
            >
              Interest Rules
            </button>
          </div>
        </div>
      </div>

      {/* Savings Products List */}
      <div className="space-y-3 mb-4">
        <h3 className="text-sm font-bold text-white font-script">Featured High-Yield Products</h3>

        {/* 1. Prime Fixed Special (Matching Screenshot) */}
        <div className="mirror-glass-card rounded-2xl p-4 border border-purple-500/20 relative overflow-hidden flex items-center justify-between group">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
              <Lock size={22} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-sm font-bold text-white font-script">Prime Fixed Special</h4>
                <span className="bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">
                  HOT
                </span>
              </div>
              <p className="text-xs text-white/60">September Only · 3-month lock</p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-base font-black text-emerald-400 font-sans">20.00%</span>
            <p className="text-[10px] text-white/50">Annual Yield</p>
          </div>
        </div>

        {/* 2. Team Up & Save (Matching Screenshot) */}
        <div className="mirror-glass-card rounded-2xl p-4 border border-white/10 relative overflow-hidden flex items-center justify-between group">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Users size={22} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white font-script">Team Up & Save</h4>
              <p className="text-xs text-white/60">Fixed Savings Challenge</p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-base font-black text-emerald-400 font-sans">₦40,000</span>
            <p className="text-[10px] text-white/50">Cash Pool</p>
          </div>
        </div>

        {/* 3. CashBox Flexible */}
        <div className="mirror-glass-card rounded-2xl p-4 border border-white/10 relative overflow-hidden flex items-center justify-between group">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-sky-500/15 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Sparkles size={22} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white font-script">CashBox (Daily Payout)</h4>
              <p className="text-xs text-white/60">Free withdraw anytime</p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-base font-black text-emerald-400 font-sans">16.00%</span>
            <p className="text-[10px] text-white/50">Annual Yield</p>
          </div>
        </div>
      </div>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="mirror-glass-modal rounded-3xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-white font-script mb-1">Save & Earn Interest</h3>
            <p className="text-xs text-white/70 mb-4">
              Transfer funds from available balance ({formatNaira(balance)}) to your Wealth account.
            </p>

            <div className="space-y-3 mb-5">
              <div>
                <label className="text-xs text-white/60 block mb-1">Deposit Amount (₦)</label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full p-3 rounded-xl mirror-glass border border-white/15 text-white font-sans text-base focus:outline-none focus:border-purple-400"
                  placeholder="Enter amount"
                />
              </div>

              <div className="flex gap-2">
                {['1000', '5000', '10000', '20000'].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setDepositAmount(amt)}
                    className="flex-1 py-1.5 rounded-lg mirror-glass text-[11px] font-semibold text-white/80 hover:bg-white/10 border border-white/10"
                  >
                    +₦{Number(amt).toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowDepositModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-white/20 text-white/80 hover:bg-white/10 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDeposit}
                className="flex-1 py-2.5 rounded-xl bg-[#7846f7] hover:bg-[#6836ea] text-white text-xs font-bold shadow-md"
              >
                Deposit Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
