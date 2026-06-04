import { useEffect, useState } from 'react';
import { ScanFace, Loader2 } from 'lucide-react';

export default function FaceAuthOverlay({ onSuccess }: { onSuccess: () => void }) {
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setScanning(false);
      setTimeout(onSuccess, 500);
    }, 2000);
    return () => clearTimeout(timer);
  }, [onSuccess]);

  return (
    <div className="absolute inset-0 z-20 bg-blue-900/90 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center text-white p-6 transition-opacity duration-500">
      <div className="relative">
        <ScanFace size={64} className={scanning ? "animate-pulse text-blue-300" : "text-green-400"} />
        {scanning && (
          <div className="absolute inset-0 border-4 border-blue-400 rounded-full animate-ping"></div>
        )}
      </div>
      <p className="mt-6 text-lg font-medium">
        {scanning ? "Scanning Face..." : "Verified!"}
      </p>
      {scanning && <Loader2 className="mt-2 animate-spin" size={24} />}
    </div>
  );
}
