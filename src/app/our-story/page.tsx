"use client";

import React from "react";
import { motion } from "framer-motion";
import { MoveRight } from "lucide-react";

// Ginawa nating PascalCase ang function name (standard sa React)
export function OurStory() {
  return (
    <section className="relative min-h-screen w-full bg-black py-24 lg:py-32 overflow-hidden selection:bg-orange-500 selection:text-white">
      <div className="mx-auto max-w-[1400px] px-6 sm:px-10 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          
          {/* LEFT SIDE: Visual/Image Section */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ once: true }}
            className="relative group"
          >
            {/* Background Decorative Text - Mas pinalabo natin para di agaw pansin */}
            <span className="absolute -top-16 -left-10 text-[120px] font-black text-white/[0.02] select-none uppercase tracking-tighter hidden md:block">
              Est. 2024
            </span>
            
            {/* Main Image Frame */}
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-white/10 bg-zinc-900">
              <img 
                src="https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?q=80&w=2071&auto=format&fit=crop" 
                alt="ADRNLN Studio Interior" 
                className="h-full w-full object-cover grayscale transition-all duration-1000 group-hover:scale-105 group-hover:grayscale-0"
              />
              
              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              
              {/* Floating Stat Card */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="absolute bottom-6 left-6 right-6 bg-black/40 backdrop-blur-md border border-white/10 p-6 rounded-xl"
              >
                <p className="text-white font-black text-xl lg:text-2xl uppercase tracking-tighter">Pure Craftsmanship</p>
                <p className="text-zinc-400 text-[10px] uppercase font-bold tracking-[0.2em] mt-1">High-End Tattoo & Piercing Studio</p>
              </motion.div>
            </div>
          </motion.div>

          {/* RIGHT SIDE: Content Section */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="flex flex-col space-y-10"
          >
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="h-[1px] w-8 bg-orange-500"></span>
                <h2 className="text-orange-500 font-black text-xs uppercase tracking-[0.5em]">The Journey</h2>
              </div>
              <h3 className="text-white text-5xl lg:text-8xl font-black uppercase italic tracking-tighter leading-[0.9]">
                More Than Just <br /> 
                <span className="text-transparent stroke-text">Ink & Skin.</span>
              </h3>
            </div>

            <div className="space-y-6 text-zinc-400 text-lg lg:text-xl leading-relaxed font-medium max-w-xl">
              <p>
                Ang <span className="text-white font-bold italic underline decoration-orange-500/50 underline-offset-4">ADRNLN</span> ay hindi lang basta tattoo shop. Ito ay santuwaryo para sa mga taong gustong ilabas ang kanilang kwento sa pamamagitan ng sining.
              </p>
              <p className="text-base lg:text-lg">
                Mula sa pinong detalye hanggang sa pinaka-matapang na obra, pinagsasama namin ang hygiene, safety, at world-class creativity. Bawat marka ay isang kolaborasyon na tatagal habambuhay.
              </p>
            </div>

            {/* CTA Button */}
            <div>
              <motion.button 
                whileHover={{ gap: "2rem" }}
                className="flex items-center gap-6 text-white font-black uppercase tracking-[0.3em] text-xs group transition-all"
              >
                Learn Our Philosophy 
                <span className="h-12 w-12 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-orange-500 group-hover:border-orange-500 group-hover:text-black transition-all duration-500">
                  <MoveRight size={20} />
                </span>
              </motion.button>
            </div>

            {/* Mini Stats - Adjusted for better spacing */}
            <div className="grid grid-cols-3 pt-12 border-t border-white/10 gap-4">
              <div className="space-y-1">
                <p className="text-white font-black text-3xl lg:text-4xl tracking-tighter">10+</p>
                <p className="text-zinc-600 text-[9px] uppercase font-black tracking-widest">Master Artists</p>
              </div>
              <div className="space-y-1">
                <p className="text-white font-black text-3xl lg:text-4xl tracking-tighter">5k+</p>
                <p className="text-zinc-600 text-[9px] uppercase font-black tracking-widest">Stories Inked</p>
              </div>
              <div className="space-y-1">
                <p className="text-white font-black text-3xl lg:text-4xl tracking-tighter">100%</p>
                <p className="text-zinc-600 text-[9px] uppercase font-black tracking-widest">Medical Grade</p>
              </div>
            </div>
          </motion.div>

        </div>
      </div>

      <style jsx>{`
        .stroke-text {
          -webkit-text-stroke: 1.5px rgba(255,255,255,0.2);
        }
      `}</style>
    </section>
  );
}