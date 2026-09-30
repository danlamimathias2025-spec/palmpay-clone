import React, { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
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

    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          return 0;
        }
        return prev - step;
      });
    }, intervalTime);

    const dismissTimer = setTimeout(() => {
      onDismiss();
    }, duration);

    return () => {
      clearInterval(progressTimer);
      clearTimeout(dismissTimer);
    };
  }, [alert, onDismiss]);

  if (!alert) return null;

  const isCredit = alert.type === 'credit';
  const senderName = alert.senderOrRecipient?.toUpperCase() || 'PALMPAY USER';
  const timeStr = alert.date?.includes(':') ? alert.date.split(' ').pop() || '11:16 PM' : '11:16 PM';

  return (
    <div className="fixed top-2 inset-x-0 z-50 px-3 flex justify-center pointer-events-none animate-in fade-in slide-in-from-top-4 duration-300">
      <div
        onClick={() => {
          if (alert.fullTransaction) {
            onViewReceipt(alert.fullTransaction);
          }
          onDismiss();
        }}
        className="pointer-events-auto w-full max-w-md bg-[#1d1f27] border border-white/10 rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.5)] text-white p-3.5 cursor-pointer relative overflow-hidden transition-all hover:brightness-110 active:scale-[0.99] flex items-start gap-3"
      >
        {/* PalmPay Brand Icon */}
        <div className="w-8 h-8 rounded-full bg-transparent flex items-center justify-center shrink-0 mt-0.5">
          <img src="/palmpay_official_icon.svg" alt="PalmPay" className="w-full h-full object-contain" />
        </div>

        {/* Text Content Block */}
        <div className="flex-1 min-w-0">
          {/* Header row with Title and Chevron */}
          <div className="flex items-center justify-between gap-1.5 mb-1">
            <h4 className="text-[12px] font-bold text-white tracking-wide truncate">
              {isCredit ? `Received from ${senderName}` : `Paid to ${senderName}`}
            </h4>
            <div className="flex items-center gap-1.5 shrink-0 text-[10px] text-white/50">
              <span>{timeStr}</span>
              <ChevronDown size={14} className="text-white/40" />
            </div>
          </div>

          {/* Subtitle Message Body */}
          <p className="text-[11px] text-white/70 leading-relaxed truncate">
            {isCredit
              ? `You received ${alert.formattedAmount} from ${senderName}. It has been credite..`
              : `Your transfer of ${alert.formattedAmount} to ${senderName} was successful.`}
          </p>
        </div>

        {/* Custom Auto Dismiss Progress Line indicator */}
        <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-white/5 overflow-hidden">
          <div
            className={`h-full transition-all duration-75 ${
              isCredit ? 'bg-purple-500' : 'bg-purple-400'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
