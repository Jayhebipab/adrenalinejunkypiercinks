"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Star, Quote, Loader2, MessageSquareQuote, 
  ChevronLeft, ArrowRight, ShieldCheck, ImageIcon
} from "lucide-react";
import Link from "next/link";
import { Navbar } from "../components/navigation/navbar";
import { Footer } from "../components/navigation/footer";

interface Review {
  _id: string;
  name: string;
  stars: number;
  description: string;
  userImage?: string;
  reviewImage?: string;
  isVisible: boolean;
}

const NoiseOverlay = () => (
  <div
    className="pointer-events-none fixed inset-0 z-[999] opacity-[0.03]"
    style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
      backgroundRepeat: "repeat",
      backgroundSize: "128px 128px",
      mixBlendMode: "overlay",
    }}
  />
);

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<number | "All">("All");

  useEffect(() => {
    fetch("/api/reviews")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setReviews(data.filter(r => r.isVisible));
      })
      .catch(() => console.error("Failed to fetch reviews"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "All" ? reviews : reviews.filter(r => r.stars === filter);

  const avgRating = reviews.length
    ? (reviews.reduce((acc, r) => acc + r.stars, 0) / reviews.length).toFixed(1)
    : "0.0";

  const fiveStarCount = reviews.filter(r => r.stars === 5).length;

  return (
    <>
      <NoiseOverlay />
      <Navbar />
      <main className="min-h-screen bg-black text-white">

        {/* HERO HEADER */}
        <section className="relative pt-32 pb-20 px-6 border-b border-white/5 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(234,88,12,0.05),transparent_60%)] pointer-events-none" />

          <div className="container mx-auto max-w-6xl relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-end">
              {/* Left: Title */}
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="h-px w-8 bg-orange-500" />
                  <span className="text-orange-500 text-[10px] font-black uppercase tracking-[0.4em]">The Wall of Fame</span>
                </div>
                <h1 className="text-6xl md:text-7xl font-black uppercase tracking-[-0.04em] italic leading-[0.9]">
                  Client<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-yellow-400">
                    Stories
                  </span>
                </h1>
                <p className="text-zinc-500 text-[11px] uppercase tracking-[0.2em] font-bold max-w-sm">
                  Real talk from the people who trust us with their skin. Every piercing and every drop of ink tells a story.
                </p>
              </motion.div>

              {/* Right: Stats */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.8 }}
                className="grid grid-cols-3 gap-4">
                {[
                  { label: "Avg Rating", value: avgRating, suffix: "/ 5" },
                  { label: "Reviews", value: reviews.length, suffix: "+" },
                  { label: "5 Stars", value: fiveStarCount, suffix: "" },
                ].map((stat, i) => (
                  <div key={i} className="bg-zinc-950 border border-white/5 rounded-3xl p-5 text-center">
                    <p className="text-3xl md:text-4xl font-black text-white italic tracking-tighter">
                      {stat.value}
                      <span className="text-sm text-zinc-600 ml-1">{stat.suffix}</span>
                    </p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mt-1">{stat.label}</p>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Star Filter */}
            {!loading && reviews.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                className="flex flex-wrap gap-2 mt-12 pt-8 border-t border-white/5">
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 self-center mr-2">Filter:</p>
                {(["All", 5, 4, 3, 2, 1] as (number | "All")[]).map(val => (
                  <button key={String(val)} onClick={() => setFilter(val)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                      filter === val
                        ? "bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20"
                        : "bg-zinc-950 text-zinc-500 border-zinc-900 hover:border-zinc-700 hover:text-white"
                    }`}>
                    {val === "All" ? "All" : (
                      <span className="flex items-center gap-1">
                        {val}<Star size={8} className="fill-current" />
                      </span>
                    )}
                  </button>
                ))}
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-700 self-center ml-2">
                  {filtered.length} {filtered.length === 1 ? "review" : "reviews"}
                </span>
              </motion.div>
            )}
          </div>
        </section>

        {/* REVIEWS GRID */}
        <section className="py-20 px-6">
          <div className="container mx-auto max-w-6xl">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-40 space-y-4">
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map(i => (
                    <motion.div key={i} animate={{ scaleY: [1, 2, 1] }}
                      transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
                      className="w-1 h-6 bg-orange-500 rounded-full" />
                  ))}
                </div>
                <p className="text-[9px] uppercase font-black tracking-[0.4em] text-zinc-700">Retrieving Archive...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-32">
                <p className="text-zinc-700 text-[10px] uppercase font-black tracking-widest">
                  {filter === "All" ? "No stories found yet. Be the first?" : `No ${filter}-star reviews found.`}
                </p>
              </div>
            ) : (
              <motion.div
                key={String(filter)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="columns-1 md:columns-2 lg:columns-3 gap-5 space-y-5"
              >
                {filtered.map((item, idx) => (
                  <motion.div
                    key={item._id ? `review-${item._id}` : `review-idx-${idx}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
                    className="break-inside-avoid"
                  >
                    <div className="group relative overflow-hidden border border-white/5 bg-zinc-950 rounded-3xl p-6 hover:border-orange-500/20 transition-all duration-500">
                      <div className="absolute -top-2 -right-2 text-[100px] font-black leading-none text-white/[0.02] select-none pointer-events-none group-hover:text-orange-500/5 transition-colors">"</div>

                      <div className="relative z-10">
                        {/* Stars + badge — ✅ key uses item._id + index to be unique */}
                        <div className="flex items-center justify-between mb-5">
                          <div className="flex gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star key={`${item._id}-star-${i}`} size={11}
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

                        <p className="text-sm leading-relaxed text-zinc-300 italic font-medium mb-5">
                          &quot;{item.description}&quot;
                        </p>

                        {item.reviewImage && (
                          <div className="w-full rounded-2xl overflow-hidden border border-white/5 mb-5 shadow-2xl">
                            <img src={item.reviewImage} alt="Work"
                              className="w-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                          </div>
                        )}

                        <div className="flex items-center justify-between border-t border-white/5 pt-5">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-10 h-10 rounded-xl border border-white/10 overflow-hidden bg-zinc-900">
                                <img
                                  src={item.userImage || "https://avatar.iran.liara.run/public"}
                                  alt={item.name}
                                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                />
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
                          <MessageSquareQuote className="text-zinc-800 group-hover:text-zinc-600 transition-colors" size={16} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </section>

        {/* CTA FOOTER */}
        <section className="py-24 border-t border-white/5 bg-[#030303] relative overflow-hidden px-6">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(234,88,12,0.04),transparent_70%)] pointer-events-none" />
          <div className="absolute -bottom-10 -right-10 text-white/[0.015] text-[200px] font-black uppercase italic pointer-events-none select-none leading-none">
            Reviews
          </div>

          <div className="container mx-auto max-w-3xl text-center relative z-10">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="space-y-8">
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-600">Want more proof?</p>
                <h3 className="text-5xl md:text-6xl font-black uppercase italic tracking-[-0.04em] leading-none">
                  See More on<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-yellow-400">Facebook</span>
                </h3>
                <p className="text-zinc-500 text-[10px] uppercase tracking-[0.2em] font-bold max-w-sm mx-auto">
                  Check out our community and recent works on social media.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a href="https://www.facebook.com/junkypiercing/reviews/?id=100070663572121&sk=reviews"
                  target="_blank" rel="noopener noreferrer">
                  <button className="group flex items-center gap-3 px-10 py-4 bg-white hover:bg-orange-500 text-black hover:text-white font-black uppercase text-[11px] tracking-widest rounded-2xl transition-all active:scale-95 shadow-lg">
                    Facebook Reviews
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </a>
                <Link href="/book">
                  <button className="px-10 py-4 border border-white/15 text-white font-black uppercase text-[11px] tracking-widest rounded-2xl hover:border-white/40 hover:bg-white/5 transition-all active:scale-95">
                    Book Your Session
                  </button>
                </Link>
              </div>

              <p className="text-[9px] text-zinc-700 uppercase tracking-[0.3em] font-bold">
                Join 1,000+ satisfied junkies
              </p>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}