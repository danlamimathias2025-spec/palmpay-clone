import React from 'react';

export type TelecomNetwork = 'mtn' | 'airtel' | 'glo' | '9mobile';

export function detectTelecomNetwork(tx: any): TelecomNetwork | null {
  if (!tx) return null;
  const combined = [
    tx.network,
    tx.recipient,
    tx.title,
    tx.narration,
    tx.senderBank,
    tx.bankName,
    tx.senderName,
    tx.service,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (combined.includes('airtel')) return 'airtel';
  if (combined.includes('glo') || combined.includes('globacom')) return 'glo';
  if (combined.includes('9mobile') || combined.includes('9 mobile') || combined.includes('etisalat')) return '9mobile';
  if (combined.includes('mtn')) return 'mtn';

  if (tx.type === 'airtime' || tx.type === 'data' || tx.category === 'airtime') {
    return 'mtn';
  }

  return null;
}

interface NetworkLogoProps {
  network: TelecomNetwork | string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function NetworkLogo({ network, size = 'md', className = '' }: NetworkLogoProps) {
  const n = (network || 'mtn').toLowerCase();

  // Size classes
  const sizeClasses = {
    sm: 'w-9 h-9 text-[9px]',
    md: 'w-11 h-11 text-xs',
    lg: 'w-13 h-13 text-sm',
  }[size];

  // 1. MTN
  if (n.includes('mtn')) {
    return (
      <div
        className={`${sizeClasses} rounded-full bg-[#ffcc00] flex items-center justify-center shrink-0 shadow-md border-2 border-white text-black font-sans font-extrabold ${className}`}
      >
        <div className="border border-black rounded-full px-1.5 py-0.5 flex items-center justify-center">
          <span className="leading-none tracking-tight font-black">MTN</span>
        </div>
      </div>
    );
  }

  // 2. Airtel
  if (n.includes('airtel')) {
    return (
      <div
        className={`${sizeClasses} rounded-full bg-[#e60000] flex items-center justify-center shrink-0 shadow-md border-2 border-white text-white font-sans ${className}`}
      >
        <span className="font-black tracking-tighter leading-none lowercase font-sans">airtel</span>
      </div>
    );
  }

  // 3. Glo
  if (n.includes('glo')) {
    return (
      <div
        className={`${sizeClasses} rounded-full bg-[#008751] flex items-center justify-center shrink-0 shadow-md border-2 border-white text-white font-sans ${className}`}
      >
        <span className="font-black text-sm tracking-tighter leading-none lowercase drop-shadow-sm font-sans">glo</span>
      </div>
    );
  }

  // 4. 9mobile
  if (n.includes('9mobile') || n.includes('etisalat')) {
    return (
      <div
        className={`${sizeClasses} rounded-full bg-[#005e38] flex flex-col items-center justify-center shrink-0 shadow-md border-2 border-white text-white font-sans relative overflow-hidden ${className}`}
      >
        <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-[#8cc63f] rounded-bl-full" />
        <span className="font-extrabold tracking-tighter text-[9px] leading-none">9mobile</span>
      </div>
    );
  }

  // Fallback telecom badge
  return (
    <div
      className={`${sizeClasses} rounded-full bg-amber-500 flex items-center justify-center shrink-0 shadow-md border-2 border-white text-white font-bold ${className}`}
    >
      <span className="uppercase">{network.slice(0, 3)}</span>
    </div>
  );
}
