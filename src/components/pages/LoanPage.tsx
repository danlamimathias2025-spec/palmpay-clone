import React, { useState } from 'react';
import { Landmark, ShieldCheck, CheckCircle2, ChevronRight, Calculator, AlertCircle } from 'lucide-react';
import { useOrientation } from '../../hooks/useOrientation';
import LoadingExecutionOverlay from '../LoadingExecutionOverlay';

interface LoanPageProps {
  balance: number;
  onApplySuccess: (amount: number) => void;
}

export default function LoanPage({ onApplySuccess }: LoanPageProps) {
  const [loanAmount, setLoanAmount] = useState(50000);
  const [tenor, setTenor] = useState(30);
  const [isApplying, setIsApplying] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { isLandscape } = useOrientation();

  const interestRate = 0.05; // 0.05% per day
  const totalInterest = Math.round(loanAmount * (interestRate / 100) * tenor);
  const totalRepayment = loanAmount + totalInterest;

  const handleApply = () => {
    setIsApplying(true);
    setTimeout(() => {
      setIsApplying(false);
      setShowConfirm(false);
      onApplySuccess(loanAmount);
    }, 1200);
  };

  return (
    <div className={`flex flex-col min-h-screen pb-28 mx-auto px-4 pt-3 transition-all duration-300 ${
      isLandscape ? 'max-w-4xl' : 'max-w-md'
    }`}>
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold font-script text-white">Flexi-Cash Loan</h1>
          <p className="text-xs text-white/60">Instant credit with 0 collateral</p>
        </div>
        <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full text-xs font-semibold">
          <ShieldCheck size={14} />
          <span>NDIC Insured</span>
        </div>
      </div>

      {isLandscape ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Column 1: Credit Limit and Trust Features */}
          <div className="space-y-4">
            {/* Credit Limit Hero Card */}
            <div className="mirror-glass-card rounded-3xl p-6 relative overflow-hidden border border-purple-500/30 shadow-[0_12px_36px_rgba(110,50,240,0.3)]">
              <div className="absolute top-0 right-0 w-36 h-36 bg-purple-600/20 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10">
                <span className="text-xs text-purple-300 font-script font-semibold uppercase tracking-wider">
                  Available Credit Limit
                </span>
                <div className="flex items-baseline gap-1 my-1">
                  <span className="text-3xl sm:text-4xl font-black text-white font-sans tabular-nums">
                    ₦150,000.00
                  </span>
                </div>
                <p className="text-xs text-white/70">
                  Daily interest as low as <span className="text-emerald-400 font-bold">0.05%</span>
                </p>

                <div className="mt-5 flex gap-2">
                  <button
                    onClick={() => setShowConfirm(true)}
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#7846f7] to-[#6335ea] hover:brightness-110 text-white font-bold text-sm shadow-md active:scale-95 transition-all text-center"
                  >
                    Borrow Now
                  </button>
                  <button
                    onClick={() => alert("Credit Score: 780 (Tier 1 High-Trust Borrower)")}
                    className="py-3 px-4 rounded-xl mirror-glass hover:bg-white/10 text-white/90 text-xs font-semibold border border-white/10"
                  >
                    Check Limit
                  </button>
                </div>
              </div>
            </div>

            {/* Trust & Features */}
            <div className="space-y-2.5">
              <div className="mirror-glass rounded-xl p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 size={18} />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-white">Disbursed in 5 Seconds</p>
                  <p className="text-white/60">Credited directly to your PalmPay available balance.</p>
                </div>
              </div>

              <div className="mirror-glass rounded-xl p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center text-purple-400">
                  <Landmark size={18} />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-white">Flexible Early Repayment</p>
                  <p className="text-white/60">No penalty fees for paying back early.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Interactive Loan Amount & Tenor Calculator */}
          <div>
            <div className="mirror-glass-card rounded-2xl p-5 border border-white/10 h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Calculator size={18} className="text-purple-400" />
                  <h3 className="text-sm font-bold text-white font-script">Loan Amount & Tenor</h3>
                </div>

                {/* Amount Slider */}
                <div className="mb-4">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-white/60">Amount</span>
                    <span className="font-bold text-white text-base">₦{loanAmount.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="5000"
                    max="150000"
                    step="5000"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(Number(e.target.value))}
                    className="w-full h-2 bg-purple-950/60 rounded-lg appearance-none cursor-pointer accent-[#7846f7]"
                  />
                  <div className="flex justify-between text-[10px] text-white/40 mt-1">
                    <span>₦5,000</span>
                    <span>₦150,000</span>
                  </div>
                </div>

                {/* Tenor Selection */}
                <div className="mb-4">
                  <span className="text-xs text-white/60 block mb-2">Duration (Days)</span>
                  <div className="grid grid-cols-4 gap-2">
                    {[14, 30, 60, 90].map((days) => (
                      <button
                        key={days}
                        onClick={() => setTenor(days)}
                        className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                          tenor === days
                            ? 'bg-[#7846f7] text-white border-purple-400 shadow-sm'
                            : 'mirror-glass text-white/70 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {days} Days
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Repayment Breakdown */}
              <div className="bg-black/30 rounded-xl p-3 border border-white/5 space-y-1.5 text-xs">
                <div className="flex justify-between text-white/70">
                  <span>Interest ({interestRate}%/day × {tenor}d)</span>
                  <span className="text-white">₦{totalInterest.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>Processing Fee</span>
                  <span className="text-emerald-400 font-semibold">₦0 (Waived)</span>
                </div>
                <div className="border-t border-white/10 pt-1.5 flex justify-between font-bold text-white text-sm">
                  <span>Total Repayment</span>
                  <span className="text-[#c084fc]">₦{totalRepayment.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Credit Limit Hero Card */}
          <div className="mirror-glass-card rounded-3xl p-6 relative overflow-hidden border border-purple-500/30 shadow-[0_12px_36px_rgba(110,50,240,0.3)] mb-4">
            <div className="absolute top-0 right-0 w-36 h-36 bg-purple-600/20 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10">
              <span className="text-xs text-purple-300 font-script font-semibold uppercase tracking-wider">
                Available Credit Limit
              </span>
              <div className="flex items-baseline gap-1 my-1">
                <span className="text-3xl sm:text-4xl font-black text-white font-sans tabular-nums">
                  ₦150,000.00
                </span>
              </div>
              <p className="text-xs text-white/70">
                Daily interest as low as <span className="text-emerald-400 font-bold">0.05%</span>
              </p>

              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => setShowConfirm(true)}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#7846f7] to-[#6335ea] hover:brightness-110 text-white font-bold text-sm shadow-md active:scale-95 transition-all text-center"
                >
                  Borrow Now
                </button>
                <button
                  onClick={() => alert("Credit Score: 780 (Tier 1 High-Trust Borrower)")}
                  className="py-3 px-4 rounded-xl mirror-glass hover:bg-white/10 text-white/90 text-xs font-semibold border border-white/10"
                >
                  Check Limit
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Loan Amount & Tenor Calculator */}
          <div className="mirror-glass-card rounded-2xl p-5 border border-white/10 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <Calculator size={18} className="text-purple-400" />
              <h3 className="text-sm font-bold text-white font-script">Loan Amount & Tenor</h3>
            </div>

            {/* Amount Slider */}
            <div className="mb-4">
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-white/60">Amount</span>
                <span className="font-bold text-white text-base">₦{loanAmount.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="5000"
                max="150000"
                step="5000"
                value={loanAmount}
                onChange={(e) => setLoanAmount(Number(e.target.value))}
                className="w-full h-2 bg-purple-950/60 rounded-lg appearance-none cursor-pointer accent-[#7846f7]"
              />
              <div className="flex justify-between text-[10px] text-white/40 mt-1">
                <span>₦5,000</span>
                <span>₦150,000</span>
              </div>
            </div>

            {/* Tenor Selection */}
            <div className="mb-4">
              <span className="text-xs text-white/60 block mb-2">Duration (Days)</span>
              <div className="grid grid-cols-4 gap-2">
                {[14, 30, 60, 90].map((days) => (
                  <button
                    key={days}
                    onClick={() => setTenor(days)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                      tenor === days
                        ? 'bg-[#7846f7] text-white border-purple-400 shadow-sm'
                        : 'mirror-glass text-white/70 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {days} Days
                  </button>
                ))}
              </div>
            </div>

            {/* Repayment Breakdown */}
            <div className="bg-black/30 rounded-xl p-3 border border-white/5 space-y-1.5 text-xs">
              <div className="flex justify-between text-white/70">
                <span>Interest ({interestRate}%/day × {tenor}d)</span>
                <span className="text-white">₦{totalInterest.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-white/70">
                <span>Processing Fee</span>
                <span className="text-emerald-400 font-semibold">₦0 (Waived)</span>
              </div>
              <div className="border-t border-white/10 pt-1.5 flex justify-between font-bold text-white text-sm">
                <span>Total Repayment</span>
                <span className="text-[#c084fc]">₦{totalRepayment.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Trust & Features */}
          <div className="space-y-2.5">
            <div className="mirror-glass rounded-xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400">
                <CheckCircle2 size={18} />
              </div>
              <div className="text-xs">
                <p className="font-bold text-white">Disbursed in 5 Seconds</p>
                <p className="text-white/60">Credited directly to your PalmPay available balance.</p>
              </div>
            </div>

            <div className="mirror-glass rounded-xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center text-purple-400">
                <Landmark size={18} />
              </div>
              <div className="text-xs">
                <p className="font-bold text-white">Flexible Early Repayment</p>
                <p className="text-white/60">No penalty fees for paying back early.</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="mirror-glass-modal rounded-3xl p-6 w-full max-w-sm text-center">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/20 text-[#c084fc] flex items-center justify-center mx-auto mb-3">
              <Landmark size={28} />
            </div>

            <h3 className="text-lg font-bold text-white font-script">Confirm Loan Application</h3>
            <p className="text-xs text-white/70 mt-1 mb-4">
              You are applying for <span className="font-bold text-white">₦{loanAmount.toLocaleString()}</span> for {tenor} days.
            </p>

            <div className="bg-black/40 rounded-xl p-3 text-left space-y-1.5 text-xs mb-5">
              <div className="flex justify-between text-white/60">
                <span>Disbursement</span>
                <span className="text-white font-semibold">₦{loanAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>Total Repayment</span>
                <span className="text-purple-300 font-semibold">₦{totalRepayment.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>Due Date</span>
                <span className="text-white font-semibold">
                  {new Date(Date.now() + tenor * 86400000).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-white/20 text-white/80 hover:bg-white/10 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={isApplying}
                className="flex-1 py-2.5 rounded-xl bg-[#7846f7] hover:bg-[#6836ea] text-white text-xs font-bold shadow-md flex items-center justify-center"
              >
                {isApplying ? 'Disbursing...' : 'Confirm & Accept'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isApplying && (
        <LoadingExecutionOverlay
          title="Disbursing Flexi-Cash Loan..."
          subtitle={`Instant automated credit check & direct disbursement to your PalmPay available balance.`}
          amount={loanAmount}
          variant="purple"
        />
      )}
    </div>
  );
}
