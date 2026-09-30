import React, { useState } from 'react';
import { Gift } from 'lucide-react';

interface DataRechargeBannerProps {
  onGoNow: () => void;
  onDailyGift: () => void;
}

export default function DataRechargeBanner({ onGoNow, onDailyGift }: DataRechargeBannerProps) {
  const [activeSlide, setActiveSlide] = useState(0);

  return (
    <div className="px-4 pt-2 pb-6 relative">
      <div className="relative rounded-2xl overflow-hidden shadow-xl bg-gradient-to-r from-[#95e4d2] via-[#85dbca] to-[#6eccba] p-4 text-[#0f2923]">
        {/* Left Content */}
        <div className="w-7/12 relative z-10 flex flex-col justify-between min-h-[105px]">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight leading-tight text-[#0f2923]">
              Valid <span className="text-[#059669]">Today Only</span>
            </h3>
            <p className="text-xs sm:text-sm font-medium text-[#134e42] mt-0.5 leading-snug">
              Get Cashback on Data Recharge
            </p>
          </div>

          <div className="mt-3">
            <button
              onClick={onGoNow}
              className="py-1.5 px-4 rounded-full bg-[#0d5c52] hover:bg-[#08423b] text-white font-semibold text-xs shadow-md active:scale-95 transition-all"
            >
              Go Now
            </button>
          </div>
        </div>

        {/* Right Phone & Visual Mockup */}
        <div className="absolute right-2 top-1 bottom-1 w-5/12 flex items-center justify-center pointer-events-none">
          <img
            src="/src/assets/images/data_cashback_phone_1790734678183.jpg"
            alt="Data recharge promo phone"
            className="w-24 h-24 sm:w-28 sm:h-28 object-contain drop-shadow-md rounded-xl"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>

        {/* Carousel Dots */}
        <div className="flex items-center justify-center gap-1.5 mt-2 relative z-10">
          {[0, 1, 2].map((idx) => (
            <button
              key={idx}
              onClick={() => setActiveSlide(idx)}
              aria-label={`Slide ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                activeSlide === idx ? 'w-4 bg-[#0d5c52]' : 'w-1.5 bg-black/20'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Floating Daily Gift Box badge pinned to bottom right */}
      <button
        onClick={onDailyGift}
        className="absolute -bottom-1 right-5 z-20 flex flex-col items-center group cursor-pointer active:scale-90 transition-transform"
      >
        <div className="relative">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-0.5 shadow-[0_8px_20px_rgba(236,72,153,0.5)] animate-bounce">
            <div className="w-full h-full rounded-2xl bg-[#1a1c29] flex items-center justify-center">
              <Gift size={22} className="text-amber-400" />
            </div>
          </div>
          <span className="absolute -bottom-2 -left-1 -right-1 bg-gradient-to-r from-rose-500 to-amber-500 text-white text-[8px] font-bold rounded-full px-1 py-0.2 text-center uppercase tracking-tighter shadow-sm border border-white/20 whitespace-nowrap">
            Daily Gift
          </span>
        </div>
      </button>
    </div>
  );
}
