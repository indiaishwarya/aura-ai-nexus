"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Sparkles, RefreshCw, ChevronRight } from 'lucide-react';

export default function AuthenticationPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
    
    try {
      const res = await fetch(`http://127.0.0.1:8000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.detail || "Authentication sequence rejected.");
      }
      
      if (isLogin) {
        // Check if user interests already exist locally or in backend response
        let userInterests = data.interests || [];

        // If backend didn't attach interests, check local storage cache
        if (!userInterests || userInterests.length === 0) {
          const localCache = localStorage.getItem('aura_interests');
          if (localCache) {
            try {
              const parsed = JSON.parse(localCache);
              if (Array.isArray(parsed) && parsed.length > 0) {
                userInterests = parsed;
              }
            } catch(e) {}
          }
        }

        // REDIRECT LOGIC: Send existing users to dashboard, new users to onboarding
        if (userInterests && userInterests.length > 0) {
          localStorage.setItem('aura_interests', JSON.stringify(userInterests));
          router.push('/dashboard');
        } else {
          router.push('/onboarding');
        }
      } else {
        // Successfully signed up! Switch view to login instantly
        setIsLogin(true);
        setPassword('');
        setErrorMsg('Account created successfully. Please enter password to log in.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network handshaking issue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-[#E6F4F1] via-[#F4F9F5] to-[#FFF9F3] flex items-center justify-center p-4 text-slate-900 antialiased">
      <div className="w-full max-w-md bg-white/70 backdrop-blur-xl border border-slate-200/60 p-8 rounded-2xl shadow-xl space-y-6">
        
        {/* Decorative Brand Header */}
        <div className="text-center space-y-1.5">
          <div className="w-10 h-10 bg-[#0071e3] text-white flex items-center justify-center rounded-xl mx-auto shadow-md">
            <Sparkles className="w-5 h-5 fill-current" />
          </div>
          <h2 className="text-xl font-black tracking-tight text-slate-900">
            {isLogin ? "Welcome to Aura Research" : "Create Developer Profile"}
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            {isLogin ? "Stream vector analytics & neural paper briefs" : "Instantly monitor global computational discoveries"}
          </p>
        </div>

        {errorMsg && (
          <div className={`p-3 rounded-lg text-xs font-bold text-center border ${errorMsg.includes('successfully') ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black tracking-wider uppercase text-slate-400">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@aura.ai"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#0071e3] transition-colors shadow-sm"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black tracking-wider uppercase text-slate-400">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#0071e3] transition-colors shadow-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#0071e3] hover:bg-[#0071e3]/90 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : (
              <>
                <span>{isLogin ? "Authenticate Session" : "Provision Profile"}</span>
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </>
            )}
          </button>
        </form>

        <div className="border-t border-slate-100 pt-4 text-center">
          <button
            onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); }}
            className="text-xs text-[#0071e3] font-bold hover:underline bg-transparent border-none cursor-pointer"
          >
            {isLogin ? "New explorer? Sign up instead" : "Already have an account? Log in"}
          </button>
        </div>

      </div>
    </div>
  );
}