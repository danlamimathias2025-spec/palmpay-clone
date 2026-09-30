import React, { useState, useEffect, useRef } from 'react';
import { Home, Landmark, TrendingUp, Gift, Smile } from 'lucide-react';

export type NavTab = 'home' | 'loan' | 'wealth' | 'reward' | 'me';

interface BottomNavProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
}

export default function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  const [isVisible, setIsVisible] = useState(true);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      // Hide navigation bar when scrolling
      setIsVisible(false);

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Re-appear when scrolling stops
      scrollTimeoutRef.current = setTimeout(() => {
        setIsVisible(true);
      }, 240);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('touchmove', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('touchmove', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const navItems = [
    {
      id: 'home' as NavTab,
      label: 'Home',
      icon: <Home size={23} strokeWidth={2} />,
      hasDot: false,
    },
    {
      id: 'loan' as NavTab,
      label: 'Loan',
      icon: <Landmark size={23} strokeWidth={2} />,
      hasDot: true,
    },
    {
      id: 'wealth' as NavTab,
      label: 'Wealth',
      icon: <TrendingUp size={23} strokeWidth={2} />,
      hasDot: false,
    },
    {
      id: 'reward' as NavTab,
      label: 'Reward',
      icon: <Gift size={23} strokeWidth={2} />,
      hasDot: false,
    },
    {
      id: 'me' as NavTab,
      label: 'Me',
      icon: <Smile size={23} strokeWidth={2} />,
      hasDot: false,
    },
  ];

  return (
    <div
      className={`fixed bottom-3 inset-x-0 mx-auto w-[calc(100%-2rem)] max-w-md z-40 transition-all duration-300 ease-in-out ${
        isVisible ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-24 opacity-0 pointer-events-none'
      }`}
    >
      <nav className="mirror-glass-nav rounded-full px-2 py-1.5 flex items-center justify-around shadow-[0_12px_40px_rgba(0,0,0,0.6)] border border-white/15">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 px-1 relative transition-all duration-150 group active:scale-95 ${
                isActive ? 'text-[#a855f7]' : 'text-white/60 hover:text-white/90'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <div
                  className={`transition-transform duration-200 ${
                    isActive ? 'scale-105 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]' : ''
                  }`}
                >
                  {item.icon}
                </div>

                {/* Red notification dot on Loan tab */}
                {item.hasDot && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 shadow-sm border border-[#141624]" />
                )}
              </div>

              <span
                className={`text-[11px] tracking-normal mt-0.5 leading-tight ${
                  isActive ? 'font-semibold text-[#c084fc]' : 'font-normal'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
