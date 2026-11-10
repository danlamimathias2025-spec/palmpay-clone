import React, { useState } from 'react';
import { ChevronDown, Headphones, ArrowLeft, Eye, EyeOff, Shield, Gift, Check, X, User, Edit } from 'lucide-react';
import { generatePalmPayAccountNumber } from '../utils/account';
import LoadingExecutionOverlay from './LoadingExecutionOverlay';

export default function RegistrationScreen({
  step,
  setStep,
  onRegister,
  onSwitchToLogin,
}: {
  step: 'phone' | 'details';
  setStep: (s: 'phone' | 'details') => void;
  onRegister: (data: any) => void;
  onSwitchToLogin: () => void;
}) {
  // Step State is managed externally
  
  // Registration States
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [showPassword, setPasswordVisible] = useState(false);
  const [showInvitation, setShowInvitation] = useState(false);
  const [invitationCode, setInvitationCode] = useState('');
  const [loading, setLoading] = useState(false);

  // Active input focus indicator inside details step
  const [activeDetailField, setActiveDetailField] = useState<'fullName' | 'nickname' | 'password' | 'pin'>('fullName');

  const accountNum = generatePalmPayAccountNumber(phoneNumber);

  // Spaces separator for phone display
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

  // Keyboard press handler
  const handleKeyPress = (val: string) => {
    if (step === 'phone') {
      if (phoneNumber.length < 11) {
        setPhoneNumber((prev) => prev + val);
      }
    } else {
      if (activeDetailField === 'password') {
        if (password.length < 6) {
          setPassword((prev) => prev + val);
        }
      } else if (activeDetailField === 'pin') {
        if (pin.length < 4) {
          setPin((prev) => prev + val);
        }
      }
    }
  };

  const handleBackspace = () => {
    if (step === 'phone') {
      setPhoneNumber((prev) => prev.slice(0, -1));
    } else {
      if (activeDetailField === 'password') {
        setPassword((prev) => prev.slice(0, -1));
      } else if (activeDetailField === 'pin') {
        setPin((prev) => prev.slice(0, -1));
      }
    }
  };

  const handleClear = () => {
    if (step === 'phone') {
      setPhoneNumber('');
    } else {
      if (activeDetailField === 'password') {
        setPassword('');
      } else if (activeDetailField === 'pin') {
        setPin('');
      }
    }
  };

  const handleNextStep = () => {
    const cleanPhone = phoneNumber.replace(/\s+/g, '');
    if (cleanPhone.length < 10) {
      alert('Please enter a valid 10 or 11 digit mobile number.');
      return;
    }
    setStep('details');
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!fullName.trim()) {
      alert('Full Legal Name is mandatory.');
      return;
    }
    if (!nickname.trim()) {
      alert('Preferred Username / Nickname is mandatory.');
      return;
    }
    if (password.length < 6) {
      alert('6-digit Login Password is mandatory.');
      return;
    }
    if (pin.length < 4) {
      alert('4-digit Transaction PIN is mandatory.');
      return;
    }

    setLoading(true);
    try {
      await onRegister({
        fullName: fullName.trim(),
        userName: nickname.trim(),
        phoneNumber,
        password,
        pin,
        accountNumber: accountNum,
      });
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
            if (step === 'details') {
              setStep('phone');
            } else {
              onSwitchToLogin();
            }
          }}
          className="p-1 rounded-full hover:bg-white/5 active:scale-95 transition-all text-white"
        >
          <ArrowLeft size={22} />
        </button>
        <a
          href="https://wa.me/2349027262079?text=Hello%20PalmPay%20Customer%20Care%2C%20I%20need%20assistance%20with%20registration"
          target="_blank"
          rel="noopener noreferrer"
          className="p-1 rounded-full hover:bg-white/5 active:scale-95 transition-all text-white flex items-center gap-1"
          title="Customer Care (+2349027262079)"
        >
          <Headphones size={22} />
        </a>
      </div>

      {/* Main Form Block */}
      <div className="flex-1 flex flex-col justify-start items-center mt-4 px-1 overflow-y-auto no-scrollbar max-h-[60vh]">
        
        {/* PalmPay Centered Brand Logo */}
        <div className="flex flex-col items-center text-center mb-6 select-none">
          <div className="flex items-center gap-2 mb-1">
            <img src="/palmpay_official_icon.svg" alt="PalmPay Logo" className="w-8.5 h-8.5 object-contain" />
            <span className="text-xl font-black tracking-tight text-white font-sans">PalmPay</span>
          </div>
          <p className="text-[10px] text-[#8e929a] font-medium tracking-wide">
            The Smarter Way to Bank
          </p>
        </div>

        {step === 'phone' ? (
          /* Step 1: Same aesthetic Phone Input screen */
          <div className="w-full space-y-4 max-w-sm">
            {/* Input Row Container */}
            <div className="w-full bg-[#181920] border border-white/[0.04] rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-inner relative">
              <div className="flex items-center gap-2.5 shrink-0">
                <div className="w-5.5 h-5.5 rounded-full overflow-hidden flex flex-row border border-white/10 shrink-0">
                  <div className="bg-[#008751] w-1/3 h-full" />
                  <div className="bg-[#ffffff] w-1/3 h-full" />
                  <div className="bg-[#008751] w-1/3 h-full" />
                </div>
                <span className="text-sm font-bold text-white tracking-wide">+234</span>
                <ChevronDown size={14} className="text-[#8e929a] -ml-0.5" />
              </div>

              <div className="w-[1.5px] h-5 bg-white/10 shrink-0" />

              <div className="flex-1 min-w-0 text-left flex items-center gap-0.5">
                <span className="text-[17px] font-bold text-white tracking-wider font-sans whitespace-pre">
                  {formatPhoneWithSpaces(phoneNumber)}
                </span>
                <span className="w-[2.5px] h-5 bg-[#7c1cf5] inline-block rounded-full animate-pulse" />
              </div>

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
              <div className="absolute -top-3.5 right-0.5 z-10 flex items-center gap-1.5 bg-[#fff8e1] border border-[#ffe082] text-[#f57f17] text-[10px] font-black px-2 py-1 rounded-xl shadow-md">
                <Gift size={11} className="text-[#f57f17] shrink-0" />
                <span>Get ₦100 Airtime for Free</span>
              </div>

              <button
                type="button"
                onClick={handleNextStep}
                className="w-full py-4 rounded-2xl bg-[#7c1cf5] hover:bg-[#6813d1] text-white font-extrabold text-sm active:scale-95 transition-all shadow-lg flex items-center justify-center gap-1.5 mt-2.5 font-sans"
              >
                <span>Continue to Details</span>
              </button>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="w-full py-3 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white/80 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                >
                  <span>Already have an account? Log In</span>
                </button>
              </div>
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
                <div className="mt-2.5 max-w-xs mx-auto">
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
          /* Step 2: Details screen with mandatory Full Name, Nickname, Password, and PIN */
          <div className="w-full space-y-3.5 max-w-sm animate-in fade-in slide-in-from-right-4 duration-300">
            
            {/* Account Details Form */}
            <div>
              <label className="text-xs text-white/75 block mb-1 font-medium text-left">
                Full Legal Name <span className="text-purple-400 font-bold">*</span>
              </label>
              <div className={`relative rounded-xl border transition-all ${activeDetailField === 'fullName' ? 'border-purple-400 bg-purple-500/5' : 'border-white/10 bg-[#181920]'}`}>
                <User size={15} className="absolute left-3.5 top-3.5 text-white/40" />
                <input
                  type="text"
                  placeholder="e.g. Mathias Danlami"
                  value={fullName}
                  onFocus={() => setActiveDetailField('fullName')}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-9 pr-3 py-3 text-xs text-white focus:outline-none bg-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-white/75 block mb-1 font-medium text-left">
                Preferred Nickname / Username <span className="text-purple-400 font-bold">*</span>
              </label>
              <div className={`relative rounded-xl border transition-all ${activeDetailField === 'nickname' ? 'border-purple-400 bg-purple-500/5' : 'border-white/10 bg-[#181920]'}`}>
                <Edit size={15} className="absolute left-3.5 top-3.5 text-white/40" />
                <input
                  type="text"
                  placeholder="e.g. Mathias"
                  value={nickname}
                  onFocus={() => setActiveDetailField('nickname')}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full pl-9 pr-3 py-3 text-xs text-white focus:outline-none bg-transparent"
                  required
                />
              </div>
            </div>

            {/* Grid layout for Password and PIN to keep it ultra compact above the keyboard */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/75 block mb-1 font-medium text-left">
                  Login Password <span className="text-purple-400 font-bold">*</span>
                </label>
                <div
                  onClick={() => setActiveDetailField('password')}
                  className={`w-full p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    activeDetailField === 'password' ? 'border-purple-400 bg-purple-500/5' : 'border-white/10 bg-[#181920]'
                  }`}
                >
                  <span className="text-xs font-bold font-sans tracking-wider block truncate">
                    {password ? '•'.repeat(password.length) : '6-digit Pass'}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs text-white/75 block mb-1 font-medium text-left">
                  Transaction PIN <span className="text-purple-400 font-bold">*</span>
                </label>
                <div
                  onClick={() => setActiveDetailField('pin')}
                  className={`w-full p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    activeDetailField === 'pin' ? 'border-purple-400 bg-purple-500/5' : 'border-white/10 bg-[#181920]'
                  }`}
                >
                  <span className="text-xs font-bold font-sans tracking-wider block truncate">
                    {pin ? '•'.repeat(pin.length) : '4-digit PIN'}
                  </span>
                </div>
              </div>
            </div>

            {/* Custom Account preview card */}
            {fullName && (
              <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-xs text-left">
                <span className="text-[10px] text-white/40 block">Your Generated PalmPay Account Number:</span>
                <p className="font-bold text-emerald-400 mt-0.5 font-mono tracking-wider">{accountNum}</p>
              </div>
            )}

            {/* Complete submit button */}
            <button
              onClick={() => handleSubmit()}
              disabled={loading || !fullName || !nickname || password.length < 6 || pin.length < 4}
              className="w-full py-3.5 rounded-2xl bg-[#7c1cf5] hover:bg-[#6813d1] text-white font-extrabold text-sm active:scale-95 transition-all shadow-lg flex items-center justify-center gap-1.5 disabled:opacity-40 select-none font-sans"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>Create My Account</span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Bottom Area: Numeric secure input keyboard */}
      <div className="w-full max-w-sm mx-auto select-none pt-2">
        {/* Secure Shield label and Done link */}
        <div className="flex items-center justify-between mb-2 px-1 select-none">
          <div className="flex items-center gap-1 text-[#22c55e]">
            <Shield size={13} strokeWidth={2.8} />
            <span className="text-[11px] font-bold tracking-wide font-sans">Secure input mode is active</span>
          </div>
          <button
            onClick={() => {
              if (step === 'phone') {
                handleNextStep();
              } else {
                if (activeDetailField === 'fullName') {
                  setActiveDetailField('nickname');
                } else if (activeDetailField === 'nickname') {
                  setActiveDetailField('password');
                } else if (activeDetailField === 'password') {
                  setActiveDetailField('pin');
                } else {
                  handleSubmit();
                }
              }
            }}
            className="text-[#7c1cf5] hover:text-[#933dfa] text-xs font-bold transition-colors"
          >
            {step === 'phone' ? 'Next' : (activeDetailField === 'pin' ? 'Submit' : 'Next Field')}
          </button>
        </div>

        {/* Custom Grid Keyboard Layout (Only rendered for numerical input targets) */}
        <div className="grid grid-cols-3 gap-2 pb-safe">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => handleKeyPress(k)}
              className="bg-[#181920] hover:bg-[#20212a] text-white py-3.5 rounded-xl text-lg font-bold font-sans transition-all active:scale-[0.96] shadow-md border border-white/[0.01]"
            >
              {k}
            </button>
          ))}
          {/* Last row with Empty, Zero, and Backspace */}
          <div className="bg-[#0d0e12] py-3.5" />
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="bg-[#181920] hover:bg-[#20212a] text-white py-3.5 rounded-xl text-lg font-bold font-sans transition-all active:scale-[0.96] shadow-md border border-white/[0.01]"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="bg-[#181920] hover:bg-[#20212a] text-white py-3.5 rounded-xl text-lg font-bold font-sans transition-all active:scale-[0.96] shadow-md border border-white/[0.01] flex items-center justify-center text-white/80 hover:text-white"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
              <line x1="18" y1="9" x2="12" y2="15" />
              <line x1="12" y1="9" x2="18" y2="15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Loading State Overlay during Account Registration */}
      {loading && (
        <LoadingExecutionOverlay
          title="Creating PalmPay Account..."
          subtitle="Provisioning your unique 10-digit account number and isolating your secure wallet."
          variant="purple"
        />
      )}
    </div>
  );
}
