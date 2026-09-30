import React, { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Start fade-out 300ms before completion
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
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between bg-[#6c1cf5] text-white p-6 transition-opacity duration-300 ${
        fading ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="w-full flex-1" />

      {/* Exact Centered PalmPay Logo & Wordmark matching PalmPay-1-e1711922496790.jpg */}
      <div className="flex flex-col items-center justify-center animate-scale-up">
        {/* White Rounded Hexagon Emblem with PalmPay Interlocking Geometry */}
        <div className="w-28 h-28 sm:w-32 sm:h-32 mb-4 relative drop-shadow-[0_10px_25px_rgba(0,0,0,0.3)]">
          <svg viewBox="0 0 512 512" className="w-full h-full">
            <g transform="translate(256, 256)">
              {/* White Hexagon Base with rounded corners */}
              <path
                d="M 0 -195 
                   C 20 -195, 38 -184, 48 -166 
                   L 152 10 
                   C 162 28, 162 48, 152 66 
                   L 48 242 
                   C 38 260, 20 271, 0 271 
                   C -20 271, -38 260, -48 242 
                   L -152 66 
                   C -162 48, -162 28, -152 10 
                   L -48 -166 
                   C -38 -184, -20 -195, 0 -195 Z"
                fill="#ffffff"
                transform="scale(1.02)"
              />

              {/* Inner PalmPay Interlocking Emblem in Purple */}
              <g fill="#6c1cf5">
                {/* Upper Loop */}
                <path d="M -72 -18 
                         L 44 -134 
                         C 58 -148, 80 -148, 94 -134 
                         L 116 -112 
                         C 130 -98, 130 -76, 116 -62 
                         L 36 18 
                         L -6 60 
                         L -48 18 
                         L 32 -62 
                         L 54 -84 
                         L 2 -136 
                         L -72 -62 Z" />

                {/* Lower Loop */}
                <path d="M 72 94 
                         L -44 210 
                         C -58 224, -80 224, -94 210 
                         L -116 188 
                         C -130 174, -130 152, -112 138 
                         L -36 58 
                         L 6 16 
                         L 48 58 
                         L -32 138 
                         L -54 160 
                         L -2 212 
                         L 72 138 Z" />

                {/* Central Diamond */}
                <polygon points="0,5 30,35 0,65 -30,35" fill="#6c1cf5" />
              </g>
            </g>
          </svg>
        </div>

        {/* 'palmpay' Lowercase Geometric Wordmark matching image */}
        <h1
          className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-sans lowercase"
          style={{ letterSpacing: '-0.03em' }}
        >
          palmpay
        </h1>
      </div>

      {/* Footer Credentials */}
      <div className="w-full flex-1 flex flex-col justify-end items-center pb-6">
        <div className="flex items-center gap-1.5 text-white/80 text-xs font-medium">
          <ShieldCheck size={14} className="text-white" />
          <span>Licensed by CBN · Insured by NDIC</span>
        </div>
      </div>
    </div>
  );
}
