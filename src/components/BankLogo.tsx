import React from 'react';

export interface BankLogoInfo {
  name: string;
  url: string;
  fallbackBg?: string;
  fallbackText?: string;
}

/**
 * Returns the exact logo URL for Nigerian banks based on the user-provided exact assets.
 */
export function getBankLogoUrl(bankNameOrCode?: string): string {
  if (!bankNameOrCode) return '/assets/aistudio/download__1__15dfc463.png';
  const b = bankNameOrCode.toLowerCase().trim();

  // First Bank of Nigeria
  if (b.includes('first') || b === '011') {
    return '/assets/aistudio/download__3__4e826280.png';
  }

  // United Bank for Africa (UBA)
  if (b.includes('uba') || b.includes('united bank') || b === '033') {
    return '/assets/aistudio/download__1__5e9437a3.jpeg';
  }

  // Moniepoint
  if (b.includes('monie') || b.includes('point') || b === '50515') {
    return '/assets/aistudio/download_4168ff40.jpeg';
  }

  // Access Bank
  if (b.includes('access') || b === '044') {
    return '/assets/aistudio/download__2__0776e9ab.png';
  }

  // OPay
  if (b.includes('opay') || b.includes('paycom') || b === '999992') {
    return '/assets/aistudio/download_c708934a.png';
  }

  // PalmPay
  if (
    b.includes('palm') ||
    b.includes('palmpay') ||
    b === '999991' ||
    b === '100033' ||
    b === 'default'
  ) {
    return '/assets/aistudio/download__1__15dfc463.png';
  }

  // Default to PalmPay logo
  return '/assets/aistudio/download__1__15dfc463.png';
}

interface BankLogoProps {
  bank?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  rounded?: 'full' | 'xl' | '2xl' | 'lg';
  border?: boolean;
}

export default function BankLogo({
  bank = '',
  size = 'md',
  className = '',
  rounded = 'full',
  border = true,
}: BankLogoProps) {
  const logoUrl = getBankLogoUrl(bank);

  const sizeClasses = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-14 h-14',
  }[size];

  const roundedClasses = {
    full: 'rounded-full',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    lg: 'rounded-lg',
  }[rounded];

  const borderClass = border ? 'border border-gray-100 shadow-xs' : '';

  return (
    <div
      className={`${sizeClasses} ${roundedClasses} ${borderClass} overflow-hidden bg-white shrink-0 flex items-center justify-center p-0.5 select-none ${className}`}
    >
      <img
        src={logoUrl}
        alt={bank || 'Bank Logo'}
        className="w-full h-full object-contain rounded-[inherit]"
        loading="eager"
        decoding="sync"
        crossOrigin="anonymous"
      />
    </div>
  );
}
