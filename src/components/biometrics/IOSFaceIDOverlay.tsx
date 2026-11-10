import React, { useEffect, useState } from 'react';
import { ScanFace, Check, X, ShieldCheck } from 'lucide-react';
import { authenticateWithBiometrics } from '../../utils/biometrics';

interface IOSFaceIDOverlayProps {
  userId?: string;
  userName?: string;
  onSuccess: () => void;
  onCancel: () => void;
  onSwitchToTouch?: () => void;
  onFallbackToPin?: () => void;
}

export default function IOSFaceIDOverlay({
  userId,
  userName = 'PalmPay User',
  onSuccess,
  onCancel,
  onSwitchToTouch,
  onFallbackToPin,
}: IOSFaceIDOverlayProps) {
  const [phase, setPhase] = useState<'scanning' | 'verifying' | 'success' | 'failed'>('scanning');
  const [errorText, setErrorText] = useState('');

  const triggerAuth = async () => {
    setPhase('scanning');
    setErrorText('');

    // Wait 4 seconds scanning before verifying
    await new Promise((r) => setTimeout(r, 4000));
    setPhase('verifying');

    const res = await authenticateWithBiometrics({
      userId,
      title: 'Face ID',
      reason: 'Verify Face ID to sign in to PalmPay',
    });

    if (res.success) {
      setPhase('success');
      setTimeout(() => {
        onSuccess();
      }, 700);
    } else {
      setPhase('failed');
      setErrorText(res.error || 'Face Not Recognized');
    }
  };

  useEffect(() => {
    const t = setTimeout(triggerAuth, 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-start p-4 pt-8 bg-black/85 backdrop-blur-2xl animate-fade-in select-none">
      {/* iOS TrueDepth Camera Island Notch at Top */}
      <div className="w-32 h-7 bg-black rounded-full mx-auto mb-6 border border-white/10 flex items-center justify-between px-3.5 shadow-2xl">
        {/* Camera lens */}
        <div className="w-2.5 h-2.5 rounded-full bg-[#111] border border-white/20 flex items-center justify-center">
          <div className="w-1 h-1 rounded-full bg-blue-500/80 animate-pulse" />
        </div>
        {/* Speaker grill */}
        <div className="w-10 h-1 bg-white/20 rounded-full" />
        {/* IR Dot projector sensor */}
        <div className="w-2 h-2 rounded-full bg-[#111] border border-white/20" />
      </div>

      {/* iOS Face ID Modal Container positioned directly below camera notch */}
      <div className="w-[320px] bg-[#1c1c1e]/95 backdrop-blur-3xl border border-white/15 rounded-[38px] p-6 text-center shadow-[0_30px_70px_rgba(0,0,0,0.9)] relative overflow-hidden font-sans">
        {/* Title & App Subtitle */}
        <div className="mb-4">
          <h3 className="text-xl font-extrabold text-white tracking-tight font-sans">
            Face ID
          </h3>
          <p className="text-xs text-white/60 font-medium mt-0.5">
            PalmPay Sign In
          </p>
        </div>

        {/* iOS Face ID Visual Container */}
        <div className="relative my-3 mx-auto w-28 h-28 flex items-center justify-center">
          {/* Outer Squircle Box with glowing corners */}
          <div
            className={`w-32 h-32 rounded-[28px] border-2 flex items-center justify-center relative overflow-hidden transition-all duration-500 ${
              phase === 'success'
                ? 'bg-[#30d158]/20 border-[#30d158] scale-105 shadow-[0_0_30px_rgba(48,209,88,0.4)]'
                : phase === 'failed'
                ? 'bg-rose-500/20 border-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.4)] animate-shake'
                : 'bg-white/[0.04] border-cyan-400/40 shadow-[0_0_25px_rgba(56,189,248,0.2)]'
            }`}
          >
            {/* Corner Bracket Accents (iOS style) */}
            {phase !== 'success' && phase !== 'failed' && (
              <>
                <div className="absolute top-2 left-2 w-3.5 h-3.5 border-t-2 border-l-2 border-cyan-400 rounded-tl" />
                <div className="absolute top-2 right-2 w-3.5 h-3.5 border-t-2 border-r-2 border-cyan-400 rounded-tr" />
                <div className="absolute bottom-2 left-2 w-3.5 h-3.5 border-b-2 border-l-2 border-cyan-400 rounded-bl" />
                <div className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b-2 border-r-2 border-cyan-400 rounded-br" />
              </>
            )}

            {/* Lottie-style radiating scanning feedback rings */}
            {(phase === 'scanning' || phase === 'verifying') && (
              <>
                <div className="absolute inset-0 rounded-[28px] border border-cyan-400/50 animate-ping opacity-50 pointer-events-none" />
                <div className="absolute -inset-2 rounded-[32px] border border-blue-400/30 animate-pulse opacity-40 pointer-events-none" />
              </>
            )}

            {/* Vertical Scanning Laser Line */}
            {(phase === 'scanning' || phase === 'verifying') && (
              <div className="absolute inset-x-0 h-[2.5px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#38bdf8] animate-scan-y z-10" />
            )}

            {/* Main Face Icon / Checkmark */}
            {phase === 'success' ? (
              <div className="w-14 h-14 rounded-full bg-[#30d158] text-black flex items-center justify-center shadow-lg animate-scale-up">
                <Check size={36} strokeWidth={3.5} />
              </div>
            ) : (
              <ScanFace
                size={60}
                className={`transition-all duration-300 ${
                  phase === 'failed'
                    ? 'text-rose-400'
                    : phase === 'verifying'
                    ? 'text-cyan-300 animate-pulse'
                    : 'text-white/80'
                }`}
                strokeWidth={1.5}
              />
            )}
          </div>
        </div>

        {/* Status Text */}
        <div className="min-h-[32px] flex items-center justify-center my-3">
          <p className="text-xs font-semibold text-white/80 font-sans">
            {phase === 'success'
              ? 'Face ID Verified'
              : phase === 'failed'
              ? errorText || 'Face Not Recognized'
              : phase === 'verifying'
              ? 'Verifying identity...'
              : 'Hold phone upright to scan'}
          </p>
        </div>

        {/* Action Controls */}
        <div className="mt-4 pt-3 border-t border-white/10 space-y-2">
          {phase === 'failed' ? (
            <button
              onClick={triggerAuth}
              className="w-full py-2.5 rounded-xl bg-[#0a84ff] hover:bg-[#0071e3] text-white font-bold text-xs shadow-md active:scale-95 transition-all"
            >
              Try Face ID Again
            </button>
          ) : null}

          {onSwitchToTouch && (
            <button
              type="button"
              onClick={onSwitchToTouch}
              className="w-full py-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
            >
              Switch to One UI Touch Sensor
            </button>
          )}

          {onFallbackToPin ? (
            <button
              type="button"
              onClick={onFallbackToPin}
              className="w-full py-1.5 text-xs font-semibold text-[#0a84ff] hover:text-blue-300 transition-colors"
            >
              Enter Password / PIN
            </button>
          ) : (
            <button
              type="button"
              onClick={onCancel}
              className="w-full py-1.5 text-xs text-white/50 hover:text-white transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
