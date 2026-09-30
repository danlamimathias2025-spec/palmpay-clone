/**
 * Currency and Number Formatting Utility for PalmPay
 * Guarantees standard Nigerian Naira formatting (e.g. ₦10,000.00)
 */

export function formatNaira(amount: number | string | undefined | null, includeSymbol = true): string {
  const num = Number(amount);
  if (isNaN(num) || amount === undefined || amount === null) {
    return includeSymbol ? '₦0.00' : '0.00';
  }
  const formatted = num.toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return includeSymbol ? `₦${formatted}` : formatted;
}
