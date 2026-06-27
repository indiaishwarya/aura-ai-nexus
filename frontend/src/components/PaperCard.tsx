"use client";
import React from 'react';
import { Bookmark, ArrowUpRight } from 'lucide-react';

export interface CardItem {
  id: string;
  title: string;
  summary: string;
  authors: string[];
  isSaved: boolean;
  published?: string;
  primary_category?: string;
}

interface PaperCardProps {
  card: CardItem;
  onToggleSave: (id: string) => void;
}

export function PaperCard({ card, onToggleSave }: PaperCardProps) {
  return (
    <div className="group relative flex flex-col justify-between p-5 bg-white rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.04)] hover:scale-[1.02] hover:border-[#0071e3] transition-all duration-300 ease-out cursor-pointer text-left">
      
      <div className="space-y-2.5">
        {/* Card Header row */}
        <div className="flex items-start justify-between gap-4">
          <h3 className="font-bold text-slate-900 text-sm md:text-base leading-snug transition-colors group-hover:text-[#0071e3]">
            {card.title}
          </h3>
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleSave(card.id); }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-[#0071e3] hover:bg-slate-50 transition-colors cursor-pointer shrink-0"
          >
            <Bookmark className={`w-4 h-4 ${card.isSaved ? 'fill-[#0071e3] text-[#0071e3]' : ''}`} />
          </button>
        </div>

        {/* Authors Node */}
        <p className="text-xs font-semibold text-slate-500/90 tracking-tight truncate">
          {card.authors && card.authors.length > 0 ? card.authors.join(', ') : 'Anonymous Researchers'}
        </p>

        {/* Core Abstract Text Segment */}
        <p className="text-xs text-slate-600 font-medium leading-relaxed line-clamp-3">
          {card.summary}
        </p>
      </div>

      {/* Footer Anchors */}
      <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-end">
        <a 
          href={`https://arxiv.org/abs/${card.id}`}
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] font-black tracking-wider uppercase text-[#0071e3] hover:text-[#005bb5] transition-colors"
        >
          Abstract <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
        </a>
      </div>

    </div>
  );
}