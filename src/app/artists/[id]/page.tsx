"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Instagram, Facebook, CheckCircle2, ArrowLeft, X, 
  AlertCircle, Sparkles, Download, Filter, ChevronRight,
  CameraOff, ZoomIn, Share2
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function ArtistProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const [artist, setArtist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [resolvedId, setResolvedId] = useState<string | null>(null);
  const [selectedImg, setSelectedImg] = useState<{ url: string; category?: string } | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    params.then(p => setResolvedId(p.id));
  }, [params]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!resolvedId) return;
    const fetchArtistData = async () => {
      try {
        const res = await fetch("/api/artists");
        const data = await res.json();
        if (Array.isArray(data)) {
          const normalName = resolvedId.replace(/-/g, " ");
          const found = data.find((a: any) =>
            a.fullName.toLowerCase() === normalName.toLowerCase()
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
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filename}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      window.open(imageUrl, "_blank");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="space-y-3 text-center">
          <div className="flex gap-1 justify-center">
            {[0,1,2,3].map(i => (
              <motion.div key={i} animate={{ scaleY: [1, 2.5, 1] }}
                transition={{ repeat: Infinity, duration: 0.7, delay: i * 0.12 }}
                className="w-1 h-5 bg-orange-500 rounded-full" />
            ))}
          </div>
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!artist) return notFound();

  const artworks = artist.artworks || [];
  const filterOptions: string[] = [
    "All",
    ...Array.from(new Set(artworks.map((item: any) => item.category).filter(Boolean) as string[]))
  ];

  const filteredArtworks = activeFilter === "All"
    ? artworks
    : artworks.filter((item: any) => item.category === activeFilter);

  const isActive = artist.status === "active";

  return (
    <div className="min-h-screen bg-black text-white pt-28 md:pt-32 pb-20 px-4 sm:px-10 lg:px-16">

      {/* ── LIGHTBOX ── */}
      <AnimatePresence>
        {selectedImg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/98 backdrop-blur-2xl"
            onClick={() => setSelectedImg(null)}
          >
            {/* TOP BAR */}
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 md:p-8 bg-gradient-to-b from-black/90 to-transparent">

              {/* Desktop only: artwork label */}
              <div className="hidden md:flex items-center gap-4">
              </div>

              {/* Mobile: empty left side */}
              <div className="md:hidden" />

              {/* Right actions */}
              <div className="flex items-center gap-2 md:gap-3">
                {/* Download — always visible */}
                <button
                  onClick={e => {
                    e.stopPropagation();
                    handleDownload(selectedImg.url, `AJ-${selectedImg.category}`);
                  }}
                  className="flex items-center gap-2 px-4 md:px-5 py-2.5 md:py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-orange-600/30"
                >
                  <Download size={14} />
                  <span>Save</span>
                </button>


                {/* Close */}
                <button
                  onClick={() => setSelectedImg(null)}
                  className="p-2.5 md:p-3 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 text-white/60 hover:text-red-400 transition-all"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* IMAGE */}
            <div className="h-full w-full flex items-center justify-center p-4 md:p-20">
              <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: "spring", damping: 25 }}
                className="relative max-w-6xl max-h-full w-full"
                onClick={e => e.stopPropagation()}
              >
                <div className="relative rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                  <img
                    src={selectedImg.url}
                    alt="Artwork"
                    className="max-h-[82vh] w-full md:w-auto object-contain mx-auto"
                  />

                  {/* Bottom overlay — DESKTOP ONLY */}
                  <div className="hidden md:block absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-8">
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-orange-500 text-[10px] font-black uppercase tracking-[0.4em] mb-2">Category</p>
                        <h3 className="text-3xl font-black uppercase italic tracking-tighter text-white">
                          {selectedImg.category || "Untitled"}
                        </h3>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Corner decorations — desktop only */}
                <div className="hidden md:block absolute -top-3 -left-3 w-6 h-6 border-t-2 border-l-2 border-orange-600 rounded-tl-xl" />
                <div className="hidden md:block absolute -top-3 -right-3 w-6 h-6 border-t-2 border-r-2 border-orange-600 rounded-tr-xl" />
                <div className="hidden md:block absolute -bottom-3 -left-3 w-6 h-6 border-b-2 border-l-2 border-orange-600 rounded-bl-xl" />
                <div className="hidden md:block absolute -bottom-3 -right-3 w-6 h-6 border-b-2 border-r-2 border-orange-600 rounded-br-xl" />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto">
        <Link
          href="/home"
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-white mb-10 uppercase text-[10px] font-black tracking-[0.3em] transition-colors group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          Back to Collective
        </Link>

        {/* PROFILE HEADER */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-24 items-start mb-24">
          <div className="lg:col-span-5 lg:sticky lg:top-32">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative aspect-4/5 overflow-hidden rounded-[2.5rem] md:rounded-[3rem] border border-white/5 shadow-2xl"
            >
              <Image
                src={artist.profileImage || "/placeholder.jpg"}
                alt={artist.fullName}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

              <div className={cn(
                "absolute bottom-6 left-6 flex items-center gap-3 backdrop-blur-xl px-4 py-2.5 rounded-2xl border",
                isActive ? "bg-emerald-500/10 border-emerald-500/20" : "bg-red-500/10 border-red-500/20"
              )}>
                {isActive
                  ? <CheckCircle2 size={15} className="text-emerald-500 animate-pulse" />
                  : <AlertCircle size={15} className="text-red-500" />
                }
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-[0.2em]",
                  isActive ? "text-emerald-500" : "text-red-500"
                )}>
                  {isActive ? "Active Artist" : "Currently Inactive"}
                </span>
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-7 space-y-10">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-orange-500">
                <Sparkles size={15} />
                <span className="font-black uppercase tracking-[0.5em] text-xs italic">
                  {artist.position}
                </span>
              </div>
              <h1 className="text-6xl md:text-8xl lg:text-9xl font-black uppercase italic leading-[0.85] tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-600">
                {artist.fullName}
              </h1>
            </div>

            <div className="grid grid-cols-2 gap-8 py-8 md:py-12 border-y border-white/10">
              <div className="space-y-1">
                <p className="text-zinc-600 text-[10px] uppercase font-black tracking-[0.3em]">Phone</p>
                <p className="text-base md:text-xl font-bold text-white tracking-tight">
                  {artist.contactNumber || "N/A"}
                </p>
              </div>
              <div className="space-y-3">
                <p className="text-zinc-600 text-[10px] uppercase font-black tracking-[0.3em]">Socials</p>
                <div className="flex gap-5">
                  {artist.socials?.instagram && (
                    <a href={artist.socials.instagram} target="_blank" rel="noopener noreferrer"
                      className="text-zinc-400 hover:text-white transition-all hover:-translate-y-1">
                      <Instagram size={22} />
                    </a>
                  )}
                  {artist.socials?.facebook && (
                    <a href={artist.socials.facebook} target="_blank" rel="noopener noreferrer"
                      className="text-zinc-400 hover:text-white transition-all hover:-translate-y-1">
                      <Facebook size={22} />
                    </a>
                  )}
                </div>
              </div>
            </div>

            <Link
              href={`/book?artist=${encodeURIComponent(artist.fullName)}`}
              className={cn(
                "inline-block w-full md:w-auto text-center px-12 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all active:scale-95 bg-white text-black hover:bg-orange-600 hover:text-white shadow-xl",
                !isActive && "pointer-events-none opacity-40 grayscale"
              )}
            >
              Book {artist.fullName.split(" ")[0]} Now
            </Link>
          </div>
        </div>

        {/* PORTFOLIO */}
        <div className="flex flex-col lg:flex-row gap-12 border-t border-white/5 pt-20">

          {/* Sidebar filter — horizontal scroll on mobile */}
          <aside className="w-full lg:w-56 shrink-0">
            <div className="lg:sticky lg:top-32 space-y-4">
              <div className="flex items-center gap-2 px-1 mb-2">
                <Filter className="w-3 h-3 text-orange-500" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Filter</h3>
              </div>
              {/* Mobile: horizontal scroll */}
              <div className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:overflow-visible lg:pb-0">
                {filterOptions.map(option => (
                  <button
                    key={option}
                    onClick={() => setActiveFilter(option)}
                    className={cn(
                      "flex-shrink-0 flex items-center justify-between px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                      activeFilter === option
                        ? "bg-orange-600 text-white shadow-lg shadow-orange-600/20"
                        : "bg-zinc-900 text-zinc-500 hover:bg-zinc-800 hover:text-white border border-zinc-900"
                    )}
                  >
                    {option}
                    <ChevronRight className={cn("w-3 h-3 ml-2 hidden lg:block", activeFilter === option ? "opacity-100" : "opacity-0")} />
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Grid */}
          <div className="flex-1 space-y-10">
            <div className="flex items-end justify-between border-b border-white/10 pb-6">
              <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter">
                Art Archive
              </h2>
              <span className="text-orange-500 text-xs font-bold uppercase tracking-widest italic">
                [{filteredArtworks.length}]
              </span>
            </div>

            {filteredArtworks.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 md:gap-6">
                {filteredArtworks.map((item: any, idx: number) => (
                  <motion.div
                    key={idx}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.05 }}
                    className="relative group aspect-3/4 overflow-hidden rounded-[2rem] bg-zinc-950 border border-white/5 cursor-pointer shadow-xl"
                    onClick={() => setSelectedImg({ url: item.url, category: item.category })}
                  >
                    <Image
                      src={item.url}
                      alt="Tattoo Art"
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />

                    {/* Mobile: always-visible DL button in corner */}
                    <div className="absolute top-3 right-3 md:hidden z-10">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleDownload(item.url, `${artist.fullName}-${item.category}`);
                        }}
                        className="p-2.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-white active:scale-95 transition-all"
                      >
                        <Download size={14} />
                      </button>
                    </div>

                    {/* Desktop: hover overlay */}
                    <div className="hidden md:flex absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex-col justify-between p-6">
                      <div className="flex justify-end">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleDownload(item.url, `${artist.fullName}-${item.category}`);
                          }}
                          className="p-3 rounded-2xl bg-white/10 backdrop-blur-md hover:bg-orange-600 text-white transition-colors border border-white/10 active:scale-95"
                        >
                          <Download size={16} />
                        </button>
                      </div>

                      <div className="text-center space-y-2">
                        <p className="text-[8px] font-black uppercase tracking-[0.4em] text-orange-400">Style</p>
                        <p className="text-base font-black text-white uppercase italic tracking-tighter">
                          {item.category || "General"}
                        </p>
                      </div>
                    </div>

                    {/* Mobile: category tag at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 md:hidden bg-gradient-to-t from-black/80 to-transparent p-4 pt-8">
                      <p className="text-[9px] font-black uppercase tracking-widest text-zinc-300 truncate">
                        {item.category || "General"}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-32 border border-dashed border-white/10 rounded-[3rem]">
                <CameraOff className="w-10 h-10 text-zinc-800 mb-4" />
                <p className="text-zinc-700 text-xs font-black uppercase tracking-widest">No matching artworks</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}