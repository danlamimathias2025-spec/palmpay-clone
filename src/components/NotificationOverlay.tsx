
import { X, Bell } from 'lucide-react';

export default function NotificationOverlay({ onClose, notifications }: { onClose: () => void, notifications: any[] }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-sm shadow-xl relative top-16">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400"><X /></button>
        <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
            <Bell size={24} /> Notifications
        </h2>
        <div className="space-y-4 max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
                <p className="text-center text-gray-500 py-10">No new notifications.</p>
            ) : (
                notifications.map((n, i) => (
                    <div key={i} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm">
                        <p className="font-semibold text-gray-900 dark:text-white">{n.title}</p>
                        <p className="text-gray-500 dark:text-gray-400">{n.message}</p>
                    </div>
                ))
            )}
        </div>
      </div>
    </div>
  );
}
