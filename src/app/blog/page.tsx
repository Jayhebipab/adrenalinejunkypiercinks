"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Calendar, ArrowUpRight } from "lucide-react";
import { Navbar } from "../components/navigation/navbar"; 
import { Footer } from "../components/navigation/footer";

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
    <main className="min-h-screen bg-black text-white selection:bg-orange-500/30">
      <Navbar />
      
      {/* Blog Hero/Section */}
      <section className="relative py-24 md:py-32 border-y border-white/5 overflow-hidden">
        {/* Background Fire Glow - v4 optimized */}
        <div className="absolute top-0 right-0 w-125 h-125 bg-orange-600/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-red-600/5 blur-[100px] rounded-full pointer-events-none" />

        <div className="container mx-auto px-6 max-w-7xl relative z-10">
          {/* HEADER */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-20">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full">
                <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                <span className="text-white uppercase text-[10px] tracking-[0.3em] font-black">
                  The Adrenalin Junky Journal
                </span>
              </div>
              <h1 className="text-5xl md:text-8xl font-black uppercase text-white tracking-tighter leading-[0.85] italic">
                Our <span className="text-transparent bg-clip-text bg-linear-to-r from-red-600 via-orange-500 to-yellow-400">Journal</span>
              </h1>
              <p className="text-zinc-500 max-w-xl text-sm font-bold uppercase tracking-widest leading-relaxed">
                Documenting the raw energy of tattoo culture, studio life, and the stories behind the ink.
              </p>
            </div>
          </div>

          {loading ? (
            /* SKELETON LOADING GRID */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
              {[1, 2, 3, 4, 5, 6].map((_, idx) => (
                <div key={idx} className="space-y-6 animate-pulse">
                  <div className="aspect-8/10 bg-zinc-900 rounded-[2.5rem] border border-white/5" />
                  <div className="space-y-3 px-2">
                    <div className="h-2 bg-zinc-900 rounded w-1/4" />
                    <div className="h-8 bg-zinc-900 rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* DYNAMIC BLOG GRID */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
              {blogItems.map((post, idx) => (
                <motion.div
                  key={post.id || post._id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                  className="group relative flex flex-col"
                >
                  {/* Image Container */}
                  <div className="relative aspect-8/10 overflow-hidden rounded-[2.5rem] border border-white/5 bg-zinc-900 shadow-2xl">
                    {post.image && (
                      <Image 
                        src={post.image} 
                        alt={post.title || "Blog Post"}
                        fill
                        className="object-cover transition-transform duration-1000 group-hover:scale-110"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    )}
                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-80" />
                    
                    {/* Category Badge */}
                    <div className="absolute top-6 left-6">
                      <span className="bg-black/60 backdrop-blur-md border border-white/10 text-orange-500 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full">
                        {post.category}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="pt-8 px-2 space-y-4">
                    <div className="flex items-center text-zinc-500 text-[10px] uppercase tracking-[0.2em] font-black">
                      <Calendar className="mr-2 h-3.5 w-3.5 text-orange-600" />
                      {new Date(post.createdAt?.seconds ? post.createdAt.seconds * 1000 : post.createdAt || Date.now()).toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </div>
                    <h3 className="text-2xl font-black text-white group-hover:text-orange-500 transition-colors line-clamp-2 uppercase tracking-tight italic leading-none">
                      {post.title}
                    </h3>
                    
                    <Link 
                      href={`/blog/${post.id || post._id}`} 
                      className="inline-flex items-center text-[10px] font-black uppercase tracking-[0.3em] text-white/50 group-hover:text-white pt-2 transition-all"
                    >
                      Explore Entry 
                      <div className="ml-3 p-1.5 rounded-full border border-white/10 group-hover:bg-orange-600 group-hover:border-orange-600 group-hover:text-white transition-all duration-500">
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