import React, { useState, useEffect } from 'react';
import IOSFaceIDOverlay from './biometrics/IOSFaceIDOverlay';
import OneUITouchOverlay from './biometrics/OneUITouchOverlay';
import { BiometricTransactionContext } from '../utils/webauthn';
import { getBiometricPreference, setBiometricPreference, checkBiometricAvailability } from '../utils/biometrics';

interface BiometricAuthOverlayProps {
  userId?: string;
  userName?: string;
  mode?: 'login' | 'transaction';
  transactionContext?: BiometricTransactionContext;
  onSuccess: () => void;
  onCancel: () => void;
  onFallbackToPin?: () => void;
}

export default function BiometricAuthOverlay({
  userId,
  userName = 'PalmPay User',
  mode = 'login',
  transactionContext,
  onSuccess,
  onCancel,
  onFallbackToPin,
}: BiometricAuthOverlayProps) {
  const [activeType, setActiveType] = useState<'faceid' | 'touch'>(getBiometricPreference());

  useEffect(() => {
    // Detect device capabilities if available
    checkBiometricAvailability(userId).then((res) => {
      if (res.biometryType === 'FACE_ID') {
        setActiveType('faceid');
      } else if (res.biometryType === 'FINGERPRINT' || res.biometryType === 'TOUCH_ID') {
        setActiveType('touch');
      }
    }).catch(console.warn);
  }, [userId]);

  const handleSwitchType = (newType: 'faceid' | 'touch') => {
    setActiveType(newType);
    setBiometricPreference(newType);
  };

  if (activeType === 'faceid') {
    return (
      <IOSFaceIDOverlay
        userId={userId}
        userName={userName}
        onSuccess={onSuccess}
        onCancel={onCancel}
        onSwitchToTouch={() => handleSwitchType('touch')}
        onFallbackToPin={onFallbackToPin}
      />
    );
  }

  return (
    <OneUITouchOverlay
      userId={userId}
      userName={userName}
      onSuccess={onSuccess}
      onCancel={onCancel}
      onSwitchToFaceID={() => handleSwitchType('faceid')}
      onFallbackToPin={onFallbackToPin}
    />
  );
}
