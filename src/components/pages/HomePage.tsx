import React from 'react';
import Header from '../Header';
import AccountCard from '../AccountCard';
import QuickActions from '../QuickActions';
import PromoCard from '../PromoCard';
import ServicesGrid from '../ServicesGrid';
import CashbackMiniBanner from '../CashbackMiniBanner';
import WealthCards from '../WealthCards';
import DataRechargeBanner from '../DataRechargeBanner';
import { useOrientation } from '../../hooks/useOrientation';
import { ArrowDownToLine, ArrowUpFromLine, ChevronRight } from 'lucide-react';

interface HomePageProps {
  balance: number;
  userProfile: {
    fullName: string;
    userName: string;
    phoneNumber: string;
    accountNumber?: string;
    imageUrl?: string;
  };
  transactions?: any[];
  onSelectTransaction?: (tx: any) => void;
  onSupportClick: () => void;
  onSecurityClick: () => void;
  onBellClick: () => void;
  onAddMoney: () => void;
  onViewHistory: () => void;
  onEarningsClick: () => void;
  onToBank: () => void;
  onToPalmPay: () => void;
  onSavings: () => void;
  onLoan: () => void;
  onClaimPromo: () => void;
  onAirtime: () => void;
  onData: () => void;
  onBetting: () => void;
  onElectricity: () => void;
  onRefer: () => void;
  onInsurance: () => void;
  onCards: () => void;
  onMore: () => void;
  onGoCashback: () => void;
  onSaveNow: () => void;
  onGrabChallenge: () => void;
  onMoreWealth: () => void;
  onGoDataRecharge: () => void;
  onDailyGift: () => void;
}

export default function HomePage({
  balance,
  userProfile,
  transactions = [],
  onSelectTransaction,
  onSupportClick,
  onSecurityClick,
  onBellClick,
  onAddMoney,
  onViewHistory,
  onEarningsClick,
  onToBank,
  onToPalmPay,
  onSavings,
  onLoan,
  onClaimPromo,
  onAirtime,
  onData,
  onBetting,
  onElectricity,
  onRefer,
  onInsurance,
  onCards,
  onMore,
  onGoCashback,
  onSaveNow,
  onGrabChallenge,
  onMoreWealth,
  onGoDataRecharge,
  onDailyGift,
}: HomePageProps) {
  const { isLandscape } = useOrientation();

  const recentTransactions = (transactions || []).slice(0, 2);

  const renderMiniIcon = (tx: any) => {
    if (tx.type === 'credit' || tx.type === 'interest') {
      return (
        <div className="w-8 h-8 rounded-full bg-[#2563eb]/20 text-[#60a5fa] flex items-center justify-center shrink-0">
          <ArrowDownToLine size={15} strokeWidth={2.5} />
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-full bg-[#6d28d9]/20 text-[#a78bfa] flex items-center justify-center shrink-0">
        <ArrowUpFromLine size={15} strokeWidth={2.5} />
      </div>
    );
  };

  const renderRecentTransactions = () => {
    if (recentTransactions.length === 0) return null;
    return (
      <div className="mirror-glass-card rounded-2xl p-4 border border-white/5 space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold text-white/90 font-sans tracking-wide uppercase">Recent Transactions</h3>
          <button
            onClick={onViewHistory}
            className="text-[11px] text-purple-400 font-bold hover:underline flex items-center gap-0.5"
          >
            <span>See All</span>
            <ChevronRight size={12} />
          </button>
        </div>
        <div className="space-y-2">
          {recentTransactions.map((tx) => {
            const isCredit = tx.type === 'credit' || tx.type === 'interest';
            return (
              <div
                key={tx.id}
                onClick={() => onSelectTransaction?.(tx)}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 active:scale-[0.99] cursor-pointer transition-all border border-white/[0.03]"
              >
                <div className="flex items-center gap-3">
                  {renderMiniIcon(tx)}
                  <div className="text-left">
                    <p className="text-xs font-bold text-white max-w-[150px] truncate">{tx.title}</p>
                    <p className="text-[10px] text-white/40">{tx.date || 'Just now'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-black font-sans ${isCredit ? 'text-emerald-400' : 'text-slate-100'}`}>
                    {isCredit ? '+' : '-'}{typeof tx.amount === 'number' ? `₦${tx.amount.toLocaleString()}` : tx.formattedAmount}
                  </span>
                  <p className="text-[9px] text-[#22c55e] font-semibold">Successful</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={`flex flex-col min-h-screen pb-24 mx-auto relative transition-all duration-300 ${
      isLandscape ? 'max-w-4xl px-4' : 'max-w-md'
    }`}>
      {/* 1. Header with Avatar, Greeting, and 3 Icons */}
      <Header
        userProfile={userProfile}
        onSupportClick={onSupportClick}
        onSecurityClick={onSecurityClick}
        onBellClick={onBellClick}
      />

      {isLandscape ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          {/* Column 1 */}
          <div className="space-y-4">
            {/* 2. Available Balance Card */}
            <AccountCard
              balance={balance}
              accountNumber={userProfile.accountNumber}
              onAddMoney={onAddMoney}
              onViewHistory={onViewHistory}
              onEarningsClick={onEarningsClick}
            />

            {/* Recent Transactions display under Balance Card */}
            {renderRecentTransactions()}

            {/* 3. 4-item Quick Action Bar */}
            <QuickActions
              onToBank={onToBank}
              onToPalmPay={onToPalmPay}
              onSavings={onSavings}
              onLoan={onLoan}
            />

            {/* 4. Promotional Card: Fund ₦450 Get ₦50 Extra */}
            <PromoCard onClaim={onClaimPromo} />
          </div>

          {/* Column 2 */}
          <div className="space-y-4">
            {/* 5. 8-Icon Services Grid */}
            <ServicesGrid
              onAirtime={onAirtime}
              onData={onData}
              onBetting={onBetting}
              onElectricity={onElectricity}
              onRefer={onRefer}
              onInsurance={onInsurance}
              onCards={onCards}
              onMore={onMore}
            />

            {/* 6. Mini Promo / Cashback Carousel */}
            <CashbackMiniBanner onGo={onGoCashback} />

            {/* 7. Wealth & Savings Section (Prime Fixed & Team Up) */}
            <WealthCards
              onSaveNow={onSaveNow}
              onGrab={onGrabChallenge}
              onMoreWealth={onMoreWealth}
            />

            {/* 8. Data Recharge Promotion Banner with Daily Gift */}
            <DataRechargeBanner
              onGoNow={onGoDataRecharge}
              onDailyGift={onDailyGift}
            />
          </div>
        </div>
      ) : (
        <>
          {/* 2. Available Balance Card */}
          <AccountCard
            balance={balance}
            accountNumber={userProfile.accountNumber}
            onAddMoney={onAddMoney}
            onViewHistory={onViewHistory}
            onEarningsClick={onEarningsClick}
          />

          {/* Recent Transactions display under Balance Card */}
          <div className="mb-4">
            {renderRecentTransactions()}
          </div>

          {/* 3. 4-item Quick Action Bar */}
          <QuickActions
            onToBank={onToBank}
            onToPalmPay={onToPalmPay}
            onSavings={onSavings}
            onLoan={onLoan}
          />

          {/* 4. Promotional Card: Fund ₦450 Get ₦50 Extra */}
          <PromoCard onClaim={onClaimPromo} />

          {/* 5. 8-Icon Services Grid */}
          <ServicesGrid
            onAirtime={onAirtime}
            onData={onData}
            onBetting={onBetting}
            onElectricity={onElectricity}
            onRefer={onRefer}
            onInsurance={onInsurance}
            onCards={onCards}
            onMore={onMore}
          />

          {/* 6. Mini Promo / Cashback Carousel */}
          <CashbackMiniBanner onGo={onGoCashback} />

          {/* 7. Wealth & Savings Section (Prime Fixed & Team Up) */}
          <WealthCards
            onSaveNow={onSaveNow}
            onGrab={onGrabChallenge}
            onMoreWealth={onMoreWealth}
          />

          {/* 8. Data Recharge Promotion Banner with Daily Gift */}
          <DataRechargeBanner
            onGoNow={onGoDataRecharge}
            onDailyGift={onDailyGift}
          />
        </>
      )}
    </div>
  );
}
