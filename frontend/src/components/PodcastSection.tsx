"use client";
import React, { useState, useRef } from 'react';
import { Play, Pause, Calendar, Disc } from 'lucide-react';

export const PodcastSection = ({ data, onSelectSegment, activeSegmentId }: any) => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlayPause = (track: any) => {
    if (playingId === track.id) {
      if (audioRef.current?.paused) audioRef.current.play();
      else audioRef.current?.pause();
      return;
    }
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(track.audio_url);
    audioRef.current = audio;
    setPlayingId(track.id);
    audio.addEventListener('ended', () => setPlayingId(null));
    audio.play().catch(e => console.log(e));
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold tracking-tight">AI Audio Briefings</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {data.map((p: any) => {
          const isPlaying = playingId === p.id && audioRef.current && !audioRef.current.paused;
          return (
            <div key={p.id} className="p-6 rounded-[24px] border glass-premium-dark flex flex-col justify-between group relative overflow-hidden">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="text-[10px] text-slate-500 flex items-center gap-1"><Calendar className="w-3 h-3" /> {p.date}</div>
                  <button onClick={() => handlePlayPause(p)} className="w-10 h-10 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-lg cursor-pointer">
                    {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current translate-x-0.5" />}
                  </button>
                </div>
                <h3 className="font-bold text-base mb-1 group-hover:text-blue-400 transition-colors">{p.title}</h3>
                <p className="text-xs text-slate-400 line-clamp-2">{p.summary}</p>
              </div>
              {isPlaying && <div className="absolute top-4 left-6 flex items-center gap-1 text-[9px] text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded"><Disc className="w-3 h-3 animate-spin" /> Streaming</div>}
              <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-xs font-semibold text-blue-400">
                <span className="text-slate-500">Nodes: {p.linkedCardCount}</span>
                <button onClick={() => onSelectSegment(p.id)} className="hover:underline cursor-pointer">{activeSegmentId === p.id ? 'Collapse' : 'Inspect Breakdown →'}</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};