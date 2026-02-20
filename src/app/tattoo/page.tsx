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
  Star 
} from 'lucide-react';
import { Navbar } from '../components/navigation/navbar';
import { Footer } from '../components/navigation/footer';
import { cn } from "@/lib/utils";
import FloatingChatWidget from '../components/chatbot';

// In-update ang Interface para kasama ang Artist details
interface Tattoo {
  _id: string;
  image: string;
  placement: string;
  category: string;
  artistName?: string;
  artistImage?: string;
}

export default function TattooGalleryPage() {
  const [tattoos, setTattoos] = useState<Tattoo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImg, setSelectedImg] = useState<Tattoo | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("All");

  useEffect(() => {
    fetch("/api/tattoo")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setTattoos(data);
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
      link.download = `AdrenalineJunky-${filename}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      window.open(imageUrl, '_blank');
    }
  };

  const filterOptions = ["All", ...Array.from(new Set(tattoos.map(t => t.placement).filter(Boolean)))];

  const filteredTattoos = activeFilter === "All" 
    ? tattoos 
    : tattoos.filter(t => t.placement === activeFilter);

  const groupedTattoos = filteredTattoos.reduce((acc: { [key: string]: Tattoo[] }, tattoo) => {
    const key = tattoo.placement || "Others";
    if (!acc[key]) acc[key] = [];
    acc[key].push(tattoo);
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
      <section className="relative h-[40vh] w-full flex items-center justify-center overflow-hidden border-b border-white/5">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed grayscale opacity-40"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1590201845110-386f5c888e93?q=80&w=2000')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
        
        <div className="relative z-10 text-center space-y-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-orange-500/20 bg-orange-500/5 mb-2">
            <Flame className="w-3 h-3 text-orange-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500">Tatto Archive</span>
          </motion.div>
          <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter italic">
            THE ART OF BODY <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-orange-400 to-yellow-400">TATTOO</span>
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
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Filter by Placement</h3>
                </div>
                <nav className="flex flex-col gap-1">
                  {filterOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => setActiveFilter(option)}
                      className={cn(
                        "flex items-center justify-between px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all",
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
            {Object.keys(groupedTattoos).length === 0 ? (
              <div className="flex flex-col items-center py-20 border border-zinc-900 rounded-[3rem]">
                <CameraOff className="w-12 h-12 text-zinc-800 mb-4" />
                <p className="text-zinc-600 text-xs font-black uppercase tracking-widest">No matching tattoos found</p>
              </div>
            ) : (
              Object.entries(groupedTattoos).map(([placement, items]) => (
                <section key={placement} className="space-y-8">
                  <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-black uppercase tracking-widest text-white">{placement}</h2>
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-orange-600/50 to-transparent" />
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {items.map((item) => (
                      <motion.div
                        key={item._id}
                        layout
                        whileHover={{ y: -10 }}
                        className="relative group aspect-[3/4] overflow-hidden rounded-[2rem] bg-zinc-900 border border-white/5 cursor-pointer shadow-2xl"
                      >
                        <img
                          src={item.image}
                          alt={item.placement}
                          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                        />
                        
                        {/* BRUSHED OVERLAY (Parang yung sa Landing Page) */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-between p-6">
                          <div className="flex justify-end">
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDownload(item.image, item.placement); }}
                              className="p-3 rounded-2xl bg-white/10 backdrop-blur-md hover:bg-orange-600 text-white transition-colors border border-white/10"
                            >
                              <Download size={18} />
                            </button>
                          </div>

                          <div className="flex flex-col items-center text-center space-y-3" onClick={() => setSelectedImg(item)}>
                             <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-orange-500 rotate-3 group-hover:rotate-0 transition-transform duration-500 shadow-xl">
                                <img src={item.artistImage || "/default-artist.jpg"} alt={item.artistName} className="w-full h-full object-cover" />
                             </div>
                             <div>
                                <p className="text-[8px] font-black uppercase tracking-[0.3em] text-orange-500">Inked By</p>
                                <p className="text-sm font-black text-white uppercase italic">{item.artistName || "Master Artist"}</p>
                             </div>
                             <Maximize2 className="text-white/40 w-4 h-4" />
                          </div>
                        </div>

                        {/* Side Label (Visible only when not hovered) */}
                        <div className="absolute top-6 left-6 group-hover:opacity-0 transition-opacity">
                           <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] [writing-mode:vertical-lr]">
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
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/98 backdrop-blur-md p-4 md:p-10"
            onClick={() => setSelectedImg(null)}
          >
            <div className="absolute top-8 right-8 flex gap-4">
              <button 
                onClick={(e) => { e.stopPropagation(); handleDownload(selectedImg.image, selectedImg.placement); }}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-orange-600 hover:bg-orange-700 text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-2xl border border-orange-500/50"
              >
                <Download size={16} /> Save Artwork
              </button>
              <button className="text-white/50 hover:text-white transition-colors bg-white/5 p-2 rounded-full"><X size={32} /></button>
            </div>

            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="relative max-w-4xl w-full flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative group">
                <img src={selectedImg.image} className="max-h-[70vh] w-auto mx-auto rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10" />
              </div>
              
              {/* Modal Artist Info Footer */}
              <div className="mt-8 flex items-center gap-4 bg-zinc-900/50 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                <div className="w-12 h-12 rounded-xl overflow-hidden border border-orange-500">
                  <img src={selectedImg.artistImage || "/default-artist.jpg"} className="w-full h-full object-cover" />
                </div>
                <div className="text-left">
                  <p className="text-[9px] font-black uppercase tracking-widest text-orange-500">Artist</p>
                  <p className="text-xl font-black text-white uppercase italic tracking-tighter">{selectedImg.artistName || "Master Artist"}</p>
                </div>
                <div className="ml-8 text-right hidden md:block border-l border-white/10 pl-8">
                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Placement</p>
                  <p className="text-lg font-black text-zinc-300 uppercase">{selectedImg.placement}</p>
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