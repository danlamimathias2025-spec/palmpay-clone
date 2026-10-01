import React from 'react';
import { Shield, Sparkles, Lock } from 'lucide-react';

interface LoadingExecutionOverlayProps {
  title?: string;
  subtitle?: string;
  amount?: number | string;
  variant?: 'purple' | 'emerald' | 'blue';
}

export default function LoadingExecutionOverlay({
  title = 'Processing...',
  subtitle = 'Please wait while your request is processed securely.',
  amount,
  variant = 'purple',
}: LoadingExecutionOverlayProps) {
  const getGlowColor = () => {
    switch (variant) {
      case 'emerald':
        return 'from-emerald-600/30 via-teal-900/20';
      case 'blue':
        return 'from-blue-600/30 via-indigo-900/20';
      default:
        return 'from-[#7846f7]/30 via-purple-900/20';
    }
  };

  const getSpinnerBorder = () => {
    switch (variant) {
      case 'emerald':
        return 'border-emerald-400 border-t-transparent';
      case 'blue':
        return 'border-blue-400 border-t-transparent';
      default:
        return 'border-[#933dfa] border-t-transparent';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="relative rounded-3xl p-6 sm:p-8 w-full max-w-sm text-center mirror-glass-modal border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden">
        {/* Background Ambient Glow */}
        <div
          className={`absolute -top-12 -left-12 w-48 h-48 bg-gradient-to-br ${getGlowColor()} to-transparent rounded-full blur-2xl pointer-events-none`}
        />
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-purple-600/10 rounded-full blur-2xl pointer-events-none" />

        {/* Dynamic Dual-Ring Spinner with Center Pulse */}
        <div className="relative w-20 h-20 mx-auto mb-5 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-white/10" />
          <div className={`absolute inset-0 rounded-full border-4 ${getSpinnerBorder()} animate-spin`} />
          <div className="w-12 h-12 rounded-full bg-[#1e153a] border border-white/10 flex items-center justify-center text-purple-300 shadow-inner">
            <Lock size={18} className="animate-pulse" />
          </div>
        </div>

        {/* Title & Execution Details */}
        <h3 className="text-lg font-extrabold text-white tracking-tight mb-1 font-sans">
          {title}
        </h3>

        {amount !== undefined && amount !== null && (
          <div className="inline-block my-2 py-1 px-3.5 rounded-full bg-white/10 border border-white/15">
            <span className="text-sm font-black text-emerald-400 font-sans tracking-wide">
              {typeof amount === 'number'
                ? `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`
                : amount}
            </span>
          </div>
        )}

        <p className="text-xs text-white/60 max-w-xs mx-auto leading-relaxed mt-1">
          {subtitle}
        </p>

        {/* Security Badge */}
        <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-center gap-1.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
          <Shield size={12} strokeWidth={2.5} />
          <span>256-Bit Encrypted & Instant</span>
        </div>
      </div>
    </div>
  );
}
