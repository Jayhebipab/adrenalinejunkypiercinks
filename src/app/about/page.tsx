"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Navbar } from '@/app/components/navigation/navbar';
import { Footer } from '@/app/components/navigation/footer';
import { ArrowRight, Info, ShieldCheck, Heart } from 'lucide-react';
import Image from 'next/image';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans selection:bg-orange-500/30">
      <Navbar />

      <main className="container mx-auto max-w-6xl px-6 py-24 md:py-32">
        
        {/* HERO SECTION */}
        <section className="mb-24 md:mb-32">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-4 md:space-y-6"
          >
            <span className="text-orange-500 font-black text-[9px] md:text-[10px] tracking-[0.4em] uppercase block">
              Established Precision
            </span>
            <h1 className="text-4xl sm:text-6xl md:text-8xl font-black tracking-tighter text-white italic uppercase leading-[0.9]">
              adrenaline junky piercing,
              <span className="block mt-2 text-zinc-800">est 2019.</span>
            </h1>
          </motion.div>
        </section>

        {/* ABOUT SECTION */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-20 items-center mb-32 md:mb-40">
          
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6 md:space-y-8 order-2 lg:order-1"
          >
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 md:w-10 h-[2px] bg-orange-500" />
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-white">
                  About Us
                </h2>
              </div>
              <p className="text-zinc-300 text-base md:text-lg leading-relaxed font-normal">
                Every customer deserves exceptional service. We provide the best accommodation, precision in Piercings & Tattoos, accurate information, and comprehensive guidance throughout the healing process.
              </p>
            </div>
            
            <p className="text-zinc-500 text-sm md:text-base leading-relaxed">
              Choosing us as your Piercer & Tattoo Artist guarantees the most satisfactory solution for your body art journey. We don't just create art—we ensure it heals perfectly and stays beautiful forever.
            </p>
          </motion.div>

          {/* MINIMALIST IMAGE */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative order-1 lg:order-2"
          >
            <div className="relative aspect-4/5 rounded-2xl md:rounded-[2rem] overflow-hidden border border-white/10 bg-zinc-900">
              <Image 
                src="/images/about3.png" 
                alt="Adrenaline Junky Studio"
                fill
                className="object-cover"
                priority
              />
            </div>
          </motion.div>

        </section>

        {/* SERVICES SECTION */}
        <section className="mb-32 md:mb-40">
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xl md:text-2xl font-black uppercase tracking-tight text-white mb-8 md:mb-12"
          >
            Our <span className="text-orange-500">Extra</span> Services
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
            {[
              { 
                title: "Consultations", 
                desc: "Professional advice on placement and design, absolutely free.", 
                icon: <Info size={20}/> 
              },
              { 
                title: "Cleaning", 
                desc: "Expert cleaning services to ensure your piercings stay healthy.", 
                icon: <ShieldCheck size={20}/> 
              },
              { 
                title: "Replacement", 
                desc: "High-quality jewelry replacement for healed piercings.", 
                icon: <Heart size={20}/> 
              }
            ].map((service, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="space-y-3 p-6 rounded-2xl border border-white/5 bg-zinc-950/50 hover:border-orange-500/20 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                  {service.icon}
                </div>
                <h3 className="font-black uppercase text-sm tracking-wide text-white">
                  {service.title}
                </h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  {service.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}