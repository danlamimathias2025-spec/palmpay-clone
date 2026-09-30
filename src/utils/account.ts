/**
 * Generates a 10-digit PalmPay NUBAN account number from a registered phone number
 * by removing the leading '0' (or country prefix).
 * Example:
 *   '08082076038' -> '8082076038'
 *   '08012345678' -> '8012345678'
 *   '+2348082076038' -> '8082076038'
 */
export function generatePalmPayAccountNumber(phone: string): string {
  if (!phone) return '8082076038';
  let clean = phone.toString().replace(/\D/g, '');
  
  // Remove international prefix if present
  if (clean.startsWith('234') && clean.length >= 13) {
    clean = clean.slice(3);
  }
  
  // Strip leading 0
  if (clean.startsWith('0')) {
    clean = clean.slice(1);
  }
  
  // Return the 10-digit PalmPay account number
  return clean.slice(0, 10) || '8082076038';
}
