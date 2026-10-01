/**
 * Account number utilities for PalmPay.
 *
 * Rules in Nigeria:
 *   - Nigerian mobile phone numbers are 11 digits starting with 0 (e.g. 08082076038).
 *   - PalmPay 10-digit NUBAN account numbers are derived directly from the phone number
 *     by stripping the leading '0' (e.g. 08082076038 -> 8082076038).
 *   - Every user's account number MUST be strictly derived from their own identity
 *     to prevent collision, mismatch, or accidental account combination.
 */

/**
 * Normalizes any phone number or account input into a strict 10-digit PalmPay account number.
 * Never defaults to a hardcoded account number to ensure absolute user isolation.
 */
export function normalizePalmPayAccountNumber(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return '';
  const raw = value.toString().trim();
  if (!raw) return '';

  let clean = raw.replace(/\D/g, '');

  // Strip international prefix '234'
  if (clean.startsWith('234') && clean.length > 10) {
    clean = clean.slice(3);
  }

  // Strip leading zero if 11 digits (Nigerian mobile standard)
  if (clean.startsWith('0') && clean.length === 11) {
    clean = clean.slice(1);
  } else if (clean.startsWith('0') && clean.length > 10) {
    clean = clean.replace(/^0+/, '');
  }

  // If still longer than 10 digits, keep the last 10 digits
  if (clean.length > 10) {
    clean = clean.slice(-10);
  }

  // If already exactly 10 digits, return it
  if (clean.length === 10) {
    return clean;
  }

  // If shorter than 10 digits, do NOT return another user's account number.
  // Pad with zeroes at the beginning to avoid cross-user pollution.
  if (clean.length > 0 && clean.length < 10) {
    return clean.padStart(10, '0');
  }

  return clean;
}

/**
 * Generates the 10-digit PalmPay account number for a phone number.
 */
export function generatePalmPayAccountNumber(phone: string | number | undefined | null): string {
  return normalizePalmPayAccountNumber(phone);
}

/**
 * Normalizes any phone or account string into canonical 11-digit Nigerian mobile format (0XXXXXXXXXX).
 * Used as the primary key / document ID in Firestore to isolate user accounts.
 */
export function normalizePhoneNumber(value: string | number | undefined | null): string {
  if (!value) return '';
  let clean = value.toString().trim().replace(/\D/g, '');

  // International 234 format: 2348082076038 -> 08082076038
  if (clean.startsWith('234') && clean.length === 13) {
    return '0' + clean.slice(3);
  }

  // 10-digit PalmPay account format: 8082076038 -> 08082076038
  if (clean.length === 10) {
    return '0' + clean;
  }

  // 11-digit phone format starting with 0
  if (clean.length === 11 && clean.startsWith('0')) {
    return clean;
  }

  // Fallback: if ends with 10 digits, prefix with 0
  if (clean.length > 10) {
    return '0' + clean.slice(-10);
  }

  return clean;
}

/**
 * Formats a 10-digit account number with readable spacing (e.g., "808 207 6038").
 */
export function formatAccountNumber(acc: string | number | undefined | null): string {
  const clean = normalizePalmPayAccountNumber(acc);
  if (clean.length === 10) {
    return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6)}`;
  }
  return clean;
}

/**
 * Formats an 11-digit phone number with readable spacing (e.g., "0808 207 6038").
 */
export function formatPhoneNumber(phone: string | number | undefined | null): string {
  const clean = normalizePhoneNumber(phone);
  if (clean.length === 11) {
    return `${clean.slice(0, 4)} ${clean.slice(4, 7)} ${clean.slice(7)}`;
  }
  return clean;
}
