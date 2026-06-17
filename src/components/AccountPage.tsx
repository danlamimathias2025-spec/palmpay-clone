import React, { useState } from 'react';
import { Camera, ChevronRight, Save } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function AccountPage({ userProfile, setUserProfile, onLogout }: { userProfile: any, setUserProfile: any, onLogout: () => void }) {
  const [localProfile, setLocalProfile] = useState({ tier: 'Tier 1', pin: '', password: '', ...userProfile });
  const [saving, setSaving] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalProfile({ ...localProfile, imageUrl: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalProfile({ ...localProfile, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
        const userRef = doc(db, 'users', localProfile.phoneNumber);
        const { imageUrl, ...dataToSave } = localProfile;
        await updateDoc(userRef, {
            ...dataToSave,
            balance: Number(localProfile.balance)
        });
        setUserProfile(localProfile);
        alert('Profile saved successfully!');
    } catch (error) {
        console.error('Save failed', error);
        alert('Failed to save profile. Please try again.');
    } finally {
        setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Account</h2>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold disabled:bg-gray-400 cursor-pointer disabled:opacity-75">
            {saving ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Saving...
              </>
            ) : (
              <>
                <Save size={16} /> Save
              </>
            )}
        </button>
      </div>
      <div className="bg-linear-to-b from-blue-500 to-blue-700 rounded-3xl p-6 text-white text-center mb-6">
        <div className="relative inline-block">
          {localProfile.imageUrl ? (
            <img src={localProfile.imageUrl} alt="Profile" className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-white" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-blue-300 mx-auto flex items-center justify-center text-3xl font-bold text-blue-900 border-4 border-white">
              {localProfile.fullName ? localProfile.fullName[0].toUpperCase() : 'U'}
            </div>
          )}
          <label className="absolute bottom-0 right-0 bg-white p-2 rounded-full cursor-pointer">
            <Camera size={16} className="text-blue-900" />
            <input type="file" className="hidden" onChange={handleImageChange} accept="image/*" />
          </label>
        </div>
        <input name="fullName" value={localProfile.fullName} onChange={handleInputChange} className="text-xl font-bold mt-4 bg-transparent text-center w-full border-b border-white/30" />
        <input name="phoneNumber" value={localProfile.phoneNumber} onChange={handleInputChange} className="text-blue-100 bg-transparent text-center w-full border-b border-transparent hover:border-white/30" readOnly/>
      </div>

      <div className="space-y-4">
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl flex items-center justify-between border border-gray-100 dark:border-gray-800">
           <span>Balance (₦)</span>
           <input type="number" name="balance" value={localProfile.balance} onChange={handleInputChange} className="text-right bg-transparent text-gray-900 dark:text-white font-bold" />
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl flex items-center justify-between border border-gray-100 dark:border-gray-800">
           <span>Account Tier</span>
           <select name="tier" value={localProfile.tier} onChange={handleInputChange} className="text-right bg-transparent text-gray-900 dark:text-white font-bold">
               <option value="Tier 1">Tier 1</option>
               <option value="Tier 2">Tier 2</option>
               <option value="Tier 3">Tier 3</option>
           </select>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Transaction Limits</h4>
            <div className='flex justify-between text-sm text-gray-500'>
                <span>Daily transaction limit:</span>
                <span className='font-bold text-gray-800 dark:text-white'>Unlimited</span>
            </div>
            <div className='flex justify-between text-sm text-gray-500'>
                <span>Account balance limit:</span>
                <span className='font-bold text-gray-800 dark:text-white'>Unlimited</span>
            </div>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl space-y-4 border border-gray-100 dark:border-gray-800">
             <h4 className="font-semibold text-gray-900 dark:text-white">Security Settings</h4>
             <div className='flex justify-between items-center'>
                 <span>Change PIN</span>
                 <input type="password" name="pin" value={localProfile.pin} onChange={handleInputChange} placeholder="New PIN" className="text-right bg-transparent text-gray-900 dark:text-white font-bold w-24" />
             </div>
             <div className='flex justify-between items-center'>
                 <span>Change Password</span>
                 <input type="password" name="password" value={localProfile.password} onChange={handleInputChange} placeholder="New Password" className="text-right bg-transparent text-gray-900 dark:text-white font-bold w-32" />
             </div>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl flex items-center justify-between border border-gray-100 dark:border-gray-800">
           <span>Username</span>
           <input name="userName" value={localProfile.userName} onChange={handleInputChange} className="text-right bg-transparent text-gray-700 dark:text-gray-300" />
        </div>
        <button onClick={onLogout} className="w-full p-4 mt-8 rounded-xl bg-red-50 text-red-600 font-semibold dark:bg-red-900/20 dark:text-red-400">Log Out</button>
      </div>
    </div>
  );
}
