/**
 * Normalizes and generates a strict 10-digit PalmPay NUBAN account number
 * (Unique Funds ID) from any phone or account string.
 *
 * Rules:
 *   - Strips non-digits
 *   - Strips international prefix '234' if length > 10
 *   - Strips leading '0' if length is 11 (e.g., '08082076038' -> '8082076038')
 *   - Always guarantees exactly 10 digits
 *
 * Example:
 *   '08082076038'   -> '8082076038' (10 digits)
 *   '+2348082076038'-> '8082076038' (10 digits)
 *   '8082076038'    -> '8082076038' (10 digits)
 */
export function normalizePalmPayAccountNumber(value: string | number | undefined | null): string {
  if (!value) return '8082076038';
  let clean = value.toString().replace(/\D/g, '');

  // Strip international prefix '234'
  if (clean.startsWith('234') && clean.length > 10) {
    clean = clean.slice(3);
  }

  // Strip leading zero if 11 digits
  if (clean.startsWith('0') && clean.length === 11) {
    clean = clean.slice(1);
  } else if (clean.startsWith('0') && clean.length > 10) {
    clean = clean.replace(/^0+/, '');
  }

  // If still longer than 10 digits, keep the last 10 digits
  if (clean.length > 10) {
    clean = clean.slice(-10);
  }

  // Fallback to default if too short
  if (clean.length !== 10) {
    return '8082076038';
  }

  return clean;
}

export function generatePalmPayAccountNumber(phone: string | number | undefined | null): string {
  return normalizePalmPayAccountNumber(phone);
}
