import React from 'react';
import { Smartphone, ArrowUpDown, Trophy, Zap, Gift, Shield, CreditCard, LayoutGrid } from 'lucide-react';

interface ServicesGridProps {
  onAirtime: () => void;
  onData: () => void;
  onBetting: () => void;
  onElectricity: () => void;
  onRefer: () => void;
  onInsurance: () => void;
  onCards: () => void;
  onMore: () => void;
}

export default function ServicesGrid({
  onAirtime,
  onData,
  onBetting,
  onElectricity,
  onRefer,
  onInsurance,
  onCards,
  onMore,
}: ServicesGridProps) {
  const services = [
    {
      id: 'airtime',
      name: 'Airtime',
      icon: <Smartphone size={22} className="text-[#38bdf8]" strokeWidth={2.2} />,
      bg: 'bg-[#0284c7]/15',
      action: onAirtime,
    },
    {
      id: 'data',
      name: 'Data',
      icon: <ArrowUpDown size={22} className="text-[#34d399]" strokeWidth={2.2} />,
      bg: 'bg-[#059669]/15',
      action: onData,
    },
    {
      id: 'betting',
      name: 'Betting',
      icon: <Trophy size={22} className="text-[#4ade80]" strokeWidth={2.2} />,
      bg: 'bg-[#16a34a]/15',
      action: onBetting,
    },
    {
      id: 'electricity',
      name: 'Electricity',
      icon: <Zap size={22} className="text-[#2dd4bf]" strokeWidth={2.2} />,
      bg: 'bg-[#0d9488]/15',
      action: onElectricity,
    },
    {
      id: 'refer',
      name: 'Refer & Earn',
      icon: <Gift size={22} className="text-[#c084fc]" strokeWidth={2.2} />,
      bg: 'bg-[#9333ea]/15',
      badge: '₦10000',
      action: onRefer,
    },
    {
      id: 'insurance',
      name: 'Insurance',
      icon: <Shield size={22} className="text-[#60a5fa]" strokeWidth={2.2} />,
      bg: 'bg-[#2563eb]/15',
      action: onInsurance,
    },
    {
      id: 'cards',
      name: 'Cards',
      icon: <CreditCard size={22} className="text-[#a78bfa]" strokeWidth={2.2} />,
      bg: 'bg-[#7c3aed]/15',
      action: onCards,
    },
    {
      id: 'more',
      name: 'More',
      icon: <LayoutGrid size={22} className="text-[#c084fc]" strokeWidth={2.2} />,
      bg: 'bg-[#8b5cf6]/15',
      action: onMore,
    },
  ];

  return (
    <div className="px-4 py-2">
      <div className="mirror-glass-card rounded-2xl p-3.5 border border-white/10 shadow-lg">
        <div className="grid grid-cols-4 gap-y-3.5 gap-x-2">
          {services.map((item) => (
            <button
              key={item.id}
              onClick={item.action}
              className="flex flex-col items-center justify-start group cursor-pointer active:scale-95 transition-all text-center relative"
            >
              <div className="relative mb-1">
                {item.badge && (
                  <span className="absolute -top-2 -right-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[8px] font-bold px-1.5 py-0.2 rounded-full shadow-sm leading-tight border border-white/20 whitespace-nowrap z-10 animate-bounce">
                    {item.badge}
                  </span>
                )}
                <div
                  className={`w-11 h-11 rounded-xl ${item.bg} flex items-center justify-center border border-white/10 group-hover:scale-105 transition-transform shadow-xs`}
                >
                  {item.icon}
                </div>
              </div>

              <span className="text-xs text-white/90 font-medium whitespace-nowrap tracking-normal">
                {item.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
