"use client";
import React, { useState } from 'react';
import { SlidersHorizontal, Plus, X } from 'lucide-react';

interface TopicSelectorProps {
  selected: string[];
  onToggle: (id: string) => void;
  onTriggerIngestionNotify: () => void;
}

export function TopicSelector({ selected, onToggle, onTriggerIngestionNotify }: TopicSelectorProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onToggle(input.trim());
    setInput('');
    onTriggerIngestionNotify();
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.02)] border border-slate-200 space-y-5 text-left">
      
      {/* High Visibility Header Label Block */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-[#0071e3] stroke-[2.5]" />
          <h3 className="font-black text-slate-900 text-xs tracking-wider uppercase">Active Pipeline Filters</h3>
        </div>
      </div>

      {/* Clean White Form Input */}
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Inject context matrix index..."
          className="w-full px-4 py-3 pr-12 text-xs font-semibold bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0071e3] focus:bg-white transition-all text-slate-900 placeholder-slate-400"
        />
        <button
          type="submit"
          className="absolute right-2 p-1.5 bg-[#0071e3] text-white rounded-lg hover:bg-[#005bb5] transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
        </button>
      </form>

      {/* Clear Contrast Badges */}
      <div className="flex flex-wrap gap-2">
        {selected.map((topic) => (
          <div
            key={topic}
            className="flex items-center gap-1.5 pl-2.5 pr-1 py-1 bg-slate-50 border border-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-all hover:border-[#0071e3]"
          >
            <span className="font-mono text-slate-900">{topic}</span>
            <button
              onClick={() => onToggle(topic)}
              className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-3 h-3 stroke-[2.5]" />
            </button>
          </div>
        ))}
        {selected.length === 0 && (
          <p className="text-xs font-semibold text-slate-400 italic">No tracking criteria targets initialized.</p>
        )}
      </div>
      
    </div>
  );
}