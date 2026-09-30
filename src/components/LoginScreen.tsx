import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, Eye, EyeOff, Fingerprint, ScanFace } from 'lucide-react';
import { generatePalmPayAccountNumber } from '../utils/account';
import BiometricAuthOverlay from './BiometricAuthOverlay';

export default function LoginScreen({
  onLogin,
  onSwitchToRegister,
}: {
  onLogin: (phone: string, password: string) => void;
  onSwitchToRegister: () => void;
}) {
  const [phoneNumber, setPhoneNumber] = useState('08082076038');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showBiometrics, setShowBiometrics] = useState(false);

  const accountNum = generatePalmPayAccountNumber(phoneNumber);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onLogin(phoneNumber, password);
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricSuccess = () => {
    setShowBiometrics(false);
    onLogin(phoneNumber, password || '123456');
  };

  return (
    <div className="min-h-screen bg-[#0d0f17] text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-[#6700ea]/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-purple-600/15 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md mirror-glass-card rounded-3xl p-6 sm:p-8 border border-white/10 relative z-10 shadow-2xl">
        {/* PalmPay Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#6700ea] p-2 flex items-center justify-center shadow-lg mb-3 border border-white/10">
            <svg viewBox="0 0 48 48" className="w-full h-full">
              <path
                fill="#ffffff"
                d="M21.1574,4.2617 c1.759-1.0156, 3.9262-1.0156, 5.6851,0 l12.83,7.4074 c1.759,1.0156, 2.8426,2.8925, 2.8426,4.9236 v14.8147 c0,2.0311 -1.0836,3.908 -2.8426,4.9236 l-12.83,7.4074 c-1.759,1.0156 -3.9262,1.0156 -5.6851,0 l-12.83-7.4074 c-1.759-1.0156 -2.8426-2.8925 -2.8426-4.9236 v-14.8147 c0-2.0311, 1.0836-3.908, 2.8426-4.9236 l12.83-7.4074Z"
              />
              <g stroke="#6700ea" strokeWidth="3.4" fill="none" strokeLinejoin="round" strokeLinecap="round">
                <path d="M5.5645,29.8801 L23.0057,12.4388 c.4851-.4853, 1.2688-.4945,1.7653-.0208 l7.4316,7.0885" />
                <path d="M42.4482,18.6101 l-17.4414,17.4413 c-.4851.4851, -1.2688.4944, -1.7653.0208 l-7.4316-7.0886" />
              </g>
              <rect
                fill="#6700ea"
                x="21.4733"
                y="21.4733"
                width="5.0535"
                height="5.0535"
                rx=".6317"
                ry=".6317"
                transform="translate(-9.9411 24) rotate(-45)"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Welcome to PalmPay</h2>
          <p className="text-xs text-white/60 mt-1">The Smarter Way to Bank</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-white/70 block mb-1 font-medium">Registered Mobile Number</label>
            <input
              type="tel"
              placeholder="08082076038"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full p-3 rounded-xl mirror-glass border border-white/10 text-white text-sm tracking-wider font-mono focus:outline-none focus:border-purple-400"
              required
            />
            {phoneNumber.length >= 10 && (
              <p className="text-[11px] text-purple-300 mt-1 font-mono">
                PalmPay Account: <span className="font-bold text-emerald-400">{accountNum}</span> (10 Digits)
              </p>
            )}
          </div>

          <div>
            <label className="text-xs text-white/70 block mb-1 font-medium">6-digit Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••"
                maxLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 rounded-xl mirror-glass border border-white/10 text-white text-sm tracking-widest focus:outline-none focus:border-purple-400"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-[#6700ea] hover:bg-[#5800cc] text-white font-bold text-sm mt-4 flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 transition-all disabled:opacity-75"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign In to PalmPay</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>

          {/* WebAuthn Biometric Fast Login */}
          <button
            type="button"
            onClick={() => setShowBiometrics(true)}
            className="w-full py-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-200 font-semibold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm"
          >
            <Fingerprint size={16} className="text-purple-300" />
            <span>Sign In with Biometrics (Touch ID / Face ID)</span>
            <ScanFace size={16} className="text-purple-300 ml-1" />
          </button>
        </form>

        {showBiometrics && (
          <BiometricAuthOverlay
            userId={phoneNumber}
            userName={phoneNumber === '08082076038' ? 'Mathias Shekwoaga Danlami' : 'PalmPay User'}
            onSuccess={handleBiometricSuccess}
            onCancel={() => setShowBiometrics(false)}
          />
        )}

        <div className="mt-6 pt-4 border-t border-white/10 text-center">
          <p className="text-xs text-white/60">
            Don't have an account?{' '}
            <button
              onClick={onSwitchToRegister}
              className="text-purple-300 font-bold hover:underline"
            >
              Open Account
            </button>
          </p>
        </div>

        <div className="mt-4 flex items-center justify-center gap-1.5 text-white/40 text-[11px]">
          <ShieldCheck size={13} className="text-emerald-400" />
          <span>Licensed by CBN · Insured by NDIC</span>
        </div>
      </div>
    </div>
  );
}
