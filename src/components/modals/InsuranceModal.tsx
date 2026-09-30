import React from 'react';
import { X, ShieldCheck, HeartPulse, Car, Home, PhoneCall } from 'lucide-react';

interface InsuranceModalProps {
  onClose: () => void;
}

export default function InsuranceModal({ onClose }: InsuranceModalProps) {
  const plans = [
    { title: 'Personal Accident Cover', price: 'From ₦250/mo', icon: <HeartPulse className="text-rose-400" /> },
    { title: 'Phone Screen Protection', price: 'From ₦150/mo', icon: <PhoneCall className="text-purple-400" /> },
    { title: 'Third-Party Auto Insurance', price: 'From ₦5,000/yr', icon: <Car className="text-sky-400" /> },
    { title: 'Home Goods Insurance', price: 'From ₦1,200/mo', icon: <Home className="text-amber-400" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="mirror-glass-modal rounded-3xl p-6 w-full max-w-sm relative">
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full mirror-glass flex items-center justify-center text-white/70 hover:text-white">
          <X size={18} />
        </button>

        <h2 className="text-xl font-bold text-white font-script mb-1">PalmPay Insurance</h2>
        <p className="text-xs text-white/60 mb-4">Affordable micro-insurance underwritten by leading partners</p>

        <div className="space-y-2.5 mb-5">
          {plans.map((p, i) => (
            <div key={i} className="mirror-glass rounded-2xl p-3 flex items-center justify-between border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                  {p.icon}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{p.title}</h4>
                  <p className="text-[10px] text-white/50">{p.price}</p>
                </div>
              </div>
              <button
                onClick={() => alert(`Subscribed to ${p.title} successfully!`)}
                className="py-1 px-3 rounded-full bg-[#7846f7] hover:bg-[#6836ea] text-white text-[11px] font-bold"
              >
                Enroll
              </button>
            </div>
          ))}
        </div>

        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-white/10 text-white/70 text-xs font-bold">
          Close
        </button>
      </div>
    </div>
  );
}
