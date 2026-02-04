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
    if (!params.id) return;
    
    fetch(`/api/blogs?id=${params.id}`)
      .then(res => res.json())
      .then(data => setPost(data?.image ? data : null))
      .catch(err => console.error("Error:", err))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-orange-600 animate-spin" />
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600">
          Retrieving Journal...
        </span>
      </div>
    );
  }

  if (!post?.image?.trim()) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center space-y-6 px-6">
        <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter text-zinc-900">
          Article Missing
        </h1>
        <Link href="/blog">
          <Button variant="outline" className="rounded-full border-white/10 px-8 font-black uppercase text-[10px] tracking-widest hover:bg-white hover:text-black">
            Back to Journal
          </Button>
        </Link>
      </div>
    );
  }

  const formatDate = (date: any) => {
    const timestamp = date?.seconds ? date.seconds * 1000 : date;
    return new Date(timestamp).toLocaleDateString('en-US', { 
      month: 'long', day: 'numeric', year: 'numeric' 
    });
  };

  return (
    <main className="min-h-screen bg-black text-zinc-300 selection:bg-orange-500/30">
      <Navbar />

      {/* Header */}
      <section className="relative pt-32 pb-12 overflow-hidden">
        <div className="absolute top-0 right-0 w-150 h-150 bg-red-600/5 blur-[140px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-100 h-100 bg-orange-600/5 blur-[120px] rounded-full" />
        
        <div className="container mx-auto px-6 max-w-4xl relative z-10">
          <Link href="/blog" className="inline-flex items-center text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 hover:text-white mb-12 group">
            <ArrowLeft className="mr-2 h-3 w-3 group-hover:-translate-x-2 transition-transform" />
            Return to Collective
          </Link>

          <div className="space-y-8">
            <div className="flex flex-wrap items-center gap-4 md:gap-8">
              <span className="bg-white text-black text-[9px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full">
                {post.category}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex items-center">
                <Calendar className="mr-2 h-3 w-3 text-orange-600" />
                {formatDate(post.createdAt)}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex items-center">
                <Clock className="mr-2 h-3 w-3 text-orange-600" />
                5 Min Read
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black uppercase text-white tracking-tighter leading-[0.85] italic">
              {post.title}
            </h1>
          </div>
        </div>
      </section>

      {/* Featured Image */}
      <section className="container mx-auto px-6 max-w-4xl mb-24">
        <div className="relative aspect-4/5 md:aspect-16/10 rounded-[2.5rem] md:rounded-[4rem] overflow-hidden border border-white/5 shadow-2xl group">
          <Image 
            src={post.image} 
            alt={post.title || "Blog cover"} 
            fill 
            className="object-cover transition-transform duration-[2.5s] group-hover:scale-110"
            priority
            unoptimized={post.image.startsWith('http') && !post.image.includes('cloudinary')}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent" />
        </div>
      </section>

      {/* Content */}
      <section className="container mx-auto px-6 max-w-2xl pb-32 relative">
        {/* Sidebar Actions */}
        <div className="hidden lg:flex flex-col absolute -left-32 top-4 space-y-4">
          <Button variant="ghost" size="icon" className="rounded-full border border-white/5 bg-white/2 hover:bg-orange-600 w-12 h-12">
            <Bookmark size={18} />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full border border-white/5 bg-white/2 hover:bg-orange-600 w-12 h-12">
            <Share2 size={18} />
          </Button>
        </div>

        <article className="prose prose-invert prose-orange max-w-none">
          <div className="relative mb-16">
            <span className="absolute -left-6 top-0 w-1.5 h-full bg-gradient-to-b from-red-600 via-orange-500 to-transparent rounded-full" />
            <p className="text-2xl md:text-3xl text-white font-black tracking-tight leading-tight italic pl-4">
              {post.content?.split('.')[0]}.
            </p>
          </div>
          
          <div className="whitespace-pre-wrap text-zinc-400 leading-relaxed text-lg font-medium space-y-8">
            {post.content}
          </div>
        </article>

       
      </section>

      <Footer />
    </main>
  );
}