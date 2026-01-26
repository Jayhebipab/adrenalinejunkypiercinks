"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Calendar, ArrowLeft, Loader2, Share2, Clock, Bookmark } from "lucide-react";
import { Navbar } from "../../components/navigation/navbar";
import { Footer } from "../../components/navigation/footer";
import { Button } from "@/components/ui/button";

export default function BlogPostPage() {
  const params = useParams();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetch(`/api/blogs?id=${params.id}`)
        .then((res) => res.json())
        .then((data) => setPost(data))
        .catch((err) => console.error("Error:", err))
        .finally(() => setLoading(false));
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-orange-600 animate-spin" />
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Retrieving Journal...</span>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center space-y-6">
        <h1 className="text-4xl font-black uppercase italic tracking-tighter text-zinc-800">Article Missing</h1>
        <Link href="/blog">
          <Button variant="outline" className="rounded-full border-white/10 px-8 font-black uppercase text-[10px] tracking-widest">
            Back to Journal
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black text-zinc-300 selection:bg-orange-500/30">

      {/* HEADER SECTION */}
      <section className="relative pt-32 pb-12 overflow-hidden">
        {/* Gradients */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-600/5 blur-[140px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-orange-600/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="container mx-auto px-6 max-w-4xl relative z-10 text-center md:text-left">
          <Link href="/blog" className="inline-flex items-center text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 hover:text-white transition-colors mb-12 group">
            <ArrowLeft className="mr-2 h-3 w-3 group-hover:-translate-x-2 transition-transform" />
            Return to Collective
          </Link>

          <div className="space-y-8">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
              <span className="bg-white text-black text-[9px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full">
                {post.category}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex items-center">
                <Calendar className="mr-2 h-3 w-3 text-orange-600" />
                {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex items-center">
                <Clock className="mr-2 h-3 w-3 text-orange-600" />
                5 Min Read
              </span>
            </div>

            <h1 className="text-5xl md:text-8xl font-black uppercase text-white tracking-tighter leading-[0.85] italic drop-shadow-2xl">
              {post.title}
            </h1>
          </div>
        </div>
      </section>

      {/* FEATURED IMAGE - Portrait Centered for Impact */}
      <section className="container mx-auto px-6 max-w-4xl mb-24">
        <div className="relative aspect-[4/5] md:aspect-[16/10] rounded-[3rem] overflow-hidden border border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.5)] group">
          <Image 
            src={post.image} 
            alt={post.title} 
            fill 
            className="object-cover transition-transform duration-[2s] group-hover:scale-105"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>
      </section>

      {/* CONTENT AREA */}
      <section className="container mx-auto px-6 max-w-2xl pb-32 relative">
        {/* Floating Side Button - Desktop Only */}
        <div className="hidden lg:block absolute -left-32 top-0 space-y-4">
            <Button variant="ghost" size="icon" className="rounded-full border border-white/5 hover:bg-orange-600 hover:text-white transition-all">
                <Bookmark size={18} />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full border border-white/5 hover:bg-orange-600 hover:text-white transition-all">
                <Share2 size={18} />
            </Button>
        </div>

        <div className="prose prose-invert prose-orange max-w-none">
          {/* Lead Paragraph */}
          <div className="relative mb-12">
            <span className="absolute -left-4 top-0 w-1 h-full bg-gradient-to-b from-red-600 to-orange-500 rounded-full" />
            <p className="text-2xl md:text-3xl text-white font-bold tracking-tight leading-tight italic pl-6">
              {post.content?.substring(0, 150)}...
            </p>
          </div>
          
          <div className="whitespace-pre-wrap text-zinc-400 leading-relaxed text-lg font-medium space-y-6">
            {post.content}
          </div>
        </div>

        {/* AUTHOR CARD */}
        <div className="mt-24 p-8 rounded-[2rem] bg-zinc-900/30 border border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="relative h-20 w-20 rounded-2xl overflow-hidden rotate-3">
               <div className="absolute inset-0 bg-gradient-to-tr from-red-600 to-orange-500 animate-pulse" />
               <div className="absolute inset-[2px] bg-black rounded-2xl flex items-center justify-center font-black text-white text-xl italic">
                 AJ
               </div>
            </div>
            <div className="text-center md:text-left">
              <p className="text-[10px] uppercase font-black tracking-[0.3em] text-orange-500 mb-1">Author / Founder</p>
              <p className="text-2xl font-black uppercase text-white tracking-tighter italic">Adrenaline Junky</p>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">Piercinks Studio Official</p>
            </div>
          </div>

          <Button className="rounded-full bg-white hover:bg-orange-600 text-black hover:text-white font-black uppercase text-[10px] tracking-widest h-14 px-10 transition-all">
            <Share2 className="mr-2 h-4 w-4" /> Share Story
          </Button>
        </div>
      </section>

      <Footer />
    </main>
  );
}