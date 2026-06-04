import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, addDoc, collection, updateDoc, increment, serverTimestamp } from 'firebase/firestore';

const banks = [
  'Access Bank', 'Zenith Bank', 'GTBank', 'UBA', 'First Bank', 'Fidelity Bank', 
  'Stanbic IBTC', 'EcoBank', 'Sterling Bank', 'Polaris Bank', 'FCMB', 'Union Bank', 
  'Providus Bank', 'Wema Bank', 'Kuda Bank', 'Moniepoint', 'OPay', 'PalmPay', 
  'Nomba', 'Sparkle'
];

export default function TransferModal({ balance, setBalance, onClose, userProfile }: { balance: number, setBalance: (b: number) => void, onClose: () => void, userProfile: any }) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({ amount: '', accountNumber: '', accountName: '', bank: '', pin: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleSubmit called', formData);
    setLoading(true);
    console.log('Submitting transfer...', formData, balance);
    const amount = Number(formData.amount);
    if (amount > balance) {
        alert('Insufficient funds');
        console.log('Insufficient funds');
        setLoading(false);
        return;
    }
    // Changed PIN check to use userProfile.pin
    if (formData.pin !== userProfile.pin) {
        alert('Incorrect PIN');
        console.log('Incorrect PIN', formData.pin, userProfile.pin);
        setLoading(false);
        return;
    }

    try {
        const userId = userProfile.phoneNumber; // Using phone number as userId for now
        console.log('Using userId:', userId);
        const userRef = doc(db, 'users', userId);
        const transactionsRef = collection(userRef, 'transactions');
        
        await addDoc(transactionsRef, {
            amount,
            type: 'transfer',
            recipient: formData.accountNumber,
            timestamp: serverTimestamp()
        });
        
        await updateDoc(userRef, {
            balance: increment(-amount)
        });

        setBalance(balance - amount);
        setShowSuccess(true);
        console.log('Transfer successful');
    } catch (error) {
        console.error('Transfer failed', error);
        alert('Transfer failed. Please try again.');
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
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Transfer Successful</h2>
          <p className="text-gray-500 mb-6 font-mono text-sm">₦{Number(formData.amount).toLocaleString()} sent to {formData.accountName}</p>
          <button onClick={onClose} className="w-full p-3 rounded-xl bg-blue-600 text-white font-semibold">Done</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-sm shadow-xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400"><X /></button>
        <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">Fund Transfer</h2>
        {userProfile.phoneNumber ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="number" placeholder="Amount (₦)" className="w-full p-3 rounded-xl border dark:bg-gray-800" onChange={e => setFormData({...formData, amount: e.target.value})} required />
          <input type="text" placeholder="Account Number" className="w-full p-3 rounded-xl border dark:bg-gray-800" onChange={e => setFormData({...formData, accountNumber: e.target.value})} required />
          <input type="text" placeholder="Account Name" className="w-full p-3 rounded-xl border dark:bg-gray-800" onChange={e => setFormData({...formData, accountName: e.target.value})} required />
          <select className="w-full p-3 rounded-xl border dark:bg-gray-800" onChange={e => setFormData({...formData, bank: e.target.value})} required>
            <option value="">Select Bank</option>
            {banks.map(bank => <option key={bank} value={bank}>{bank}</option>)}
          </select>
          <input type="password" placeholder="4-digit PIN" maxLength={4} className="w-full p-3 rounded-xl border dark:bg-gray-800" onChange={e => setFormData({...formData, pin: e.target.value})} required />
          <button type="submit" disabled={loading} className="w-full p-3 rounded-xl bg-blue-600 text-white font-semibold mt-4">
            {loading ? 'Processing...' : 'Transfer'}
          </button>
        </form>
        ) : (
            <p className="text-red-500 font-semibold text-center">Loading user profile... please wait.</p>
        )}
      </div>
    </div>
  );
}