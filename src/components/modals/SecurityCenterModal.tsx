import React, { useState } from 'react';
import { X, ShieldCheck, Lock, Smartphone, KeyRound, Check } from 'lucide-react';

interface SecurityCenterModalProps {
  onClose: () => void;
  userProfile: any;
}

export default function SecurityCenterModal({ onClose, userProfile }: SecurityCenterModalProps) {
  const [pinChanged, setPinChanged] = useState(false);
  const [newPin, setNewPin] = useState('');

  const handleUpdatePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length === 4) {
      userProfile.pin = newPin;
      setPinChanged(true);
      setTimeout(() => setPinChanged(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="mirror-glass-modal rounded-3xl p-6 w-full max-w-sm relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full mirror-glass flex items-center justify-center text-white/70 hover:text-white"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white font-script">Security Center</h2>
            <p className="text-[11px] text-emerald-400 font-semibold">Account Security Rating: High (100%)</p>
          </div>
        </div>

        <div className="space-y-3 mb-5">
          <div className="mirror-glass rounded-2xl p-3.5 border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lock size={18} className="text-purple-400" />
              <div className="text-xs">
                <p className="font-bold text-white">Transaction PIN</p>
                <p className="text-white/50">Required for transfers and airtime</p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-400">Set</span>
          </div>

          <div className="mirror-glass rounded-2xl p-3.5 border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone size={18} className="text-sky-400" />
              <div className="text-xs">
                <p className="font-bold text-white">Biometric Login</p>
                <p className="text-white/50">Face ID & Fingerprint enabled</p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-400">Active</span>
          </div>

          <div className="mirror-glass rounded-2xl p-3.5 border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <KeyRound size={18} className="text-amber-400" />
              <div className="text-xs">
                <p className="font-bold text-white">NDIC Deposit Guarantee</p>
                <p className="text-white/50">Up to ₦5,000,000 protection</p>
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
