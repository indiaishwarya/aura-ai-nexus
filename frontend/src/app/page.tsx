"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { AuraLogo } from '../components/Logo';
import { Chrome, Github, Sparkles } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();

  const handleNewUserAuth = (provider: string) => {
    console.log(`Registering new profile via ${provider}...`);
    router.push('/onboarding');
  };

  const handleReturningUserAuth = () => {
    console.log("Authenticating returning workspace configuration...");
    router.push('/dashboard');
  };
  
  const handleGoogleLogin = async () => {
    // 1. Simulate authentication success by setting a temporary session key
    localStorage.setItem('aura_user_session', 'authenticated_true');

    // 2. Read state profile to decide where to route them
    const savedInterests = localStorage.getItem('aura_interests');

    if (savedInterests && JSON.parse(savedInterests).length >= 3) {
      // Returning User: Deep-link directly to workspace data matrix
      router.push('/dashboard');
    } else {
      // First Time User: Forward to selection engine to build baseline matrix
      router.push('/onboarding');
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-between p-6 bg-gradient-to-tr from-[#E6F4F1] via-[#F4F9F5] to-[#FFF9F3] text-slate-900 overflow-hidden">
      {/* Background Stylized Blob Geometry */}
      <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-[#D1F2E5]/50 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[45vw] h-[45vw] bg-[#FFEED9]/60 rounded-full blur-[100px] pointer-events-none" />

      {/* Header Navigation */}
      <header className="w-full max-w-6xl flex items-center justify-between py-4 relative z-10">
        <div className="flex items-center gap-2.5">
          <AuraLogo className="w-9 h-9" />
          <span className="font-extrabold text-xl tracking-tight text-[#111827]">Aura.AI</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={handleReturningUserAuth} className="text-sm font-semibold text-slate-600 hover:text-slate-900 cursor-pointer">
            Sign In
          </button>
          <button onClick={() => handleNewUserAuth('Navbar')} className="px-5 py-2.5 rounded-full bg-[#111827] text-white text-xs font-bold shadow-md hover:bg-slate-800 transition-all cursor-pointer">
            Get Started
          </button>
        </div>
      </header>

      {/* Main Hero Wrapper */}
      <main className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-12 items-center my-auto relative z-10">
        {/* Left Side: Core Value Proposition */}
        <div className="lg:col-span-7 space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#D1F2E5] text-[#0F764E] text-xs font-bold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" /> Unlimited Agentic Briefings
          </div>
          <h1 className="text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-[1.1]">
            Start Listening <br />To Your <span className="text-[#0071e3] bg-gradient-to-r from-[#0071e3] to-[#5e5ce6] bg-clip-text text-transparent">Research</span>.
          </h1>
          <p className="text-base text-slate-600 max-w-xl leading-relaxed">
            Aura crawls across global technical clusters, isolates high-signal updates, and auto-synthesizes clear daily podcast summaries mapped exactly to your profile stack.
          </p>

          {/* Social Authentication Integration Button Cluster */}
          <div className="space-y-3 pt-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Secure Single Sign-On Architecture</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => handleGoogleLogin()}
                className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md text-sm font-bold text-slate-700 transition-all cursor-pointer sm:w-60"
              >
                <Chrome className="w-4 h-4 text-red-500 fill-current" /> Continue with Google
              </button>
              <button 
                onClick={() => handleNewUserAuth('GitHub')}
                className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-[#111827] text-white shadow-md hover:bg-slate-800 text-sm font-bold transition-all cursor-pointer sm:w-60"
              >
                <Github className="w-4 h-4 fill-current" /> Continue with GitHub
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Informational Core Presentation Display Card */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end">
          <div className="w-full max-w-[340px] bg-white rounded-[32px] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-slate-100 flex flex-col justify-between aspect-[4/5] relative">
            <div className="absolute top-5 right-5 w-10 h-10 rounded-full bg-[#FFF9F3] flex items-center justify-center text-[#FF9F1C] font-bold text-sm shadow-sm">
              ✨
            </div>
            
            <div className="space-y-4 my-auto">
              <div className="w-12 h-12 rounded-2xl bg-[#D1F2E5] flex items-center justify-center text-2xl shadow-sm">
                🎙️
              </div>
              <h3 className="text-2xl font-black tracking-tight text-slate-900 leading-tight">
                Unlock Personalized Research Nodes
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Connect your professional parameters to immediately authorize pipeline crawling and build contextual tracking layers tailored to your everyday execution flow.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center gap-3 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              <span>● Low Latency</span>
              <span>● Zero Pre-Rendering</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="w-full text-center py-4 text-xs font-medium text-slate-400 relative z-10">
        &copy; 2026 Aura.AI Technologies Inc. • Enterprise Grade Pulse Aggregations.
      </footer>
    </div>
  );
}