"use client";
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '../../components/Header';
import { TopicSelector } from '../../components/TopicSelector';
import { PodcastSection } from '../../components/PodcastSection';
import { PaperCard, CardItem } from '../../components/PaperCard';
import { AudioLines, RefreshCw, Layers, Calendar, Tag } from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('discover');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [activeFilterId, setActiveFilterId] = useState<string | null>(null);
  const [podcasts, setPodcasts] = useState<any[]>([]);
  
  // Pagination Matrix States
  const [cards, setCards] = useState<CardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [paginationLoading, setPaginationLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const observerRef = useRef<HTMLDivElement | null>(null);

  // Initialize Topics
  useEffect(() => {
    const raw = localStorage.getItem('aura_interests');
    if (!raw) { router.push('/onboarding'); return; }
    setSelectedTopics(JSON.parse(raw));
  }, [router]);

  // Master Data Harvester
  const fetchWorkspaceData = useCallback(async (pageNum: number, currentTopics: string[], append: boolean = false) => {
    if (currentTopics.length === 0) {
      setCards([]);
      setLoading(false);
      return;
    }
    
    try {
      if (!append) setLoading(true);
      else setPaginationLoading(true);

      const topicParams = encodeURIComponent(currentTopics.join(','));
      const res = await fetch(`http://127.0.0.1:8000/api/discover?topics=${topicParams}&page=${pageNum}&limit=10`);
      const data = await res.json();
      
      const newCards = data.cards || [];
      setPodcasts(data.podcasts || []);
      
      if (append) {
        setCards(prev => [...prev, ...newCards]);
      } else {
        setCards(newCards);
      }
      
      setHasMore(newCards.length === 10);
    } catch (err) {
      console.error("Data pipeline processing failure:", err);
    } finally {
      setLoading(false);
      setPaginationLoading(false);
    }
  }, []);

  // Sync Fetch triggers with user topic arrays
  useEffect(() => {
    if (selectedTopics.length > 0) {
      setPage(1);
      fetchWorkspaceData(1, selectedTopics, false);
    }
  }, [selectedTopics, fetchWorkspaceData]);

  // Intersection Observer implementation for Infinite Scrolling
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

  const handleToggleTopic = (topic: string) => {
    setSelectedTopics(prev => {
      const updated = prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic];
      localStorage.setItem('aura_interests', JSON.stringify(updated));
      return updated;
    });
  };

  // Chronological Grouping Matrix Engine
  const groupedChronologicalNodes = useMemo(() => {
    const activeViewCards = activeTab === 'library' ? cards.filter(c => c.isSaved) : cards;
    const dateMap: { [date: string]: { [topic: string]: CardItem[] } } = {};

    activeViewCards.forEach((card) => {
      const rawDate = card.published || "Latest Continuous Updates";
      let cleanDate = rawDate;
      
      try {
        const parsed = new Date(rawDate);
        if (!isNaN(parsed.getTime())) {
          cleanDate = parsed.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        }
      } catch(e){}

      if (!dateMap[cleanDate]) dateMap[cleanDate] = {};
      const primaryTopic = card.primary_category || "Cross Domain Core";
      
      if (!dateMap[cleanDate][primaryTopic]) dateMap[cleanDate][primaryTopic] = [];
      dateMap[cleanDate][primaryTopic].push(card);
    });

    return dateMap;
  }, [cards, activeTab]);

  return (
    <div className="relative min-h-screen bg-gradient-to-tr from-[#E6F4F1] via-[#F4F9F5] to-[#FFF9F3] text-slate-900 antialiased selection:bg-[#0071e3]/10">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <Header activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT RECONSTRUCTION CONTAINER FEED */}
          <main className="lg:col-span-8 space-y-10 order-2 lg:order-1">
            
            <div className="space-y-4">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#0071e3]" /> AI Audio Briefings
              </h2>
              <PodcastSection data={podcasts} activeSegmentId={activeFilterId} onSelectSegment={setActiveFilterId} />
            </div>

            <div className="space-y-6">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <AudioLines className="w-4 h-4 text-[#FF9F1C]" /> Chronological Research Matrix
              </h2>
              
              {loading && cards.length === 0 ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-8 h-8 border-4 border-[#0071e3] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : Object.keys(groupedChronologicalNodes).length > 0 ? (
                Object.entries(groupedChronologicalNodes).map(([dateLabel, topicsBucket]) => (
                  <div key={dateLabel} className="space-y-6 border-l-2 border-slate-200 pl-6 ml-2 relative">
                    
                    {/* Floating Section Date Bubble */}
                    <div className="flex items-center gap-2 -ml-[35px] bg-white border border-slate-200 shadow-sm px-4 py-2 rounded-full w-fit mb-4">
                      <Calendar className="w-3.5 h-3.5 text-[#0071e3]" />
                      <span className="text-xs font-black tracking-tight text-slate-900">{dateLabel}</span>
                    </div>

                    {/* Topic Group Render Blocks */}
                    {Object.entries(topicsBucket).map(([topicLabel, paperItems]) => (
                      <div key={topicLabel} className="space-y-3 pt-1">
                        <div className="flex items-center gap-2 text-slate-600 mb-2">
                          <Tag className="w-3 h-3 text-[#0071e3]" />
                          <span className="text-[10px] font-mono font-black uppercase bg-white border border-slate-200 px-2 py-0.5 rounded text-[#0071e3]">
                            {topicLabel}
                          </span>
                          <span className="text-xs text-slate-400 font-bold">({paperItems.length} publications cached)</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {paperItems.map(card => (
                            <PaperCard key={card.id} card={card} onToggleSave={() => {}} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              ) : (
                <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 font-bold text-sm">
                  No tracking vectors matching parameters loaded.
                </div>
              )}

              {/* Infinite Scroll Page Sentinel Element */}
              <div ref={observerRef} className="w-full py-6 flex items-center justify-center">
                {paginationLoading && (
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                    <RefreshCw className="w-4 h-4 animate-spin text-[#0071e3]" /> Retrieving adjacent chronological indices...
                  </div>
                )}
              </div>

            </div>
          </main>

          {/* RIGHT SIDEBAR WITH CLEANED BRIGHT CONTRAST THEME */}
          <aside className="lg:col-span-4 lg:sticky lg:top-6 order-1 lg:order-2">
            <TopicSelector selected={selectedTopics} onToggle={handleToggleTopic} onTriggerIngestionNotify={() => {}} />
          </aside>

        </div>
      </div>
    </div>
  );
}