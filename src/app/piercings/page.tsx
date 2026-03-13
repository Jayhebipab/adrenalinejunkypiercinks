"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, CameraOff, Flame, Filter, 
  ChevronRight, Download, ChevronDown, Zap
} from 'lucide-react';
import { Navbar } from '../components/navigation/navbar';
import { Footer } from '../components/navigation/footer';
import { cn } from "@/lib/utils";
import FloatingChatWidget from '../components/chatbot';
import { Maximize2 } from 'lucide-react';

interface Piercing {
  _id: string;
  image: string;
  placement: string;
  category: string;
  artistName?: string;
  artistImage?: string;
}

export default function PiercingGalleryPage() {
  const [piercings, setPiercings] = useState<Piercing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImg, setSelectedImg] = useState<Piercing | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    fetch("/api/gallery")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setPiercings(data.filter(item => item.category === "Piercing"));
        }
      })
      .catch(err => console.error("Fetch error:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `AdrenalineJunky-Piercing-${filename}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      window.open(imageUrl, '_blank');
    }
  };

  const filterOptions = ["All", ...Array.from(new Set(piercings.map(p => p.placement).filter(Boolean)))];
  const filteredPiercings = activeFilter === "All" ? piercings : piercings.filter(p => p.placement === activeFilter);
  const groupedPiercings = filteredPiercings.reduce((acc: { [key: string]: Piercing[] }, item) => {
    const key = item.placement || "Others";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="space-y-3 text-center">
          <div className="flex gap-1 justify-center">
            {[0,1,2,3].map(i => (
              <motion.div key={i} animate={{ scaleY: [1, 2, 1] }} transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
                className="w-1 h-6 bg-orange-500 rounded-full" />
            ))}
          </div>
          <p className="text-orange-500 font-black uppercase tracking-[0.4em] text-[10px]">Loading Archive...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200">
      <FloatingChatWidget />
      <Navbar />

      {/* HERO */}
      <section className="relative h-[35vh] md:h-[40vh] w-full flex items-center justify-center overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed grayscale opacity-30"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1590201845110-386f5c888e93?q=80&w=2000')` }} />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
        <div className="relative z-10 text-center space-y-3 px-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-orange-500/20 bg-orange-500/5">
            <Zap className="w-3 h-3 text-orange-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500">Piercing Archive</span>
          </motion.div>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic leading-none">
            THE ART OF<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-yellow-400">BODY PIERCING</span>
          </h1>
        </div>
      </section>

      {/* MOBILE FILTER BAR */}
      <div className="lg:hidden sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-md border-b border-white/5 px-4 py-3">
        <button onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-zinc-900 rounded-2xl border border-white/5">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-orange-500" />
            <span className="text-[11px] font-black uppercase tracking-widest">{activeFilter}</span>
          </div>
          <ChevronDown className={cn("w-4 h-4 text-zinc-500 transition-transform", isFilterOpen && "rotate-180")} />
        </button>
        <AnimatePresence>
          {isFilterOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-2">
              <div className="flex flex-wrap gap-2 pb-2">
                {filterOptions.map(option => (
                  <button key={option} onClick={() => { setActiveFilter(option); setIsFilterOpen(false); }}
                    className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                      activeFilter === option ? "bg-orange-600 text-white" : "bg-zinc-900 text-zinc-400 border border-white/5")}>
                    {option}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* MAIN */}
      <main className="container mx-auto max-w-7xl px-4 md:px-6 py-8 md:py-16">
        <div className="flex flex-col lg:flex-row gap-10">

          {/* DESKTOP SIDEBAR */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-28 space-y-4">
              <div className="flex items-center gap-2 px-2">
                <Filter className="w-3 h-3 text-orange-600" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Filter Placement</h3>
              </div>
              <nav className="flex flex-col gap-1">
                {filterOptions.map(option => (
                  <button key={option} onClick={() => setActiveFilter(option)}
                    className={cn("flex items-center justify-between px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all text-left",
                      activeFilter === option ? "bg-orange-600 text-white shadow-lg shadow-orange-900/20" : "bg-zinc-900/50 text-zinc-500 hover:bg-zinc-900")}>
                    {option}
                    <ChevronRight className={cn("w-4 h-4", activeFilter === option ? "opacity-100" : "opacity-0")} />
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* GALLERY */}
          <div className="flex-1 space-y-16 md:space-y-24">
            {Object.keys(groupedPiercings).length === 0 ? (
              <div className="flex flex-col items-center py-20 border border-zinc-900 rounded-[3rem]">
                <CameraOff className="w-12 h-12 text-zinc-800 mb-4" />
                <p className="text-zinc-600 text-xs font-black uppercase tracking-widest">No piercing works found</p>
              </div>
            ) : (
              Object.entries(groupedPiercings).map(([placement, items]) => (
                <section key={placement} className="space-y-6">
                  <div className="flex items-center gap-4">
                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-widest text-white italic">{placement}</h2>
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-orange-600/30 to-transparent" />
                    <span className="text-[10px] font-black text-zinc-600 uppercase">{items.length} works</span>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                    {items.map((item, idx) => (
                      <motion.div key={item._id} layout
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                        className="relative group flex flex-col overflow-hidden rounded-[1.5rem] md:rounded-[2.5rem] bg-zinc-900 border border-white/5 shadow-2xl"
                      >
                        {/* IMAGE */}
                        <div className="relative aspect-[3/4] overflow-hidden cursor-pointer" onClick={() => setSelectedImg(item)}>
                          <img src={item.image} alt={item.placement}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                          {/* Desktop hover */}
                          <div className="hidden lg:flex absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-400 items-end justify-center pb-6">
                            <div className="flex items-center gap-2 text-white/60">
                              <Maximize2 size={14} />
                              <span className="text-[9px] font-black uppercase tracking-widest">View Full</span>
                            </div>
                          </div>
                          {/* Mobile expand */}
                          <div className="lg:hidden absolute top-3 right-3">
                            <div className="p-2 bg-black/50 backdrop-blur-sm rounded-xl border border-white/10">
                              <Maximize2 size={12} className="text-white/60" />
                            </div>
                          </div>
                          {/* Placement label */}
                          <div className="absolute top-3 left-3 lg:hidden">
                            <span className="text-[8px] font-black text-white/40 uppercase tracking-widest bg-black/40 backdrop-blur-sm px-2 py-1 rounded-lg">
                              {item.placement}
                            </span>
                          </div>
                        </div>

                        {/* ARTIST INFO + DOWNLOAD — Always visible */}
                        <div className="p-3 md:p-4 flex items-center justify-between gap-2 border-t border-white/5 bg-zinc-900">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl overflow-hidden border border-orange-500/40 flex-shrink-0">
                              <img src={item.artistImage || "/default-artist.jpg"} alt={item.artistName}
                                className="w-full h-full object-cover" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[8px] font-black uppercase tracking-widest text-orange-500 leading-none mb-0.5">Pierced By</p>
                              <p className="text-[11px] font-black text-white uppercase italic truncate leading-none">
                                {item.artistName || "Master Piercer"}
                              </p>
                            </div>
                          </div>
                          <button onClick={() => handleDownload(item.image, item.placement)}
                            className="flex-shrink-0 p-2.5 rounded-xl bg-zinc-800 hover:bg-orange-600 active:bg-orange-700 text-zinc-400 hover:text-white transition-all border border-white/5 active:scale-95">
                            <Download size={14} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </section>
              ))
            )}
          </div>
        </div>
      </main>

      {/* LIGHTBOX */}
      <AnimatePresence>
        {selectedImg && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/98 backdrop-blur-xl p-4"
            onClick={() => setSelectedImg(null)}>

            {/* Controls */}
            <div className="absolute top-4 right-4 md:top-8 md:right-8 flex gap-2 md:gap-4 z-10">
              <button onClick={(e) => { e.stopPropagation(); handleDownload(selectedImg.image, selectedImg.placement); }}
                className="flex items-center gap-2 px-4 md:px-6 py-2.5 md:py-3 rounded-full bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95">
                <Download size={14} /> Save
              </button>
              <button onClick={() => setSelectedImg(null)}
                className="text-white/40 hover:text-white transition-colors bg-white/5 p-2 rounded-full">
                <X size={28} />
              </button>
            </div>

            <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }}
              className="relative max-w-4xl w-full flex flex-col items-center"
              onClick={e => e.stopPropagation()}>
              <img src={selectedImg.image}
                className="max-h-[75vh] md:max-h-[70vh] w-auto mx-auto rounded-2xl md:rounded-[2.5rem] shadow-2xl border border-white/10" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}