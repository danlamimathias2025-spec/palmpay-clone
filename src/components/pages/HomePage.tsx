import React from 'react';
import Header from '../Header';
import AccountCard from '../AccountCard';
import QuickActions from '../QuickActions';
import PromoCard from '../PromoCard';
import ServicesGrid from '../ServicesGrid';
import CashbackMiniBanner from '../CashbackMiniBanner';
import WealthCards from '../WealthCards';
import DataRechargeBanner from '../DataRechargeBanner';

interface HomePageProps {
  balance: number;
  userProfile: {
    fullName: string;
    userName: string;
    phoneNumber: string;
    imageUrl?: string;
  };
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
  return (
    <div className="flex flex-col min-h-screen pb-24 max-w-md mx-auto relative">
      {/* 1. Header with Avatar, Greeting, and 3 Icons */}
      <Header
        userProfile={userProfile}
        onSupportClick={onSupportClick}
        onSecurityClick={onSecurityClick}
        onBellClick={onBellClick}
      />

      {/* 2. Available Balance Card */}
      <AccountCard
        balance={balance}
        onAddMoney={onAddMoney}
        onViewHistory={onViewHistory}
        onEarningsClick={onEarningsClick}
      />

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
    </div>
  );
}
