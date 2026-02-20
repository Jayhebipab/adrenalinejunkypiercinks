"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  ShieldCheck, 
  CheckCircle2, 
  Gem,
  Baby,
  Clock,
  AlertCircle,
  FileWarning
} from "lucide-react";
import { Navbar } from "../components/navigation/navbar";
import { Footer } from "../components/navigation/footer";
import FloatingChatWidget from "../components/chatbot";

const SAFETY_DATA = {
  protocols: [
    {
      id: "tattoo-consent",
      title: "TATTOO CONSENT & WAIVER",
      category: "TATTOO",
      description: "Official procedure guidelines and health acknowledgements for tattoo sessions.",
      details: [
        "Health & Skin Condition Disclosure: Clients must advise the tattooer of any conditions affecting healing.",
        "Influence: Clients must not be under the influence of alcohol or drugs during the session.",
        "Infection & Allergy: Acknowledgement of possible allergic reactions to pigments or processes.",
        "Color & Design: Understanding that variations in color and design may exist based on skin tone.",
        "Permanent Change: Acknowledgement that a tattoo is a permanent change to appearance.",
        "Age Requirement: Must be 18 years of age or older to undergo the procedure."
      ]
    },
    {
      id: "piercing-protocol",
      title: "PIERCING SAFETY & JEWELRY",
      category: "PIERCING",
      description: "Strict requirements for jewelry materials and studio safety for piercing procedures.",
      details: [
        "Biocompatible Materials: We only use Solid Gold, Implant-Grade Titanium, Bioplast, or Glass.",
        "Sterility: All jewelry must be sterile-sealed in a pouch with a positive indicator.",
        "Proper Fit: Initial jewelry requires extra space for swelling (Length & Gauge).",
        "Anatomical Assessment: Procedures are subject to the client's unique anatomy for safety.",
        "Aftercare: Strict compliance with provided aftercare instructions is required for healing.",
        "Downsizing: Jewelry downsizing is necessary after the initial healing period for a proper fit."
      ]
    }
  ],
  reminders: [
    {
      icon: Clock,
      title: "Reservation Policy",
      text: "The 500 PHP reservation fee is consumable but strictly NON-REFUNDABLE for cancellations or no-shows."
    },
    {
      icon: Baby,
      title: "No Children Policy",
      text: "Children and toddlers are not allowed inside the studio due to hazards and the delicate nature of our work."
    },
    {
      icon: AlertCircle,
      title: "Studio Etiquette",
      text: "Please follow all signages. The studio is a professional space dedicated to body modification safety."
    }
  ]
};

export default function SafetyPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#d11a2a]/30">
      <Navbar />
      <FloatingChatWidget/>
      
      <main className="max-w-7xl mx-auto px-6 pt-32 pb-32">
        {/* HEADER */}
        <header className="mb-20 text-center md:text-left">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="space-y-4"
          >
            <div className="flex items-center justify-center md:justify-start gap-2 text-[#d11a2a]">
              <ShieldCheck size={20} />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Official Protocols</span>
            </div>
            <h1 className="text-6xl md:text-7xl font-[1000] uppercase tracking-tighter italic leading-none">
              SAFETY <span className="text-[#d11a2a]">FIRST</span>
            </h1>
            <p className="text-zinc-500 max-w-2xl font-medium text-sm md:text-base mx-auto md:mx-0">
              Review our safety standards. At Adrenaline Junky Piercinks, we prioritize sterility, 
              professionalism, and the long-term health of your body modifications.
            </p>
          </motion.div>
        </header>

        {/* QUICK REMINDERS BOX */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24">
          {SAFETY_DATA.reminders.map((item, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-8 rounded-[2rem] bg-zinc-900/20 border border-white/5 hover:border-[#d11a2a]/20 transition-all group"
            >
              <item.icon className="text-[#d11a2a] mb-6 group-hover:scale-110 transition-transform" size={32} />
              <h4 className="text-base font-black uppercase italic mb-3 tracking-widest">{item.title}</h4>
              <p className="text-xs text-zinc-500 leading-relaxed font-bold uppercase tracking-tight">{item.text}</p>
            </motion.div>
          ))}
        </section>

        {/* PROTOCOLS DETAILED LIST */}
        <div className="space-y-32">
          {SAFETY_DATA.protocols.map((protocol, index) => (
            <section key={protocol.id} className="relative">
              <div className="flex flex-col lg:flex-row gap-12">
                {/* Side Title */}
                <div className="lg:w-1/3">
                  <div className="sticky top-32">
                    <span className="text-[10px] font-black text-[#d11a2a] tracking-[0.4em] uppercase mb-4 block">
                      {protocol.category} SECTION
                    </span>
                    <h2 className="text-4xl md:text-5xl font-[1000] uppercase italic tracking-tighter leading-none mb-6">
                      {protocol.title}
                    </h2>
                    <p className="text-zinc-500 text-sm font-medium leading-relaxed">
                      {protocol.description}
                    </p>
                  </div>
                </div>

                {/* Details List */}
                <div className="lg:w-2/3 grid grid-cols-1 gap-4">
                  {protocol.details.map((detail, idx) => (
                    <motion.div 
                      key={idx}
                      whileHover={{ x: 10 }}
                      className="p-6 rounded-2xl bg-zinc-900/40 border border-white/5 flex items-start gap-4 transition-all"
                    >
                      <div className="mt-1">
                        <CheckCircle2 size={18} className="text-[#d11a2a]" />
                      </div>
                      <p className="text-xs md:text-sm font-bold uppercase tracking-tight text-zinc-300 italic">
                        {detail}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>
          ))}
        </div>

      </main>

      <Footer />
    </div>
  );
}