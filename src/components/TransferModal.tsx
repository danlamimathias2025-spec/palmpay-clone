import React, { useState } from 'react';
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
  const [formData, setFormData] = useState({ amount: '', accountNumber: '', accountName: '', bankCode: '', pin: '' });
  const [loading, setLoading] = useState(false);
  const [banks, setBanks] = useState<{name: string, code: string}[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [accountError, setAccountError] = useState('');

  React.useEffect(() => {
    fetch(window.location.protocol + '//' + window.location.host + '/api/banks')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
            setBanks(data);
        } else {
            console.error("Banks data is not an array:", data);
        }
      })
      .catch(err => console.error("Error fetching banks:", err))
      .finally(() => setLoadingBanks(false));
  }, []);

  const resolveAccount = async (accountNumber: string, bankCode: string) => {
    if (accountNumber.length !== 10 || !bankCode) return;
    setVerifying(true);
    setAccountError('');
    try {
        const res = await fetch(window.location.protocol + '//' + window.location.host + '/api/resolve-account', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accountNumber, bankCode })
        });
        if (res.ok) {
            const data = await res.json();
            setFormData(prev => ({ ...prev, accountName: data.account_name }));
        } else {
            setAccountError('Account resolution failed');
            setFormData(prev => ({ ...prev, accountName: '' }));
        }
    } catch {
        setAccountError('Server error');
    } finally {
        setVerifying(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    const newFormData = { ...formData, [field]: value };
    if ((field === 'accountNumber' || field === 'bankCode')) {
        if (newFormData.accountNumber.length === 10 && newFormData.bankCode) {
            resolveAccount(newFormData.accountNumber, newFormData.bankCode);
        }
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const amount = Number(formData.amount);
    if (amount > balance) {
        alert('Insufficient funds');
        setLoading(false);
        return;
    }
    if (formData.pin !== userProfile.pin) {
        alert('Incorrect PIN');
        setLoading(false);
        return;
    }

    try {
        const userId = userProfile.phoneNumber;
        const userRef = doc(db, 'users', userId);
        const transactionsRef = collection(userRef, 'transactions');
        
        await addDoc(transactionsRef, {
            amount,
            type: 'transfer',
            accountNumber: formData.accountNumber,
            accountName: formData.accountName,
            bankCode: formData.bankCode,
            senderName: userProfile.fullName,
            senderAccountNumber: userProfile.phoneNumber,
            timestamp: serverTimestamp()
        });
        
        await updateDoc(userRef, {
            balance: increment(-amount)
        });

        setBalance(balance - amount);
        setShowSuccess(true);
        
        try {
            await fetch(window.location.protocol + '//' + window.location.host + '/api/send-sms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phoneNumber: formData.accountNumber, amount: amount })
            });
        } catch (e) {
            console.error('SMS notification failed', e);
        }
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
          <input type="number" placeholder="Amount (₦)" className="w-full p-3 rounded-xl border dark:bg-gray-800" onChange={e => handleInputChange('amount', e.target.value)} required />
          <select disabled={loadingBanks} className="w-full p-3 rounded-xl border dark:bg-gray-800" onChange={e => handleInputChange('bankCode', e.target.value)} required>
            {loadingBanks ? (
              <option value="">Loading banks...</option>
            ) : (
              <>
                <option value="">Select Bank</option>
                {banks.map((bank, index) => <option key={`${bank.code}-${index}`} value={bank.code}>{bank.name}</option>)}
              </>
            )}
          </select>
          <input type="text" placeholder="Account Number" maxLength={10} className="w-full p-3 rounded-xl border dark:bg-gray-800" onChange={e => handleInputChange('accountNumber', e.target.value)} required />
          
          {verifying && <p className="text-sm text-blue-600">Fetching account name...</p>}
          {accountError && <p className="text-sm text-red-500">{accountError}</p>}
          {formData.accountName && <p className="text-sm text-green-600 font-semibold">{formData.accountName}</p>}
          
          <input type="password" placeholder="4-digit PIN" maxLength={4} className="w-full p-3 rounded-xl border dark:bg-gray-800" onChange={e => handleInputChange('pin', e.target.value)} required />
          <button type="submit" disabled={loading || verifying || !!accountError || !formData.accountName} className="w-full p-3 rounded-xl bg-blue-600 text-white font-semibold mt-4 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:bg-gray-400">
            {loading ? (
              <>
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Processing...
              </>
            ) : 'Transfer'}
          </button>
        </form>
        ) : (
            <p className="text-red-500 font-semibold text-center">Loading user profile... please wait.</p>
        )}
      </div>
    </div>
  );
}