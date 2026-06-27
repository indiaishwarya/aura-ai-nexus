import React from 'react';

export const AuraLogo = ({ className = "w-10 h-10" }: { className?: string }) => {
  return (
    <div className={`relative ${className} flex items-center justify-center`}>
      <div className="absolute inset-0 bg-blue-500/40 rounded-xl blur-[4px] animate-pulse" />
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10 w-full h-full">
        <rect x="15" y="15" width="70" height="70" rx="22" fill="url(#lens)" stroke="rgba(255,255,255,0.3)" strokeWidth="2"/>
        <circle cx="50" cy="50" r="14" fill="#fff"/>
        <defs>
          <linearGradient id="lens" x1="0" y1="0" x2="100" y2="100"><stop stopColor="#0071e3"/><stop offset="1" stopColor="#5e5ce6"/></linearGradient>
        </defs>
      </svg>
    </div>
  );
};