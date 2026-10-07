import React from 'react';
import { Headphones, ShieldCheck, Bell } from 'lucide-react';

interface HeaderProps {
  userProfile: {
    fullName: string;
    userName: string;
    phoneNumber: string;
    imageUrl?: string;
    photoURL?: string;
    avatarUrl?: string;
  };
  onSupportClick: () => void;
  onSecurityClick: () => void;
  onBellClick: () => void;
}

export default function Header({ userProfile, onSupportClick, onSecurityClick, onBellClick }: HeaderProps) {
  const avatarSrc = userProfile.imageUrl || userProfile.photoURL || userProfile.avatarUrl;
  const initial = (userProfile.userName?.[0] || userProfile.fullName?.[0] || 'U').toUpperCase();
  const displayName = userProfile.userName || userProfile.fullName?.split(' ')[0] || 'User';

  return (
    <header className="px-4 pt-3 pb-2.5 flex items-center justify-between sticky top-0 z-30 bg-[#0d0f17]/95 backdrop-blur-md">
      {/* User Profile Avatar & Greeting */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full overflow-hidden p-[1.5px] bg-gradient-to-tr from-purple-500 to-indigo-500 shadow-md shrink-0 flex items-center justify-center">
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt={displayName}
              className="w-full h-full rounded-full object-cover bg-slate-800"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-700 to-indigo-900 flex items-center justify-center text-white font-black text-sm">
              {initial}
            </div>
          )}
        </div>

        <h1 className="text-base sm:text-lg font-bold text-white tracking-normal truncate max-w-[170px] sm:max-w-xs">
          Hi, {displayName}
        </h1>
      </div>

      {/* Action Icons matching screenshot sizes */}
      <div className="flex items-center gap-3.5">
        {/* Customer Support */}
        <button
          onClick={onSupportClick}
          aria-label="Customer Support"
          className="text-white/90 hover:text-white active:scale-95 transition-all p-1"
        >
          <Headphones size={22} strokeWidth={1.8} />
        </button>

        {/* Security Shield */}
        <button
          onClick={onSecurityClick}
          aria-label="Security Center"
          className="text-white/90 hover:text-white active:scale-95 transition-all p-1"
        >
          <ShieldCheck size={22} strokeWidth={1.8} />
        </button>

        {/* Notification Bell with Red 50 Badge */}
        <button
          onClick={onBellClick}
          aria-label="Notifications"
          className="text-white/90 hover:text-white relative active:scale-95 transition-all p-1"
        >
          <Bell size={22} strokeWidth={1.8} />
          <span className="absolute -top-1 -right-1 bg-[#ef4444] text-white text-[10px] font-bold px-1 rounded-full min-w-[17px] h-[17px] flex items-center justify-center border-2 border-[#0d0f17] shadow-sm leading-none">
            50
          </span>
        </button>
      </div>
    </header>
  );
}
