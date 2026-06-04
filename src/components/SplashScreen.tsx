import { useEffect } from 'react';

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onFinish, 3000);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2962FF]">
      <h1 className="text-white font-bold text-6xl tracking-widest" style={{ letterSpacing: '0.2em' }}>
        TENN
      </h1>
    </div>
  );
}
