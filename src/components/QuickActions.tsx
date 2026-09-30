import React from 'react';
import { Landmark, Smartphone, PiggyBank, HandCoins } from 'lucide-react';

interface QuickActionsProps {
  onToBank: () => void;
  onToPalmPay: () => void;
  onSavings: () => void;
  onLoan: () => void;
}

export default function QuickActions({ onToBank, onToPalmPay, onSavings, onLoan }: QuickActionsProps) {
  return (
    <div className="px-4 py-2">
      <div className="grid grid-cols-4 gap-2.5">
        {/* To Bank */}
        <button
          onClick={onToBank}
          className="relative mirror-glass-card rounded-2xl py-3 px-1 flex flex-col items-center justify-center group active:scale-95 transition-all text-center"
        >
          {/* 0 Fee badge */}
          <span className="absolute -top-1.5 right-2 bg-gradient-to-r from-amber-500 to-rose-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full shadow-sm leading-tight border border-white/20">
            0 Fee
          </span>

          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-1 text-[#a855f7]">
            <Landmark size={24} strokeWidth={2} />
          </div>
          <span className="text-xs text-white/90 font-medium whitespace-nowrap">
            To Bank
          </span>
        </button>

        {/* To PalmPay */}
        <button
          onClick={onToPalmPay}
          className="mirror-glass-card rounded-2xl py-3 px-1 flex flex-col items-center justify-center group active:scale-95 transition-all text-center"
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-1 overflow-hidden p-0">
            <img
              src="/palmpay_official_icon.svg"
              alt="PalmPay"
              className="w-full h-full object-contain rounded-lg group-hover:scale-105 transition-transform"
            />
          </div>
          <span className="text-xs text-white/90 font-medium whitespace-nowrap">
            To PalmPay
          </span>
        </button>

        {/* Savings */}
        <button
          onClick={onSavings}
          className="mirror-glass-card rounded-2xl py-3 px-1 flex flex-col items-center justify-center group active:scale-95 transition-all text-center"
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-1 text-[#c084fc]">
            <PiggyBank size={24} strokeWidth={2} />
          </div>
          <span className="text-xs text-white/90 font-medium whitespace-nowrap">
            Savings
          </span>
        </button>

        {/* Loan */}
        <button
          onClick={onLoan}
          className="mirror-glass-card rounded-2xl py-3 px-1 flex flex-col items-center justify-center group active:scale-95 transition-all text-center"
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-1 text-[#a855f7]">
            <HandCoins size={24} strokeWidth={2} />
          </div>
          <span className="text-xs text-white/90 font-medium whitespace-nowrap">
            Loan
          </span>
        </button>
      </div>
    </div>
  );
}
