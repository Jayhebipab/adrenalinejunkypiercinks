"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  Gavel, 
  HandCoins, 
  Ban, 
  Scale,
  FileSignature,
  ShieldAlert,
  Gem,
  UserCheck
} from "lucide-react";
import { Navbar } from "../components/navigation/navbar";
import { Footer } from "../components/navigation/footer";

const TERMS_DATA = {
  sections: [
    {
      id: "booking-terms",
      title: "Booking & Deposits",
      category: "APPOINTMENTS",
      description: "Financial commitments and entry protocols for scheduled sessions.",
      details: [
        "Reservation Fee: The 500 PHP reservation fee is consumable during your appointment and deductible from your total studio bill.",
        "Non-Refundable: The 500 PHP fee is strictly NON-REFUNDABLE in case of cancellations or no-shows.",
        "Confirmed Entry: Only clients with confirmed appointments or valid walk-ins are allowed to enter the studio.",
        "Fixed Pricing: Prices are fixed once agreed upon during consultation. No haggling or low-balling inside the studio."
      ]
    },
    {
      id: "studio-security",
      title: "Studio Safety & Security",
      category: "SECURITY",
      description: "Strict guidelines implemented for the peace of mind of our clients and team.",
      details: [
        "No Companion Policy: Companions are not permitted unless absolutely necessary for security and to maintain a calm, focused environment.",
        "No Children Policy: We strictly do not allow children or toddlers inside the studio due to hazards and delicate modification procedures.",
        "Security Measures: These stricter guidelines follow recent reports of security incidents to keep everyone safe.",
        "Studio Etiquette: Please follow all signages; the studio is a professional workspace, not a place for children."
      ]
    },
    {
      id: "piercing-jewelry",
      title: "Jewelry & Piercing Standards",
      category: "PIERCING",
      description: "Requirements for jewelry materials and procedure eligibility.",
      details: [
        "Personal Jewelry: We allow personal jewelry if it is Biocompatible (Solid Gold, Implant-Grade Titanium, Bioplast, or Glass).",
        "Sterility: Personal jewelry must be sterile-sealed in a pouch with a positive indicator (e.g., Brown/Dark Green for autoclave).",
        "Proper Fit: Initial jewelry requires extra space for swelling (Length & Gauge); downsizing is required later for a proper fit.",
        "Anatomical Assessment: All procedures are subject to an artist's assessment of your unique anatomy for safety."
      ]
    },
    {
      id: "tattoo-consent",
      title: "Tattoo Consent & Health",
      category: "TATTOO",
      description: "Legal acknowledgements and health disclosures for tattoo procedures.",
      details: [
        "Age Verification: You acknowledge that you are over the age of eighteen (18) and have truthfully represented this to the artist.",
        "Medical Disclosure: You must advise the artist of any conditions (acne, keloids, psoriasis) or infections anywhere on your body.",
        "Permanent Change: You acknowledge that a tattoo is a permanent change to your appearance with no representations for later removal.",
        "Sobriety & Health: You confirm you are not pregnant, nursing, or under the influence of alcohol or drugs during the session.",
        "Color Variation: You understand that variations in color/design may exist and colors may not appear as bright on dark skin as on light skin."
      ]
    }
  ],
  highlights: [
    {
      icon: HandCoins,
      title: "500 PHP Deposit",
      text: "Consumable but strictly non-refundable for no-shows."
    },
    {
      icon: Ban,
      title: "No Companions",
      text: "Strictly only the client is allowed inside for security and focus."
    },
    {
      icon: UserCheck,
      title: "Age 18+",
      text: "Valid ID and truthful age representation are required for all procedures."
    }
  ]
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#d11a2a]/30">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-6 pt-32 pb-32">
        {/* HEADER */}
        <header className="mb-20 text-center md:text-left">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="space-y-4"
          >
            <div className="flex items-center justify-center md:justify-start gap-2 text-[#d11a2a]">
              <Scale size={20} />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Official Terms</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-[1000] uppercase tracking-tighter italic leading-none">
              TERMS OF <span className="text-[#d11a2a]">SERVICE</span>
            </h1>
            <p className="text-zinc-500 max-w-2xl font-medium text-sm md:text-base mx-auto md:mx-0 uppercase tracking-tight">
              By booking at Adrenaline Junky Piercinks, you automatically agree to the 
              following studio protocols and legal waivers.
            </p>
          </motion.div>
        </header>

        {/* QUICK HIGHLIGHTS */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24">
          {TERMS_DATA.highlights.map((item, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-8 rounded-[2rem] bg-zinc-900/20 border border-white/5 hover:border-[#d11a2a]/20 transition-all group"
            >
              <item.icon className="text-[#d11a2a] mb-6 group-hover:scale-110 transition-transform" size={32} />
              <h4 className="text-base font-black uppercase italic mb-3 tracking-widest">{item.title}</h4>
              <p className="text-[10px] text-zinc-500 leading-relaxed font-bold uppercase tracking-widest">{item.text}</p>
            </motion.div>
          ))}
        </section>

        {/* DETAILED SECTIONS */}
        <div className="space-y-32">
          {TERMS_DATA.sections.map((section) => (
            <section key={section.id} className="relative">
              <div className="flex flex-col lg:flex-row gap-12">
                {/* Side Title */}
                <div className="lg:w-1/3">
                  <div className="sticky top-32">
                    <span className="text-[10px] font-black text-[#d11a2a] tracking-[0.4em] uppercase mb-4 block">
                      {section.category}
                    </span>
                    <h2 className="text-4xl md:text-5xl font-[1000] uppercase italic tracking-tighter leading-none mb-6">
                      {section.title}
                    </h2>
                    <p className="text-zinc-500 text-sm font-bold uppercase tracking-tighter leading-relaxed">
                      {section.description}
                    </p>
                  </div>
                </div>

                {/* Details List */}
                <div className="lg:w-2/3 grid grid-cols-1 gap-4">
                  {section.details.map((detail, idx) => (
                    <motion.div 
                      key={idx}
                      whileHover={{ x: 10 }}
                      className="p-6 rounded-2xl bg-zinc-900/40 border border-white/5 flex items-start gap-4 transition-all"
                    >
                      <div className="mt-1 text-[#d11a2a]">
                        <Gavel size={18} />
                      </div>
                      <p className="text-xs md:text-sm font-bold uppercase tracking-tight text-zinc-300 italic leading-relaxed">
                        {detail}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>
          ))}
        </div>

        {/* FINAL ACKNOWLEDGEMENT */}
        <section className="mt-32 p-12 rounded-[3rem] bg-[#d11a2a] text-white text-center relative overflow-hidden">
          <ShieldAlert size={150} className="absolute -right-10 -bottom-10 opacity-20 rotate-12" />
          <h3 className="text-3xl md:text-5xl font-[1000] uppercase italic tracking-tighter mb-4 relative z-10">
            Strict Enforcement
          </h3>
          <p className="text-white/90 text-xs md:text-sm font-black uppercase tracking-[0.2em] max-w-2xl mx-auto relative z-10">
            These terms are in place to ensure a safe and professional environment for both our clients and artists. 
            No exceptions will be made.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}