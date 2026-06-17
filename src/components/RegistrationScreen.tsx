import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';

export default function RegistrationScreen({ onRegister, onSwitchToLogin }: { onRegister: (data: any) => void, onSwitchToLogin: () => void }) {
  const [formData, setFormData] = useState({
    fullName: '',
    userName: '',
    phoneNumber: '',
    password: '',
    pin: '',
    imageUrl: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onRegister(formData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 flex flex-col justify-center">
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Create Account</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8">Join TENN and manage your finances easily.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            type="text" name="fullName" placeholder="Full Name" 
            className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            onChange={handleChange} required />
          <input 
            type="text" name="userName" placeholder="Username" 
            className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            onChange={handleChange} required />
          <input 
            type="tel" name="phoneNumber" placeholder="Phone Number" 
            className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            onChange={handleChange} required />
          <input 
            type="password" name="password" placeholder="6-digit Password" maxLength={6}
            className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            onChange={handleChange} required />
          <input 
            type="password" name="pin" placeholder="4-digit PIN" maxLength={4}
            className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            onChange={handleChange} required />
          
          <button type="submit" disabled={loading} className="w-full p-3 rounded-xl bg-blue-600 text-white font-semibold mt-4 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75">
            {loading ? (
              <>
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Processing...
              </>
            ) : 'Register'}
          </button>
        </form>
        <p className="text-center mt-4 text-sm text-gray-500">
            Already have an account? <button onClick={onSwitchToLogin} className="text-blue-600 font-semibold cursor-pointer">Login</button>
        </p>
      </div>
    </div>
  );
}
