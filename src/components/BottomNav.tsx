import { Home, Ticket, User } from 'lucide-react';

export default function BottomNav({ activeView, setActiveView }: { activeView: string, setActiveView: (view: 'home' | 'account') => void }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800 flex justify-around">
      <button onClick={() => setActiveView('home')} className={`flex flex-col items-center gap-1 ${activeView === 'home' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
        <Home size={24} />
        <span className="text-xs font-semibold">Home</span>
      </button>
      <button className="flex flex-col items-center gap-1 text-gray-500 dark:text-gray-400">
        <Ticket size={24} />
        <span className="text-xs">Coupons</span>
      </button>
      <button onClick={() => setActiveView('account')} className={`flex flex-col items-center gap-1 ${activeView === 'account' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
        <User size={24} />
        <span className="text-xs">Account</span>
      </button>
    </nav>
  );
}
