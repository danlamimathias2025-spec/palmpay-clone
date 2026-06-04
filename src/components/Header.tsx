import { Bell, Headphones, Plus, Moon, Sun } from 'lucide-react';

export default function Header({ darkMode, toggleDarkMode, userProfile, onBellClick }: { darkMode: boolean, toggleDarkMode: () => void, userProfile: any, onBellClick: () => void }) {
  return (
    <header className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
      <div className="flex items-center gap-3">
        <div className="relative">
          {userProfile.imageUrl ? (
            <img src={userProfile.imageUrl} alt="Profile" className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center font-semibold text-gray-700 dark:text-gray-200">
              {userProfile.fullName ? userProfile.fullName[0].toUpperCase() : 'MD'}
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 bg-blue-600 rounded-full p-0.5 border-2 border-white dark:border-gray-900">
            <Plus size={10} className="text-white" />
          </div>
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Hi {userProfile.userName || 'User'}</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">Last Login: 04 Jun 2026</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={toggleDarkMode} className="p-2 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <button className="relative p-2 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
          <Headphones size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full"></span>
        </button>
        <button onClick={onBellClick} className="relative p-2 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full"></span>
        </button>
      </div>
    </header>
  );
}
