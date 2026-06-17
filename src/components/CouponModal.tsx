import { useState } from 'react';
import { X, Gift } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';

export default function CouponModal({ onClose, userProfile, setBalance, balance }: { onClose: () => void, userProfile: any, setBalance: (b: number) => void, balance: number }) {
  const [claimed, setClaimed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleClaim = async () => {
    setLoading(true);
    const bonus = Math.floor(Math.random() * 500) + 100; // Random bonus
    try {
        const userRef = doc(db, 'users', userProfile.phoneNumber);
        await updateDoc(userRef, {
            balance: increment(bonus)
        });
        setBalance(balance + bonus);
        setClaimed(true);
    } catch (error) {
        console.error('Claim failed', error);
        alert('Failed to claim coupon.');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-sm shadow-xl relative text-center">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400"><X /></button>
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gift size={32} />
        </div>
        <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Daily Coupon</h2>
        {claimed ? (
            <p className="text-gray-500 mb-6">Coupon claimed successfully! Check back tomorrow.</p>
        ) : (
            <p className="text-gray-500 mb-6">Claim your daily reward!</p>
        )}
        {!claimed && (
            <button onClick={handleClaim} disabled={loading} className="w-full p-3 rounded-xl bg-blue-600 text-white font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75">
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Claiming...
                </>
              ) : 'Claim Bonus'}
            </button>
        )}
      </div>
    </div>
  );
}
