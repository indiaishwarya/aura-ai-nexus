"use client";
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '../../components/Header';
import { TopicSelector } from '../../components/TopicSelector';
import { PaperCard, CardItem } from '../../components/PaperCard';
import { Play, Pause, ChevronUp, Calendar, Tag, Volume2, RefreshCw, X, Headphones, BookOpen, Clock } from 'lucide-react';

const TAXONOMY_MAP: { [key: string]: string } = {
  "cs.AI": "Artificial Intelligence", "cs.LG": "Machine Learning", "cs.CV": "Computer Vision",
  "cs.CL": "Computation & Language", "cs.NE": "Neural & Evolutionary Computing", "cs.RO": "Robotics",
  "cs.MA": "Multi-Agent Systems", "cs.DB": "Databases", "cs.DC": "Distributed Computing",
  "cs.NI": "Networking & Internet Architecture", "cs.CR": "Cryptography & Security",
  "cs.IR": "Information Retrieval", "cs.DS": "Data Structures & Algorithms",
  "cs.SE": "Software Engineering", "cs.PL": "Programming Languages"
};

interface ModalState {
  isOpen: boolean;
  dateLabel: string;
  topicCode: string;
  papers: CardItem[];
}

export default function Dashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('discover');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [cards, setCards] = useState<CardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [paginationLoading, setPaginationLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Deep-Dive Modal Audio states
  const [modal, setModal] = useState<ModalState>({ isOpen: false, dateLabel: '', topicCode: '', papers: [] });
  const [audioLoading, setAudioLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const observerRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem('aura_interests');
    if (!raw) { router.push('/onboarding'); return; }
    setSelectedTopics(JSON.parse(raw));
  }, [router]);

  useEffect(() => {
    const handleScrollVisibility = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScrollVisibility);
    return () => window.removeEventListener('scroll', handleScrollVisibility);
  }, []);

  const fetchWorkspaceData = useCallback(async (pageNum: number, currentTopics: string[], append: boolean = false) => {
    if (currentTopics.length === 0) { setCards([]); setLoading(false); return; }
    try {
      if (!append) setLoading(true);
      else setPaginationLoading(true);
      const topicParams = encodeURIComponent(currentTopics.join(','));
      const res = await fetch(`http://127.0.0.1:8000/api/discover?topics=${topicParams}&page=${pageNum}&limit=10`);
      const data = await res.json();
      setCards(prev => append ? [...prev, ...(data.cards || [])] : (data.cards || []));
      setHasMore((data.cards || []).length === 10);
    } catch (err) { console.error(err); } finally { setLoading(false); setPaginationLoading(false); }
  }, []);

  useEffect(() => {
    if (selectedTopics.length > 0) { setPage(1); fetchWorkspaceData(1, selectedTopics, false); }
  }, [selectedTopics, fetchWorkspaceData]);

  useEffect(() => {
    if (loading || !hasMore || paginationLoading) return;
    const container = observerRef.current;
    if (!container) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchWorkspaceData(nextPage, selectedTopics, true);
      }
    }, { threshold: 0.1, rootMargin: '150px' });
    observer.observe(container);
    return () => { if (container) observer.unobserve(container); };
  }, [loading, hasMore, paginationLoading, page, selectedTopics, fetchWorkspaceData]);

  // Audio Player Event Listeners Mechanics
  const setupAudioListeners = (audio: HTMLAudioElement) => {
    audio.ontimeupdate = () => setCurrentTime(audio.currentTime);
    audio.ondurationchange = () => setDuration(audio.duration || 0);
    audio.onended = () => setIsPlaying(false);
  };

  const handleOpenDeepDive = async (dateLabel: string, topicCode: string, sectionPapers: CardItem[]) => {
    // Stop any active general audio playing before opening modal
    if (audioRef.current) { audioRef.current.pause(); setIsPlaying(false); }
    
    setCurrentTime(0);
    setDuration(0);
    setModal({ isOpen: true, dateLabel, topicCode, papers: sectionPapers });
    setAudioLoading(true);

    try {
      const encDate = encodeURIComponent(dateLabel);
      const encTopic = encodeURIComponent(topicCode);
      const encPapers = encodeURIComponent(JSON.stringify(sectionPapers));
      const streamUrl = `http://127.0.0.1:8000/api/generate-brief?date=${encDate}&topic_code=${encTopic}&papers_json=${encPapers}`;
      
      const audio = new Audio(streamUrl);
      audioRef.current = audio;
      setupAudioListeners(audio);
      
      audio.oncanplaythrough = () => setAudioLoading(false);
      audio.load();
    } catch(e) { setAudioLoading(false); }
  };

  const toggleModalPlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleScrubChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };
  
  const handleCloseModal = () => {
    if (audioRef.current) { 
      audioRef.current.pause(); 
      audioRef.current = null;
    }
    setIsPlaying(false);
    setModal({ isOpen: false, dateLabel: '', topicCode: '', papers: [] });
  };

  const groupedChronologicalNodes = useMemo(() => {
    const activeViewCards = activeTab === 'library' ? cards.filter(c => c.isSaved) : cards;
    const dateMap: { [date: string]: { [topic: string]: CardItem[] } } = {};
    activeViewCards.forEach((card) => {
      let cleanDate = card.published || "Latest Updates";
      try {
        const parsed = new Date(card.published);
        if (!isNaN(parsed.getTime())) {
          cleanDate = parsed.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        }
      } catch(e){}
      if (!dateMap[cleanDate]) dateMap[cleanDate] = {};
      const primaryTopic = card.primary_category || "General Context";
      if (!dateMap[cleanDate][primaryTopic]) dateMap[cleanDate][primaryTopic] = [];
      dateMap[cleanDate][primaryTopic].push(card);
    });
    return dateMap;
  }, [cards, activeTab]);

  return (
    <div className="relative min-h-screen bg-gradient-to-tr from-[#E6F4F1] via-[#F4F9F5] to-[#FFF9F3] text-slate-900 antialiased">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <Header activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <main className="lg:col-span-8 space-y-8 order-2 lg:order-1">
            <div className="space-y-12">
              {loading && cards.length === 0 ? (
                <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-[#0071e3] border-t-transparent rounded-full animate-spin" /></div>
              ) : Object.keys(groupedChronologicalNodes).length > 0 ? (
                Object.entries(groupedChronologicalNodes).map(([dateLabel, topicsBucket]) => (
                  <div key={dateLabel} className="space-y-8 relative">
                    <div className="sticky top-0 z-30 bg-gradient-to-b from-[#F4F9F5] via-[#F4F9F5] to-transparent py-3">
                      <div className="flex items-center gap-2 bg-white border border-slate-200 shadow-sm px-4 py-2 rounded-full w-fit">
                        <Calendar className="w-3.5 h-3.5 text-[#0071e3]" />
                        <span className="text-xs font-black text-slate-900">{dateLabel}</span>
                      </div>
                    </div>

                    {Object.entries(topicsBucket).map(([topicCode, paperItems]) => {
                      const friendlyTopicName = TAXONOMY_MAP[topicCode] || topicCode;
                      return (
                        <div key={topicCode} className="space-y-4 pl-4 border-l-2 border-slate-200/80">
                          {/* STICKY INTERACTIVE SUBTOPIC BAR */}
                          <div 
                            onClick={() => handleOpenDeepDive(dateLabel, topicCode, paperItems)}
                            className="sticky top-14 z-20 flex items-center justify-between gap-4 bg-white/80 backdrop-blur-md border border-slate-200 p-3 rounded-xl shadow-sm hover:border-[#0071e3] transition-all cursor-pointer group"
                          >
                            <div className="flex items-center gap-2">
                              <Tag className="w-3.5 h-3.5 text-[#0071e3]" />
                              <span className="text-xs font-black text-slate-900 uppercase group-hover:text-[#0071e3] transition-colors">
                                {friendlyTopicName}
                              </span>
                              <span className="text-[11px] text-slate-400 font-bold">({paperItems.length} papers)</span>
                            </div>
                            <span className="text-[11px] text-[#0071e3] font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                              Open Audio & Summaries →
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {paperItems.map(card => <PaperCard key={card.id} card={card} onToggleSave={() => {}} />)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              ) : <div className="p-12 text-center bg-white rounded-2xl border text-slate-400 font-bold">No indices loaded.</div>}
              <div ref={observerRef} className="w-full py-6 flex justify-center">{paginationLoading && <RefreshCw className="w-4 h-4 animate-spin text-[#0071e3]" />}</div>
            </div>
          </main>
          <aside className="lg:col-span-4 lg:sticky lg:top-8 order-1 lg:order-2">
            <TopicSelector selected={selectedTopics} onToggle={(topic) => setSelectedTopics(p => p.includes(topic) ? p.filter(t => t !== topic) : [...p, topic])} onTriggerIngestionNotify={() => {}} />
          </aside>
        </div>
      </div>

      {/* INTELLIGENT DEEP DIVE MODAL PLAYER COMPONENT */}
      {modal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] shadow-2xl border border-slate-100 flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <span className="text-[10px] font-black tracking-wider text-[#0071e3] uppercase block mb-0.5">{modal.dateLabel}</span>
                <h3 className="text-base font-black text-slate-900">{TAXONOMY_MAP[modal.topicCode] || modal.topicCode} Deep Dive</h3>
              </div>
              <button onClick={handleCloseModal} className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-all rounded-full cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content Frame */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-left">
              
              {/* ADVANCED TRACK SEEK TIMELINE AUDIO PLAYER */}
              <div className="p-4 bg-gradient-to-tr from-slate-900 to-slate-800 rounded-xl text-white space-y-4 shadow-inner">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-white/10 rounded-lg text-[#0071e3]">
                      <Headphones className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">AI Audio Insights Engine</h4>
                      <p className="text-[11px] text-slate-400">Gemini Concept Synthesis + Neural Audio</p>
                    </div>
                  </div>
                  
                  {/* Central Action Trigger */}
                  <button 
                    onClick={toggleModalPlayback}
                    disabled={audioLoading}
                    className="w-10 h-10 flex items-center justify-center bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-full transition-transform transform active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {audioLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current pl-0.5" />}
                  </button>
                </div>

                {/* Scrub Timeline Control interface */}
                <div className="space-y-1">
                  <input 
                    type="range"
                    min={0}
                    max={duration || 100}
                    value={currentTime}
                    onChange={handleScrubChange}
                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>
              </div>

              {/* STRUCTURED PAPERS METADATA SECTION */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" /> Synthesized Publications Index
                </h4>
                <div className="space-y-3">
                  {modal.papers.map((paper, idx) => (
                    <div key={paper.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400">Paper #{idx+1}</span>
                      <h5 className="text-xs font-black text-slate-900 leading-tight">{paper.title}</h5>
                      <p className="text-xs text-slate-500 font-medium line-clamp-3 leading-relaxed">{paper.summary}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-6 right-6 p-3 bg-white border border-slate-200 rounded-full shadow-lg transition-all z-50 cursor-pointer transform ${showScrollTop ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}
      >
        <ChevronUp className="w-5 h-5 stroke-[2.5]" />
      </button>
    </div>
  );
}