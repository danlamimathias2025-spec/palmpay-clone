import React from 'react';
import { Gift, Sparkles, Check, ArrowRight } from 'lucide-react';
import { formatNaira } from '../../utils/format';

interface ClaimRewardModalProps {
  title: string;
  bonusAmount: number;
  onClose: () => void;
  onConfirmClaim: () => void;
}

export default function ClaimRewardModal({
  title,
  bonusAmount,
  onClose,
  onConfirmClaim,
}: ClaimRewardModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="mirror-glass-modal rounded-3xl p-6 w-full max-w-xs text-center relative overflow-hidden animate-scale-up">
        {/* Glow */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-44 h-44 bg-purple-500/30 rounded-full blur-2xl pointer-events-none" />

        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 p-0.5 mx-auto mb-3 shadow-[0_0_30px_rgba(244,63,94,0.6)]">
          <div className="w-full h-full rounded-3xl bg-[#141624] flex items-center justify-center text-amber-300">
            <Gift size={32} className="animate-bounce" />
          </div>
        </div>

        <span className="bg-purple-600/30 text-purple-300 border border-purple-500/30 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider inline-block mb-1">
          Special Reward
        </span>

        <h3 className="text-xl font-extrabold text-white font-script mb-1">
          {title}
        </h3>

        <div className="my-4 p-3 bg-black/40 rounded-2xl border border-white/10">
          <span className="text-xs text-white/60 block">Bonus Reward:</span>
          <span className="text-3xl font-black text-emerald-400 font-sans tracking-tight">
            +{formatNaira(bonusAmount)}
          </span>
          <p className="text-[10px] text-white/50 mt-1">Instant addition to your Available Balance</p>
        </div>

        <div className="space-y-2">
          <button
            onClick={() => {
              onConfirmClaim();
              onClose();
            }}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#7846f7] to-[#9333ea] hover:brightness-110 text-white font-bold text-sm shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <span>Claim into Balance</span>
            <ArrowRight size={16} />
          </button>

          <button
            onClick={onClose}
            className="w-full py-2 text-xs text-white/60 hover:text-white transition-colors"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
