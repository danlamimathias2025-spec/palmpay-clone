import React from 'react';
import { useOrientation } from '../hooks/useOrientation';

export type NavTab = 'home' | 'loan' | 'wealth' | 'reward' | 'me';

interface BottomNavProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
}

export default function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  const { isLandscape } = useOrientation();

  // Custom high-fidelity inline SVGs to match the exact styles on the uploaded image
  const renderIcon = (id: NavTab, isActive: boolean) => {
    const strokeColor = isActive ? '#7c1cf5' : '#8e929a';
    const fillColor = isActive ? '#7c1cf5' : 'none';

    switch (id) {
      case 'home':
        return isActive ? (
          <svg width="23" height="23" viewBox="0 0 24 24" fill="#7c1cf5">
            <path d="m12 2-9 7v13a1 1 0 0 0 1 1h5v-7h6v7h5a1 1 0 0 0 1-1V9l-9-7z" />
          </svg>
        ) : (
          <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="#8e929a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        );

      case 'loan':
        // Stylized money sack icon
        return (
          <svg width="23" height="23" viewBox="0 0 24 24" fill={fillColor} stroke={strokeColor} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a4 4 0 0 0-4 4c0 1.2.5 2.3 1.3 3.1A7 7 0 0 0 4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3a7 7 0 0 0-5.3-6.9A4 4 0 0 0 12 2z" />
            <circle cx="12" cy="15" r="2" fill={isActive ? '#ffffff' : 'none'} />
          </svg>
        );

      case 'wealth':
        // Screen folder with trending upward curve
        return (
          <svg width="23" height="23" viewBox="0 0 24 24" fill={fillColor} fillOpacity={isActive ? 0.15 : 1} stroke={strokeColor} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="m7 15 3-3 3 3 4-5" />
          </svg>
        );

      case 'reward':
        // Gift box outline with ribbon
        return (
          <svg width="23" height="23" viewBox="0 0 24 24" fill={fillColor} fillOpacity={isActive ? 0.15 : 1} stroke={strokeColor} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 12v10H4V12" />
            <rect x="2" y="7" width="20" height="5" rx="1" />
            <path d="M12 22V7" />
            <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
            <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
          </svg>
        );

      case 'me':
        // Circular smiley face outline
        return (
          <svg width="23" height="23" viewBox="0 0 24 24" fill={fillColor} fillOpacity={isActive ? 0.15 : 1} stroke={strokeColor} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
          </svg>
        );

      default:
        return null;
    }
  };

  const navItems = [
    { id: 'home' as NavTab, label: 'Home', hasDot: false },
    { id: 'loan' as NavTab, label: 'Loan', hasDot: false },
    { id: 'wealth' as NavTab, label: 'Wealth', hasDot: false },
    { id: 'reward' as NavTab, label: 'Reward', hasDot: false },
    { id: 'me' as NavTab, label: 'Me', hasDot: false },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#111217] border-t border-white/5 shadow-[0_-8px_30px_rgba(0,0,0,0.4)] pb-safe">
      <div className={`mx-auto w-full flex items-center justify-around py-2.5 ${isLandscape ? 'max-w-2xl px-8' : 'max-w-md px-2'}`}>
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="flex-1 flex flex-col items-center justify-center relative active:scale-95 transition-all group"
            >
              {/* Icon Container */}
              <div className="relative flex items-center justify-center">
                <div className="transition-transform duration-150 group-hover:scale-105">
                  {renderIcon(item.id, isActive)}
                </div>

                {/* Optional notification dot */}
                {item.hasDot && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-rose-500 shadow-sm" />
                )}
              </div>

              {/* Text Label */}
              <span
                className={`text-[11px] tracking-wide mt-1.5 leading-none transition-colors duration-150 font-sans ${
                  isActive ? 'font-bold text-[#7c1cf5]' : 'font-medium text-[#8e929a] group-hover:text-white/80'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
