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
  Download // Import Download icon
} from 'lucide-react';
import { Navbar } from '../components/navigation/navbar';
import { Footer } from '../components/navigation/footer';
import { cn } from "@/lib/utils";
import FloatingChatWidget from '../components/chatbot';
interface Tattoo {
  _id: string;
  image: string;
  placement: string;
  category: string;
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
      .finally(() => setLoading(false));
  }, []);

  // DOWNLOAD FUNCTION
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
      console.error("Download failed:", error);
      // Fallback: Open in new tab if blob fails
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
      <section className="relative h-[50vh] w-full flex items-center justify-center overflow-hidden border-b border-white/5">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed grayscale opacity-40"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1590201845110-386f5c888e93?q=80&w=2000')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
        
        <div className="relative z-10 text-center space-y-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-orange-500/20 bg-orange-500/5 mb-2">
            <Flame className="w-3 h-3 text-orange-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500">Our Artwork Gallery</span>
          </motion.div>
          <h1 className="text-6xl md:text-7xl font-black uppercase tracking-tighter">
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
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Select Area</h3>
                </div>
                <nav className="flex flex-col gap-1">
                  {filterOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => setActiveFilter(option)}
                      className={cn(
                        "flex items-center justify-between px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all",
                        activeFilter === option ? "bg-orange-600 text-white" : "bg-zinc-900/50 text-zinc-500 hover:bg-zinc-900"
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
              <div className="flex flex-col items-center py-20 border border-zinc-900 rounded-4xl">
                <CameraOff className="w-12 h-12 text-zinc-800 mb-4" />
                <p className="text-zinc-600 text-xs font-black uppercase tracking-widest">No matching tattoos found</p>
              </div>
            ) : (
              Object.entries(groupedTattoos).map(([placement, items]) => (
                <section key={placement} className="space-y-8">
                  <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-black uppercase tracking-widest text-white">{placement}</h2>
                    <div className="h-[1px] flex-1 bg-linear-to-r from-orange-600/50 to-transparent" />
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {items.map((item) => (
                      <motion.div
                        key={item._id}
                        layout
                        whileHover={{ y: -8 }}
                        className="relative group aspect-[3/4] overflow-hidden rounded-2xl bg-zinc-900 border border-white/5 cursor-pointer"
                      >
                        <img
                          src={item.image}
                          alt={item.placement}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          onClick={() => setSelectedImg(item)}
                        />
                        {/* Hover Overlay with Download */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-4">
                          <div className="flex justify-end">
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDownload(item.image, item.placement); }}
                              className="p-2 rounded-full bg-white/10 hover:bg-orange-600 text-white transition-colors"
                            >
                              <Download size={16} />
                            </button>
                          </div>
                          <div className="flex items-center justify-between" onClick={() => setSelectedImg(item)}>
                             <span className="text-[9px] font-black uppercase text-orange-500">{item.category}</span>
                             <Maximize2 className="text-white w-4 h-4" />
                          </div>
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
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-sm p-6"
            onClick={() => setSelectedImg(null)}
          >
            <div className="absolute top-8 right-8 flex gap-4">
              {/* DOWNLOAD IN MODAL */}
              <button 
                onClick={(e) => { e.stopPropagation(); handleDownload(selectedImg.image, selectedImg.placement); }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-orange-600 hover:bg-orange-700 text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-xl"
              >
                <Download size={16} /> Download
              </button>
              <button className="text-white/50 hover:text-white transition-colors"><X size={32} /></button>
            </div>

            <motion.div 
              initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              className="relative max-w-3xl w-full text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img src={selectedImg.image} className="max-h-[75vh] mx-auto rounded-xl shadow-2xl border border-white/10" />
              <h3 className="text-white text-2xl font-black uppercase tracking-widest mt-6">{selectedImg.placement}</h3>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}