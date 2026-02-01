"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Maximize2, 
  CameraOff, 
  Flame, 
  Filter, 
  ChevronRight, 
  Download,
  Zap // Ginagamit nating icon for piercings
} from 'lucide-react';
import { Navbar } from '../components/navigation/navbar';
import { Footer } from '../components/navigation/footer';
import { cn } from "@/lib/utils";
import FloatingChatWidget from '../components/chatbot';

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

  useEffect(() => {
    // Kinukuha ang data sa main gallery api
    fetch("/api/gallery")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          // Filter natin para Piercings lang ang nandito
          const piercingData = data.filter(item => item.category === "Piercing");
          setPiercings(piercingData);
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
    } catch (error) {
      window.open(imageUrl, '_blank');
    }
  };

  const filterOptions = ["All", ...Array.from(new Set(piercings.map(p => p.placement).filter(Boolean)))];

  const filteredPiercings = activeFilter === "All" 
    ? piercings 
    : piercings.filter(p => p.placement === activeFilter);

  const groupedPiercings = filteredPiercings.reduce((acc: { [key: string]: Piercing[] }, item) => {
    const key = item.placement || "Others";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-orange-500 animate-pulse font-black uppercase tracking-[0.5em]">Loading Archive...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200">
      <FloatingChatWidget/>
      <Navbar />

      {/* --- HERO SECTION --- */}
      <section className="relative h-[50vh] w-full flex items-center justify-center overflow-hidden border-b border-white/5">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed grayscale opacity-30"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1590201845110-386f5c888e93?q=80&w=2000')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
        
        <div className="relative z-10 text-center space-y-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-orange-500/20 bg-orange-500/5 mb-2">
            <Zap className="w-3 h-3 text-orange-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500">Piercing Archive</span>
          </motion.div>
          <h1 className="text-6xl md:text-7xl font-black uppercase tracking-tighter italic">
            THE ART OF BODY <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-orange-400 to-yellow-400">PIERCING</span>
          </h1>
        </div>
      </section>

      {/* --- MAIN CONTENT --- */}
      <main className="container mx-auto max-w-7xl px-6 py-20">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* SIDEBAR */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <div className="sticky top-28 space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-2">
                  <Filter className="w-3 h-3 text-orange-600" />
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Filter Placement</h3>
                </div>
                <nav className="flex flex-col gap-1">
                  {filterOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => setActiveFilter(option)}
                      className={cn(
                        "flex items-center justify-between px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all text-left",
                        activeFilter === option ? "bg-orange-600 text-white shadow-lg shadow-orange-900/20" : "bg-zinc-900/50 text-zinc-500 hover:bg-zinc-900"
                      )}
                    >
                      {option}
                      <ChevronRight className={cn("w-4 h-4", activeFilter === option ? "opacity-100" : "opacity-0")} />
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </aside>

          {/* GALLERY GRID */}
          <div className="flex-1 space-y-24">
            {Object.keys(groupedPiercings).length === 0 ? (
              <div className="flex flex-col items-center py-20 border border-zinc-900 rounded-[3rem]">
                <CameraOff className="w-12 h-12 text-zinc-800 mb-4" />
                <p className="text-zinc-600 text-xs font-black uppercase tracking-widest">No piercing works found</p>
              </div>
            ) : (
              Object.entries(groupedPiercings).map(([placement, items]) => (
                <section key={placement} className="space-y-8">
                  <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-black uppercase tracking-widest text-white italic">{placement}</h2>
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-orange-600/30 to-transparent" />
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
                    {items.map((item) => (
                      <motion.div
                        key={item._id}
                        layout
                        whileHover={{ y: -12 }}
                        className="relative group aspect-[3/4] overflow-hidden rounded-[2.5rem] bg-zinc-900 border border-white/5 cursor-pointer shadow-2xl"
                      >
                        <img
                          src={item.image}
                          alt={item.placement}
                          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                        />
                        
                        {/* PREMIUM OVERLAY */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-between p-7">
                          <div className="flex justify-end">
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDownload(item.image, item.placement); }}
                              className="p-3 rounded-2xl bg-white/10 backdrop-blur-md hover:bg-orange-600 text-white transition-colors border border-white/10"
                            >
                              <Download size={18} />
                            </button>
                          </div>

                          <div className="flex flex-col items-center text-center space-y-3" onClick={() => setSelectedImg(item)}>
                             <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-orange-500 rotate-3 group-hover:rotate-0 transition-transform duration-500 shadow-2xl">
                                <img src={item.artistImage || "/default-artist.jpg"} alt={item.artistName} className="w-full h-full object-cover" />
                             </div>
                             <div>
                                <p className="text-[8px] font-black uppercase tracking-[0.4em] text-orange-500">Pierced By</p>
                                <p className="text-sm font-black text-white uppercase italic tracking-tighter">{item.artistName || "Master Piercer"}</p>
                             </div>
                             <div className="bg-white/10 px-4 py-1 rounded-full border border-white/10">
                                <span className="text-[9px] font-black uppercase text-white/60 tracking-widest">{item.placement}</span>
                             </div>
                          </div>
                        </div>

                        {/* Side Label */}
                        <div className="absolute top-6 left-6 group-hover:opacity-0 transition-opacity">
                           <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] [writing-mode:vertical-lr]">
                             {item.placement}
                           </span>
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

      {/* --- LIGHTBOX MODAL --- */}
      <AnimatePresence>
        {selectedImg && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/98 backdrop-blur-xl p-4 md:p-10"
            onClick={() => setSelectedImg(null)}
          >
            {/* Modal Controls */}
            <div className="absolute top-8 right-8 flex gap-4">
              <button 
                onClick={(e) => { e.stopPropagation(); handleDownload(selectedImg.image, selectedImg.placement); }}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-orange-600 hover:bg-orange-700 text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-2xl"
              >
                <Download size={16} /> Download High-Res
              </button>
              <button className="text-white/40 hover:text-white transition-colors bg-white/5 p-2 rounded-full"><X size={32} /></button>
            </div>

            <motion.div 
              initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }}
              className="relative max-w-4xl w-full flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img src={selectedImg.image} className="max-h-[70vh] w-auto mx-auto rounded-[2.5rem] shadow-2xl border border-white/10" />
              
              {/* Modal Artist Footer */}
              <div className="mt-8 flex items-center gap-5 bg-zinc-900/80 p-5 rounded-[2rem] border border-white/5 backdrop-blur-md">
                <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-orange-500">
                  <img src={selectedImg.artistImage || "/default-artist.jpg"} className="w-full h-full object-cover" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Expert Piercer</p>
                  <p className="text-2xl font-black text-white uppercase italic tracking-tighter">{selectedImg.artistName || "Master Piercer"}</p>
                </div>
                <div className="ml-8 text-right hidden md:block border-l border-white/10 pl-8">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Service</p>
                  <p className="text-xl font-black text-zinc-200 uppercase tracking-tighter">{selectedImg.placement} Piercing</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}