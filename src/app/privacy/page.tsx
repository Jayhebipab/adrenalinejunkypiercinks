"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  Lock, 
  EyeOff, 
  Database, 
  UserCheck, 
  ShieldAlert,
  Fingerprint
} from "lucide-react";
import { Navbar } from "../components/navigation/navbar";
import { Footer } from "../components/navigation/footer";
import FloatingChatWidget from "../components/chatbot";

const PRIVACY_DATA = {
  sections: [
    {
      id: "data-collection",
      title: "Data Collection",
      category: "INFORMATION",
      description: "How we handle the personal information you provide during booking.",
      details: [
        "Personal Details: We collect your name, contact number, and email for appointment confirmation.",
        "Health Information: Health disclosures are used strictly to assess procedure safety.",
        "Identification: Age verification is required to comply with legal modification standards.",
        "Image Rights: We only take and post photos of your tattoos/piercings with your explicit consent."
      ]
    },
    {
      id: "data-usage",
      title: "How We Use Data",
      category: "USAGE",
      description: "Your data is used solely to provide a professional and safe studio experience.",
      details: [
        "Booking Management: To schedule, reschedule, or notify you about your session.",
        "Safety Compliance: To ensure you are physically fit for the requested procedure.",
        "Studio Records: For internal documentation of procedures and jewelry used.",
        "Zero Spam Policy: We do not sell your data or use it for unrelated marketing."
      ]
    },
    {
      id: "security",
      title: "Data Security",
      category: "PROTECTION",
      description: "We implement industry-standard measures to protect your digital and physical records.",
      details: [
        "Confidentiality: Only authorized studio staff have access to your health and contact records.",
        "Digital Protection: Our booking systems use encryption to keep your data private.",
        "Storage Duration: Records are kept only as long as necessary for legal and safety follow-ups.",
        "Client Rights: You can request to view or delete your non-legal records at any time."
      ]
    }
  ],
  highlights: [
    {
      icon: Fingerprint,
      title: "Personal Identity",
      text: "Your identity is protected. We never share personal client details with third parties."
    },
    {
      icon: EyeOff,
      title: "Discreet Records",
      text: "All health disclosures are treated as highly confidential medical information."
    },
    {
      icon: UserCheck,
      title: "Your Consent",
      text: "You have full control over what information you share and how your photos are used."
    }
  ]
};

export default function PrivacyPage() {
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
              <Lock size={20} />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Privacy Policy</span>
            </div>
            <h1 className="text-6xl md:text-7xl font-[1000] uppercase tracking-tighter italic leading-none">
              DATA <span className="text-[#d11a2a]">PRIVACY</span>
            </h1>
            <p className="text-zinc-500 max-w-2xl font-medium text-sm md:text-base mx-auto md:mx-0">
              At Adrenaline Junky Piercinks, we value your trust. This policy outlines how we protect 
              your personal information and ensure your privacy throughout your journey with us.
            </p>
          </motion.div>
        </header>

        {/* PRIVACY HIGHLIGHTS */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24">
          {PRIVACY_DATA.highlights.map((item, i) => (
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

        {/* DETAILED PRIVACY SECTIONS */}
        <div className="space-y-32">
          {PRIVACY_DATA.sections.map((section) => (
            <section key={section.id} className="relative">
              <div className="flex flex-col lg:flex-row gap-12">
                <div className="lg:w-1/3">
                  <div className="sticky top-32">
                    <span className="text-[10px] font-black text-[#d11a2a] tracking-[0.4em] uppercase mb-4 block">
                      {section.category}
                    </span>
                    <h2 className="text-4xl md:text-5xl font-[1000] uppercase italic tracking-tighter leading-none mb-6">
                      {section.title}
                    </h2>
                    <p className="text-zinc-500 text-sm font-medium leading-relaxed">
                      {section.description}
                    </p>
                  </div>
                </div>

                <div className="lg:w-2/3 grid grid-cols-1 gap-4">
                  {section.details.map((detail, idx) => (
                    <motion.div 
                      key={idx}
                      whileHover={{ x: 10 }}
                      className="p-6 rounded-2xl bg-zinc-900/40 border border-white/5 flex items-start gap-4 transition-all"
                    >
                      <div className="mt-1">
                        <Database size={18} className="text-[#d11a2a]" />
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

        {/* SECURITY ALERT BLOCK */}
        <section className="mt-32 p-12 rounded-[3rem] border-2 border-dashed border-[#d11a2a]/30 text-center relative overflow-hidden">
          <ShieldAlert size={120} className="absolute -left-10 -top-10 opacity-5 text-[#d11a2a]" />
          <h3 className="text-2xl font-black uppercase italic mb-4">Concerns about your data?</h3>
          <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest mb-8">
            Contact us directly if you wish to update or remove your information from our studio records.
          </p>
          <div className="inline-block px-8 py-4 bg-zinc-900 rounded-full border border-white/10 text-[10px] font-black tracking-[0.3em] uppercase">
            Safe • Secure • Confidential
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}