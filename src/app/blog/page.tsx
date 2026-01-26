"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Calendar, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "../components/navigation/navbar"; // Siguraduhin ang @ shortcut
import { Footer } from "../components/navigation/footer";

// Palitan ang 'export const BlogSection' ng 'export default function BlogPage'
export default function BlogPage() {
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
    <main className="min-h-screen bg-black">
      <Navbar />
      
      {/* Blog Hero/Section */}
      <section className="relative py-24 md:py-32 border-y border-white/5 overflow-hidden">
        {/* Background Fire Glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-600/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="container mx-auto px-6 max-w-7xl relative z-10">
          {/* HEADER */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full">
                <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                <span className="text-white uppercase text-[10px] tracking-[0.3em] font-black">
                  The Adrenalin Junky Journal
                </span>
              </div>
              <h2 className="text-4xl md:text-6xl font-black uppercase text-white tracking-tighter leading-none">
                Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-orange-500 to-yellow-400">Journal</span>
              </h2>
            </div>
          </div>

          {loading ? (
            /* SKELETON LOADING GRID */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((_, idx) => (
                <div key={idx} className="space-y-6 animate-pulse">
                  <div className="aspect-[16/10] bg-zinc-900 rounded-3xl border border-white/5" />
                  <div className="space-y-3">
                    <div className="h-3 bg-zinc-900 rounded w-1/4" />
                    <div className="h-6 bg-zinc-900 rounded w-full" />
                    <div className="h-6 bg-zinc-900 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* DYNAMIC BLOG GRID */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogItems.map((post, idx) => (
                <motion.div
                  key={post._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="group relative flex flex-col"
                >
                  {/* Image Container */}
                  <div className="relative aspect-[8/10] overflow-hidden rounded-3xl border border-white/5 bg-zinc-900">
                    <Image 
                      src={post.image} 
                      alt={post.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                    
                    {/* Category Badge */}
                    <div className="absolute top-4 left-4">
                      <span className="bg-black/60 backdrop-blur-md border border-white/10 text-orange-500 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                        {post.category}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="pt-6 space-y-3">
                    <div className="flex items-center text-zinc-500 text-[10px] uppercase tracking-widest font-bold">
                      <Calendar className="mr-2 h-3 w-3 text-orange-600" />
                      {new Date(post.createdAt || Date.now()).toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </div>
                    <h3 className="text-xl font-bold text-white group-hover:text-orange-500 transition-colors line-clamp-2 uppercase tracking-tight italic">
                      {post.title}
                    </h3>
                    
                    <Link 
                      href={post.link || `/blog/${post._id}`} 
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
        </div>
      </section>

      <Footer />
    </main>
  );
}