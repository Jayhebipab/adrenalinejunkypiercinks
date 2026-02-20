"use client"

import React, { useState, useEffect } from "react"
import Image from "next/image"
import { motion, } from "framer-motion"
import { Card } from "@/components/ui/card";
import Link from "next/link";
import {
  Star,
  ArrowRight,
  PlayCircle,
  Mail,
  Phone,
  Facebook,
  Instagram,
  ChevronRight,
  ShoppingBag,
  Syringe,
  Sparkles,
  X,
  ChevronLeft,
  MessageSquareQuote,
  Quote,
  Loader2,
  Calendar, ArrowUpRight, Zap, ImageIcon, ShieldCheck
} from "lucide-react"
import Swal from "sweetalert2"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Navbar } from "../components/navigation/navbar"
import { Footer } from "../components/navigation/footer"
import FloatingChatWidget from "../components/chatbot"
// ---------- TYPES ----------
interface GalleryItem {
  _id: string
  image: string
  placement: string
  category?: string
  name?: string
  price?: number | string
}

interface Review {
  id: string;
  name: string;
  stars: number;
  description: string;
  userImage?: string;
  reviewImage?: string; // Support for tattoo/piercing photo
  isVisible: boolean;
}

// ---------- LIGHTBOX / IMAGE MODAL ----------
const ImageModal = ({
  images,
  currentIndex,
  onClose,
}: {
  images: string[]
  currentIndex: number
  onClose: () => void
}) => {
  const [index, setIndex] = useState(currentIndex)

  const prev = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setIndex((i) => (i - 1 + images.length) % images.length)
  }
  const next = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setIndex((i) => (i + 1) % images.length)
  }

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowLeft") prev()
      if (e.key === "ArrowRight") next()
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [images])

  return (
    <div 
      className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-6 backdrop-blur-md"
      onClick={onClose}
    >
      <div 
        className="relative max-w-xl w-full flex flex-col items-center" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute -top-12 right-0 text-white/70 hover:text-red-500 transition-colors"
        >
          <X size={32} />
        </button>

        {/* Main Image Container */}
        <div className="relative w-full aspect-square md:aspect-[4/5] bg-zinc-900 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
          <img
            src={images[index]}
            className="w-full h-full object-contain"
            alt="Art Gallery Preview"
          />

          {/* Navigation Controls inside the box for mobile friendliness */}
          <div className="absolute inset-y-0 left-0 flex items-center">
             <button onClick={prev} className="p-2 ml-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition-all">
                <ChevronLeft size={24} />
             </button>
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center">
             <button onClick={next} className="p-2 mr-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition-all">
                <ChevronRight size={24} />
             </button>
          </div>
        </div>

        {/* Image Counter */}
        <div className="mt-4 px-4 py-1 bg-white/5 border border-white/10 rounded-full">
           <p className="text-[10px] text-zinc-400 font-mono">
             {index + 1} / {images.length}
           </p>
        </div>
      </div>
    </div>
  )
}
// ---------- HERO ----------
const Hero = () => (
  <section id="home" className="relative flex min-h-[100vh] items-center justify-center overflow-hidden bg-black">
    <div
      className="absolute inset-0 bg-cover bg-center"
      style={{ backgroundImage: "url('/images/about2.jpeg')", backgroundPosition: "center 45%" }}
    >
      {/* BINABAWASAN ANG DILIM DITO: Mula 60/80/100, ginawa nating 30/40/60 */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/50 to-black/99"></div>
    </div>
    
    <div className="container relative z-10 text-center px-4">
      {/* ... rest of your code (buttons, h1, etc) stay the same ... */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9 }}
        className="space-y-6 md:space-y-8"
      >
        <p className="text-xs md:text-lg text-gray-300 uppercase tracking-[0.3em] font-medium">
          Adrenaline Junky Piercinks
        </p>

        <h1 className="text-4xl md:text-7xl font-black leading-tight tracking-tighter text-white uppercase">
          SERMON IS TEMPORARY,<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-orange-500 to-yellow-400">
            VANITY IS FOREVER!
          </span>
        </h1>


      </motion.div>
    </div>
  </section>
)

export const BlogSection = () => {
  const [blogItems, setBlogItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/blogs")
      .then((res) => res.json())
      .then((data) => (Array.isArray(data) ? setBlogItems(data) : null))
      .catch((err) => console.error("Error fetching blogs:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section id="blogs" className="relative py-20 md:py-32 bg-black border-y border-white/5 overflow-hidden">
      {/* Background Fire Glow */}
      <div className="absolute top-0 right-0 w-125 h-125 bg-orange-600/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        {/* UPGRADED HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 px-4 py-1.5 rounded-full">
              <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              <span className="text-white uppercase text-[10px] tracking-[0.3em] font-black">
                Latest from the Studio
              </span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none">
              <span className="text-white">Our </span>
              <span className="text-orange-500">Journal</span>
            </h2>
          </div>
        </div>

        {loading ? (
          /* SKELETON LOADING GRID */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((_, idx) => (
              <div key={idx} className="space-y-6 animate-pulse">
                <div className="aspect-16/10 bg-zinc-900 rounded-3xl border border-white/5" />
                <div className="space-y-3">
                  <div className="h-3 bg-zinc-900 rounded w-1/4" />
                  <div className="h-6 bg-zinc-900 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* DYNAMIC BLOG GRID */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogItems.slice(0, 3).map((post, idx) => (
              <motion.div
                key={post.id || post._id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group relative flex flex-col"
              >
                {/* Image Container - NO TRANSITION/TRANSFORM */}
                <div className="relative aspect-8/10 overflow-hidden rounded-3xl border border-white/5 bg-zinc-900">
                  <Image 
                    src={post.image} 
                    alt={post.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                  
                  {/* Category Badge */}
                  <div className="absolute top-4 left-4">
                    <span className="bg-black/60 backdrop-blur-md border border-orange-500/30 text-orange-500 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                      {post.category}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="pt-6 space-y-3">
                  <div className="flex items-center text-zinc-500 text-[10px] uppercase tracking-widest font-bold">
                    <Calendar className="mr-2 h-3 w-3 text-orange-600" />
                    {new Date(post.createdAt?.seconds ? post.createdAt.seconds * 1000 : post.createdAt || Date.now()).toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </div>
                  <h3 className="text-xl font-bold text-white group-hover:text-orange-500 transition-colors line-clamp-2 uppercase tracking-tight italic">
                    {post.title}
                  </h3>
                  
                  <Link 
                    href={`/blog/${post.id || post._id}`} 
                    className="inline-flex items-center text-xs font-black uppercase tracking-[0.2em] text-white pt-2 group/link"
                  >
                    Read Article 
                    <div className="ml-2 p-1 rounded-full border border-white/10 group-hover/link:bg-orange-600 group-hover/link:border-orange-600 transition-all">
                      <ArrowUpRight className="h-3 w-3" />
                    </div>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <div className="mt-20 flex justify-center">
          <Link href="/blog">
            <Button 
              variant="ghost" 
              className="group text-zinc-500 hover:text-orange-600 text-[10px] uppercase font-black tracking-[0.3em] transition-all"
            >
              VIEW ALL POSTS
              <ChevronRight size={14} className="ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
// ---------- PIERCING GALLERY (UPDATED VERSION) ----------
const GallerySection = ({ openModal }: { openModal: (imgs: string[], i: number) => void }) => {
  const [galleryItems, setGalleryItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/gallery")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setGalleryItems(data.filter(item => item.category === "Piercing").slice(0, 6))
        }
      })
      .catch(err => console.error("Gallery fetch error:", err))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section id="gallery-section" className="py-20 bg-black px-6 overflow-hidden">
      <div className="container mx-auto max-w-6xl">
        {/* UPGRADED TITLE */}
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none italic">
            <span className="text-white">The art of body </span>
            <span className="text-orange-500">Piercings</span>
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-10 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((_, idx) => (
              <div key={idx} className="aspect-[3/4] bg-zinc-900 rounded-[2rem]" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-10">
              {galleryItems.map((item, idx) => (
                <motion.div
                  key={item._id}
                  whileHover={{ y: -15 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="group relative overflow-hidden rounded-[2.5rem] border border-white/10 aspect-[3/4] cursor-pointer bg-zinc-900 shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
                  onClick={() => openModal(galleryItems.map(g => g.image), idx)}
                >
                  {/* MAIN PIERCING IMAGE - NO TRANSITION */}
                  <img
                    src={item.image}
                    alt={item.placement}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* --- ARTIST OVERLAY (WHITE/ORANGE ONLY) --- */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-8">
                    
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      className="flex flex-col items-center space-y-4"
                    >
                      {/* Artist Avatar */}
                      <div className="relative">
                        <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden border-2 border-orange-500 rotate-3 shadow-2xl transition-transform group-hover:rotate-0 duration-500">
                          <img 
                            src={item.artistImage || "/default-artist.jpg"} 
                            alt={item.artistName} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-orange-600 text-white p-1 rounded-md shadow-lg">
                           <Zap size={12} fill="currentColor" />
                        </div>
                      </div>

                      <div className="text-center">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-orange-500 mb-1">Pierced By</p>
                        <p className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter italic leading-none mb-4">
                          {item.artistName || "Master Piercer"}
                        </p>
                      </div>

                      {/* Placement Tag */}
                      <div className="bg-white/10 backdrop-blur-md border border-orange-500/30 px-6 py-2 rounded-full shadow-xl">
                        <p className="text-white text-[10px] md:text-xs font-black uppercase tracking-[0.2em]">
                          {item.placement}
                        </p>
                      </div>
                    </motion.div>
                  </div>

                  {/* Top Subtle Label */}
                  <div className="absolute top-6 left-6 group-hover:opacity-0 transition-opacity">
                    <span className="text-[12px] font-black text-white/50 uppercase tracking-[0.3em] [writing-mode:vertical-lr]">
                      {item.placement}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <div className="mt-20 flex justify-center">
              <Link href="/piercings" passHref>
                <Button 
                  variant="ghost" 
                  className="group text-zinc-500 hover:text-orange-600 text-[10px] uppercase font-black tracking-[0.3em] transition-all"
                >
                  Explore Full Archive
                  <ChevronRight size={14} className="ml-2 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
// ---------- TATTOO GALLERY (UPDATED VERSION) ----------
const TattooSection = ({ openModal }: { openModal: (imgs: string[], i: number) => void }) => {
  const [galleryItems, setGalleryItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/tattoo")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setGalleryItems(data.slice(0, 6))
        }
      })
      .catch(err => console.error("Tattoo fetch error:", err))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section id="tattoo-gallery" className="py-20 bg-black px-6 overflow-hidden">
      <div className="container mx-auto max-w-6xl">
        {/* UPGRADED TITLE */}
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none italic">
            <span className="text-white">The art of body </span>
            <span className="text-orange-500">Tattoo</span>
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-10 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((_, idx) => (
              <div key={idx} className="aspect-[3/4] bg-zinc-900 rounded-[2rem]" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-10">
              {galleryItems.map((item, idx) => (
                <motion.div
                  key={item._id}
                  whileHover={{ y: -15 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="group relative overflow-hidden rounded-[2.5rem] border border-white/10 aspect-[3/4] cursor-pointer bg-zinc-900 shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
                  onClick={() => openModal(galleryItems.map(g => g.image), idx)}
                >
                  {/* MAIN TATTOO IMAGE - NO TRANSITION */}
                  <img
                    src={item.image}
                    alt={item.placement}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* --- ARTIST OVERLAY (WHITE/ORANGE ONLY) --- */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-8">
                    
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      className="flex flex-col items-center space-y-4"
                    >
                      {/* Artist Avatar */}
                      <div className="relative">
                        <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden border-2 border-orange-500 rotate-3 shadow-2xl transition-transform group-hover:rotate-0 duration-500">
                          <img 
                            src={item.artistImage || "/default-artist.jpg"} 
                            alt={item.artistName} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {/* Star Badge */}
                        <div className="absolute -bottom-2 -right-2 bg-orange-600 text-white p-1 rounded-md shadow-lg">
                           <Star size={12} fill="currentColor" />
                        </div>
                      </div>

                      <div className="text-center">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-orange-500 mb-1">Inked By</p>
                        <p className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter italic leading-none mb-4">
                          {item.artistName || "Master Artist"}
                        </p>
                      </div>

                      {/* Style/Placement Tag */}
                      <div className="bg-white/10 backdrop-blur-md border border-orange-500/30 px-6 py-2 rounded-full shadow-xl">
                        <p className="text-white text-[10px] md:text-xs font-black uppercase tracking-[0.2em]">
                          {item.placement || "Custom Design"}
                        </p>
                      </div>
                    </motion.div>
                  </div>

                  {/* Vertical Side Label */}
                  <div className="absolute top-6 left-6 group-hover:opacity-0 transition-opacity">
                    <span className="text-[12px] font-black text-white/50 uppercase tracking-[0.3em] [writing-mode:vertical-lr]">
                      {item.placement}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
            
            {/* CTA Button */}
            <div className="mt-20 flex justify-center">
              <Link href="/tattoo" passHref>
                <Button 
                  variant="ghost" 
                  className="group text-zinc-500 hover:text-orange-600 text-[10px] uppercase font-black tracking-[0.3em] transition-all"
                >
                  Explore Full Archive
                  <ChevronRight size={14} className="ml-2 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  )
}

export const ReviewsSection = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch("/api/reviews");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        
        if (Array.isArray(data)) {
          // I-filter lang ang visible, kung walang property na isVisible, tanggalin mo muna .filter
          const visible = data.filter((r) => r.isVisible !== false); 
          setReviews(visible);
        }
      } catch (err) {
        console.error("Review Fetch Error:", err);
      } finally {
        // Siguradong hihinto ang loading kahit anong mangyari
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  // Triple content para walang putol sa infinite loop
  const sliderItems = [...reviews, ...reviews, ...reviews];

  return (
    <section id="reviews-section" className="py-24 bg-[#050505] px-4 border-t border-white/5 overflow-hidden">
      <div className="container mx-auto max-w-6xl">
        
        {/* HEADER */}
        <div className="text-center mb-16 md:mb-20 space-y-4">
          <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic leading-none">
            <span className="text-white">Client </span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-500 via-orange-400 to-yellow-400">
              Stories
            </span>
          </h2>
          <p className="mx-auto max-w-xl text-zinc-500 text-[10px] md:text-xs uppercase tracking-[0.2em] font-bold">
            Real experiences from the Junky family. Ink that lasts, stories that matter.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500 opacity-50" />
            <p className="text-[9px] uppercase font-black tracking-[0.3em] text-zinc-600">Accessing Database...</p>
          </div>
        ) : reviews.length === 0 ? (
          /* Fallback kung walang data para hindi blanko ang screen */
          <div className="text-center py-10">
            <p className="text-zinc-600 text-[10px] uppercase font-black tracking-widest">No stories found in the database.</p>
          </div>
        ) : (
          <>
            {/* AUTOMATIC SLIDER CONTAINER */}
            <div className="flex overflow-hidden relative">
              {/* Fade Overlays para swabe sa gilid */}
              <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#050505] to-transparent z-10" />
              <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#050505] to-transparent z-10" />

              <motion.div 
                className="flex gap-6 py-4"
                animate={isPaused ? {} : { x: ["0%", "-50%"] }} 
                transition={{ 
                  duration: 40, // Mas mataas na number = mas mabagal/premium
                  repeat: Infinity, 
                  ease: "linear",
                }}
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
              >
                {sliderItems.map((item, idx) => (
                  <div key={`${item.id || item.id}-${idx}`} className="w-[300px] md:w-[400px] shrink-0">
                    <Card className="relative h-full overflow-hidden border-white/5 bg-[#0a0a0a] p-6 transition-all duration-500 hover:border-orange-500/30">
                      <Quote className="absolute -top-2 -right-2 h-20 w-20 text-white/[0.02] -rotate-12" />

                      <div className="relative z-10 flex flex-col h-full">
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={10}
                                className={i < item.stars ? "fill-orange-500 text-orange-500" : "text-white/10"}
                              />
                            ))}
                          </div>
                          {item.reviewImage && (
                             <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-md border border-white/5">
                               <ImageIcon size={10} className="text-orange-400" />
                               <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Art Piece</span>
                             </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-4">
                          <p className="text-xs md:text-sm leading-relaxed text-zinc-300 italic font-medium mb-4 line-clamp-4">
                            &quot;{item.description.toUpperCase()}&quot;
                          </p>

                          {item.reviewImage && (
                            <div className="w-full h-32 rounded-xl overflow-hidden border border-white/5 shadow-2xl">
                              <img src={item.reviewImage} alt="Work" className="w-full h-full object-cover grayscale transition-all duration-700 hover:grayscale-0" />
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between border-t border-white/5 pt-6 mt-6">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-10 h-10 rounded-xl border border-white/10 overflow-hidden bg-zinc-900">
                                <img
                                  src={item.userImage || "/placeholder-avatar.png"}
                                  alt={item.name}
                                  className="w-full h-full object-cover opacity-80"
                                />
                              </div>
                              <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-orange-600 to-yellow-400 rounded-full p-0.5 border-2 border-[#050505]">
                                <ShieldCheck size={8} className="text-white" />
                              </div>
                            </div>
                            <div>
                              <h4 className="text-white text-[10px] font-black uppercase tracking-widest">
                                {item.name}
                              </h4>
                              <p className="text-zinc-600 text-[7px] uppercase font-black tracking-tighter">
                                Verified Junkie
                              </p>
                            </div>
                          </div>
                          <MessageSquareQuote className="text-zinc-900" size={20} />
                        </div>
                      </div>
                    </Card>
                  </div>
                ))}
              </motion.div>
            </div>

            <div className="mt-16 flex justify-center">
              <Link href="/reviews" passHref>
                <Button 
                  variant="ghost" 
                  className="group bg-white/5 border border-white/5 hover:border-orange-500/20 hover:bg-orange-500/5 px-10 py-6 rounded-2xl text-zinc-400 hover:text-white text-[11px] uppercase font-black tracking-[0.4em] transition-all"
                >
                  Read More 
                  <ChevronRight size={14} className="ml-2 transition-transform group-hover:translate-x-2" />
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
};
// ---------- PRODUCTS SECTION (UPDATED) ----------
const ProductSection = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.ok ? res.json() : [])
      .then((data) => {
        if (Array.isArray(data)) setProducts(data);
      })
      .catch((err) => console.error("Error fetching products:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section id="shop" className="py-20 bg-black px-6">
      <div className="container mx-auto max-w-5xl">
        
        {/* --- UPGRADED HEADER --- */}
        <div className="flex flex-col items-center text-center mb-12 space-y-3">
          <Badge className="bg-orange-500 text-white px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border-none">
            Premium Supplies
          </Badge>
          <div className="space-y-1">
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic leading-none">
              <span className="text-white">Aftercare & </span>
              <span className="text-orange-500">Jewelry</span>
            </h2>
            <p className="text-zinc-500 text-[10px] md:text-xs uppercase tracking-[0.3em] font-bold">
              High-Quality Piercings • Balms • Studio Merch
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
            {[1, 2, 3].map((i) => (
              <div key={`skeleton-${i}`} className="aspect-square bg-zinc-900/50 rounded-[2rem] animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
              {products.slice(0, 3).map((product) => (
                <motion.div
                  key={product.id || product.name} 
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="group relative bg-zinc-900/30 border border-white/5 rounded-[2rem] p-3 md:p-4 "
                >
                  {/* Product Category Tag - ORANGE */}
                  <div className="absolute top-6 left-6 z-10">
                    <span className="bg-black/60 backdrop-blur-md text-orange-500 border border-orange-500/30 text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-tighter">
                      {product.category || "Item"}
                    </span>
                  </div>

                  {/* PRODUCT IMAGE - NO TRANSITION */}
                  <div className="relative aspect-square overflow-hidden rounded-[1.2rem] mb-4 bg-zinc-800">
                    <img
                      src={product.image || "/images/placeholder.jpg"}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="space-y-1 px-1">
                    <h3 className="text-sm md:text-base font-bold text-white uppercase tracking-tight truncate">
                      {product.name}
                    </h3>
                    <div className="flex justify-between items-center">
                      <p className="text-zinc-500 text-[9px] md:text-[10px] uppercase font-bold tracking-widest">
                        In-Store Only
                      </p>
                      <span className="text-orange-500 font-black text-sm md:text-base">
                        ₱{(Number(product.selling_price) || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* BROWSE ALL BUTTON */}
            <div className="mt-12 flex justify-center">
              <Link href="/shop" passHref>
                <Button 
                  variant="ghost" 
                  className="group text-zinc-500 hover:text-orange-500 text-[10px] uppercase font-black tracking-[0.3em] transition-all"
                >
                  Browse all items
                  <ChevronRight size={14} className="ml-2 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
};
// ---------- MAIN PAGE ----------
export default function Dashboard() {
  const [modalOpen, setModalOpen] = useState(false)
  const [modalImages, setModalImages] = useState<string[]>([])
  const [modalIndex, setModalIndex] = useState(0)
  
  const openModal = (imgs: string[], i: number) => {
    setModalImages(imgs)
    setModalIndex(i)
    setModalOpen(true)
  }

  

  return (
    <div className="bg-black text-white selection:bg-orange-400/30 font-sans">
      <Navbar />

      {modalOpen && (
        <ImageModal
          images={modalImages}
          currentIndex={modalIndex}
          onClose={() => setModalOpen(false)}
        />
      )}

      <main>
        <Hero />
        <FloatingChatWidget/>
        <BlogSection />
        
        <GallerySection openModal={openModal} />
        <TattooSection openModal={openModal} />
        <ReviewsSection/>
      </main>
      <Footer />
    </div>
  )
}