"use client";

import React from "react";
import { motion } from "framer-motion";
import { Navbar } from "../components/navigation/navbar";
import { Footer } from "../components/navigation/footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, User } from "lucide-react";

const blogPosts = [
  {
    id: 1,
    title: "Tattoo Aftercare: The Ultimate Guide to Healing",
    excerpt: "Nakuha mo na ang dream ink mo, ano na ang susunod? Alamin ang tamang paraan ng pag-aalaga...",
    category: "Tips & Care",
    date: "Jan 15, 2026",
    author: "Junky Admin",
    image: "https://images.unsplash.com/photo-1562967916-eb82221dfb92?q=80&w=2072",
  },
  {
    id: 2,
    title: "Top 5 Piercing Trends to Watch in 2026",
    excerpt: "Mula sa curated ears hanggang sa dermal anchors, heto ang mga nauuso ngayon sa mundo ng piercing...",
    category: "Trends",
    date: "Jan 10, 2026",
    author: "Artist Sam",
    image: "https://images.unsplash.com/photo-1590247813693-5541d1c609fd?q=80&w=1818",
  },
  {
    id: 3,
    title: "First Tattoo? Here's What You Need to Know",
    excerpt: "Kinakabahan sa unang session? Huwag mag-alala, we've got you covered sa lahat ng dapat i-expect...",
    category: "Lifestyle",
    date: "Jan 05, 2026",
    author: "Junky Admin",
    image: "https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?q=80&w=2071",
  },
];

export default function BlogPage() {
  return (
    <>
      <Navbar />
      <main className="bg-black min-h-screen pt-32 pb-20 px-6">
        <div className="mx-auto max-w-7xl">
          
          {/* HEADER SECTION */}
          <div className="mb-20 space-y-4">
            <Badge className="bg-orange-600 text-white font-black px-4 py-1 uppercase italic tracking-widest border-none">
              The Journal
            </Badge>
            <h1 className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter text-white leading-none">
              LATEST <span className="text-zinc-700 underline decoration-orange-600">STORIES.</span>
            </h1>
            <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs md:text-sm">
              Ink, Pain, and the Culture behind the needle.
            </p>
          </div>

          {/* FEATURED POST (LARGE) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="group relative h-[400px] md:h-[600px] rounded-[3rem] overflow-hidden border border-white/5 mb-12 cursor-pointer"
          >
            <img 
              src={blogPosts[0].image} 
              className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
              alt="Featured Post"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            <div className="absolute bottom-0 p-8 md:p-12 space-y-4">
              <Badge className="bg-white text-black font-black uppercase italic tracking-widest">{blogPosts[0].category}</Badge>
              <h2 className="text-3xl md:text-5xl font-black uppercase italic text-white tracking-tighter leading-none max-w-3xl">
                {blogPosts[0].title}
              </h2>
              <div className="flex items-center gap-6 text-zinc-400 text-xs font-black uppercase tracking-widest pt-2">
                <span className="flex items-center gap-2"><Calendar className="size-4 text-orange-600" /> {blogPosts[0].date}</span>
                <span className="flex items-center gap-2"><User className="size-4 text-orange-600" /> By {blogPosts[0].author}</span>
              </div>
            </div>
          </motion.div>

          {/* GRID POSTS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-10">
            {blogPosts.slice(1).map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group flex flex-col gap-6"
              >
                <div className="h-[300px] rounded-[2.5rem] overflow-hidden border border-white/5">
                  <img 
                    src={post.image} 
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105" 
                    alt={post.title}
                  />
                </div>
                <div className="space-y-4 px-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="border-orange-600 text-orange-600 font-black uppercase italic tracking-widest text-[10px]">
                      {post.category}
                    </Badge>
                    <span className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">{post.date}</span>
                  </div>
                  <h3 className="text-2xl font-black uppercase italic text-white tracking-tighter group-hover:text-orange-600 transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-zinc-500 text-sm font-medium leading-relaxed line-clamp-2">
                    {post.excerpt}
                  </p>
                  <Button variant="link" className="text-white p-0 h-auto font-black uppercase tracking-[0.2em] text-[10px] group-hover:text-orange-600 transition-colors">
                    Read Story <ArrowRight className="ml-2 size-3" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>


        </div>
      </main>
      <Footer />
    </>
  );
}