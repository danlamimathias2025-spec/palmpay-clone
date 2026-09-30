import React from 'react';
import { X, Bell, Sparkles, ArrowDownLeft, ShieldCheck } from 'lucide-react';

interface NotificationOverlayProps {
  onClose: () => void;
  notifications?: any[];
}

export default function NotificationOverlay({ onClose }: NotificationOverlayProps) {
  const dummyNotifications = [
    {
      id: 1,
      title: '₦50 Extra Cashback Claim Available',
      time: '10 mins ago',
      desc: 'Fund ₦450 to unlock your ₦50 bonus reward today.',
      unread: true,
      tag: 'Bonus',
    },
    {
      id: 2,
      title: 'Daily Interest Credited',
      time: 'Today 00:00',
      desc: '₦14.20 interest accrued from your PalmPay CashBox savings.',
      unread: true,
      tag: 'Interest',
    },
    {
      id: 3,
      title: 'September Prime Fixed 20% Yield',
      time: 'Yesterday',
      desc: 'Lock in 20.00% annual returns before September slots close.',
      unread: false,
      tag: 'Wealth',
    },
    {
      id: 4,
      title: 'Security Alert: Login Verified',
      time: 'Yesterday',
      desc: 'Successful biometric sign-in on your Android device.',
      unread: false,
      tag: 'Security',
    },
    {
      id: 5,
      title: '0-Fee Bank Transfer Granted',
      time: '2 days ago',
      desc: 'Enjoy unlimited zero transfer fees to all commercial banks.',
      unread: false,
      tag: 'Reward',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="mirror-glass-modal rounded-3xl p-5 w-full max-w-sm max-h-[80vh] flex flex-col relative top-12">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full mirror-glass flex items-center justify-center text-white/70 hover:text-white"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-[#c084fc] flex items-center justify-center">
            <Bell size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white font-script">Notifications</h2>
            <p className="text-[10px] text-white/50">50 updates & promotions</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {dummyNotifications.map((n) => (
            <div
              key={n.id}
              className={`p-3 rounded-2xl border transition-all ${
                n.unread
                  ? 'bg-purple-600/15 border-purple-500/30'
                  : 'mirror-glass border-white/5'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider">
                  {n.tag}
                </span>
                <span className="text-[9px] text-white/40">{n.time}</span>
              </div>
              <p className="text-xs font-bold text-white mb-0.5">{n.title}</p>
              <p className="text-[11px] text-white/70 leading-relaxed">{n.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
