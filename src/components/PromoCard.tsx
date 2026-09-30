import React from 'react';

interface PromoCardProps {
  onClaim: () => void;
}

export default function PromoCard({ onClaim }: PromoCardProps) {
  return (
    <div className="px-4 py-2">
      <div className="relative rounded-2xl p-6 mirror-glass-card border border-purple-500/25 shadow-[0_12px_36px_rgba(20,15,40,0.7)] overflow-hidden text-center group">
        {/* Ambient purple center glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <p className="text-white/90 text-base font-normal tracking-normal mb-1 font-sans">
            Fund <span className="font-semibold text-white">₦450</span>
          </p>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight my-2">
            Get <span className="text-[#6366f1] drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">₦50</span> Extra
          </h2>

          <div className="mt-5">
            <button
              onClick={onClaim}
              className="w-full py-3 px-6 rounded-full bg-[#7846f7] hover:bg-[#6836ea] text-white font-bold text-base shadow-[0_6px_25px_rgba(120,70,247,0.45)] hover:shadow-[0_8px_30px_rgba(120,70,247,0.6)] active:scale-[0.98] transition-all"
            >
              Claim Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
