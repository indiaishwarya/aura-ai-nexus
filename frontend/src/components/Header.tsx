"use client";
import React from 'react';
import { Sparkles, Library } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Header({ activeTab, setActiveTab }: HeaderProps) {
  return (
    <header className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/70 backdrop-blur-xl px-6 py-4 rounded-2xl border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.01)]">
      
      {/* Brand Identity */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0071e3] to-[#369eff] flex items-center justify-center text-white shadow-md shadow-[#0071e3]/20">
          <span className="font-black text-sm tracking-tighter">A</span>
        </div>
        <span className="font-black text-lg tracking-tight text-slate-900">
          Aura.<span className="text-[#0071e3]">AI</span> Nexus
        </span>
      </div>

      {/* Control Navigation Anchors */}
      <nav className="flex items-center p-1 bg-slate-100/80 rounded-xl">
        <button
          onClick={() => setActiveTab('discover')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-black tracking-wide uppercase transition-all cursor-pointer ${
            activeTab === 'discover'
              ? 'bg-white text-[#0071e3] shadow-sm'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" /> Discover
        </button>
        <button
          onClick={() => setActiveTab('library')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-black tracking-wide uppercase transition-all cursor-pointer ${
            activeTab === 'library'
              ? 'bg-white text-[#0071e3] shadow-sm'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Library className="w-3.5 h-3.5" /> Saved Library
        </button>
      </nav>
      
    </header>
  );
}