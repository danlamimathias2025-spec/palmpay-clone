import React, { useState, useEffect } from 'react';
import { ChevronDown, Headphones, ArrowLeft, Eye, EyeOff, Check, X, Shield, Gift } from 'lucide-react';
import { generatePalmPayAccountNumber } from '../utils/account';
import LoadingExecutionOverlay from './LoadingExecutionOverlay';

export default function LoginScreen({
  onLogin,
  onSwitchToRegister,
}: {
  onLogin: (phone: string, password: string) => void;
  onSwitchToRegister: () => void;
}) {
  // Step State: 'phone' or 'password'
  const [step, setStep] = useState<'phone' | 'password'>('phone');
  const [phoneNumber, setPhoneNumber] = useState(() => localStorage.getItem('palmpay_last_login_phone') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setPasswordVisible] = useState(false);
  const [showInvitation, setShowInvitation] = useState(false);
  const [invitationCode, setInvitationCode] = useState('');
  const [loading, setLoading] = useState(false);

  // Skip step 1 if the user logged in within the fast-path duration window (24h default vs 60s optional settings)
  useEffect(() => {
    const lastPhone = localStorage.getItem('palmpay_last_login_phone');
    const lastTime = localStorage.getItem('palmpay_last_login_time');
    const settingDuration = localStorage.getItem('palmpay_fast_path_duration') || '24h';
    
    // Default limit is 24 Hours (86,400,000ms), optionally 60 seconds (60,000ms)
    const timeLimitMs = settingDuration === '60s' ? 60000 : 24 * 60 * 60 * 1000;
    
    if (lastPhone && lastTime) {
      const diffMs = Date.now() - Number(lastTime);
      if (diffMs <= timeLimitMs) {
        // Within fast-path duration window: prefill and skip directly to password entry
        setPhoneNumber(lastPhone);
        setStep('password');
        console.log(`Skipped phone step: last login was ${Math.round(diffMs / 1000)}s ago (Limit: ${settingDuration}).`);
      } else {
        // Outside the window: prefill but start on phone step 1
        setPhoneNumber(lastPhone);
        setStep('phone');
      }
    }
  }, []);

  // For visual spaces: "070 7338 6737"
  const formatPhoneWithSpaces = (numStr: string) => {
    const cleaned = numStr.replace(/\s+/g, '');
    if (cleaned.length === 11) {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 7)} ${cleaned.slice(7)}`;
    }
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    }
    return cleaned;
  };

  // Keyboard key press handler
  const handleKeyPress = (val: string) => {
    if (step === 'phone') {
      if (phoneNumber.length < 11) {
        setPhoneNumber((prev) => prev + val);
      }
    } else {
      if (password.length < 6) {
        setPassword((prev) => prev + val);
      }
    }
  };

  const handleBackspace = () => {
    if (step === 'phone') {
      setPhoneNumber((prev) => prev.slice(0, -1));
    } else {
      setPassword((prev) => prev.slice(0, -1));
    }
  };

  const handleClear = () => {
    if (step === 'phone') {
      setPhoneNumber('');
    } else {
      setPassword('');
    }
  };

  const handleNextStep = () => {
    const cleanPhone = phoneNumber.replace(/\s+/g, '');
    if (cleanPhone.length < 10) {
      alert('Please enter a valid 10 or 11 digit mobile number.');
      return;
    }
    setStep('password');
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (password.length < 4) {
      alert('Password must be at least 4 digits.');
      return;
    }
    setLoading(true);
    try {
      // Simulate/trigger standard login action
      await onLogin(phoneNumber, password);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0e12] text-white flex flex-col justify-between p-5 select-none font-sans">
      
      {/* Top Header Row */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            if (step === 'password') {
              setStep('phone');
            } else {
              // Just trigger normal switch
              onSwitchToRegister();
            }
          }}
          className="p-1 rounded-full hover:bg-white/5 active:scale-95 transition-all text-white"
        >
          <ArrowLeft size={22} />
        </button>
        <button
          onClick={() => alert('Support line active')}
          className="p-1 rounded-full hover:bg-white/5 active:scale-95 transition-all text-white"
        >
          <Headphones size={22} />
        </button>
      </div>

      {/* Main Form Block */}
      <div className="flex-1 flex flex-col justify-start items-center mt-6 px-1">
        
        {/* PalmPay Centered Brand Logo */}
        <div className="flex flex-col items-center text-center mb-9 select-none">
          {/* Exact PalmPay brand icon rendering */}
          <div className="flex items-center gap-2 mb-1.5">
            <img src="/palmpay_official_icon.svg" alt="PalmPay Logo" className="w-9 h-9 object-contain" />
            <span className="text-2xl font-black tracking-tight text-white font-sans">PalmPay</span>
          </div>
          <p className="text-[11px] text-[#8e929a] font-medium tracking-wide">
            The Smarter Way to Bank
          </p>
        </div>

        {step === 'phone' ? (
          /* Step 1: Phone Number view matching screenshot exactly */
          <div className="w-full space-y-4 max-w-sm">
            {/* Input Row Container */}
            <div className="w-full bg-[#181920] border border-white/[0.04] rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-inner relative">
              <div className="flex items-center gap-2.5 shrink-0 select-none">
                {/* Micro clean circular flag of Nigeria */}
                <div className="w-5.5 h-5.5 rounded-full overflow-hidden flex flex-row border border-white/10 shrink-0">
                  <div className="bg-[#008751] w-1/3 h-full" />
                  <div className="bg-[#ffffff] w-1/3 h-full" />
                  <div className="bg-[#008751] w-1/3 h-full" />
                </div>
                <span className="text-sm font-bold text-white tracking-wide">+234</span>
                <ChevronDown size={14} className="text-[#8e929a] -ml-0.5" />
              </div>

              {/* Vertical line divider */}
              <div className="w-[1.5px] h-5 bg-white/10 shrink-0" />

              {/* Styled Interactive Text Input mimicking caret */}
              <div className="flex-1 min-w-0 text-left flex items-center gap-0.5">
                <span className="text-[17px] font-bold text-white tracking-wider font-sans whitespace-pre">
                  {formatPhoneWithSpaces(phoneNumber)}
                </span>
                {/* Flashing blue carets */}
                <span className="w-[2.5px] h-5 bg-[#7c1cf5] inline-block rounded-full animate-pulse" />
              </div>

              {/* Clear button */}
              {phoneNumber.length > 0 && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all shrink-0"
                >
                  <X size={13} strokeWidth={3} />
                </button>
              )}
            </div>

            {/* Next / Sign Up Button Row */}
            <div className="relative w-full">
              {/* Floating Free Airtime Yellow Banner Bubble */}
              <div className="absolute -top-3.5 right-0.5 z-10 flex items-center gap-1.5 bg-[#fff8e1] border border-[#ffe082] text-[#f57f17] text-[10px] font-black px-2 py-1 rounded-xl shadow-md select-none transform hover:scale-105 transition-all">
                <Gift size={11} className="text-[#f57f17] shrink-0" />
                <span>Get ₦100 Airtime for Free</span>
              </div>

              <button
                type="button"
                onClick={handleNextStep}
                className="w-full py-4 rounded-2xl bg-[#7c1cf5] hover:bg-[#6813d1] text-white font-extrabold text-sm active:scale-95 transition-all shadow-lg flex items-center justify-center gap-1.5 mt-2.5 font-sans"
              >
                <span>Sign Up</span>
              </button>
            </div>

            {/* Invitation Code dropdown block */}
            <div className="w-full text-center select-none pt-2">
              <button
                onClick={() => setShowInvitation(!showInvitation)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#8e929a] hover:text-white/80 transition-colors"
              >
                <span>Invitation Code</span>
                <ChevronDown size={12} className={`transition-transform duration-200 ${showInvitation ? 'rotate-180' : ''}`} />
              </button>

              {showInvitation && (
                <div className="mt-2.5 max-w-xs mx-auto animate-in fade-in slide-in-from-top-2 duration-150">
                  <input
                    type="text"
                    value={invitationCode}
                    onChange={(e) => setInvitationCode(e.target.value)}
                    placeholder="Enter Invitation Code (Optional)"
                    className="w-full p-2.5 rounded-xl bg-[#181920] border border-white/5 text-xs text-white placeholder-white/30 text-center uppercase tracking-wider focus:outline-none focus:border-purple-400"
                  />
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Step 2: Request Password and verification */
          <div className="w-full space-y-4 max-w-sm animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-left mb-2">
              <h3 className="text-sm font-bold text-white font-sans">Enter Security Password</h3>
              <p className="text-[11px] text-[#8e929a] mt-0.5">Please provide your secure 6-digit login password.</p>
            </div>

            {/* Password input row container */}
            <div className="w-full bg-[#181920] border border-white/[0.04] rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-inner">
              <div className="flex-1 min-w-0 text-left flex items-center gap-1.5">
                <span className="text-[17px] font-bold text-white tracking-widest font-sans">
                  {showPassword ? password : '•'.repeat(password.length)}
                </span>
                {password.length < 6 && (
                  <span className="w-[2.5px] h-5 bg-[#7c1cf5] inline-block rounded-full animate-pulse" />
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setPasswordVisible(!showPassword)}
                  className="p-1 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
                {password.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="p-1 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all"
                  >
                    <X size={13} strokeWidth={3} />
                  </button>
                )}
              </div>
            </div>

            {/* Confirm Submit button */}
            <button
              onClick={() => handleSubmit()}
              disabled={loading || password.length < 4}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#2563eb] to-[#7c1cf5] text-white font-extrabold text-sm active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2 mt-1 select-none font-sans disabled:opacity-50"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>Confirm & Sign In</span>
              )}
            </button>

            {/* Toggle back to phone */}
            <button
              onClick={() => setStep('phone')}
              className="text-xs text-purple-300 font-bold hover:underline select-none mt-1"
            >
              Change Mobile Number
            </button>
          </div>
        )}
      </div>

      {/* Bottom Area: Numeric secure input keyboard exactly matching screenshot */}
      <div className="w-full max-w-sm mx-auto select-none pt-4">
        {/* Secure Shield label and Done link */}
        <div className="flex items-center justify-between mb-2.5 px-1 select-none">
          <div className="flex items-center gap-1 text-[#22c55e]">
            <Shield size={13} strokeWidth={2.8} />
            <span className="text-[11px] font-bold tracking-wide font-sans">Secure input mode is active</span>
          </div>
          <button
            onClick={() => {
              if (step === 'phone') {
                handleNextStep();
              } else {
                handleSubmit();
              }
            }}
            className="text-[#7c1cf5] hover:text-[#933dfa] text-xs font-bold transition-colors"
          >
            Done
          </button>
        </div>

        {/* Custom Grid Keyboard Layout */}
        <div className="grid grid-cols-3 gap-2 pb-safe">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => handleKeyPress(k)}
              className="bg-[#181920] hover:bg-[#20212a] text-white py-4 rounded-xl text-xl font-bold font-sans transition-all active:scale-[0.96] shadow-md border border-white/[0.01]"
            >
              {k}
            </button>
          ))}
          {/* Last row with Empty, Zero, and Backspace */}
          <div className="bg-[#0d0e12] py-4" /> {/* Empty spacing */}
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="bg-[#181920] hover:bg-[#20212a] text-white py-4 rounded-xl text-xl font-bold font-sans transition-all active:scale-[0.96] shadow-md border border-white/[0.01]"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="bg-[#181920] hover:bg-[#20212a] text-white py-4 rounded-xl text-xl font-bold font-sans transition-all active:scale-[0.96] shadow-md border border-white/[0.01] flex items-center justify-center text-white/80 hover:text-white"
          >
            {/* Custom backspace symbol outline */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
              <line x1="18" y1="9" x2="12" y2="15" />
              <line x1="12" y1="9" x2="18" y2="15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Loading State Overlay during Authentication */}
      {loading && (
        <LoadingExecutionOverlay
          title="Authenticating Session..."
          subtitle="Verifying your 6-digit credentials and securing your financial session."
          variant="purple"
        />
      )}
    </div>
  );
}
