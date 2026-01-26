"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Sparkles, Heart, Star, MoveRight, Scissors, Award, Zap, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Footer } from "@/app/components/navigation/footer";
import { Navbar } from "@/app/components/navigation/navbar";

// --- DATA ---
const stats = [
  { label: "Years in Chaos", value: "10Y+", icon: Award },
  { label: "Skins Inked", value: "5K+", icon: Star },
  { label: "Safety Rank", value: "A+", icon: ShieldCheck },
  { label: "Original Styles", value: "20+", icon: Zap },
];

const values = [
  { icon: ShieldCheck, title: "Sterile Lab", desc: "Hospital-grade sterilization. Your safety is our religion, zero excuses." },
  { icon: Sparkles, title: "No Copy-Paste", desc: "Custom art only. We don't follow trends; we kill them with originality." },
  { icon: Heart, title: "Blood & Care", desc: "We stay with you from the first poke until the art is fully healed and vivid." },
  { icon: Scissors, title: "Pro Piercing", desc: "Precision piercing using only surgical-grade titanium for the clean look." },
];

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="bg-[#0a0a0a] min-h-screen text-white selection:bg-orange-600 selection:text-black">
        
        {/* --- 1. RAW HERO SECTION --- */}
        <section className="relative pt-40 pb-20 border-b border-white/10 overflow-hidden">
          <div className="container mx-auto px-6 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-start"
            >
              <div className="inline-block bg-orange-600 text-black font-black uppercase italic px-4 py-1 text-xs mb-8 -rotate-2">
                The Adrenalin Legacy
              </div>
              <h1 className="text-[14vw] md:text-[11vw] font-black uppercase italic leading-[0.75] tracking-tighter">
                SKIN<span className="text-orange-600">.</span><br />
                SOUL<span className="text-orange-600">.</span><br />
                <span className="text-transparent stroke-text-heavy">SINS.</span>
              </h1>
              
              <div className="mt-12 flex flex-col md:flex-row md:items-end justify-between w-full gap-10">
                <p className="max-w-md text-zinc-500 font-bold uppercase tracking-widest text-sm leading-tight">
                  Adrenalin Junky Piercinks is not a shop. It's an underground movement of self-expression. Established 2014.
                </p>
                <div className="flex gap-10">
                    <div className="flex flex-col">
                        <span className="text-white font-black text-5xl italic leading-none tracking-tighter">10Y</span>
                        <span className="text-zinc-600 font-black text-[10px] uppercase tracking-widest">Experience</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-white font-black text-5xl italic leading-none tracking-tighter">A+</span>
                        <span className="text-zinc-600 font-black text-[10px] uppercase tracking-widest">Hygiene</span>
                    </div>
                </div>
              </div>
            </motion.div>
          </div>
          {/* Background Decor */}
          <span className="absolute -bottom-10 -right-20 text-[25vw] font-black text-white/[0.02] select-none tracking-tighter uppercase italic -rotate-12">
            JUNKY
          </span>
        </section>

        {/* --- 2. THE MANIFESTO (STORY) --- */}
        <section className="py-24 border-b border-white/10 bg-white text-black">
          <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            
            <div className="lg:col-span-7 space-y-10">
              <h2 className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter leading-[0.85]">
                WE DON'T DO <br />
                <span className="bg-black text-white px-4">NORMAL.</span>
              </h2>
              <div className="space-y-6 text-2xl font-bold leading-tight max-w-2xl">
                <p>Nagsimula ang <span className="underline decoration-orange-600 decoration-4 underline-offset-4">Junky Piercinks</span> sa simpleng pangarap: Gawing canvas ang balat para sa sining na walang takot.</p>
                <p className="text-zinc-500">Hindi kami basta shop; kami ay santuwaryo ng indibidwalismo. Bawat needle poke ay simbolo ng aming dedikasyon sa mastery.</p>
              </div>
              <motion.button 
                whileHover={{ gap: "2rem" }}
                className="flex items-center gap-6 font-black uppercase tracking-[0.3em] text-xs transition-all border-b-2 border-black pb-2"
              >
                Our Whole Journey <MoveRight size={20} />
              </motion.button>
            </div>

            <div className="lg:col-span-5 relative">
              <div className="border-[15px] border-black rotate-3 hover:rotate-0 transition-transform duration-500 group">
                <img 
                  src="https://images.unsplash.com/photo-1590201845110-386f5c888e93?q=80&w=2000" 
                  alt="Studio vibe" 
                  className="w-full grayscale group-hover:grayscale-0 transition-all duration-700"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-orange-600 text-black p-4 font-black uppercase italic -rotate-6 text-sm">
                Authentic Craft
              </div>
            </div>
          </div>
        </section>

        {/* --- 3. THE SPECS (VALUES) --- */}
        <section className="py-24 bg-black">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {values.map((v, i) => (
                <div key={i} className="group p-10 border border-white/5 hover:border-orange-600/50 hover:bg-zinc-900/30 transition-all">
                  <v.icon className="size-10 mb-8 text-orange-600 group-hover:scale-110 transition-transform" />
                  <h3 className="text-xl font-black uppercase italic mb-4">0{i+1}. {v.title}</h3>
                  <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest leading-relaxed">
                    {v.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- 4. THE CALL (CTA) --- */}
        <section className="py-40 bg-orange-600 text-black overflow-hidden relative">
          <div className="container mx-auto px-6 text-center relative z-10">
            <h2 className="text-[12vw] font-black uppercase italic leading-[0.7] tracking-tighter mb-12">
              MARK YOUR<br/>LIFETIME.
            </h2>
            <Button className="bg-black text-white hover:bg-white hover:text-black px-16 h-20 rounded-none font-black uppercase tracking-[0.5em] text-xs transition-all border-4 border-black">
              Book Your Appointment <ChevronRight className="ml-2" />
            </Button>
          </div>
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[40vw] font-black text-black/5 select-none tracking-tighter uppercase italic">
            INKED
          </span>
        </section>

      </main>
      <Footer />

      <style jsx>{`
        .stroke-text-heavy {
          -webkit-text-stroke: 2px white;
        }
        @media (max-width: 768px) {
          .stroke-text-heavy {
            -webkit-text-stroke: 1px white;
          }
        }
      `}</style>
    </>
  );
}