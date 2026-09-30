import React, { useEffect, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, X, ChevronRight, BellRing, Sparkles } from 'lucide-react';
import { FlashAlertData } from '../utils/alerts';

interface FlashAlertOverlayProps {
  alert: FlashAlertData | null;
  onDismiss: () => void;
  onViewReceipt: (tx: any) => void;
}

export default function FlashAlertOverlay({
  alert,
  onDismiss,
  onViewReceipt,
}: FlashAlertOverlayProps) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!alert) return;

    setProgress(100);
    const duration = 7000; // 7 seconds
    const intervalTime = 50;
    const step = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          onDismiss();
          return 0;
        }
        return prev - step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [alert, onDismiss]);

  if (!alert) return null;

  const isCredit = alert.type === 'credit';

  return (
    <div className="fixed top-2 inset-x-0 z-50 px-3 flex justify-center pointer-events-none animate-in fade-in slide-in-from-top-4 duration-300">
      <div
        onClick={() => {
          if (alert.fullTransaction) {
            onViewReceipt(alert.fullTransaction);
          }
          onDismiss();
        }}
        className="pointer-events-auto w-full max-w-md bg-[#121524]/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.6)] text-white p-3.5 cursor-pointer relative overflow-hidden transition-all hover:scale-[1.01] active:scale-[0.99]"
      >
        {/* Animated Background Accent Glow */}
        <div
          className={`absolute -top-10 -right-10 w-36 h-36 rounded-full blur-3xl opacity-30 pointer-events-none ${
            isCredit ? 'bg-emerald-500' : 'bg-purple-600'
          }`}
        />

        {/* Top Header Strip */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#6700ea] p-1 flex items-center justify-center shadow-md">
              <img src="/palmpay_official_icon.png" alt="PalmPay" className="w-full h-full object-contain" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-200">
                PalmPay Flash Alert
              </span>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-tight flex items-center gap-0.5 ${
                  isCredit
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                }`}
              >
                <Sparkles size={9} />
                {isCredit ? 'Deposit' : 'Withdrawal'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[10px] text-white/50">{alert.date || 'Just now'}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDismiss();
              }}
              className="p-1 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all"
              aria-label="Close"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Main Alert Body */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${
                isCredit
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}
            >
              {isCredit ? (
                <ArrowDownLeft size={20} strokeWidth={2.6} className="animate-bounce" />
              ) : (
                <ArrowUpRight size={20} strokeWidth={2.6} />
              )}
            </div>

            <div>
              <p className="text-xs text-white/70 font-medium truncate max-w-[200px]">
                {isCredit ? `From: ${alert.senderOrRecipient}` : `To: ${alert.senderOrRecipient}`}
              </p>
              <h3
                className={`text-lg font-black tracking-tight font-sans ${
                  isCredit ? 'text-emerald-400' : 'text-white'
                }`}
              >
                {alert.formattedAmount}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-bold text-purple-300 hover:text-white bg-white/5 hover:bg-white/10 px-2.5 py-1.5 rounded-xl border border-white/10 transition-all shrink-0">
            <span>View Receipt</span>
            <ChevronRight size={13} />
          </div>
        </div>

        {/* Auto Dismiss Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10 overflow-hidden">
          <div
            className={`h-full transition-all duration-75 ${
              isCredit ? 'bg-emerald-400' : 'bg-purple-400'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
