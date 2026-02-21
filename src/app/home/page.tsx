"use client"

import React, { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion"
import Link from "next/link"
import {
  Star, ArrowRight, Facebook, Instagram,
  ChevronRight, Sparkles, X,
  ChevronLeft, MessageSquareQuote, Loader2,
  Calendar, ArrowUpRight, Zap, ImageIcon, ShieldCheck,
  AlertTriangle, ShieldX
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
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
  id: string
  name: string
  stars: number
  description: string
  userImage?: string
  reviewImage?: string
  isVisible: boolean
}

// ---------- NOISE TEXTURE OVERLAY ----------
const NoiseOverlay = () => (
  <div
    className="pointer-events-none fixed inset-0 z-[999] opacity-[0.035]"
    style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
      backgroundRepeat: "repeat",
      backgroundSize: "128px 128px",
      mixBlendMode: "overlay",
    }}
  />
)

// ---------- AGE GATE ----------
const AgeGate = ({ onConfirm }: { onConfirm: (allowed: boolean) => void }) => {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[99999] bg-black flex items-center justify-center p-6"
      >
        {/* Subtle bg texture */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(234,88,12,0.06),transparent_70%)] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-sm text-center space-y-8"
        >
          {/* Logo / Brand */}
          <div className="space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 mx-auto">
              <ShieldCheck className="text-orange-500" size={28} />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-600 mb-1">Adrenaline Junky Piercinks</p>
              <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-white leading-none">
                Age<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-yellow-400">Verification</span>
              </h1>
            </div>
          </div>

          {/* Divider */}
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mx-auto" />

          {/* Warning text */}
          <div className="space-y-2">
            <p className="text-white font-black uppercase text-sm tracking-wide">
              You must be <span className="text-orange-400">18 years or older</span> to enter.
            </p>
            <p className="text-zinc-600 text-[10px] uppercase tracking-widest font-bold">
              This site contains content related to tattoos and body piercings.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => onConfirm(true)}
              className="w-full py-4 bg-white text-black font-black uppercase text-[11px] tracking-widest rounded-2xl hover:bg-orange-500 hover:text-white transition-all shadow-lg"
            >
              Yes, I am 18 or older — Enter
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => onConfirm(false)}
              className="w-full py-4 border border-white/10 text-zinc-500 font-black uppercase text-[11px] tracking-widest rounded-2xl hover:border-white/20 hover:text-zinc-300 transition-all"
            >
              No, I am under 18 — Exit
            </motion.button>
          </div>

          <p className="text-zinc-700 text-[9px] uppercase tracking-widest font-bold">
            By entering you agree to our terms of service.
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ---------- MINOR BLOCK ----------
const MinorBlock = () => (
  <div className="fixed inset-0 z-[99999] bg-black flex items-center justify-center p-6">
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.05),transparent_70%)] pointer-events-none" />
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full max-w-sm text-center space-y-6"
    >
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 mx-auto">
        <ShieldX className="text-red-500" size={28} />
      </div>
      <div>
        <h1 className="text-3xl font-black uppercase italic tracking-tighter text-white leading-none mb-3">
          Access<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-400">Denied</span>
        </h1>
        <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold">
          Sorry, you must be 18 or older to access this site.
        </p>
      </div>
      <div className="w-16 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mx-auto" />
      <p className="text-zinc-700 text-[9px] uppercase tracking-widest font-bold max-w-xs mx-auto">
        Tattooing and body piercing services are for adults only.
      </p>
    </motion.div>
  </div>
)

// ---------- IMAGE MODAL ----------
const ImageModal = ({ images, currentIndex, onClose }: { images: string[]; currentIndex: number; onClose: () => void }) => {
  const [index, setIndex] = useState(currentIndex)
  const prev = (e?: React.MouseEvent) => { e?.stopPropagation(); setIndex(i => (i - 1 + images.length) % images.length) }
  const next = (e?: React.MouseEvent) => { e?.stopPropagation(); setIndex(i => (i + 1) % images.length) }

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
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center p-6 backdrop-blur-xl"
      onClick={onClose}
    >
      <div className="relative max-w-xl w-full flex flex-col items-center" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute -top-12 right-0 text-white/40 hover:text-white transition-colors">
          <X size={28} />
        </button>
        <div className="relative w-full aspect-square md:aspect-[4/5] bg-zinc-950 rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
          <img src={images[index]} className="w-full h-full object-contain" alt="Gallery" />
          <div className="absolute inset-y-0 left-0 flex items-center">
            <button onClick={prev} className="p-2 ml-3 bg-black/60 hover:bg-black text-white rounded-full transition-all backdrop-blur-sm border border-white/10">
              <ChevronLeft size={20} />
            </button>
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center">
            <button onClick={next} className="p-2 mr-3 bg-black/60 hover:bg-black text-white rounded-full transition-all backdrop-blur-sm border border-white/10">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
        <div className="mt-4 px-5 py-1.5 bg-white/5 border border-white/10 rounded-full">
          <p className="text-[10px] text-zinc-500 font-mono tracking-widest">{index + 1} / {images.length}</p>
        </div>
      </div>
    </motion.div>
  )
}

// ---------- HERO ----------
const Hero = () => {
  const ref = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(false)

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] })
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"])
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  // Detect mobile — disable parallax on small screens
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  return (
    <section ref={ref} id="home" className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-black">

      {/* BG: parallax on desktop, plain cover on mobile */}
      {isMobile ? (
        // Mobile — no motion.div wrapping, just a static positioned bg
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/images/about2.jpeg')", backgroundPosition: "center 45%" }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black" />
        </div>
      ) : (
        // Desktop — parallax motion
        <motion.div className="absolute inset-0" style={{ y }}>
          <div
            className="absolute inset-0 bg-cover bg-center scale-110"
            style={{ backgroundImage: "url('/images/about2.jpeg')", backgroundPosition: "center 45%" }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black" />
        </motion.div>
      )}

      {/* Red glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-red-700/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Content — opacity fade only on desktop */}
      <motion.div
        style={isMobile ? {} : { opacity }}
        className="container relative z-10 text-center px-4"
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-6"
        >
          <motion.h1
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl md:text-7xl font-black leading-[0.9] tracking-[-0.04em] text-white uppercase"
          >
            SERMON IS TEMPORARY,<br />
            <span className="relative inline-block">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-400 to-yellow-300">
                VANITY IS FOREVER!
              </span>
            </span>
          </motion.h1>

          <motion.div
            initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.8, duration: 0.8 }}
            className="mx-auto w-24 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"
          />

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link href="/book">
              <button className="group relative px-10 py-4 bg-white text-black font-black uppercase text-[11px] tracking-widest rounded-2xl overflow-hidden transition-all hover:shadow-[0_0_40px_rgba(255,255,255,0.15)] active:scale-95">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative z-10 group-hover:text-white transition-colors flex items-center gap-2">
                  Book A Session <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            </Link>
            <Link href="/shop">
              <button className="px-10 py-4 border border-white/20 text-white font-black uppercase text-[11px] tracking-widest rounded-2xl hover:border-white/50 hover:bg-white/5 transition-all active:scale-95 backdrop-blur-sm">
                Shop Now
              </button>
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}
          className="w-px h-10 bg-gradient-to-b from-white/30 to-transparent"
        />
        <span className="text-[8px] font-black uppercase tracking-[0.4em] text-zinc-600">Scroll</span>
      </motion.div>
    </section>
  )
}

// ---------- STATS MARQUEE ----------
const StatsMarquee = () => {
  const stats = ["Custom Tattoos", "Body Piercings", "Premium Aftercare", "Expert Artists", "Walk-Ins Welcome", "Putatan, Muntinlupa"]
  const repeated = [...stats, ...stats, ...stats]

  return (
    <div className="relative py-5 bg-white overflow-hidden border-y border-white/10">
      <motion.div
        animate={{ x: ["0%", "-33.33%"] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="flex gap-0 whitespace-nowrap"
      >
        {repeated.map((s, i) => (
          <div key={i} className="flex items-center gap-6 pr-8">
            <span className="text-black font-black text-xs uppercase tracking-[0.3em]">{s}</span>
            <span className="text-black/30 font-black">✦</span>
          </div>
        ))}
      </motion.div>
    </div>
  )
}

// ---------- BLOG SECTION ----------
export const BlogSection = () => {
  const [blogItems, setBlogItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/blogs")
      .then(res => res.json())
      .then(data => Array.isArray(data) ? setBlogItems(data) : null)
      .catch(err => console.error("Error fetching blogs:", err))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section id="blogs" className="relative py-24 md:py-36 bg-[#030303] border-y border-white/5 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(234,88,12,0.04),transparent_60%)]" />

      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-px w-8 bg-orange-500" />
              <span className="text-orange-500 text-[10px] font-black uppercase tracking-[0.4em]">From the Studio</span>
            </div>
            <h2 className="text-5xl md:text-7xl font-black uppercase tracking-[-0.04em] leading-none">
              <span className="text-white">Our </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-yellow-400">Journal</span>
            </h2>
          </div>
          <Link href="/blog">
            <button className="group flex items-center gap-3 text-zinc-500 hover:text-white transition-colors">
              <span className="text-[10px] font-black uppercase tracking-widest">All Posts</span>
              <div className="p-2 rounded-full border border-zinc-800 group-hover:border-white group-hover:bg-white transition-all">
                <ArrowUpRight size={12} className="group-hover:text-black transition-colors" />
              </div>
            </button>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-5 animate-pulse">
                <div className="aspect-[4/3] bg-zinc-900 rounded-3xl" />
                <div className="space-y-2">
                  <div className="h-2 bg-zinc-900 rounded w-1/4" />
                  <div className="h-5 bg-zinc-900 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {blogItems.slice(0, 3).map((post, idx) => (
              <motion.div key={post.id || post._id}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: idx * 0.12, ease: [0.16, 1, 0.3, 1] }}
                className="group flex flex-col"
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-zinc-950 border border-white/5 mb-6">
                  <Image src={post.image} alt={post.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute top-4 left-4">
                    <span className="bg-black/70 backdrop-blur-md text-orange-400 border border-orange-500/20 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                      {post.category}
                    </span>
                  </div>
                  <div className="absolute bottom-4 right-4 text-[60px] font-black leading-none text-white/5 select-none">
                    {String(idx + 1).padStart(2, '0')}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-zinc-600 text-[9px] uppercase tracking-widest font-bold mb-3">
                  <Calendar className="h-3 w-3 text-orange-600" />
                  {new Date(post.createdAt?.seconds ? post.createdAt.seconds * 1000 : post.createdAt || Date.now())
                    .toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>

                <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-tight italic leading-tight mb-4 group-hover:text-orange-400 transition-colors line-clamp-2">
                  {post.title}
                </h3>

                <Link href={`/blog/${post.id || post._id}`}
                  className="mt-auto inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors group/link">
                  Read Article
                  <ChevronRight size={12} className="group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

// ---------- PIERCING GALLERY ----------
const GallerySection = ({ openModal }: { openModal: (imgs: string[], i: number) => void }) => {
  const [galleryItems, setGalleryItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/gallery")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setGalleryItems(data.filter(item => item.category === "Piercing").slice(0, 6))
      })
      .catch(err => console.error("Gallery fetch error:", err))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section id="gallery-section" className="py-24 md:py-36 bg-black px-6 overflow-hidden">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-px w-8 bg-orange-500" />
              <span className="text-orange-500 text-[10px] font-black uppercase tracking-[0.4em]">Portfolio</span>
            </div>
            <h2 className="text-5xl md:text-7xl font-black uppercase tracking-[-0.04em] leading-none italic">
              Body<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-yellow-400">Piercings</span>
            </h2>
          </div>
          <Link href="/piercings">
            <button className="group flex items-center gap-3 text-zinc-500 hover:text-white transition-colors">
              <span className="text-[10px] font-black uppercase tracking-widest">Full Archive</span>
              <div className="p-2 rounded-full border border-zinc-800 group-hover:border-white group-hover:bg-white transition-all">
                <ArrowUpRight size={12} className="group-hover:text-black transition-colors" />
              </div>
            </button>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="aspect-[3/4] bg-zinc-900 rounded-[2rem]" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {galleryItems.map((item, idx) => (
              <motion.div key={item._id}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: idx * 0.08 }}
                whileHover={{ y: -12 }}
                className="group relative overflow-hidden rounded-[2rem] border border-white/5 aspect-[3/4] cursor-pointer bg-zinc-950 shadow-[0_20px_60px_rgba(0,0,0,0.8)]"
                onClick={() => openModal(galleryItems.map(g => g.image), idx)}
              >
                <img src={item.image} alt={item.placement} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-6">
                  <div className="flex flex-col items-center space-y-3 text-center">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-orange-500 rotate-3 group-hover:rotate-0 transition-transform duration-500 shadow-2xl">
                        <img src={item.artistImage || "/default-artist.jpg"} alt={item.artistName} className="w-full h-full object-cover" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-orange-600 p-1 rounded-md">
                        <Zap size={10} fill="currentColor" className="text-white" />
                      </div>
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.4em] text-orange-400 mb-1">Pierced By</p>
                      <p className="text-base font-black text-white uppercase italic leading-none">{item.artistName || "Master Piercer"}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm border border-white/10 px-4 py-1.5 rounded-full">
                      <p className="text-white text-[9px] font-black uppercase tracking-widest">{item.placement}</p>
                    </div>
                  </div>
                </div>
                <div className="absolute top-5 left-5 group-hover:opacity-0 transition-opacity">
                  <span className="text-[11px] font-black text-white/30 uppercase tracking-[0.3em] [writing-mode:vertical-lr]">{item.placement}</span>
                </div>
                <div className="absolute top-5 right-5 group-hover:opacity-0 transition-opacity">
                  <span className="text-[11px] font-black text-white/20 font-mono">{String(idx + 1).padStart(2, '0')}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

// ---------- TATTOO GALLERY ----------
const TattooSection = ({ openModal }: { openModal: (imgs: string[], i: number) => void }) => {
  const [galleryItems, setGalleryItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/tattoo")
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setGalleryItems(data.slice(0, 6)) })
      .catch(err => console.error("Tattoo fetch error:", err))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section id="tattoo-gallery" className="py-24 md:py-36 bg-[#030303] px-6 overflow-hidden border-t border-white/5">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-px w-8 bg-orange-500" />
              <span className="text-orange-500 text-[10px] font-black uppercase tracking-[0.4em]">Ink Work</span>
            </div>
            <h2 className="text-5xl md:text-7xl font-black uppercase tracking-[-0.04em] leading-none italic">
              Body<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-400">Tattoos</span>
            </h2>
          </div>
          <Link href="/tattoo">
            <button className="group flex items-center gap-3 text-zinc-500 hover:text-white transition-colors">
              <span className="text-[10px] font-black uppercase tracking-widest">Full Archive</span>
              <div className="p-2 rounded-full border border-zinc-800 group-hover:border-white group-hover:bg-white transition-all">
                <ArrowUpRight size={12} className="group-hover:text-black transition-colors" />
              </div>
            </button>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="aspect-[3/4] bg-zinc-900/50 rounded-[2rem]" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {galleryItems.map((item, idx) => (
              <motion.div key={item._id}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: idx * 0.08 }}
                whileHover={{ y: -12 }}
                className="group relative overflow-hidden rounded-[2rem] border border-white/5 aspect-[3/4] cursor-pointer bg-zinc-950 shadow-[0_20px_60px_rgba(0,0,0,0.8)]"
                onClick={() => openModal(galleryItems.map(g => g.image), idx)}
              >
                <img src={item.image} alt={item.placement} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-6">
                  <div className="flex flex-col items-center space-y-3 text-center">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-orange-500 rotate-3 group-hover:rotate-0 transition-transform duration-500 shadow-2xl">
                        <img src={item.artistImage || "/default-artist.jpg"} alt={item.artistName} className="w-full h-full object-cover" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-orange-600 p-1 rounded-md">
                        <Star size={10} fill="currentColor" className="text-white" />
                      </div>
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.4em] text-orange-400 mb-1">Inked By</p>
                      <p className="text-base font-black text-white uppercase italic leading-none">{item.artistName || "Master Artist"}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm border border-white/10 px-4 py-1.5 rounded-full">
                      <p className="text-white text-[9px] font-black uppercase tracking-widest">{item.placement || "Custom Design"}</p>
                    </div>
                  </div>
                </div>
                <div className="absolute top-5 left-5 group-hover:opacity-0 transition-opacity">
                  <span className="text-[11px] font-black text-white/30 uppercase tracking-[0.3em] [writing-mode:vertical-lr]">{item.placement}</span>
                </div>
                <div className="absolute top-5 right-5 group-hover:opacity-0 transition-opacity">
                  <span className="text-[11px] font-black text-white/20 font-mono">{String(idx + 1).padStart(2, '0')}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

// ---------- REVIEWS ----------
export const ReviewsSection = () => {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    fetch("/api/reviews")
      .then(res => { if (!res.ok) throw new Error(); return res.json() })
      .then(data => { if (Array.isArray(data)) setReviews(data.filter(r => r.isVisible !== false)) })
      .catch(err => console.error("Review Fetch Error:", err))
      .finally(() => setLoading(false))
  }, [])

  const sliderItems = [...reviews, ...reviews, ...reviews]

  return (
    <section id="reviews-section" className="py-24 md:py-36 bg-black border-t border-white/5 overflow-hidden">
      <div className="container mx-auto max-w-6xl px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-20">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-px w-8 bg-orange-500" />
              <span className="text-orange-500 text-[10px] font-black uppercase tracking-[0.4em]">Testimonials</span>
            </div>
            <h2 className="text-5xl md:text-7xl font-black uppercase tracking-[-0.04em] leading-none italic">
              Client<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-yellow-400">Stories</span>
            </h2>
          </div>
          <p className="text-zinc-600 text-[10px] uppercase tracking-[0.2em] font-bold max-w-xs">
            Real experiences from the Junky family. Ink that lasts, stories that matter.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-orange-500/40" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-zinc-700 text-[10px] uppercase font-black tracking-widest">No stories yet.</p>
          </div>
        ) : (
          <>
            <div className="flex overflow-hidden relative">
              <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />
              <motion.div
                className="flex gap-5 py-4"
                animate={isPaused ? {} : { x: ["0%", "-50%"] }}
                transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
              >
                {sliderItems.map((item, idx) => (
                  <div key={`${item.id}-${idx}`} className="w-[300px] md:w-[380px] shrink-0">
                    <div className="relative h-full overflow-hidden border border-white/5 bg-zinc-950 rounded-3xl p-6 hover:border-orange-500/20 transition-colors group">
                      <div className="absolute -top-3 -right-3 text-[120px] font-black leading-none text-white/[0.015] select-none pointer-events-none">"</div>
                      <div className="relative z-10">
                        <div className="flex justify-between items-start mb-5">
                          <div className="flex gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={10}
                                className={i < item.stars ? "fill-orange-500 text-orange-500" : "fill-zinc-800 text-zinc-800"} />
                            ))}
                          </div>
                          {item.reviewImage && (
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-orange-500/10 rounded-lg border border-orange-500/10">
                              <ImageIcon size={9} className="text-orange-400" />
                              <span className="text-[8px] font-black uppercase tracking-widest text-orange-400">Art Piece</span>
                            </div>
                          )}
                        </div>
                        <p className="text-[11px] md:text-xs leading-relaxed text-zinc-400 italic font-medium mb-5 line-clamp-4">
                          &quot;{item.description.toUpperCase()}&quot;
                        </p>
                        {item.reviewImage && (
                          <div className="w-full h-28 rounded-2xl overflow-hidden border border-white/5 mb-5">
                            <img src={item.reviewImage} alt="Work" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                          </div>
                        )}
                        <div className="flex items-center justify-between border-t border-white/5 pt-5">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-9 h-9 rounded-xl border border-white/10 overflow-hidden bg-zinc-900">
                                <img src={item.userImage || "/placeholder-avatar.png"} alt={item.name} className="w-full h-full object-cover opacity-80" />
                              </div>
                              <div className="absolute -bottom-1 -right-1 bg-orange-600 rounded-full p-0.5 border-2 border-zinc-950">
                                <ShieldCheck size={7} className="text-white" />
                              </div>
                            </div>
                            <div>
                              <h4 className="text-white text-[10px] font-black uppercase tracking-widest">{item.name}</h4>
                              <p className="text-zinc-700 text-[8px] uppercase font-bold tracking-tight">Verified Junkie</p>
                            </div>
                          </div>
                          <MessageSquareQuote className="text-zinc-800" size={18} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>
            <div className="mt-16 flex justify-center">
              <Link href="/reviews">
                <button className="group flex items-center gap-3 px-8 py-4 border border-zinc-800 hover:border-white/30 rounded-2xl text-zinc-500 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all">
                  Read All Stories
                  <ChevronRight size={13} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  )
}

// ---------- PRODUCTS ----------
const ProductSection = () => {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/products")
      .then(res => res.ok ? res.json() : [])
      .then(data => { if (Array.isArray(data)) setProducts(data) })
      .catch(err => console.error("Error fetching products:", err))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section id="shop" className="py-24 md:py-36 bg-[#030303] px-6 border-t border-white/5">
      <div className="container mx-auto max-w-5xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-px w-8 bg-orange-500" />
              <span className="text-orange-500 text-[10px] font-black uppercase tracking-[0.4em]">Premium Supplies</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black uppercase tracking-[-0.04em] leading-none italic">
              Aftercare &<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-yellow-400">Jewelry</span>
            </h2>
          </div>
          <Link href="/shop">
            <button className="group flex items-center gap-3 text-zinc-500 hover:text-white transition-colors">
              <span className="text-[10px] font-black uppercase tracking-widest">All Items</span>
              <div className="p-2 rounded-full border border-zinc-800 group-hover:border-white group-hover:bg-white transition-all">
                <ArrowUpRight size={12} className="group-hover:text-black transition-colors" />
              </div>
            </button>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5 animate-pulse">
            {[1, 2, 3].map(i => <div key={i} className="aspect-square bg-zinc-900/50 rounded-[2rem]" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {products.slice(0, 3).map((product, idx) => (
              <motion.div key={product.id || product.name}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: idx * 0.1 }}
                className="group relative bg-zinc-950 border border-white/5 rounded-[2rem] p-3 hover:border-orange-500/20 transition-all"
              >
                <div className="absolute top-5 left-5 z-10">
                  <span className="bg-black/70 backdrop-blur-md text-orange-400 border border-orange-500/20 text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-tight">
                    {product.category || "Item"}
                  </span>
                </div>
                <div className="relative aspect-square overflow-hidden rounded-[1.5rem] mb-4 bg-zinc-900">
                  <img src={product.image || "/images/placeholder.jpg"} alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>
                <div className="px-1 pb-1 space-y-1">
                  <h3 className="text-sm font-black text-white uppercase tracking-tight truncate">{product.name}</h3>
                  <div className="flex justify-between items-center">
                    <p className="text-zinc-600 text-[9px] uppercase font-bold tracking-widest">In-Store Only</p>
                    <span className="text-orange-400 font-black text-sm">₱{(Number(product.selling_price) || 0).toLocaleString()}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

// ---------- BOOK CTA BANNER ----------
const BookCTA = () => (
  <section className="py-24 md:py-32 bg-black border-t border-white/5 px-6 overflow-hidden relative">
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(234,88,12,0.06),transparent_70%)]" />
    <div className="container mx-auto max-w-4xl text-center relative z-10 space-y-8">
      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-600 mb-4">Ready to commit?</p>
        <h2 className="text-5xl md:text-7xl font-black uppercase tracking-[-0.04em] leading-[0.9] italic">
          <span className="text-white">Book Your</span><br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-400 to-yellow-300">Session</span>
        </h2>
        <p className="text-zinc-500 text-sm mt-6 max-w-md mx-auto font-bold uppercase tracking-widest text-[10px]">
          Custom tattoos, body piercings, and premium aftercare. Walk-ins welcome.
        </p>
      </motion.div>
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }}
        className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link href="/book">
          <button className="group px-12 py-5 bg-white hover:bg-orange-500 text-black hover:text-white font-black uppercase text-[11px] tracking-widest rounded-2xl transition-all shadow-lg active:scale-95">
            Book Now →
          </button>
        </Link>
        <Link href="/piercings">
          <button className="px-12 py-5 border border-white/15 text-white font-black uppercase text-[11px] tracking-widest rounded-2xl hover:border-white/40 hover:bg-white/5 transition-all active:scale-95">
            View Gallery
          </button>
        </Link>
      </motion.div>
    </div>
  </section>
)

// ---------- MAIN PAGE ----------
export default function Dashboard() {
  const [modalOpen, setModalOpen] = useState(false)
  const [modalImages, setModalImages] = useState<string[]>([])
  const [modalIndex, setModalIndex] = useState(0)

  // Age gate: null = not decided, true = allowed, false = blocked
  const [ageStatus, setAgeStatus] = useState<null | boolean>(null)

  useEffect(() => {
    // Check session storage so user doesn't see it every page refresh
    const saved = sessionStorage.getItem("ageConfirmed")
    if (saved === "true") setAgeStatus(true)
    else if (saved === "false") setAgeStatus(false)
    else setAgeStatus(null) // show gate
  }, [])

  const handleAgeConfirm = (allowed: boolean) => {
    sessionStorage.setItem("ageConfirmed", String(allowed))
    setAgeStatus(allowed)
  }

  const openModal = (imgs: string[], i: number) => {
    setModalImages(imgs)
    setModalIndex(i)
    setModalOpen(true)
  }

  // Show minor block screen
  if (ageStatus === false) return <MinorBlock />

  return (
    <div className="bg-black text-white selection:bg-orange-400/30 font-sans">
      <NoiseOverlay />

      {/* Age gate — show while not yet decided */}
      {ageStatus === null && <AgeGate onConfirm={handleAgeConfirm} />}

      {/* Main content — always rendered but hidden behind gate */}
      <div className={ageStatus === null ? "invisible" : ""}>
        <Navbar />
        <FloatingChatWidget />

        <AnimatePresence>
          {modalOpen && (
            <ImageModal images={modalImages} currentIndex={modalIndex} onClose={() => setModalOpen(false)} />
          )}
        </AnimatePresence>

        <main>
          <Hero />
          <StatsMarquee />
          <BlogSection />
          <GallerySection openModal={openModal} />
          <TattooSection openModal={openModal} />
          <ReviewsSection />
          <BookCTA />
        </main>

        <Footer />
      </div>
    </div>
  )
}