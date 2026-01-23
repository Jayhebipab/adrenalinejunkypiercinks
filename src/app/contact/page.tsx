"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { Mail, MapPin, Phone, Send, Clock, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Footer } from "../components/navigation/footer";
import { Navbar } from "../components/navigation/navbar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const contactInfo = [
  {
    icon: Mail,
    label: "Email Us",
    value: "caranicolas.819@icloud.com",
    href: "mailto:ink@junky-piercinks.com",
  },
  {
    icon: Phone,
    label: "Call/Text",
    value: "+63 935 595 5699",
  },
  {
    icon: MapPin,
    label: "Studio Location",
    value: "7/11, 2nd Flr, National Road, Putatan, (In front of Muntinlupa City Hall), Muntinlupa City, Philippines",
    href: "#",
  },
];

export default function ContactPage() {
  return (
    <>
      <Navbar />
      
      <main className="bg-black min-h-screen">
        {/* --- HERO SECTION WITH BG IMAGE --- */}
        <section className="relative h-[60vh] w-full flex items-center justify-center overflow-hidden">
          {/* Background Image with Overlay */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 hover:scale-105"
            style={{ 
              backgroundImage: `url('https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?q=80&w=2071&auto=format&fit=crop')`, // Pwede mong palitan 'to ng local image mo
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/70 to-black"></div>
          </div>


        </section>

        {/* --- FORM SECTION --- */}
        <section id="contact" className="relative w-full px-6 pb-32 -mt-20 z-20">
          <div className="mx-auto w-full max-w-7xl">
            <div className="grid gap-12 lg:grid-cols-5">
              
              {/* Refined Dark Form */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="lg:col-span-3"
              >
                <Card className="relative overflow-hidden rounded-[2rem] border-white/10 bg-zinc-950/50 p-8 md:p-14 backdrop-blur-xl shadow-2xl shadow-orange-900/10">
                  <div className="mb-10">
                    <h2 className="text-2xl font-black uppercase italic text-white flex items-center gap-2">
                      <Sparkles className="text-orange-600 h-5 w-5" /> 
                      Inquiry Form
                    </h2>
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-2">Expect a reply within 24-48 hours</p>
                  </div>

                  <form className="space-y-10">
                    <div className="grid gap-10 sm:grid-cols-2">
                      <div className="relative group">
                        <Input
                          id="name"
                          placeholder=""
                          className="peer bg-transparent border-zinc-800  focus-visible:ring-0 focus-visible:border-orange-600 transition-all placeholder:text-zinc-700 text-white font-medium text-sm"
                        />
                        <Label htmlFor="name" className="absolute left-0 -top-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 peer-focus:text-orange-600 transition-colors">Client Name</Label>
                      </div>

                      <div className="relative group">
                        <Input
                          id="email"
                          type="email"
                          placeholder=""
                          className="peer bg-transparent border-zinc-800 focus-visible:ring-0 focus-visible:border-orange-600 transition-all placeholder:text-zinc-700 text-white font-medium text-sm"
                        />
                        <Label htmlFor="email" className="absolute left-0 -top-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 peer-focus:text-orange-600 transition-colors">Email Address</Label>
                      </div>
                    </div>

<div className="relative group">
  <Label 
    htmlFor="subject" 
    className="absolute left-0 -top-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 peer-focus:text-orange-600 transition-colors"
  >
    Service Type
  </Label>
  
  <select
    id="subject"
    defaultValue="" // Dito na natin ilalagay ang default sa halip na sa <option>
    className="peer w-full h-12 bg-transparent border-0 border-b-2 border-zinc-800 rounded-none px-0 focus:outline-none focus:border-orange-600 transition-all text-white font-bold uppercase text-sm appearance-none cursor-pointer"
  >
    <option value="" disabled className="bg-zinc-950 text-zinc-700">
      Select a service
    </option>
    <option value="tattoo" className="bg-zinc-950 text-white">
      Tattoo Session
    </option>
    <option value="piercing" className="bg-zinc-950 text-white">
      Body Piercing
    </option>
    <option value="consultation" className="bg-zinc-950 text-white">
      Consultation
    </option>
  </select>

  {/* Custom Arrow Icon - Para hindi mukhang default browser select */}
  <div className="absolute right-0 top-4 pointer-events-none text-zinc-500 peer-focus:text-orange-600 transition-colors">
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6"/>
    </svg>
  </div>
</div>
                    <div className="relative group">
                      <Textarea
                        id="message"
                        placeholder=""
                        rows={4}
                        className="peer bg-transparent border-zinc-800 rounded-2xl p-4 focus-visible:ring-0 focus-visible:border-orange-600 transition-all placeholder:text-zinc-700 text-white font-medium text-sm"
                      />
                      <Label htmlFor="message" className="absolute left-0 -top-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 peer-focus:text-orange-600 transition-colors">Project Details</Label>
                    </div>

                    <Button type="submit" className="w-full h-16 gap-3 text-sm font-black uppercase tracking-[0.2em] bg-orange-600 text-white hover:bg-white hover:text-black rounded-xl transition-all duration-500 shadow-lg shadow-orange-600/20">
                      Send Inquiry
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </Card>
              </motion.div>

              {/* Sidebar Info */}
              <div className="lg:col-span-2 space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                  {contactInfo.map((info, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <a href={info.href} className="block group">
                        <div className="flex items-center gap-5 p-6 rounded-3xl border border-white/5 bg-zinc-900/20 hover:bg-zinc-900/60 transition-all duration-500">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800 text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-all duration-500">
                            <info.icon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">{info.label}</p>
                            <p className="font-bold text-zinc-200 text-sm group-hover:text-white">{info.value}</p>
                          </div>
                        </div>
                      </a>
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                >
                  <Card className="rounded-[2rem] border-orange-600/20 bg-gradient-to-br from-zinc-900 to-black p-8 backdrop-blur-sm relative overflow-hidden">
                    <div className="flex items-center gap-3 mb-8 text-orange-600">
                      <Clock className="h-5 w-5" />
                      <h3 className="text-xs font-black uppercase tracking-widest text-white">Studio Hours</h3>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="flex justify-between items-end border-b border-white/5 pb-4">
                        <span className="text-zinc-500 text-[10px] font-black uppercase italic">Weekdays</span>
                        <span className="text-white font-bold text-sm">9:00 AM  — 10:00 PM</span>
                      </div>
                      <div className="flex justify-between items-end border-b border-white/5 pb-4">
                        <span className="text-zinc-500 text-[10px] font-black uppercase italic">Weekends</span>
                        <span className="text-orange-500 font-bold text-sm">8:00 AM — 9:00 PM</span>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}