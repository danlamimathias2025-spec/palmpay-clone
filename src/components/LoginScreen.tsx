import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';

export default function LoginScreen({ onLogin, onSwitchToRegister }: { onLogin: (phone: string, password: string) => void, onSwitchToRegister: () => void }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(phoneNumber, password);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 flex flex-col justify-center">
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Welcome Back</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8">Login to your TENN MFB account.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            type="tel" placeholder="Phone Number" 
            className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)} required />
          <input 
            type="password" placeholder="6-digit Password" maxLength={6}
            className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            value={password}
            onChange={(e) => setPassword(e.target.value)} required />
          
          <button type="submit" className="w-full p-3 rounded-xl bg-blue-600 text-white font-semibold mt-4">Login</button>
        </form>
        <p className="text-center mt-4 text-sm text-gray-500">
          Don't have an account? <button onClick={onSwitchToRegister} className="text-blue-600 font-semibold">Register</button>
        </p>
      </div>
    </div>
  );
}
