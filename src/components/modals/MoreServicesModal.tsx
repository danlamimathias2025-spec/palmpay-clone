import React from 'react';
import { X, Tv, Film, School, Plane, Ticket, ShoppingBag, ShieldCheck } from 'lucide-react';

interface MoreServicesModalProps {
  onClose: () => void;
  onSelectService: (serviceName: string) => void;
}

export default function MoreServicesModal({ onClose, onSelectService }: MoreServicesModalProps) {
  const moreServices = [
    { name: 'Cable TV (DSTV, GOTV)', icon: <Tv size={22} className="text-red-400" /> },
    { name: 'Movie Tickets', icon: <Film size={22} className="text-purple-400" /> },
    { name: 'School & Exam Fees (WAEC/JAMB)', icon: <School size={22} className="text-amber-400" /> },
    { name: 'Flights & Travel', icon: <Plane size={22} className="text-sky-400" /> },
    { name: 'Event Tickets', icon: <Ticket size={22} className="text-emerald-400" /> },
    { name: 'PalmMall Deals', icon: <ShoppingBag size={22} className="text-rose-400" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="mirror-glass-modal rounded-3xl p-6 w-full max-w-sm relative">
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full mirror-glass flex items-center justify-center text-white/70 hover:text-white">
          <X size={18} />
        </button>

        <h2 className="text-xl font-bold text-white font-script mb-1">All Lifestyle Services</h2>
        <p className="text-xs text-white/60 mb-4">Discover everything you can pay for with PalmPay</p>

        <div className="grid grid-cols-3 gap-2.5 mb-5">
          {moreServices.map((s, idx) => (
            <button
              key={idx}
              onClick={() => {
                onSelectService(s.name);
                alert(`Selected ${s.name}`);
              }}
              className="mirror-glass rounded-2xl p-3 flex flex-col items-center justify-center text-center hover:border-purple-400/40 active:scale-95 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-1.5">
                {s.icon}
              </div>
              <span className="text-[11px] font-medium text-white/90 leading-tight">{s.name}</span>
            </button>
          ))}
        </div>

        <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-[#7846f7] hover:bg-[#6836ea] text-white text-xs font-bold shadow-md">
          Done
        </button>
      </div>
    </div>
  );
}
