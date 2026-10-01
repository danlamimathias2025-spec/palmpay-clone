import React, { useState } from 'react';
import { Gift, Sparkles, Award, Ticket, Check, RotateCw } from 'lucide-react';

interface RewardPageProps {
  onClaimVoucher: (title: string, amount: number) => void;
}

export default function RewardPage({ onClaimVoucher }: RewardPageProps) {
  const [points, setPoints] = useState(() => {
    return Number(localStorage.getItem('palmpay_user_points') || 0);
  });
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState<string | null>(null);

  const handleCheckIn = () => {
    if (!hasCheckedIn) {
      setHasCheckedIn(true);
      const nextPoints = points + 50;
      setPoints(nextPoints);
      localStorage.setItem('palmpay_user_points', nextPoints.toString());
      alert("Daily check-in successful! +50 PalmPoints added.");
    }
  };

  const handleSpin = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setSpinResult(null);

    const outcomes = [
      { text: '₦50 Cashback', value: 50 },
      { text: '₦100 Airtime Voucher', value: 100 },
      { text: '0-Fee Bank Transfer Pass', value: 0 },
      { text: '100 PalmPoints', value: 100 },
    ];

    setTimeout(() => {
      const winner = outcomes[Math.floor(Math.random() * outcomes.length)];
      setIsSpinning(false);
      setSpinResult(winner.text);
      if (winner.value > 0) {
        onClaimVoucher(winner.text, winner.value);
      }
    }, 1500);
  };

  const coupons = [
    { id: 1, title: '₦100 Data Recharge Voucher', minSpend: 'Min spend ₦500', exp: 'Valid for 7 days', amount: 100 },
    { id: 2, title: '₦200 Airtime Top-Up Coupon', minSpend: 'Min spend ₦1,000', exp: 'Valid for 5 days', amount: 200 },
    { id: 3, title: '100% Free Bank Transfer Fee Pass', minSpend: 'No min spend', exp: 'Valid today', amount: 10 },
  ];

  return (
    <div className="flex flex-col min-h-screen pb-28 max-w-md mx-auto px-4 pt-3">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold font-script text-white">Reward Center</h1>
          <p className="text-xs text-white/60">Earn points, claim cashback & win prizes</p>
        </div>
        <div className="flex items-center gap-1.5 mirror-glass px-3 py-1.5 rounded-full text-xs font-bold text-amber-300 border border-amber-500/30">
          <Sparkles size={14} />
          <span>{points.toLocaleString()} Points</span>
        </div>
      </div>

      {/* Daily Check-in Streak */}
      <div className="mirror-glass-card rounded-3xl p-5 border border-purple-500/20 mb-4">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="text-sm font-bold text-white font-script">Daily Check-In</h3>
            <p className="text-[11px] text-white/60">Check in 7 days in a row for a ₦500 surprise</p>
          </div>
          <button
            onClick={handleCheckIn}
            disabled={hasCheckedIn}
            className={`py-1.5 px-4 rounded-full text-xs font-bold transition-all shadow-sm ${
              hasCheckedIn
                ? 'bg-emerald-600 text-white cursor-default'
                : 'bg-[#7846f7] hover:bg-[#6836ea] text-white active:scale-95'
            }`}
          >
            {hasCheckedIn ? 'Checked In ✓' : 'Check In'}
          </button>
        </div>

        {/* 7-Day row */}
        <div className="grid grid-cols-7 gap-1.5 text-center">
          {[1, 2, 3, 4, 5, 6, 7].map((day) => {
            const isToday = day === 1;
            const checked = hasCheckedIn && isToday;
            return (
              <div
                key={day}
                className={`py-2 rounded-xl border flex flex-col items-center justify-center transition-all ${
                  checked
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                    : isToday
                    ? 'bg-purple-600/30 border-purple-400 text-white'
                    : 'mirror-glass border-white/5 text-white/50'
                }`}
              >
                <span className="text-[10px] font-bold">D{day}</span>
                <span className="text-xs font-extrabold mt-0.5">+{day * 10}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lucky Spin Wheel Mini Game */}
      <div className="mirror-glass-card rounded-3xl p-5 border border-white/10 mb-4 text-center">
        <h3 className="text-sm font-bold text-white font-script mb-1">Lucky Prize Spin</h3>
        <p className="text-[11px] text-white/60 mb-4">Free daily spin for exclusive rewards!</p>

        <div className="relative w-36 h-36 mx-auto mb-4 flex items-center justify-center">
          <div
            className={`w-full h-full rounded-full border-4 border-purple-500/50 bg-gradient-to-tr from-purple-900 via-indigo-950 to-purple-800 flex items-center justify-center shadow-xl ${
              isSpinning ? 'animate-spin' : ''
            }`}
          >
            <Gift size={36} className="text-amber-400" />
          </div>
          <div className="absolute -top-1 w-3 h-5 bg-amber-400 rounded-b-md shadow-md" />
        </div>

        {spinResult && (
          <div className="mb-3 p-2 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs font-bold text-emerald-300 animate-fade-in">
            🎉 You Won: {spinResult}!
          </div>
        )}

        <button
          onClick={handleSpin}
          disabled={isSpinning}
          className="py-2.5 px-6 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-white font-bold text-xs shadow-md active:scale-95 transition-all inline-flex items-center gap-1.5"
        >
          <RotateCw size={14} className={isSpinning ? 'animate-spin' : ''} />
          <span>{isSpinning ? 'Spinning...' : 'Spin Wheel (1 Free)'}</span>
        </button>
      </div>

      {/* Active Coupons & Vouchers */}
      <div className="space-y-2.5 mb-4">
        <h3 className="text-sm font-bold text-white font-script">Available Vouchers</h3>

        {coupons.map((coupon) => (
          <div
            key={coupon.id}
            className="mirror-glass-card rounded-2xl p-3.5 border border-white/10 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/20 flex items-center justify-center text-purple-300 shrink-0">
                <Ticket size={20} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white leading-tight">{coupon.title}</h4>
                <p className="text-[10px] text-white/50">{coupon.minSpend} · {coupon.exp}</p>
              </div>
            </div>

            <button
              onClick={() => {
                onClaimVoucher(coupon.title, coupon.amount);
                alert(`Coupon applied: ${coupon.title}`);
              }}
              className="py-1 px-3 rounded-full bg-[#7846f7] hover:bg-[#6836ea] text-white text-[11px] font-bold active:scale-95 transition-all shrink-0"
            >
              Use
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
