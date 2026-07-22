"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, Headphones, BookOpen, ArrowRight, Brain, Zap, Shield, LogOut } from 'lucide-react';

const TAXONOMIES = [
  { label: "Artificial Intelligence", desc: "Neural networks, prompt optimization, and multi-agent system scaling hooks." },
  { label: "Machine Learning", desc: "Statistical vector alignments and specialized inference pipeline profiling." },
  { label: "Computer Vision", desc: "Generative latent diffusion grids and spatial segmentation analytics." },
  { label: "Computation & Language", desc: "Transformers, tokenizer optimization, and large-scale semantic parsing." }
];

export default function LandingPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem('aura_interests');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setIsLoggedIn(true);
        }
      } catch (e) {
        console.error("Session verification error", e);
      }
    }
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('http://127.0.0.1:8000/api/auth/logout', { 
        method: 'POST', 
        credentials: 'include' 
      });
      localStorage.removeItem('aura_interests');
      setIsLoggedIn(false);
      router.push('/');
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-[#E6F4F1] via-[#F4F9F5] to-[#FFF9F3] text-slate-900 antialiased overflow-hidden">
      
      {/* Premium Minimal Navigation Header */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between border-b border-slate-200/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#0071e3] text-white flex items-center justify-center rounded-xl shadow-sm">
            <Sparkles className="w-4 h-4 fill-current" />
          </div>
          <span className="font-black text-sm tracking-tight uppercase">Aura Research</span>
        </div>
        
        <div className="flex items-center gap-4">
          {!isLoggedIn ? (
            <>
              <Link href="/auth" className="text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors">
                Sign In
              </Link>
              <Link href="/auth" className="px-4 py-2 bg-[#0071e3] hover:bg-[#0071e3]/90 text-white font-bold text-xs rounded-full transition-all shadow-sm">
                Get Started Free
              </Link>
            </>
          ) : (
            <>
              <Link href="/dashboard" className="px-4 py-2 bg-[#0071e3] hover:bg-[#0071e3]/90 text-white font-bold text-xs rounded-full transition-all shadow-sm">
                Go to Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 text-rose-600 hover:bg-rose-50 rounded-full transition-all border-none bg-transparent cursor-pointer flex items-center justify-center"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </header>

      {/* Hero Narrative Block */}
      <main className="max-w-5xl mx-auto px-4 pt-16 pb-24 text-center space-y-8">
        
        {/* Subtle dynamic pill badge */}
        <div className="inline-flex items-center gap-1.5 bg-white border border-slate-200/80 px-3 py-1 rounded-full shadow-sm animate-fade-in">
          <Brain className="w-3.5 h-3.5 text-[#0071e3]" />
          <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Powered by Gemini & Edge-TTS Neural Networks</span>
        </div>

        <div className="space-y-4 max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Turn dense academic research into clear, custom audio briefs.
          </h1>
          <p className="text-sm sm:text-base text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
            Stop drowning in hundreds of open browser tabs. Aura automatically extracts daily computer science preprints from arXiv, compiles structural summaries, and generates natural, conversational podcast briefings.
          </p>
        </div>

        {/* Action Direct Hooks */}
        <div className="flex items-center justify-center gap-4 pt-4">
          <Link 
            href={isLoggedIn ? "/dashboard" : "/auth"} 
            className="px-6 py-3.5 bg-[#0071e3] hover:bg-[#0071e3]/90 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 group transform active:scale-95"
          >
            <span>{isLoggedIn ? "Open Your Workspace" : "Initialize Research Workspace"}</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Core Value Proposition Pillars */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 max-w-4xl mx-auto text-left">
          <div className="bg-white/60 backdrop-blur-md border border-slate-200/60 p-5 rounded-2xl shadow-sm space-y-2">
            <div className="p-2 bg-blue-50 text-[#0071e3] w-fit rounded-lg mb-2">
              <BookOpen className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide">Automated arXiv Aggregation</h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Real-time daily publication cross-matching. Monitor specialized sub-disciplines instantly via scroll-spy chronology.
            </p>
          </div>

          <div className="bg-white/60 backdrop-blur-md border border-slate-200/60 p-5 rounded-2xl shadow-sm space-y-2">
            <div className="p-2 bg-cyan-50 text-cyan-600 w-fit rounded-lg mb-2">
              <Headphones className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide">Deep Dive Audio Briefings</h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Synthesizes massive study groups into fluid verbal deep dives highlighting tangible industry applications and clear use cases.
            </p>
          </div>

          <div className="bg-white/60 backdrop-blur-md border border-slate-200/60 p-5 rounded-2xl shadow-sm space-y-2">
            <div className="p-2 bg-amber-50 text-amber-600 w-fit rounded-lg mb-2">
              <Shield className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide">Cost-Free Infrastructure</h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              No subscription gates. Leverages free-tier Gemini contextual analysis paired with production neural text-to-speech loops.
            </p>
          </div>
        </section>

        {/* Live Taxonomy Highlight Area */}
        <section className="pt-12 border-t border-slate-200/50 max-w-4xl mx-auto text-left space-y-4">
          <div className="space-y-1">
            <h4 className="text-[10px] font-black uppercase text-[#0071e3] tracking-widest">Active Discovery Sectors</h4>
            <h3 className="text-lg font-black text-slate-900">Supported Computational Domains</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {TAXONOMIES.map((tax, i) => (
              <div key={i} className="p-4 bg-slate-50/50 border border-slate-200/60 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500 fill-current" />
                  <span className="text-xs font-black text-slate-900">{tax.label}</span>
                </div>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">{tax.desc}</p>
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* Simple Footer anchor */}
      <footer className="text-center py-8 text-[11px] text-slate-400 font-medium border-t border-slate-200/40">
        © {new Date().getFullYear()} Aura Research. Localized sandbox workspace.
      </footer>
    </div>
  );
}