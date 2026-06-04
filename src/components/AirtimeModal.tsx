import { useState } from 'react';
import { X, Smartphone, Check } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, addDoc, collection, updateDoc, increment, serverTimestamp } from 'firebase/firestore';

const operators = ['MTN', 'AIRTEL', 'GLO', '9MOBILE'];

export default function AirtimeModal({ balance, setBalance, onClose, userProfile }: { balance: number, setBalance: (b: number) => void, onClose: () => void, userProfile: any }) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({ amount: '', phoneNumber: '', operator: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const amount = Number(formData.amount);
    if (amount > balance) {
        alert('Insufficient funds');
        setLoading(false);
        return;
    }

    try {
        const userId = userProfile.phoneNumber;
        const userRef = doc(db, 'users', userId);
        const transactionsRef = collection(userRef, 'transactions');
        
        await addDoc(transactionsRef, {
            amount,
            type: 'airtime',
            recipient: formData.phoneNumber,
            timestamp: serverTimestamp()
        });
        
        await updateDoc(userRef, {
            balance: increment(-amount)
        });

        setBalance(balance - amount);
        setShowSuccess(true);
    } catch (error) {
        console.error('Airtime purchase failed', error);
        alert('Airtime purchase failed. Please try again.');
    } finally {
        setLoading(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 w-full max-w-xs shadow-xl text-center">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Purchase Successful</h2>
          <p className="text-gray-500 mb-6 font-mono text-sm">₦{Number(formData.amount).toLocaleString()} airtime for {formData.phoneNumber}</p>
          <button onClick={onClose} className="w-full p-3 rounded-xl bg-blue-600 text-white font-semibold">Done</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-sm shadow-xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400"><X /></button>
        <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
            <Smartphone size={24} /> Buy Airtime
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="tel" placeholder="Phone Number" className="w-full p-3 rounded-xl border dark:bg-gray-800" onChange={e => setFormData({...formData, phoneNumber: e.target.value})} required />
          <select className="w-full p-3 rounded-xl border dark:bg-gray-800" onChange={e => setFormData({...formData, operator: e.target.value})} required>
            <option value="">Select Operator</option>
            {operators.map(op => <option key={op} value={op}>{op}</option>)}
          </select>
          <input type="number" placeholder="Amount (₦)" className="w-full p-3 rounded-xl border dark:bg-gray-800" onChange={e => setFormData({...formData, amount: e.target.value})} required />
          <button type="submit" disabled={loading} className="w-full p-3 rounded-xl bg-blue-600 text-white font-semibold mt-4">
            {loading ? 'Processing...' : 'Buy Airtime'}
          </button>
        </form>
      </div>
    </div>
  );
}
