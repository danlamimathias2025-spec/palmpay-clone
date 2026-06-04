import { Copy, Eye, Lock } from 'lucide-react';
import { useState } from 'react';
import FaceAuthOverlay from './FaceAuthOverlay';

export default function AccountCard({ balance }: { balance: number }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  const handleStartAuth = () => setShowAuth(true);
  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    setShowAuth(false);
  };

  return (
    <div className="p-4 relative">
      {showAuth && <FaceAuthOverlay onSuccess={handleAuthSuccess} />}
      
      <div className="relative p-6 rounded-3xl bg-linear-to-r from-blue-700 to-purple-800 text-white shadow-xl overflow-hidden">
        <div className="absolute top-4 right-4 text-white opacity-20 font-black text-6xl tracking-widest pointer-events-none">
          TENN
        </div>
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-sm opacity-80 mb-1">Balance (₦)</p>
            <div className="flex items-center gap-2">
                <h2 className="text-3xl font-bold">
                    {isAuthenticated ? balance.toLocaleString('en-NG', { minimumFractionDigits: 2 }) : "••••••••"}
                </h2>
                {!isAuthenticated ? (
                    <Lock size={18} className="opacity-70 cursor-pointer hover:text-blue-200" onClick={handleStartAuth}/>
                ) : (
                    <Eye size={18} className="opacity-70 cursor-pointer hover:text-blue-200"/>
                )}
            </div>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-white/20 rounded-full">Level 2</span>
        </div>
        <div className="flex items-center justify-between">
            <div className='flex items-center gap-2'>
                <p className="text-sm opacity-80">AccountNumber: <span className='font-semibold'>8082076038</span></p>
                <Copy size={14} className='opacity-70 cursor-pointer'/>
                <div className='w-4 h-4 bg-green-500 rounded-full flex items-center justify-center'><span className='text-[10px]'>✓</span></div>
            </div>
          <button className="text-sm font-semibold px-4 py-2 bg-white text-blue-900 rounded-lg hover:bg-gray-100">Upgrade</button>
        </div>
      </div>
    </div>
  );
}
