import React, { useEffect, useState } from 'react';

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Start subtle fade-out transition 300ms before 3s finish
    const fadeTimer = setTimeout(() => {
      setFading(true);
    }, 2700);

    // Exact 3 seconds total splash duration
    const finishTimer = setTimeout(() => {
      onFinish();
    }, 3000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#151618] text-white p-6 transition-opacity duration-300 ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Exact Branding matching Screenshot_20260930-130718_PalmPay.jpg */}
      <div className="flex flex-col items-center justify-center animate-scale-up select-none">
        {/* Horizontal Lockup: Logo Icon + "PalmPay" */}
        <div className="flex items-center gap-2.5">
          {/* Authentic White PalmPay Glyph */}
          <div className="w-8 h-8 sm:w-9 sm:h-9 shrink-0">
            <svg viewBox="0 0 48 48" className="w-full h-full drop-shadow-sm">
              {/* Outer White Base Hexagon */}
              <path
                fill="#ffffff"
                d="M21.1574,4.2617 c1.759-1.0156, 3.9262-1.0156, 5.6851,0 l12.83,7.4074 c1.759,1.0156, 2.8426,2.8925, 2.8426,4.9236 v14.8147 c0,2.0311 -1.0836,3.908 -2.8426,4.9236 l-12.83,7.4074 c-1.759,1.0156 -3.9262,1.0156 -5.6851,0 l-12.83-7.4074 c-1.759-1.0156 -2.8426-2.8925 -2.8426-4.9236 v-14.8147 c0-2.0311, 1.0836-3.908, 2.8426-4.9236 l12.83-7.4074Z"
              />
              {/* Inner Cutouts in Dark Background Color */}
              <g stroke="#151618" strokeWidth="3.4" fill="none" strokeLinejoin="round" strokeLinecap="round">
                <path d="M5.5645,29.8801 L23.0057,12.4388 c.4851-.4853, 1.2688-.4945, 1.7653-.0208 l7.4316,7.0885" />
                <path d="M42.4482,18.6101 l-17.4414,17.4413 c-.4851.4851, -1.2688.4944, -1.7653.0208 l-7.4316-7.0886" />
              </g>
              {/* Central Diamond */}
              <rect
                fill="#151618"
                x="21.4733"
                y="21.4733"
                width="5.0535"
                height="5.0535"
                rx=".6317"
                ry=".6317"
                transform="translate(-9.9411 24) rotate(-45)"
              />
            </svg>
          </div>

          {/* "PalmPay" Wordmark */}
          <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
            PalmPay
          </span>
        </div>

        {/* Tagline exactly as in screenshot: "The Smarter Way to Bank" */}
        <p className="text-xs sm:text-sm text-slate-300 font-normal tracking-wide mt-2 font-sans">
          The Smarter Way to Bank
        </p>
      </div>
    </div>
  );
}
