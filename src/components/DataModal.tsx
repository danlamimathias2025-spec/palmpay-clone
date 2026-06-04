import { useState } from 'react';
import { X, Smartphone, Check } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, addDoc, collection, updateDoc, increment, serverTimestamp } from 'firebase/firestore';

const operators = ['MTN', 'AIRTEL', 'GLO', '9MOBILE'];
const dataPlans = [
    { name: '1GB - ₦500', amount: 500 },
    { name: '2GB - ₦1000', amount: 1000 },
    { name: '5GB - ₦2000', amount: 2000 },
];

export default function DataModal({ balance, setBalance, onClose, userProfile }: { balance: number, setBalance: (b: number) => void, onClose: () => void, userProfile: any }) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({ phoneNumber: '', operator: '', plan: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedPlan = dataPlans.find(p => p.name === formData.plan);
    if (!selectedPlan) return;
    
    setLoading(true);
    if (selectedPlan.amount > balance) {
        alert('Insufficient funds');
        setLoading(false);
        return;
    }

    try {
        const userId = userProfile.phoneNumber;
        const userRef = doc(db, 'users', userId);
        const transactionsRef = collection(userRef, 'transactions');
        
        await addDoc(transactionsRef, {
            amount: selectedPlan.amount,
            type: 'data',
            recipient: formData.phoneNumber,
            timestamp: serverTimestamp()
        });
        
        await updateDoc(userRef, {
            balance: increment(-selectedPlan.amount)
        });

        setBalance(balance - selectedPlan.amount);
        setShowSuccess(true);
    } catch (error) {
        console.error('Data purchase failed', error);
        alert('Data purchase failed. Please try again.');
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
          <p className="text-gray-500 mb-6 font-mono text-sm">Data plan for {formData.phoneNumber}</p>
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
            <Smartphone size={24} /> Buy Data
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="tel" placeholder="Phone Number" className="w-full p-3 rounded-xl border dark:bg-gray-800" onChange={e => setFormData({...formData, phoneNumber: e.target.value})} required />
          <select className="w-full p-3 rounded-xl border dark:bg-gray-800" onChange={e => setFormData({...formData, operator: e.target.value})} required>
            <option value="">Select Operator</option>
            {operators.map(op => <option key={op} value={op}>{op}</option>)}
          </select>
          <select className="w-full p-3 rounded-xl border dark:bg-gray-800" onChange={e => setFormData({...formData, plan: e.target.value})} required>
            <option value="">Select Plan</option>
            {dataPlans.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
          </select>
          <button type="submit" disabled={loading} className="w-full p-3 rounded-xl bg-blue-600 text-white font-semibold mt-4">
            {loading ? 'Processing...' : 'Buy Data'}
          </button>
        </form>
      </div>
    </div>
  );
}
