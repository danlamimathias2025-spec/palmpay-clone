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
import { ChevronRight } from 'lucide-react';

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

  const realTransactions = (transactions || []).filter(
    (tx) => tx.id && !tx.id.startsWith('tx-jul-') && !tx.id.startsWith('tx-mock-')
  );
  const recentTransactions = realTransactions.slice(0, 2);

  const renderRecentTransactions = () => {
    if (recentTransactions.length === 0) return null;
    return (
      <div className="mirror-glass-card rounded-2xl p-4 border border-white/5 divide-y divide-white/5">
        {recentTransactions.map((tx) => {
          const isCredit = tx.type === 'credit' || tx.type === 'interest';
          const titleText = isCredit 
            ? `Received from ${(tx.senderName || 'MATHIAS SHEKWOAGA DANLAMI').toUpperCase()}`
            : `Paid to ${(tx.recipient || 'USER').toUpperCase()}`;
          const amountText = typeof tx.amount === 'number' 
            ? `₦${tx.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`
            : tx.formattedAmount;
          return (
            <div
              key={tx.id}
              onClick={() => onSelectTransaction?.(tx)}
              className="flex items-center justify-between py-2 cursor-pointer active:scale-[0.99] transition-all first:pt-0 last:pb-0"
            >
              <div className="text-left min-w-0 pr-2">
                <p className="text-xs font-semibold text-white font-sans truncate">{titleText}</p>
                <p className="text-[10px] text-white/50 font-sans mt-0.5">
                  {amountText} <span className="text-white/40 font-medium">Success</span>
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] text-white/40 font-sans">{tx.date || 'Today 11:16 PM'}</p>
              </div>
            </div>
          );
        })}
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
