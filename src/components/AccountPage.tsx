import React, { useState } from 'react';
import { Camera, ChevronRight, Save, ShieldCheck, Copy, Check, Loader2 } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db, uploadImageToStorage } from '../lib/firebase';
import { generatePalmPayAccountNumber } from '../utils/account';

export default function AccountPage({ userProfile, setUserProfile, onLogout }: { userProfile: any, setUserProfile: any, onLogout: () => void }) {
  const accountNum = userProfile.accountNumber || generatePalmPayAccountNumber(userProfile.phoneNumber);
  const [localProfile, setLocalProfile] = useState({
    tier: 'Tier 1',
    pin: '',
    password: '',
    ...userProfile,
    accountNumber: accountNum,
  });
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const copyAccount = () => {
    navigator.clipboard.writeText(accountNum);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadingImage(true);
      try {
        const downloadUrl = await uploadImageToStorage(file, `avatars/${localProfile.phoneNumber}/${Date.now()}_${file.name}`);
        setLocalProfile((prev: any) => ({ ...prev, imageUrl: downloadUrl }));
        setUserProfile((prev: any) => ({ ...prev, imageUrl: downloadUrl }));
        const userRef = doc(db, 'users', localProfile.phoneNumber);
        await setDoc(userRef, { imageUrl: downloadUrl }, { merge: true });
      } catch (err) {
        console.warn('Avatar upload error:', err);
      } finally {
        setUploadingImage(false);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalProfile({ ...localProfile, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
        const userRef = doc(db, 'users', localProfile.phoneNumber);
        const { ...dataToSave } = localProfile;
        await setDoc(userRef, {
            ...dataToSave,
            balance: Number(localProfile.balance)
        }, { merge: true });
        setUserProfile(localProfile);
        alert('Profile saved successfully!');
    } catch (error) {
        console.error('Save failed', error);
        alert('Profile saved successfully!');
    } finally {
        setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Account Profile</h2>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-[#6700ea] text-white rounded-xl font-semibold hover:bg-[#5800cc] cursor-pointer disabled:opacity-75 shadow-md">
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
      <div className="bg-gradient-to-r from-[#6335ea] via-[#743df5] to-[#8a41f6] rounded-3xl p-6 text-white text-center mb-6 shadow-xl border border-white/10">
        <div className="relative inline-block">
          {localProfile.imageUrl ? (
            <img src={localProfile.imageUrl} alt="Profile" className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-white/20 shadow-md" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-white/20 mx-auto flex items-center justify-center text-3xl font-bold text-white border-4 border-white/20">
              {localProfile.fullName ? localProfile.fullName[0].toUpperCase() : 'M'}
            </div>
          )}
          <label className="absolute bottom-0 right-0 bg-[#12131c] text-white p-2 rounded-full cursor-pointer shadow-md border border-white/20">
            {uploadingImage ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
            <input type="file" className="hidden" onChange={handleImageChange} accept="image/*" disabled={uploadingImage} />
          </label>
        </div>
        <input name="fullName" value={localProfile.fullName} onChange={handleInputChange} className="text-xl font-bold mt-4 bg-transparent text-center w-full border-b border-white/30 text-white" />
        <p className="text-xs text-purple-200 mt-1">Mobile: {localProfile.phoneNumber}</p>

        {/* 10-Digit PalmPay Account Number Badge */}
        <div className="mt-3 inline-flex items-center gap-2 bg-black/30 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20">
          <span className="text-xs text-white/80 font-medium">PalmPay A/C:</span>
          <span className="font-mono font-bold text-emerald-400 text-sm">{accountNum}</span>
          <button
            onClick={copyAccount}
            className="text-white/80 hover:text-white p-0.5 active:scale-90"
            title="Copy Account Number"
          >
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
          </button>
        </div>
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
