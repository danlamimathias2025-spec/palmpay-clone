import React, { useState } from 'react';
import { X, Gift, Copy, Check, Users, Sparkles } from 'lucide-react';

interface ReferModalProps {
  onClose: () => void;
  referralCode?: string;
}

export default function ReferModal({ onClose, referralCode = 'PALM8082' }: ReferModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(`https://palmpay.app/invite?code=${referralCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="mirror-glass-modal rounded-3xl p-6 w-full max-w-sm relative text-center">
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full mirror-glass flex items-center justify-center text-white/70 hover:text-white">
          <X size={18} />
        </button>

        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-0.5 mx-auto mb-3 shadow-lg">
          <div className="w-full h-full rounded-3xl bg-[#141624] flex items-center justify-center text-amber-400">
            <Gift size={32} />
          </div>
        </div>

        <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-block mb-2">
          Earn Up To ₦10,000 Cash
        </span>

        <h2 className="text-xl font-bold text-white font-script mb-1">Refer Friends & Get Rewarded</h2>
        <p className="text-xs text-white/60 mb-5">
          Get ₦1,000 for each friend who signs up and performs their first transaction!
        </p>

        <div className="mirror-glass rounded-2xl p-4 border border-white/10 mb-5 text-left">
          <span className="text-[11px] text-white/50 block mb-1">Your Exclusive Invite Code</span>
          <div className="flex items-center justify-between">
            <span className="text-lg font-black text-white font-mono tracking-wider">{referralCode}</span>
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-xl bg-[#7846f7] hover:bg-[#6836ea] text-white text-xs font-bold flex items-center gap-1 active:scale-95 transition-all"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-left text-xs mb-5">
          <div className="mirror-glass p-3 rounded-xl border border-white/5">
            <p className="text-white/50 text-[10px]">Friends Invited</p>
            <p className="text-base font-black text-white mt-0.5">8</p>
          </div>
          <div className="mirror-glass p-3 rounded-xl border border-white/5">
            <p className="text-white/50 text-[10px]">Total Earned</p>
            <p className="text-base font-black text-emerald-400 mt-0.5">₦8,000.00</p>
          </div>
        </div>

        <button
          onClick={handleCopy}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-white font-bold text-sm shadow-md active:scale-95 transition-all"
        >
          Share Invite Link
        </button>
      </div>
    </div>
  );
}
