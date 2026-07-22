"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface TaxonomyItem {
  id: string;
  label: string;
  desc: string;
}

export default function Onboarding() {
  const router = useRouter();
  const [taxonomies, setTaxonomies] = useState<TaxonomyItem[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If interests already exist, bypass onboarding and send directly to dashboard
    const saved = localStorage.getItem('aura_interests');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          router.push('/dashboard');
          return;
        }
      } catch (e) {
        console.error("Failed to parse interests cache", e);
      }
    }

    async function loadTaxonomy() {
      try {
        const res = await fetch('http://127.0.0.1:8000/api/taxonomy');
        const data = await res.json();
        setTaxonomies(data);
      } catch (err) {
        console.error("Failed to pull taxonomy schemas:", err);
      } finally {
        setLoading(false);
      }
    }

    loadTaxonomy();
  }, [router]);

  const handleToggle = (id: string) => {
    setSelected(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleComplete = () => {
    if (selected.length < 1) return;
    localStorage.setItem('aura_interests', JSON.stringify(selected));
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F9F5]">
        <div className="w-8 h-8 border-4 border-[#0071e3] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-tr from-[#E6F4F1] via-[#F4F9F5] to-[#FFF9F3] p-8 flex flex-col items-center justify-center">
      <div className="max-w-3xl w-full bg-white rounded-3xl p-8 shadow-[0_15px_40px_rgba(0,0,0,0.02)] border border-slate-100">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight text-center mb-2">Configure Vector Pipeline</h2>
        <p className="text-xs text-slate-400 text-center mb-8 font-semibold uppercase tracking-wider">Select a minimum of 1 domain index to structure your brief</p>
        
        {/* Render dynamically fetched list */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {taxonomies.map((tax) => {
            const isSelected = selected.includes(tax.id);
            return (
              <div
                key={tax.id}
                onClick={() => handleToggle(tax.id)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer select-none text-left ${
                  isSelected 
                    ? 'border-[#0071e3] bg-[#0071e3]/[0.02] shadow-[0_4px_20px_rgba(0,113,227,0.05)]' 
                    : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-bold text-slate-800 text-sm">{tax.label}</h4>
                  <span className="text-[10px] font-mono bg-slate-200/60 px-1.5 py-0.5 rounded text-slate-500 font-bold">{tax.id}</span>
                </div>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">{tax.desc}</p>
              </div>
            );
          })}
        </div>

        <button
          onClick={handleComplete}
          disabled={selected.length < 1}
          className={`w-full py-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md ${
            selected.length >= 1 
              ? 'bg-[#0071e3] text-white hover:bg-[#005bb5] cursor-pointer' 
              : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
          }`}
        >
          Initialize Feed ({selected.length} selected)
        </button>
      </div>
    </div>
  );
}