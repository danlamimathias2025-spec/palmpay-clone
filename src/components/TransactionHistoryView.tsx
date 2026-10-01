import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  ArrowUpFromLine,
  ArrowDownToLine,
  Coins,
  ChevronDown,
  Filter,
  CheckCircle2,
  PieChart,
  X,
  History,
} from 'lucide-react';
import NetworkLogo, { detectTelecomNetwork } from './NetworkLogo';

export interface TransactionItem {
  id: string;
  title: string;
  recipient?: string;
  senderName?: string;
  senderBank?: string;
  amount: number | string;
  formattedAmount: string;
  type: 'credit' | 'transfer' | 'interest' | 'autosave' | 'airtime' | 'data' | 'electricity' | 'betting' | 'bill';
  date: string;
  month?: 'Jan' | 'Feb' | 'Mar' | 'Apr' | 'May' | 'Jun' | 'Jul' | 'Aug' | 'Sep' | 'Oct' | 'Nov' | 'Dec' | string;
  category: 'transfer' | 'airtime' | 'electricity' | 'cashbox' | 'bill' | 'other';
  status: 'successful' | 'pending' | 'failed';
  rawTimestamp?: number;
  narration?: string;
  reference?: string;
  sessionId?: string;
  accountNumber?: string;
  [key: string]: any;
}

interface TransactionHistoryViewProps {
  onBack: () => void;
  transactions: TransactionItem[];
  onSelectTransaction: (tx: TransactionItem) => void;
}

export default function TransactionHistoryView({
  onBack,
  transactions = [],
  onSelectTransaction,
}: TransactionHistoryViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories');
  const [selectedStatus, setSelectedStatus] = useState<string>('All Status');
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [selectedMonthOverview, setSelectedMonthOverview] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Filter transactions based on category & status
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Category filter
      if (selectedCategory !== 'All Categories') {
        if (selectedCategory === 'Transfers' && tx.category !== 'transfer') return false;
        if (selectedCategory === 'CashBox' && tx.category !== 'cashbox') return false;
        if (selectedCategory === 'Bills & Airtime' && tx.category !== 'airtime' && tx.category !== 'electricity') return false;
      }
      // Status filter
      if (selectedStatus !== 'All Status') {
        if (selectedStatus === 'Successful' && tx.status !== 'successful') return false;
        if (selectedStatus === 'Pending' && tx.status !== 'pending') return false;
        if (selectedStatus === 'Failed' && tx.status !== 'failed') return false;
      }
      return true;
    });
  }, [transactions, selectedCategory, selectedStatus]);

  // Dynamically group transactions by month
  const monthlyGroups = useMemo(() => {
    const groups: { [monthKey: string]: { monthName: string; list: TransactionItem[]; inTotal: number; outTotal: number } } = {};

    filteredTransactions.forEach((tx) => {
      // Extract month name from tx.month or tx.date
      let mName = (tx.month as string) || 'Recent';
      if (!tx.month && tx.date) {
        const parts = tx.date.split(' ');
        if (parts.length > 0 && parts[0].length >= 3) {
          mName = parts[0].slice(0, 3);
        }
      }

      if (!groups[mName]) {
        groups[mName] = { monthName: mName, list: [], inTotal: 0, outTotal: 0 };
      }

      groups[mName].list.push(tx);

      const num = typeof tx.amount === 'number'
        ? Math.abs(tx.amount)
        : parseFloat(String(tx.amount).replace(/[^0-9.]/g, '')) || 0;

      if (tx.type === 'credit' || tx.type === 'interest') {
        groups[mName].inTotal += num;
      } else {
        groups[mName].outTotal += num;
      }
    });

    const groupArray = Object.values(groups);
    groupArray.sort((a, b) => {
      const latestA = a.list[0]?.rawTimestamp || 0;
      const latestB = b.list[0]?.rawTimestamp || 0;
      return latestB - latestA;
    });

    return groupArray;
  }, [filteredTransactions]);

  const handleDownloadStatement = () => {
    if (transactions.length === 0) {
      alert("No transaction records available to download.");
      return;
    }
    setDownloadSuccess(true);
    setTimeout(() => {
      setDownloadSuccess(false);
      const headers = "Date,Title,Type,Amount,Status,Reference\n";
      const rows = transactions
        .map((t) => `"${t.date}","${t.title}","${t.type}","${t.formattedAmount}","${t.status}","${t.reference || t.id}"`)
        .join("\n");
      const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `palmpay_statement_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, 1000);
  };

  const renderIcon = (tx: TransactionItem) => {
    if (tx.type === 'credit') {
      return (
        <div className="w-9 h-9 rounded-full bg-[#2563eb] text-white flex items-center justify-center shrink-0 shadow-sm">
          <ArrowDownToLine size={19} strokeWidth={2.2} />
        </div>
      );
    }
    if (tx.type === 'transfer') {
      return (
        <div className="w-9 h-9 rounded-full bg-[#6d28d9] text-white flex items-center justify-center shrink-0 shadow-sm">
          <ArrowUpFromLine size={19} strokeWidth={2.2} />
        </div>
      );
    }
    if (tx.type === 'interest' || tx.type === 'autosave') {
      return (
        <div className="w-9 h-9 rounded-full bg-[#7c3aed] text-white flex items-center justify-center shrink-0 shadow-sm">
          <Coins size={18} strokeWidth={2.2} />
        </div>
      );
    }
    if (tx.type === 'airtime' || tx.type === 'data') {
      const net = detectTelecomNetwork(tx) || 'mtn';
      return <NetworkLogo network={net} size="sm" />;
    }
    if (tx.type === 'electricity') {
      return (
        <div className="w-9 h-9 rounded-full bg-white text-[#0f2922] flex items-center justify-center shrink-0 font-black text-[8px] shadow-sm border border-gray-200">
          <span className="text-[#059669]">AEDC</span>
        </div>
      );
    }
    return (
      <div className="w-9 h-9 rounded-full bg-[#6d28d9] text-white flex items-center justify-center shrink-0">
        <ArrowUpFromLine size={19} />
      </div>
    );
  };

  const activeOverviewData = useMemo(() => {
    if (!selectedMonthOverview) return null;
    return monthlyGroups.find((g) => g.monthName === selectedMonthOverview) || null;
  }, [selectedMonthOverview, monthlyGroups]);

  return (
    <div className="flex flex-col min-h-screen bg-[#0d0f17] text-white max-w-md mx-auto relative pb-28">
      {/* 1. Top Bar */}
      <div className="px-4 pt-3 pb-3 flex items-center justify-between sticky top-0 z-30 bg-[#0d0f17]/95 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white/90 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
            aria-label="Back"
          >
            <ArrowLeft size={22} strokeWidth={2.2} />
          </button>
          <h1 className="text-lg font-bold text-white tracking-normal">
            Transaction History
          </h1>
        </div>

        <button
          onClick={handleDownloadStatement}
          className="text-white/90 hover:text-white text-sm font-normal active:scale-95 transition-all"
        >
          Download
        </button>
      </div>

      {downloadSuccess && (
        <div className="mx-4 mb-2 p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 size={16} />
          <span>Statement downloaded successfully!</span>
        </div>
      )}

      {/* 2. Top Promotional Banner */}
      <div className="px-4 mb-3">
        <div className="relative rounded-2xl overflow-hidden p-3.5 bg-gradient-to-r from-[#391d8a] via-[#4d22ad] to-[#6d28d9] border border-purple-500/30 shadow-lg flex items-center justify-between min-h-[92px]">
          <div className="max-w-[62%] z-10">
            <p className="text-[11px] font-normal text-purple-200 leading-tight">
              Join Business Hub & Apply Business Loan
            </p>
            <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight my-0.5 leading-tight">
              Lower Fees, Bigger Loans!
            </h2>
            <button
              onClick={() => alert("Business Hub & Loan Portal active")}
              className="mt-1.5 py-1 px-4 rounded-full bg-[#fbbf24] hover:bg-[#f59e0b] text-[#1c1917] font-bold text-xs shadow-md active:scale-95 transition-all"
            >
              Go Now
            </button>
          </div>

          <div className="relative z-10 w-28 h-20 flex items-center justify-center pointer-events-none">
            <img
              src="/src/assets/images/business_loan_promo_1790734668144.jpg"
              alt="Business Loan Promo"
              className="w-full h-full object-cover rounded-xl shadow-md border border-white/10"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
        </div>
      </div>

      {/* 3. Filter Bar (All Categories & All Status) */}
      <div className="px-4 py-2 border-b border-white/[0.08] flex items-center justify-between text-xs text-white/80 relative">
        {/* All Categories Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowCategoryMenu(!showCategoryMenu);
              setShowStatusMenu(false);
            }}
            className="flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-white/[0.06] transition-colors"
          >
            <span>{selectedCategory}</span>
            <Filter size={13} className="text-white/70" />
          </button>

          {showCategoryMenu && (
            <div className="absolute top-8 left-0 z-40 w-44 rounded-2xl mirror-glass-modal p-1.5 shadow-2xl border border-white/15 animate-scale-up">
              {['All Categories', 'Transfers', 'CashBox', 'Bills & Airtime'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setShowCategoryMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors ${
                    selectedCategory === cat ? 'bg-[#7846f7] text-white font-bold' : 'text-white/80 hover:bg-white/10'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* All Status Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowStatusMenu(!showStatusMenu);
              setShowCategoryMenu(false);
            }}
            className="flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-white/[0.06] transition-colors"
          >
            <span>{selectedStatus}</span>
            <ChevronDown size={14} className="text-white/70" />
          </button>

          {showStatusMenu && (
            <div className="absolute top-8 right-0 z-40 w-36 rounded-2xl mirror-glass-modal p-1.5 shadow-2xl border border-white/15 animate-scale-up">
              {['All Status', 'Successful', 'Pending', 'Failed'].map((st) => (
                <button
                  key={st}
                  onClick={() => {
                    setSelectedStatus(st);
                    setShowStatusMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors ${
                    selectedStatus === st ? 'bg-[#7846f7] text-white font-bold' : 'text-white/80 hover:bg-white/10'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4. Transaction Lists Grouped Dynamically */}
      <div className="flex-1 px-4 pt-3 space-y-4">
        {monthlyGroups.length > 0 ? (
          monthlyGroups.map((group) => (
            <div key={group.monthName} className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1 cursor-pointer">
                    <h2 className="text-xl font-bold text-white">{group.monthName}</h2>
                    <ChevronDown size={18} className="text-white/70" />
                  </div>
                  <p className="text-[11px] text-white/50 tracking-normal mt-0.5">
                    In <span className="text-white/80">₦{group.inTotal.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>{' '}
                    Out <span className="text-white/80">₦{group.outTotal.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
                  </p>
                </div>

                <button
                  onClick={() => setSelectedMonthOverview(group.monthName)}
                  className="py-1 px-3 rounded-full bg-[#2a2254] hover:bg-[#342a66] border border-purple-500/30 text-purple-300 text-xs flex items-center gap-1.5 active:scale-95 transition-all shadow-sm"
                >
                  <Coins size={13} className="text-purple-300" />
                  <span>Monthly Overview</span>
                </button>
              </div>

              <div className="divide-y divide-white/[0.06]">
                {group.list.map((tx) => (
                  <div
                    key={tx.id}
                    onClick={() => onSelectTransaction(tx)}
                    className="py-2.5 flex items-center justify-between cursor-pointer hover:bg-white/[0.03] rounded-xl px-1 -mx-1 active:scale-[0.99] transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      {renderIcon(tx)}
                      <div className="min-w-0">
                        <p className="text-[13px] font-normal text-white truncate tracking-normal group-hover:text-purple-300 transition-colors">
                          {tx.title}
                        </p>
                        <p className="text-[10px] text-white/50 mt-0.5">
                          {tx.date}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-normal text-white">
                        {tx.formattedAmount}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          /* Clean Zero-Data Empty State */
          <div className="py-16 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-3">
              <History size={32} strokeWidth={1.5} />
            </div>
            <h3 className="text-base font-bold text-white mb-1">No Transactions Yet</h3>
            <p className="text-xs text-white/50 max-w-xs leading-relaxed">
              Your incoming credits, deposits, and transfer activities will appear here in real time.
            </p>
          </div>
        )}
      </div>

      {/* Monthly Overview Modal */}
      {activeOverviewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="mirror-glass-modal rounded-3xl p-6 w-full max-w-sm relative">
            <button
              onClick={() => setSelectedMonthOverview(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full mirror-glass flex items-center justify-center text-white/70 hover:text-white"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-[#c084fc] flex items-center justify-center">
                <PieChart size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Monthly Overview ({activeOverviewData.monthName})
                </h3>
                <p className="text-[11px] text-white/60">Spending vs Inflow Breakdown</p>
              </div>
            </div>

            <div className="space-y-3 mb-5">
              <div className="p-3.5 mirror-glass rounded-2xl border border-white/5 flex justify-between items-center">
                <span className="text-xs text-white/70">Total Inflow</span>
                <span className="text-sm font-bold text-emerald-400 font-sans">
                  +₦{activeOverviewData.inTotal.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="p-3.5 mirror-glass rounded-2xl border border-white/5 flex justify-between items-center">
                <span className="text-xs text-white/70">Total Outflow</span>
                <span className="text-sm font-bold text-rose-400 font-sans">
                  -₦{activeOverviewData.outTotal.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedMonthOverview(null)}
              className="w-full py-2.5 rounded-xl bg-[#7846f7] hover:bg-[#6836ea] text-white text-xs font-semibold shadow-md"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
