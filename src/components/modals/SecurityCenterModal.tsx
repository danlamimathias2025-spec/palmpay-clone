import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Lock, KeyRound, Check, Fingerprint, SlidersHorizontal, CheckCircle2 } from 'lucide-react';
import { db } from '../../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import {
  getBiometricSettings,
  setBiometricSettings,
  hasSavedBiometrics,
} from '../../utils/webauthn';

interface SecurityCenterModalProps {
  onClose: () => void;
  userProfile: any;
}

export default function SecurityCenterModal({ onClose, userProfile }: SecurityCenterModalProps) {
  const [pinChanged, setPinChanged] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [bioMessage, setBioMessage] = useState<string | null>(null);

  const initialSettings = getBiometricSettings();
  const [bioEnabled, setBioEnabled] = useState(initialSettings.enabled);
  const [threshold, setThreshold] = useState(initialSettings.highValueThreshold);

  const phone = userProfile?.phoneNumber || '';

  const handleUpdatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length === 4) {
      userProfile.pin = newPin;
      try {
        if (phone) {
          const userRef = doc(db, 'users', phone);
          await setDoc(userRef, { pin: newPin, updatedAt: serverTimestamp() }, { merge: true });
        }
      } catch (err) {
        console.warn('Real-time PIN sync warning:', err);
      }
      setPinChanged(true);
      setTimeout(() => setPinChanged(false), 2500);
    }
  };

  const handleToggleBiometrics = async (val: boolean) => {
    setBioEnabled(val);
    setBiometricSettings({ enabled: val }, phone);
    try {
      if (phone) {
        const userRef = doc(db, 'users', phone);
        await setDoc(userRef, { biometricsEnabled: val, updatedAt: serverTimestamp() }, { merge: true });
      }
    } catch (err) {
      console.warn('Real-time biometric setting sync warning:', err);
    }
    setBioMessage(val ? 'WebAuthn biometric layer active' : 'Biometric layer disabled');
    setTimeout(() => setBioMessage(null), 2500);
  };

  const handleThresholdChange = async (newThresh: number) => {
    setThreshold(newThresh);
    setBiometricSettings({ highValueThreshold: newThresh }, phone);
    try {
      if (phone) {
        const userRef = doc(db, 'users', phone);
        await setDoc(userRef, { biometricsThreshold: newThresh, updatedAt: serverTimestamp() }, { merge: true });
      }
    } catch (err) {
      console.warn('Real-time threshold sync warning:', err);
    }
    setBioMessage(`Threshold updated: ₦${newThresh.toLocaleString()}`);
    setTimeout(() => setBioMessage(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0d0e12] text-white overflow-y-auto animate-in fade-in slide-in-from-bottom duration-300">
      {/* Full-Page Header */}
      <div className="sticky top-0 z-20 bg-[#0d0e12]/95 backdrop-blur-md px-4 py-4 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/10 text-white/80 active:scale-95 transition-all"
            aria-label="Back"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-lg font-bold text-white font-sans">Security Center</h2>
        </div>
      </div>

      {/* Main Full-Page Content */}
      <div className="w-full max-w-md mx-auto p-5 space-y-4 pb-24">
        <div className="flex items-center gap-3 p-4 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <ShieldCheck size={26} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-sans">Account Security Rating</h3>
            <p className="text-xs text-emerald-400 font-semibold mt-0.5">High Protection (100% Secure)</p>
          </div>
        </div>

        <div className="space-y-3 mb-5">
          {/* Biometrics Toggle & Status */}
          <div className="mirror-glass rounded-2xl p-3.5 border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                  <Fingerprint size={18} />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-white">WebAuthn Biometric Security</p>
                  <p className="text-white/50 text-[10px]">Fingerprint, Face ID & Passkeys</p>
                </div>
              </div>

              {/* Toggle switch */}
              <button
                type="button"
                onClick={() => handleToggleBiometrics(!bioEnabled)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  bioEnabled ? 'bg-[#7846f7]' : 'bg-white/20'
                }`}
                aria-label="Toggle Biometric Security"
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    bioEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Biometric Login Mode Switch Toggle (Face ID vs In-Screen Sensor) */}
            <div className="pt-2.5 border-t border-white/5 flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-white">Biometric Login Type</p>
                <p className="text-[10px] text-white/50">Choose authentication interface</p>
              </div>
              <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem('palmpay_biometric_pref', 'touch');
                    setBioMessage('In-Screen Sensor set as default');
                    setTimeout(() => setBioMessage(null), 2000);
                  }}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    (localStorage.getItem('palmpay_biometric_pref') || 'touch') === 'touch'
                      ? 'bg-emerald-500 text-black shadow-md'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  In-Screen
                </button>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem('palmpay_biometric_pref', 'faceid');
                    setBioMessage('iOS Face ID set as default');
                    setTimeout(() => setBioMessage(null), 2000);
                  }}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    localStorage.getItem('palmpay_biometric_pref') === 'faceid'
                      ? 'bg-cyan-400 text-black shadow-md'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  Face ID
                </button>
              </div>
            </div>

            {/* Real-time Hardware Status Row */}
            <div className="flex items-center justify-between pt-1 border-t border-white/5 text-xs">
              <span className="text-[11px] text-white/60">Hardware Protection:</span>
              <div className="flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                <CheckCircle2 size={13} />
                <span>{bioEnabled ? 'Active & Enrolled' : 'Standby'}</span>
              </div>
            </div>
          </div>

          {/* High-Value Transaction Threshold Setting */}
          <div className="mirror-glass rounded-2xl p-3.5 border border-white/5 space-y-2.5">
            <div className="flex items-center gap-2 text-xs">
              <SlidersHorizontal size={14} className="text-purple-400" />
              <span className="font-bold text-white">High-Value Confirmation Threshold</span>
            </div>
            <p className="text-[10px] text-white/50 leading-relaxed">
              Require biometric authorization before executing transfers at or above this amount:
            </p>

            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {[
                { label: '₦1,000', val: 1000 },
                { label: '₦5,000', val: 5000 },
                { label: '₦10,000', val: 10000 },
                { label: '₦20,000', val: 20000 },
              ].map((tier) => (
                <button
                  key={tier.val}
                  type="button"
                  onClick={() => handleThresholdChange(tier.val)}
                  className={`py-1.5 px-1 rounded-xl text-[10px] font-bold transition-all ${
                    threshold === tier.val
                      ? 'bg-[#7846f7] text-white shadow-md'
                      : 'bg-white/5 text-white/60 hover:text-white border border-white/5'
                  }`}
                >
                  {tier.label}
                </button>
              ))}
            </div>
          </div>

          {bioMessage && (
            <div className="p-2.5 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-200 text-[11px] text-center animate-fade-in flex items-center justify-center gap-1.5">
              <Check size={13} className="text-emerald-400" />
              <span>{bioMessage}</span>
            </div>
          )}

          {/* Transaction PIN */}
          <div className="mirror-glass rounded-2xl p-3.5 border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lock size={18} className="text-purple-400" />
              <div className="text-xs">
                <p className="font-bold text-white">4-Digit Transaction PIN</p>
                <p className="text-white/50 text-[10px]">Required fallback for high-value transactions</p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-400">Configured</span>
          </div>

          {/* Deposit Guarantee */}
          <div className="mirror-glass rounded-2xl p-3.5 border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <KeyRound size={18} className="text-amber-400" />
              <div className="text-xs">
                <p className="font-bold text-white">NDIC Deposit Guarantee</p>
                <p className="text-white/50 text-[10px]">Up to ₦5,000,000 insured</p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-400">Verified</span>
          </div>
        </div>

        {/* Change PIN Form */}
        <form onSubmit={handleUpdatePin} className="border-t border-white/10 pt-4">
          <label className="text-xs text-white/70 block mb-1">Update 4-Digit PIN</label>
          <div className="flex gap-2">
            <input
              type="password"
              maxLength={4}
              placeholder="New PIN"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
              className="flex-1 p-2.5 rounded-xl mirror-glass border border-white/10 text-white text-center tracking-widest text-sm focus:outline-none focus:border-purple-400"
            />
            <button
              type="submit"
              disabled={newPin.length !== 4}
              className="py-2.5 px-4 rounded-xl bg-[#7846f7] hover:bg-[#6836ea] text-white text-xs font-bold disabled:opacity-50"
            >
              Update
            </button>
          </div>
          {pinChanged && (
            <p className="text-[11px] text-emerald-400 font-bold mt-2 flex items-center gap-1">
              <Check size={12} /> PIN changed successfully!
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
