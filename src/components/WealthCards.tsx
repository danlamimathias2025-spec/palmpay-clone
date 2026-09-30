import React from 'react';
import { ChevronRight } from 'lucide-react';

interface WealthCardsProps {
  onSaveNow: () => void;
  onGrab: () => void;
  onMoreWealth: () => void;
}

export default function WealthCards({ onSaveNow, onGrab, onMoreWealth }: WealthCardsProps) {
  return (
    <div className="px-4 py-2">
      <div className="grid grid-cols-2 gap-3">
        {/* Card 1: Prime Fixed Special */}
        <div className="mirror-glass-card rounded-2xl p-3.5 relative overflow-hidden border border-white/10 flex flex-col justify-between">
          {/* HOT Badge */}
          <div className="absolute top-0 right-0 w-12 h-12 overflow-hidden pointer-events-none">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-bold text-center py-0.5 w-18 absolute top-2.5 -right-5 rotate-45 shadow-sm">
              HOT
            </div>
          </div>

          <div>
            <h4 className="text-xs sm:text-sm font-semibold text-[#c084fc] tracking-normal pr-5">
              Prime Fixed Special
            </h4>
            <p className="text-[11px] text-white/50 mb-2.5">
              September Only
            </p>

            <div className="mb-3">
              <span className="text-lg sm:text-xl font-bold text-[#10b981] font-sans">
                20.00%
              </span>
              <p className="text-[11px] text-white/60">
                Annual Yield
              </p>
            </div>
          </div>

          <button
            onClick={onSaveNow}
            className="w-fit py-1.5 px-4 rounded-full bg-[#7846f7] hover:bg-[#6836ea] text-white font-medium text-xs shadow-md active:scale-95 transition-all"
          >
            Save Now
          </button>
        </div>

        {/* Card 2: Team Up & Save */}
        <div className="mirror-glass-card rounded-2xl p-3.5 relative overflow-hidden border border-white/10 flex flex-col justify-between">
          <div>
            <h4 className="text-xs sm:text-sm font-semibold text-[#c084fc] tracking-normal">
              Team Up & Save
            </h4>
            <p className="text-[11px] text-white/50 mb-2.5">
              Fixed Savings Challenge
            </p>

            <div className="mb-3">
              <span className="text-lg sm:text-xl font-bold text-[#10b981] font-sans">
                ₦40,000
              </span>
              <p className="text-[11px] text-white/60">
                Cash
              </p>
            </div>
          </div>

          <button
            onClick={onGrab}
            className="w-fit py-1.5 px-5 rounded-full bg-[#7846f7] hover:bg-[#6836ea] text-white font-medium text-xs shadow-md active:scale-95 transition-all"
          >
            Grab
          </button>
        </div>
      </div>

      {/* More Wealth Product link */}
      <div className="flex justify-center mt-2.5">
        <button
          onClick={onMoreWealth}
          className="flex items-center gap-1 text-xs text-white/70 hover:text-white transition-colors"
        >
          <span>More Wealth Product</span>
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}
