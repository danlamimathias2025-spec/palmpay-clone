
import { useState } from 'react';
import { X, Copy, RefreshCw, Check } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, addDoc, collection, updateDoc, increment, serverTimestamp } from 'firebase/firestore';

export default function AddFundsModal({ onClose, userProfile, balance, setBalance }: { onClose: () => void, userProfile: any, balance: number, setBalance: (b: number) => void }) {
  const [activeTab, setActiveTab] = useState<'Transfer' | 'Card'>('Transfer');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleAddFunds = async () => {
    if (!amount) return;
    setLoading(true);
    const amountNum = Number(amount);
    
    try {
        const userId = userProfile.phoneNumber;
        const userRef = doc(db, 'users', userId);
        const transactionsRef = collection(userRef, 'transactions');
        
        await addDoc(transactionsRef, {
            amount: amountNum,
            type: 'credit', // 'credit' for incoming
            timestamp: serverTimestamp()
        });
        
        await updateDoc(userRef, {
            balance: increment(amountNum)
        });

        setBalance(balance + amountNum);
        setShowSuccess(true);
    } catch (error) {
        console.error('Failed to add funds', error);
        alert('Failed to add funds. Please try again.');
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
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Funds Added</h2>
          <p className="text-gray-500 mb-6 font-mono text-sm">₦{Number(amount).toLocaleString()} added to your account</p>
          <button onClick={onClose} className="w-full p-3 rounded-xl bg-blue-600 text-white font-semibold">Done</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-sm shadow-xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400"><X /></button>
        <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">Add Funds</h2>
        
        <div className="flex gap-4 mb-6">
            {['Transfer', 'Card'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab as 'Transfer' | 'Card')} className={`flex-1 p-3 rounded-xl border ${activeTab === tab ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
                    {tab}
                </button>
            ))}
        </div>

        {activeTab === 'Transfer' && (
            <div className="space-y-4">
                <input type="number" placeholder="Amount to add (₦)" className="w-full p-3 rounded-xl border dark:bg-gray-800" value={amount} onChange={e => setAmount(e.target.value)} />
                <button onClick={handleAddFunds} disabled={loading} className="w-full p-3 rounded-xl bg-blue-600 text-white font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75">
                    {loading ? (
                      <>
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        Processing...
                      </>
                    ) : 'Add Funds'}
                </button>
                <div className="border-t pt-4 mt-4 text-sm text-gray-500 bg-gray-50 dark:bg-gray-800 p-3 rounded-xl">
                    <p className="font-semibold mb-2">Account Details:</p>
                    <div className='flex justify-between p-1'><span>Bank:</span> <span className='font-bold'>TENN</span></div>
                    <div className='flex justify-between p-1'>
                        <span>Beneficiary:</span> 
                        <span className='font-bold flex items-center gap-2'>{userProfile.fullName} <Copy size={16} className='text-blue-500 cursor-pointer'/></span>
                    </div>
                    <div className='flex justify-between p-1'>
                        <span>Account Number:</span> 
                        <span className='font-bold flex items-center gap-2'>8082076038 <Copy size={16} className='text-blue-500 cursor-pointer'/></span>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
