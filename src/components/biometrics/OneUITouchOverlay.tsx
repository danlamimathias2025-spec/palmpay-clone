import React, { useEffect, useState } from 'react';
import { Fingerprint, Check, AlertCircle } from 'lucide-react';
import { authenticateWithBiometrics } from '../../utils/biometrics';

interface OneUITouchOverlayProps {
  userId?: string;
  userName?: string;
  onSuccess: () => void;
  onCancel: () => void;
  onSwitchToFaceID?: () => void;
  onFallbackToPin?: () => void;
}

export default function OneUITouchOverlay({
  userId,
  userName = 'PalmPay User',
  onSuccess,
  onCancel,
  onSwitchToFaceID,
  onFallbackToPin,
}: OneUITouchOverlayProps) {
  const [phase, setPhase] = useState<'idle' | 'scanning' | 'success' | 'failed'>('idle');
  const [errorText, setErrorText] = useState('');

  const triggerAuth = async () => {
    setPhase('scanning');
    setErrorText('');

    await new Promise((r) => setTimeout(r, 500));

    const res = await authenticateWithBiometrics({
      userId,
      title: 'PalmPay Fingerprint',
      reason: 'Touch in-screen fingerprint sensor to log in',
    });

    if (res.success) {
      setPhase('success');
      setTimeout(() => {
        onSuccess();
      }, 650);
    } else {
      setPhase('failed');
      setErrorText(res.error || 'Fingerprint Not Recognized');
    }
  };

  useEffect(() => {
    const t = setTimeout(triggerAuth, 350);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between p-6 bg-black/90 backdrop-blur-2xl animate-fade-in select-none">
      {/* Top Bar Header */}
      <div className="w-full max-w-sm flex items-center justify-between pt-4">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#00e676] animate-pulse" />
          <span className="text-xs font-bold text-white tracking-wide uppercase font-sans">
            One UI Biometric
          </span>
        </div>
        <button
          onClick={onCancel}
          className="text-xs text-white/50 hover:text-white px-3 py-1 rounded-full border border-white/10"
        >
          Close
        </button>
      </div>

      {/* Center Guidance Info */}
      <div className="text-center max-w-xs my-auto">
        <h3 className="text-2xl font-black text-white tracking-tight font-sans mb-1">
          Touch In-Screen Sensor
        </h3>
        <p className="text-xs text-white/60 font-medium font-sans">
          {phase === 'success'
            ? 'Fingerprint authenticated successfully'
            : phase === 'failed'
            ? errorText || 'Sensor read failed. Tap icon to retry.'
            : 'Hold your finger on the sensor until recognized'}
        </p>
      </div>

      {/* Lower In-Display Ultrasonic Sensor Target */}
      <div className="mb-14 relative flex flex-col items-center">
        <div className="relative flex items-center justify-center">
          {/* Ultrasonic Pulse Ring Waves */}
          {phase === 'scanning' && (
            <>
              <div className="absolute w-36 h-36 rounded-full border-2 border-[#00e676]/40 animate-ping pointer-events-none opacity-40" />
              <div className="absolute w-44 h-44 rounded-full border border-cyan-400/30 animate-pulse pointer-events-none opacity-20" />
            </>
          )}

          {/* Ultrasonic Sensor Touch Disc */}
          <div
            onClick={triggerAuth}
            className={`w-28 h-28 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 relative z-10 shadow-[0_0_40px_rgba(0,230,118,0.3)] active:scale-95 ${
              phase === 'success'
                ? 'bg-[#00e676] text-black shadow-[0_0_50px_#00e676] scale-110'
                : phase === 'failed'
                ? 'bg-rose-500/30 text-rose-400 border-2 border-rose-500 shadow-[0_0_40px_rgba(244,63,94,0.5)]'
                : 'bg-gradient-to-tr from-[#111a2e] to-[#0a2e1d] border-2 border-[#00e676]/80 text-[#00e676] hover:border-[#00e676]'
            }`}
          >
            {phase === 'success' ? (
              <Check size={52} strokeWidth={3.5} className="animate-scale-up" />
            ) : phase === 'failed' ? (
              <AlertCircle size={48} className="animate-shake" />
            ) : (
              <Fingerprint
                size={54}
                className={`transition-all ${phase === 'scanning' ? 'animate-pulse text-[#00e676]' : 'text-[#00e676]/90'}`}
                strokeWidth={1.75}
              />
            )}
          </div>
        </div>

        {/* Ambient One UI Sensor Footprint Ring */}
        <div className="mt-4 text-center">
          <span className="text-[11px] font-bold text-[#00e676] uppercase tracking-wider block font-mono">
            {phase === 'success' ? 'UNLOCKED' : 'ULTRASONIC SENSOR'}
          </span>
        </div>

        {/* Bottom Switcher Actions */}
        <div className="mt-6 flex flex-col gap-2 items-center text-center">
          {onSwitchToFaceID && (
            <button
              type="button"
              onClick={onSwitchToFaceID}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Switch to iOS Face ID
            </button>
          )}

          {onFallbackToPin ? (
            <button
              type="button"
              onClick={onFallbackToPin}
              className="text-xs text-white/70 hover:text-white transition-colors"
            >
              Use 6-Digit Password Instead
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
