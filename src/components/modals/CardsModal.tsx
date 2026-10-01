import React, { useState } from 'react';
import { X, CreditCard, ShieldCheck, Plus, Eye, EyeOff } from 'lucide-react';

interface CardsModalProps {
  onClose: () => void;
  userProfile: any;
}

export default function CardsModal({ onClose, userProfile }: CardsModalProps) {
  const [showCardNumber, setShowCardNumber] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="mirror-glass-modal rounded-3xl p-6 w-full max-w-sm relative">
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full mirror-glass flex items-center justify-center text-white/70 hover:text-white">
          <X size={18} />
        </button>

        <h2 className="text-xl font-bold text-white font-script mb-1">PalmPay Virtual Cards</h2>
        <p className="text-xs text-white/60 mb-4">Pay online safely anywhere in the world</p>

        {/* Virtual Card Graphic */}
        <div className="rounded-2xl p-5 bg-gradient-to-tr from-[#5821d7] via-[#7846f7] to-[#d946ef] text-white shadow-xl relative overflow-hidden mb-4 border border-white/20">
          <div className="flex justify-between items-start mb-8">
            <span className="font-extrabold text-sm tracking-widest text-white/90">PALMPAY VIRTUAL</span>
            <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-md">VERVE</span>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg font-mono tracking-widest">
              {showCardNumber
                ? `5061 9845 2314 ${(userProfile.accountNumber || userProfile.phoneNumber || '8082').slice(-4)}`
                : `•••• •••• •••• ${(userProfile.accountNumber || userProfile.phoneNumber || '8082').slice(-4)}`}
            </span>
            <button onClick={() => setShowCardNumber(!showCardNumber)} className="text-white/80 hover:text-white p-1">
              {showCardNumber ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          <div className="flex justify-between items-end text-xs">
            <div>
              <p className="text-[9px] text-white/60 uppercase">Card Holder</p>
              <p className="font-bold">{userProfile.fullName || userProfile.userName || 'PalmPay User'}</p>
            </div>
            <div>
              <p className="text-[9px] text-white/60 uppercase">Expires</p>
              <p className="font-bold">08/29</p>
            </div>
            <div>
              <p className="text-[9px] text-white/60 uppercase">CVV</p>
              <p className="font-bold">{showCardNumber ? '419' : '•••'}</p>
            </div>
          </div>
        </div>

        <div className="space-y-2 mb-5">
          <div className="flex justify-between text-xs p-2.5 mirror-glass rounded-xl border border-white/5">
            <span className="text-white/60">Card Status</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <ShieldCheck size={14} /> Active & Protected
            </span>
          </div>
          <div className="flex justify-between text-xs p-2.5 mirror-glass rounded-xl border border-white/5">
            <span className="text-white/60">Spending Limit</span>
            <span className="text-white font-bold">₦500,000 / month</span>
          </div>
        </div>

        <button
          onClick={() => alert("Physical card ordering is coming soon to your registered address!")}
          className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/10 flex items-center justify-center gap-1.5"
        >
          <Plus size={16} />
          <span>Apply for Physical PalmPay Card</span>
        </button>
      </div>
    </div>
  );
}
