"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Sparkles, Heart, Award, Star, Zap, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Footer} from "../components/navigation/footer"
import { Navbar} from "../components/navigation/navbar"


// --- DATA ---
const stats = [
  { label: "Years Exp", value: "10+", icon: Award },
  { label: "Happy Clients", value: "5K+", icon: Star },
  { label: "Safety Rank", value: "A+", icon: ShieldCheck },
  { label: "Styles", value: "20+", icon: Zap },
];

const values = [
  { 
    icon: ShieldCheck, 
    title: "100% Sterile", 
    desc: "Hospital-grade sterilization for every session. Your safety is our religion." 
  },
  { 
    icon: Sparkles, 
    title: "Custom Art", 
    desc: "We don't do 'copy-paste'. Every ink is a custom story tailored for your skin." 
  },
  { 
    icon: Heart, 
    title: "Aftercare", 
    desc: "We stay with you from the first poke until your art is fully healed and vibrant." 
  },
];

// --- MAIN COMPONENT ---
export default function AboutPage() {
  return (
<>
<Navbar></Navbar>
    <main className="bg-black min-h-screen text-white overflow-hidden pb-20">

      {/* 1. HERO SECTION */}
      <section className="relative h-[70vh] flex items-center justify-center overflow-hidden">
        {/* Background Overlay */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/60 to-black z-10" />
          <img 
            src="https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?q=80&w=2071" 
            className="w-full h-full object-cover grayscale opacity-50 scale-110"
            alt="Studio background"
          />
        </div>

        <div className="relative z-20 text-center space-y-6 px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Badge className="bg-orange-600 text-white font-black px-6 py-1 uppercase italic tracking-[0.3em] mb-4">
              The Legacy
            </Badge>
            <h1 className="text-6xl md:text-9xl font-black uppercase italic tracking-tighter leading-none">
              SKIN <span className="text-zinc-600">&</span> SOUL
            </h1>
            <p className="mt-4 text-zinc-500 text-[10px] md:text-xs font-black uppercase tracking-[0.5em]">
              Adrenalin Junky Piercinks • Est. 2014
            </p>
          </motion.div>
        </div>
      </section>

      {/* 2. THE STORY (BENTO STYLE) */}
      <section className="py-24 container mx-auto max-w-7xl px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          
          {/* Bento Images Left */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 gap-4"
          >
            <div className="col-span-2 h-80 rounded-[2.5rem] overflow-hidden border border-white/5 relative group">
              <img 
                src="https://images.unsplash.com/photo-1504198458649-012800d86a68?q=80&w=1974" 
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-all" />
            </div>
            <div className="h-56 rounded-[2rem] bg-orange-600 flex items-center justify-center p-8 -rotate-3 hover:rotate-0 transition-all duration-500 cursor-default shadow-2xl shadow-orange-600/20">
              <span className="font-black text-3xl text-black uppercase italic leading-none tracking-tighter">
                INK<br/>THAT<br/>LASTS.
              </span>
            </div>
            <div className="h-56 rounded-[2rem] overflow-hidden border border-white/5 grayscale hover:grayscale-0 transition-all">
              <img 
                src="https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?q=80&w=1974" 
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>

          {/* Text Content Right */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-10"
          >
            <div className="space-y-4">
              <h2 className="text-4xl md:text-6xl font-black uppercase italic text-white leading-tight tracking-tighter">
                Beyond the <span className="text-orange-600">Needle.</span>
              </h2>
              <p className="text-zinc-400 text-base md:text-lg leading-relaxed font-medium">
                Nagsimula ang <span className="text-white font-bold">Junky Piercinks</span> sa simpleng vision: Gawing platform ang balat para sa sining na walang takot. Hindi lang kami basta shop; kami ay isang komunidad na kumikilala sa sining ng indibidwalismo.
              </p>
              <p className="text-zinc-500 text-sm md:text-base leading-relaxed italic">
                Bawat needle na ginagamit namin ay simbolo ng aming dedikasyon sa hygiene, precision, at mastery. We treat every client like family and every skin like a canvas for a masterpiece.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-8 pt-10 border-t border-white/5">
              {stats.map((stat, i) => (
                <div key={i} className="group">
                  <div className="flex items-center gap-3">
                    <stat.icon className="size-5 text-orange-600" />
                    <span className="text-3xl font-black uppercase italic italic">{stat.value}</span>
                  </div>
                  <p className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.2em] mt-1 group-hover:text-zinc-400 transition-colors">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3. CORE VALUES SECTION */}
      <section className="py-24 bg-zinc-950/50 border-y border-white/5">
        <div className="container mx-auto max-w-6xl px-8">
          <div className="text-center mb-16 space-y-4">
             <p className="text-orange-600 font-black uppercase tracking-[0.4em] text-[10px]">The Standards</p>
             <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter">Why Junkies Choose Us</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {values.map((v, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center space-y-6 group p-8 rounded-[2rem] hover:bg-zinc-900/50 transition-all duration-500"
              >
                <div className="w-20 h-20 bg-zinc-900 border border-white/10 rounded-3xl flex items-center justify-center mx-auto group-hover:bg-orange-600 group-hover:border-orange-600 transition-all duration-500 rotate-6 group-hover:rotate-0">
                  <v.icon className="size-10 text-white" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-white font-black uppercase tracking-widest text-sm">{v.title}</h3>
                  <p className="text-zinc-500 text-xs leading-relaxed max-w-[200px] mx-auto uppercase font-bold italic">{v.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>



      {/* 4. CALL TO ACTION */}
      <section className="py-24 container mx-auto px-8">
        <div className="bg-orange-600 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden group">
          <div className="relative z-10 space-y-8">
            <h2 className="text-4xl md:text-7xl font-black text-black uppercase italic tracking-tighter leading-none">
              Ready to <br/>Get Inked?
            </h2>
            <Button className="bg-black text-white rounded-full px-12 h-16 font-black uppercase tracking-widest hover:scale-105 transition-all text-xs">
              Book Your Session Now <ChevronRight className="ml-2 size-4" />
            </Button>
          </div>
          {/* Decorative Circle */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-black/10 rounded-full blur-3xl group-hover:bg-black/20 transition-all duration-700" />
        </div>
      </section>
     
    </main>
    <Footer/>
    </>
  );
}