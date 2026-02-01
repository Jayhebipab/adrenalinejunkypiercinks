"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Instagram, 
  Facebook, 
  CheckCircle2, 
  ArrowLeft, 
  X, 
  AlertCircle, 
  Sparkles, 
  Download, 
  Filter, 
  ChevronRight,
  CameraOff
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function ArtistProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const [artist, setArtist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [resolvedId, setResolvedId] = useState<string | null>(null);
  const [selectedImg, setSelectedImg] = useState<{ url: string; category?: string } | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("All");

  useEffect(() => {
    params.then(p => setResolvedId(p.id));
  }, [params]);

  useEffect(() => {
    if (!resolvedId) return;
    const fetchArtistData = async () => {
      try {
        const res = await fetch("/api/artists");
        const data = await res.json();
        if (Array.isArray(data)) {
          const normalName = resolvedId.replace(/-/g, " ");
          const found = data.find(
            (a: any) => a.fullName.toLowerCase() === normalName.toLowerCase()
          );
          setArtist(found || null);
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchArtistData();
  }, [resolvedId]);

  const handleDownload = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      window.open(imageUrl, '_blank');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="h-12 w-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!artist) return notFound();

  // --- LOGIC PARA SA CATEGORY FILTERING ---
  const artworks = artist.artworks || [];
  
  // Kunin ang lahat ng unique categories mula sa artworks array mo
  const filterOptions: string[] = [
    "All", 
    ...Array.from(new Set(artworks.map((item: any) => item.category).filter(Boolean) as string[]))
  ];
  
  // Filter base sa piniling category
  const filteredArtworks = activeFilter === "All" 
    ? artworks 
    : artworks.filter((item: any) => item.category === activeFilter);

  const isActive = artist.status === "active";

  return (
    <div className="min-h-screen bg-black text-white pt-32 pb-20 px-6 sm:px-10 lg:px-16">
      
      {/* LIGHTBOX MODAL */}
      <AnimatePresence>
        {selectedImg && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl p-4 md:p-10"
            onClick={() => setSelectedImg(null)}
          >
            <div className="absolute top-8 right-8 flex gap-4">
              <button 
                onClick={(e) => { e.stopPropagation(); handleDownload(selectedImg.url, `AJ-${selectedImg.category}`); }}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-orange-600 hover:bg-orange-700 text-white text-[10px] font-black uppercase tracking-widest transition-all"
              >
                <Download size={16} /> Save Image
              </button>
              <button className="text-white/40 hover:text-white transition-colors bg-white/5 p-2 rounded-full">
                <X size={32} />
              </button>
            </div>

            <motion.div 
              initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }}
              className="relative max-w-4xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <img src={selectedImg.url} alt="Large View" className="max-h-[75vh] w-auto mx-auto rounded-[2.5rem] shadow-2xl border border-white/10" />
              <div className="mt-6 text-center">
                <p className="text-orange-500 text-[10px] font-black uppercase tracking-[0.4em]">Style / Category</p>
                <h3 className="text-2xl font-black uppercase italic tracking-tighter">{selectedImg.category || "Masterpiece"}</h3>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto">
        <Link href="/home" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white mb-12 uppercase text-[10px] font-black tracking-[0.3em] transition-colors group">
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back to Collective
        </Link>

        {/* --- PROFILE HEADER --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 items-start mb-32">
          <div className="lg:col-span-5 lg:sticky lg:top-32">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative aspect-[4/5] overflow-hidden rounded-[3rem] border border-white/5 shadow-2xl">
              <Image src={artist.profileImage || "/placeholder.jpg"} alt={artist.fullName} fill className="object-cover" priority />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className={`absolute bottom-8 left-8 flex items-center gap-3 backdrop-blur-xl px-5 py-2.5 rounded-2xl border ${isActive ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                {isActive ? <CheckCircle2 size={16} className="text-emerald-500 animate-pulse" /> : <AlertCircle size={16} className="text-red-500" />}
                <span className={`text-[11px] font-black uppercase tracking-[0.2em] ${isActive ? 'text-emerald-500' : 'text-red-500'}`}>
                  {isActive ? "Active Artist" : "Currently Inactive"}
                </span>
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-7 space-y-12">
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-orange-600">
                <Sparkles size={16} />
                <span className="font-black uppercase tracking-[0.5em] text-xs italic">{artist.position}</span>
              </div>
              <h1 className="text-7xl md:text-9xl font-black uppercase italic leading-[0.8] tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500">
                {artist.fullName}
              </h1>
            </div>

            <div className="grid grid-cols-2 gap-12 py-12 border-y border-white/10">
              <div className="space-y-1">
                <p className="text-zinc-600 text-[10px] uppercase font-black tracking-[0.3em]">Phone</p>
                <p className="text-xl font-bold text-white tracking-tight">{artist.contactNumber || "N/A"}</p>
              </div>
              <div className="space-y-3">
                <p className="text-zinc-600 text-[10px] uppercase font-black tracking-[0.3em]">Official Socials</p>
                <div className="flex gap-6">
                   {artist.socials?.instagram && <a href={artist.socials.instagram} target="_blank" className="text-zinc-400 hover:text-white transition-all transform hover:-translate-y-1"><Instagram size={24}/></a>}
                   {artist.socials?.facebook && <a href={artist.socials.facebook} target="_blank" className="text-zinc-400 hover:text-white transition-all transform hover:-translate-y-1"><Facebook size={24}/></a>}
                </div>
              </div>
            </div>

<Link 
  href={`/book?artist=${encodeURIComponent(artist.fullName)}`}
  className={cn(
    "inline-block w-full md:w-auto text-center px-16 py-6 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all transform active:scale-95 bg-white text-black hover:bg-orange-600 hover:text-white shadow-xl shadow-orange-600/10",
    !isActive && "pointer-events-none opacity-50 grayscale" // Disable button pag inactive
  )}
>
  Book {artist.fullName.split(' ')[0]} Now
</Link>
          </div>
        </div>

        {/* --- PORTFOLIO WITH CATEGORY FILTER --- */}
        <div className="flex flex-col lg:flex-row gap-16 border-t border-white/5 pt-24">
          
          <aside className="w-full lg:w-64 shrink-0">
            <div className="sticky top-32 space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-2">
                  <Filter className="w-3 h-3 text-orange-600" />
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Filter Style</h3>
                </div>
                <nav className="flex flex-col gap-1">
                  {filterOptions.map((option: string) => (
                    <button
                      key={option}
                      onClick={() => setActiveFilter(option)}
                      className={cn(
                        "flex items-center justify-between px-4 py-4 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all text-left",
                        activeFilter === option ? "bg-orange-600 text-white shadow-lg" : "bg-zinc-900/50 text-zinc-500 hover:bg-zinc-900"
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

          <div className="flex-1 space-y-12">
            <div className="flex items-end justify-between border-b border-white/10 pb-8">
              <h2 className="text-5xl font-black uppercase italic tracking-tighter">Art Archive</h2>
              <span className="text-orange-600 text-sm font-bold uppercase tracking-widest italic">[{filteredArtworks.length} Items]</span>
            </div>

            {filteredArtworks.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
                {filteredArtworks.map((item: any, idx: number) => (
                  <motion.div 
                    key={idx} layout initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                    className="relative group aspect-[3/4] overflow-hidden rounded-[2.5rem] bg-zinc-900 border border-white/5 cursor-pointer shadow-2xl"
                  >
                    <Image src={item.url} alt="Tattoo Art" fill className="object-cover transition-transform duration-1000 group-hover:scale-110" />
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-between p-8">
                      <div className="flex justify-end">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDownload(item.url, `${artist.fullName}-${item.category}`); }}
                          className="p-3 rounded-2xl bg-white/10 backdrop-blur-md hover:bg-orange-600 text-white transition-colors border border-white/10"
                        >
                          <Download size={18} />
                        </button>
                      </div>
                      <div className="text-center space-y-3" onClick={() => setSelectedImg({ url: item.url, category: item.category })}>
                         <div>
                            <p className="text-[8px] font-black uppercase tracking-[0.4em] text-orange-500">Style</p>
                            <p className="text-lg font-black text-white uppercase italic tracking-tighter">{item.category || "General"}</p>
                         </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-32 border border-dashed border-white/10 rounded-[3rem]">
                <CameraOff className="w-12 h-12 text-zinc-800 mb-4" />
                <p className="text-zinc-600 text-xs font-black uppercase tracking-widest">No matching artworks</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}