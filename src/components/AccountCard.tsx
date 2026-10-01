import React, { useState } from 'react';
import { Eye, EyeOff, ShieldCheck, ChevronRight, Coins, Copy, Check } from 'lucide-react';
import { normalizePalmPayAccountNumber } from '../utils/account';
import { formatNaira } from '../utils/format';

interface AccountCardProps {
  balance: number;
  accountNumber?: string;
  onAddMoney: () => void;
  onViewHistory: () => void;
  onEarningsClick: () => void;
}

export default function AccountCard({ balance, accountNumber, onAddMoney, onViewHistory, onEarningsClick }: AccountCardProps) {
  const [showBalance, setShowBalance] = useState(true);
  const [copied, setCopied] = useState(false);

  const accountNum = normalizePalmPayAccountNumber(accountNumber || '');

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(accountNum);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="px-4 py-2">
      <div className="relative rounded-2xl overflow-hidden shadow-[0_12px_36px_rgba(110,50,240,0.38)] bg-gradient-to-r from-[#6335ea] via-[#743df5] to-[#8a41f6] border border-white/20 transition-all">
        {/* Specular Sheen */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.18] via-transparent to-transparent pointer-events-none" />

        {/* Card Main Body */}
        <div className="p-4 pb-3 relative z-10">
          {/* Top Line: Available Balance + Transaction History */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-white/95">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 flex items-center justify-center text-[#0f172a] shrink-0">
                <ShieldCheck size={11} strokeWidth={3} className="text-[#0c0e15]" />
              </span>
              <span className="text-xs sm:text-sm font-medium text-white/95 tracking-normal">
                Available Balance
              </span>
              <button
                onClick={() => setShowBalance(!showBalance)}
                aria-label="Toggle balance privacy"
                className="text-white/80 hover:text-white p-0.5 active:scale-90 transition-transform"
              >
                {showBalance ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
            </div>

            <button
              onClick={onViewHistory}
              className="flex items-center gap-0.5 text-xs text-white/90 hover:text-white transition-opacity font-normal"
            >
              <span>Transaction History</span>
              <ChevronRight size={13} className="opacity-90" />
            </button>
          </div>

          {/* Balance & Add Money Button */}
          <div className="flex items-center justify-between mt-1 mb-1">
            <div className="flex items-baseline">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans tabular-nums">
                {showBalance ? formatNaira(balance) : '••••••••'}
              </span>
            </div>

            <button
              onClick={onAddMoney}
              className="bg-[#12131c] hover:bg-black text-white text-xs font-medium px-3.5 py-1.5 rounded-full shadow-md active:scale-95 transition-all border border-white/10"
            >
              Add Money
            </button>
          </div>
        </div>

        {/* Bottom Sub-strip: Yesterday's Earnings */}
        <div
          onClick={onEarningsClick}
          className="bg-black/25 backdrop-blur-md px-4 py-2 flex items-center justify-between border-t border-white/10 cursor-pointer hover:bg-black/35 transition-colors relative z-10"
        >
          <div className="flex items-center gap-2 text-white/90 text-xs">
            <Coins size={14} className="text-purple-300 shrink-0" />
            <span>
              Yesterday's Earnings: <span className="text-white/80">₦0 (Updating)</span>
            </span>
          </div>

          <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-white/90">
            <ChevronRight size={11} strokeWidth={2.5} />
          </div>
        </div>
      </div>
    </div>
  );
}
