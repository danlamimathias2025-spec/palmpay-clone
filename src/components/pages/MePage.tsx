import React from 'react';
import {
  ShieldCheck,
  CreditCard,
  History,
  Headphones,
  HelpCircle,
  Copy,
  Check,
  ChevronRight,
  LogOut,
  Moon,
  Sun,
  UserCheck
} from 'lucide-react';
import { normalizePalmPayAccountNumber } from '../../utils/account';

interface MePageProps {
  userProfile: {
    fullName: string;
    userName: string;
    phoneNumber: string;
    accountNumber?: string;
    imageUrl?: string;
  };
  balance: number;
  darkMode: boolean;
  toggleDarkMode: () => void;
  onViewHistory: () => void;
  onSecurityCenter: () => void;
  onSupport: () => void;
  onLogout: () => void;
}

export default function MePage({
  userProfile,
  balance,
  darkMode,
  toggleDarkMode,
  onViewHistory,
  onSecurityCenter,
  onSupport,
  onLogout,
}: MePageProps) {
  const [copied, setCopied] = React.useState(false);

  const accountNum = normalizePalmPayAccountNumber(userProfile.accountNumber || userProfile.phoneNumber);

  const handleCopy = () => {
    navigator.clipboard?.writeText(accountNum);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col min-h-screen pb-28 max-w-md mx-auto px-4 pt-3">
      {/* User Header Profile Card */}
      <div className="mirror-glass-card rounded-3xl p-5 border border-purple-500/20 mb-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/15 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center gap-3.5 relative z-10">
          <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-purple-500 via-indigo-400 to-fuchsia-400 shadow-lg">
            {userProfile.imageUrl ? (
              <img
                src={userProfile.imageUrl}
                alt={userProfile.userName}
                className="w-full h-full rounded-full object-cover bg-slate-800"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-[#1e2030] flex items-center justify-center text-white font-black text-lg">
                {userProfile.userName ? userProfile.userName[0].toUpperCase() : 'M'}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-base font-bold font-script text-white truncate">
                {userProfile.fullName || 'Mathias Danlami'}
              </h2>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 border border-emerald-500/30">
                <UserCheck size={10} /> Tier 2
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-white/90 mt-1">
              <span className="text-purple-200 font-semibold">Funds ID:</span>
              <span className="font-mono font-bold text-emerald-400 text-sm tracking-wider">{accountNum}</span>
              <button
                onClick={handleCopy}
                className="p-1 text-purple-300 hover:text-white transition-colors"
                title="Copy 10-digit Funds ID"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </button>
            </div>
            <p className="text-[10px] text-white/50 mt-0.5">Mobile: {userProfile.phoneNumber || '08082076038'}</p>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-white/10 text-xs">
          <div>
            <span className="text-white/50 block">Available Balance</span>
            <span className="text-sm font-extrabold text-white font-sans">₦{balance.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-white/50 block">Daily Limit</span>
            <span className="text-sm font-extrabold text-white font-sans">₦200,000.00</span>
          </div>
        </div>
      </div>

      {/* Account Settings Menu */}
      <div className="space-y-2 mb-4">
        <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider px-1">Management</h3>

        {/* Security Center */}
        <button
          onClick={onSecurityCenter}
          className="w-full mirror-glass-card rounded-2xl p-3.5 flex items-center justify-between border border-white/10 hover:bg-white/[0.08] active:scale-98 transition-all text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-300 flex items-center justify-center">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Security Center</p>
              <p className="text-[11px] text-white/50">Transaction PIN, Face ID & Devices</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-white/40" />
        </button>

        {/* Transaction History */}
        <button
          onClick={onViewHistory}
          className="w-full mirror-glass-card rounded-2xl p-3.5 flex items-center justify-between border border-white/10 hover:bg-white/[0.08] active:scale-98 transition-all text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-300 flex items-center justify-center">
              <History size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Transaction History</p>
              <p className="text-[11px] text-white/50">View all past transfers and receipts</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-white/40" />
        </button>

        {/* Bank Cards & Accounts */}
        <button
          onClick={() => alert("PalmPay Virtual Card & Linked Nigerian Debit Cards active.")}
          className="w-full mirror-glass-card rounded-2xl p-3.5 flex items-center justify-between border border-white/10 hover:bg-white/[0.08] active:scale-98 transition-all text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-300 flex items-center justify-center">
              <CreditCard size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Bank Cards & Accounts</p>
              <p className="text-[11px] text-white/50">2 Cards linked</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-white/40" />
        </button>
      </div>

      {/* Support & Preferences */}
      <div className="space-y-2 mb-4">
        <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider px-1">Support & Preferences</h3>

        {/* Customer Support */}
        <button
          onClick={onSupport}
          className="w-full mirror-glass-card rounded-2xl p-3.5 flex items-center justify-between border border-white/10 hover:bg-white/[0.08] active:scale-98 transition-all text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-300 flex items-center justify-center">
              <Headphones size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-white">24/7 Customer Care</p>
              <p className="text-[11px] text-white/50">Instant live chat and phone support</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-white/40" />
        </button>

        {/* FAQ */}
        <button
          onClick={() => alert("PalmPay FAQ: Transfers are instant and zero fee to all Nigerian banks.")}
          className="w-full mirror-glass-card rounded-2xl p-3.5 flex items-center justify-between border border-white/10 hover:bg-white/[0.08] active:scale-98 transition-all text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-300 flex items-center justify-center">
              <HelpCircle size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Help Center & FAQ</p>
              <p className="text-[11px] text-white/50">Guides and troubleshooting</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-white/40" />
        </button>

        {/* Dark/Light Mode */}
        <button
          onClick={toggleDarkMode}
          className="w-full mirror-glass-card rounded-2xl p-3.5 flex items-center justify-between border border-white/10 hover:bg-white/[0.08] active:scale-98 transition-all text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-yellow-500/15 text-yellow-300 flex items-center justify-center">
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </div>
            <div>
              <p className="text-xs font-bold text-white">Interface Theme</p>
              <p className="text-[11px] text-white/50">{darkMode ? 'Dark Mirror Glass' : 'Light Mode'}</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-purple-400">Toggle</span>
        </button>
      </div>

      {/* Logout button */}
      <button
        onClick={onLogout}
        className="w-full py-3 rounded-2xl mirror-glass border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-all mt-2"
      >
        <LogOut size={16} />
        <span>Log Out of PalmPay</span>
      </button>
    </div>
  );
}
