import React, { useState } from 'react';
import { X, ArrowDownLeft, ArrowUpRight, Search, FileText } from 'lucide-react';

interface TransactionHistoryModalProps {
  transactions: any[];
  onClose: () => void;
  onSelectTransaction: (tx: any) => void;
}

export default function TransactionHistoryModal({
  transactions,
  onClose,
  onSelectTransaction,
}: TransactionHistoryModalProps) {
  const [filter, setFilter] = useState<'all' | 'transfer' | 'credit' | 'bills'>('all');
  const [search, setSearch] = useState('');

  const filtered = transactions.filter((t) => {
    if (filter === 'transfer' && t.type !== 'transfer') return false;
    if (filter === 'credit' && t.type !== 'credit') return false;
    if (filter === 'bills' && (t.type === 'transfer' || t.type === 'credit')) return false;

    if (search) {
      const q = search.toLowerCase();
      const rec = (t.recipient || '').toLowerCase();
      const bank = (t.bankName || '').toLowerCase();
      return rec.includes(q) || bank.includes(q);
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="mirror-glass-modal rounded-3xl p-6 w-full max-w-md max-h-[85vh] flex flex-col relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full mirror-glass flex items-center justify-center text-white/70 hover:text-white"
        >
          <X size={18} />
        </button>

        <h2 className="text-xl font-bold text-white font-script mb-1">Transaction History</h2>
        <p className="text-xs text-white/60 mb-3">All your past incoming and outgoing payments</p>

        {/* Search */}
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3 top-3 text-white/40" />
          <input
            type="text"
            placeholder="Search recipient or service..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl mirror-glass border border-white/10 text-xs text-white placeholder-white/40 focus:outline-none focus:border-purple-400"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'all', label: 'All' },
            { id: 'transfer', label: 'Transfers' },
            { id: 'credit', label: 'Inflow' },
            { id: 'bills', label: 'Bills & Airtime' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`py-1 px-3 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                filter === tab.id
                  ? 'bg-[#7846f7] text-white'
                  : 'mirror-glass text-white/60 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-white/50 text-xs">
              No transactions found matching your criteria.
            </div>
          ) : (
            filtered.map((t, idx) => {
              const isCredit = t.type === 'credit';
              const dateStr = t.timestamp?.seconds
                ? new Date(t.timestamp.seconds * 1000).toLocaleString()
                : 'Just now';

              return (
                <div
                  key={t.id || idx}
                  onClick={() => onSelectTransaction(t)}
                  className="mirror-glass rounded-2xl p-3 flex items-center justify-between cursor-pointer hover:bg-white/[0.08] active:scale-98 transition-all border border-white/5"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        isCredit ? 'bg-emerald-500/20 text-emerald-400' : 'bg-purple-500/20 text-[#c084fc]'
                      }`}
                    >
                      {isCredit ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                    </div>

                    <div>
                      <p className="text-xs font-bold text-white truncate max-w-[180px]">
                        {t.recipient || (isCredit ? 'Account Credited' : 'Fund Transfer')}
                      </p>
                      <p className="text-[10px] text-white/50">{dateStr}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p
                      className={`text-xs font-black font-sans ${
                        isCredit ? 'text-emerald-400' : 'text-white'
                      }`}
                    >
                      {isCredit ? '+' : '-'}₦{Number(t.amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                    </p>
                    <span className="text-[9px] text-emerald-400/80 font-medium">Successful</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
