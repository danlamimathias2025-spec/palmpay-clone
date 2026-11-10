import { NativeBiometric, BiometryType } from 'capacitor-native-biometric';
import { verifyBiometrics as webAuthnVerify, registerBiometrics as webAuthnRegister, hasSavedBiometrics as webAuthnHasSaved } from './webauthn';

export type BiometricMode = 'faceid' | 'touch';

export interface BiometricCheckResult {
  isAvailable: boolean;
  biometryType: 'FACE_ID' | 'FINGERPRINT' | 'TOUCH_ID' | 'MULTIPLE' | 'NONE';
  hasEnrolled: boolean;
}

/**
 * Checks biometric capabilities on the device via Capacitor NativeBiometric or WebAuthn.
 */
export async function checkBiometricAvailability(userId?: string): Promise<BiometricCheckResult> {
  const cleanId = (userId || localStorage.getItem('palmpay_last_login_phone') || '').replace(/\D/g, '');

  try {
    const nativeRes = await NativeBiometric.isAvailable();
    if (nativeRes && nativeRes.isAvailable) {
      let typeStr: 'FACE_ID' | 'FINGERPRINT' | 'TOUCH_ID' | 'MULTIPLE' = 'FINGERPRINT';
      if (nativeRes.biometryType === BiometryType.FACE_ID || (nativeRes.biometryType as any) === 'FACE_ID') {
        typeStr = 'FACE_ID';
      } else if (nativeRes.biometryType === BiometryType.TOUCH_ID || (nativeRes.biometryType as any) === 'TOUCH_ID') {
        typeStr = 'TOUCH_ID';
      } else if (nativeRes.biometryType === BiometryType.MULTIPLE || (nativeRes.biometryType as any) === 'MULTIPLE') {
        typeStr = 'MULTIPLE';
      }
      return {
        isAvailable: true,
        biometryType: typeStr,
        hasEnrolled: true,
      };
    }
  } catch (e) {
    console.warn('Capacitor NativeBiometric availability check fallback:', e);
  }

  // WebAuthn fallback check
  const hasSaved = webAuthnHasSaved(cleanId);
  const webAuthnSupported = typeof window !== 'undefined' && Boolean(window.PublicKeyCredential);

  return {
    isAvailable: webAuthnSupported || hasSaved,
    biometryType: 'MULTIPLE',
    hasEnrolled: hasSaved,
  };
}

/**
 * Executes biometric verification using Capacitor NativeBiometric or WebAuthn fallback.
 */
export async function authenticateWithBiometrics(options: {
  userId?: string;
  reason?: string;
  title?: string;
}): Promise<{ success: boolean; error?: string }> {
  const cleanId = (options.userId || localStorage.getItem('palmpay_last_login_phone') || '').replace(/\D/g, '');

  // 1. Attempt Capacitor NativeBiometric plugin authentication
  try {
    const nativeCheck = await NativeBiometric.isAvailable();
    if (nativeCheck && nativeCheck.isAvailable) {
      await NativeBiometric.verifyIdentity({
        reason: options.reason || 'Log in to your PalmPay account',
        title: options.title || 'PalmPay Biometric Login',
        subtitle: 'Verify your identity using Face ID or Fingerprint',
        description: 'Place finger on sensor or look at camera',
      });
      return { success: true };
    }
  } catch (err: any) {
    console.warn('Capacitor NativeBiometric verify error, falling back to WebAuthn:', err);
    // If native prompt was cancelled by user, preserve cancel notice
    if (err?.message?.includes('cancel') || err?.code === 10 || err?.code === 13) {
      return { success: false, error: 'Authentication cancelled by user' };
    }
  }

  // 2. Fallback to WebAuthn / simulated platform biometric scanner
  return webAuthnVerify(cleanId);
}

/**
 * Saves preferred biometric mode ('faceid' or 'touch') in localStorage.
 */
export function getBiometricPreference(): BiometricMode {
  if (typeof window === 'undefined') return 'touch';
  const pref = localStorage.getItem('palmpay_biometric_pref');
  return (pref === 'faceid' ? 'faceid' : 'touch');
}

export function setBiometricPreference(pref: BiometricMode): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('palmpay_biometric_pref', pref);
}
