/**
 * Flash Alerts Utility for In-App & Outside-App notifications
 * Supports Web Audio synthesized chime, Vibration, and Browser Push Notifications
 */

export interface FlashAlertData {
  id: string;
  type: 'credit' | 'debit' | 'transfer' | 'bill' | 'other';
  title: string;
  amount: number;
  formattedAmount: string;
  senderOrRecipient: string;
  bankName?: string;
  accountNumber?: string;
  reference?: string;
  date?: string;
  fullTransaction?: any;
}

// 1. Play Authentic Crystal Payment Chime using Web Audio API
export function playFlashChime(type: 'credit' | 'debit' = 'credit') {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (type === 'credit') {
      // Upbeat cheerful 3-tone chime for Credits / Deposits
      const now = ctx.currentTime;
      const notes = [
        { freq: 523.25, time: now, dur: 0.15 },        // C5
        { freq: 659.25, time: now + 0.1, dur: 0.18 },  // E5
        { freq: 1046.5, time: now + 0.22, dur: 0.4 },  // C6
      ];

      notes.forEach(({ freq, time, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);

        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.3, time + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(time);
        osc.stop(time + dur);
      });
    } else {
      // Subtle sleek confirmation chime for Debits / Withdrawals
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(659.25, now); // E5
      osc.frequency.exponentialRampToValueAtTime(523.25, now + 0.25); // C5

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    }
  } catch (err) {
    // Audio context may be restricted by browser until user gesture
  }
}

// 2. Trigger Haptic Vibration
export function triggerHaptic() {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([100, 50, 150]);
    }
  } catch (e) {}
}

// 3. Request Outside-App Browser Notification Permission
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    if (Notification.permission === 'granted') {
      return true;
    }
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  } catch (e) {
    return false;
  }
}

// 4. Send Outside-App Flash Notification (System Tray / Lock Screen / Mobile Push)
export function sendOutsideAppNotification(alert: FlashAlertData, onClick?: () => void) {
  try {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    if (Notification.permission === 'granted') {
      const isCredit = alert.type === 'credit';
      const title = isCredit
        ? `🔔 PalmPay Credit Alert: +₦${alert.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`
        : `📤 PalmPay Debit Alert: -₦${alert.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

      const body = isCredit
        ? `Received from: ${alert.senderOrRecipient}\nAcct: ${alert.accountNumber || '808***6038'} | Ref: ${alert.reference || 'Instant'}`
        : `Paid to: ${alert.senderOrRecipient}\nAcct: ${alert.accountNumber || '808***6038'} | Ref: ${alert.reference || 'Instant'}`;

      const notification = new Notification(title, {
        body: body,
        icon: '/palmpay_official_icon.png',
        badge: '/palmpay_official_icon.png',
        tag: alert.id,
        silent: false,
        requireInteraction: false,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
        if (onClick) onClick();
      };
    }
  } catch (e) {
    console.warn('Outside-app notification error:', e);
  }
}
