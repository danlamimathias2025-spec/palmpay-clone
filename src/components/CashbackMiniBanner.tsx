import React, { useState } from 'react';
import { Sparkles, ArrowRightLeft } from 'lucide-react';

interface CashbackMiniBannerProps {
  onGo: () => void;
}

export default function CashbackMiniBanner({ onGo }: CashbackMiniBannerProps) {
  const [activeSlide, setActiveSlide] = useState(0);

  const promos = [
    {
      title: 'Up To ₦30 Cashback',
      subtitle: 'Earn Cashback Now !',
      icon: <Sparkles size={18} className="text-amber-400" />,
      tag: 'HOT',
    },
    {
      title: 'Exclusive Data Bonus',
      subtitle: 'Limited time only',
      icon: <ArrowRightLeft size={18} className="text-emerald-400" />,
      tag: 'BONUS',
    },
  ];

  const current = promos[activeSlide];

  return (
    <div className="px-4 py-1.5">
      <div className="mirror-glass-card rounded-2xl p-3 border border-white/10 relative overflow-hidden flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/20 flex items-center justify-center shrink-0">
              {current.icon}
            </div>

            <div>
              <h4 className="text-xs sm:text-sm font-semibold text-white tracking-normal">
                {current.title}
              </h4>
              <p className="text-[11px] text-white/60">
                {current.subtitle}
              </p>
            </div>
          </div>

          <button
            onClick={onGo}
            className="px-4 py-1 rounded-full border border-purple-500/60 hover:bg-purple-600/20 text-purple-300 font-semibold text-xs active:scale-95 transition-all"
          >
            GO
          </button>
        </div>

        {/* Carousel Indicator Dots */}
        <div className="flex items-center justify-center gap-1.5 mt-0.5">
          {promos.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveSlide(idx)}
              aria-label={`Slide ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                activeSlide === idx ? 'w-4 bg-[#7846f7]' : 'w-1.5 bg-white/20'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
