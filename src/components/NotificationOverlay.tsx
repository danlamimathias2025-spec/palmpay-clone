import React from 'react';
import { X, Bell, Sparkles, ArrowDownLeft, ShieldCheck } from 'lucide-react';

interface NotificationOverlayProps {
  onClose: () => void;
  transactions?: any[];
  onSelectTransaction?: (tx: any) => void;
}

export default function NotificationOverlay({
  onClose,
  transactions = [],
  onSelectTransaction,
}: NotificationOverlayProps) {
  const liveRecentAlerts = transactions.slice(0, 5).map((tx) => {
    const isCredit = tx.type === 'credit';
    return {
      id: tx.id || Math.random().toString(),
      title: isCredit
        ? `Credit Flash Alert: +₦${Number(tx.amount || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`
        : `Debit Alert: -₦${Number(tx.amount || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
      time: tx.date || 'Recently',
      desc: isCredit
        ? `Received from ${tx.senderName || 'Site A'} into PalmPay A/C`
        : `Sent to ${tx.recipient || 'Commercial Bank'}`,
      unread: true,
      tag: isCredit ? 'Flash Credit' : 'Flash Debit',
      rawTx: tx,
    };
  });

  const baseNotifications = [
    {
      id: 'promo-1',
      title: '₦50 Extra Cashback Claim Available',
      time: '10 mins ago',
      desc: 'Fund ₦450 to unlock your ₦50 bonus reward today.',
      unread: false,
      tag: 'Bonus',
    },
    {
      id: 'interest-1',
      title: 'Daily Interest Credited',
      time: 'Today 00:00',
      desc: '₦14.20 interest accrued from your PalmPay CashBox savings.',
      unread: false,
      tag: 'Interest',
    },
  ];

  const allAlerts = [...liveRecentAlerts, ...baseNotifications];

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
            <h2 className="text-base font-bold text-white font-script">Notifications & Alerts</h2>
            <p className="text-[10px] text-white/50">{allAlerts.length} updates & flash alerts</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {allAlerts.map((n: any) => (
            <div
              key={n.id}
              onClick={() => {
                if (n.rawTx && onSelectTransaction) {
                  onSelectTransaction(n.rawTx);
                  onClose();
                }
              }}
              className={`p-3 rounded-2xl border transition-all ${
                n.rawTx ? 'cursor-pointer hover:scale-[1.01] active:scale-[0.99]' : ''
              } ${
                n.unread
                  ? 'bg-purple-600/20 border-purple-500/40 shadow-sm'
                  : 'mirror-glass border-white/5'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    n.tag.includes('Credit')
                      ? 'text-emerald-400'
                      : n.tag.includes('Debit')
                      ? 'text-rose-400'
                      : 'text-purple-300'
                  }`}
                >
                  {n.tag}
                </span>
                <span className="text-[10px] text-white/40">{n.time}</span>
              </div>
              <h4 className="text-xs font-bold text-white mb-0.5">{n.title}</h4>
              <p className="text-[11px] text-white/60 leading-snug">{n.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
