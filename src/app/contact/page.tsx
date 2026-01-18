"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { Mail, MapPin, Phone, Send, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Footer } from "../components/navigation/footer";
import { Navbar } from "../components/navigation/navbar";

const contactInfo = [
  {
    icon: Mail,
    label: "Email Us",
    value: "ink@junky-piercinks.com",
    href: "mailto:ink@junky-piercinks.com",
  },
  {
    icon: Phone,
    label: "Call/Text",
    value: "+63 912 345 6789",
    href: "tel:+639123456789",
  },
  {
    icon: MapPin,
    label: "Studio Location",
    value: "123 Street, Metro Manila, PH",
    href: "#",
  },
];

export default function ContactPage() {
  return (
    <>
      <Navbar />
      
      <main className="bg-black min-h-screen">
        <section id="contact" className="relative w-full overflow-hidden px-6 py-32 lg:py-40">
          {/* Subtle Dark Grid Pattern */}
          <div className="absolute inset-0 -z-10 h-full w-full bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:30px_30px]"></div>

          <div className="mx-auto w-full max-w-7xl">
            {/* HEADER */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-16 text-center space-y-4"
            >
              <Badge className="bg-orange-600 text-white font-black px-6 py-1 uppercase italic tracking-widest border-none">
                Contact Us
              </Badge>
              <h1 className="text-4xl md:text-7xl font-black uppercase italic tracking-tighter text-white">
                Ready for your <span className="text-zinc-600 underline decoration-orange-600/50">Next Ink?</span>
              </h1>
              <p className="mx-auto max-w-2xl text-zinc-500 text-sm md:text-base uppercase font-bold tracking-wide">
                Book a consultation or visit our studio for your custom piercing needs.
              </p>
            </motion.div>

            <div className="grid gap-12 lg:grid-cols-5">
              {/* Contact Form */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="lg:col-span-3"
              >
                <Card className="relative overflow-hidden rounded-[2.5rem] border-white/5 bg-zinc-900/40 p-8 backdrop-blur-md sm:p-12">
                  <form className="relative z-10 space-y-8">
                    <div className="grid gap-8 sm:grid-cols-2">
                      <div className="space-y-3">
                        <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-zinc-400">Name</Label>
                        <Input
                          id="name"
                          placeholder="Junkie Name"
                          className="h-14 bg-black/40 border-white/5 rounded-2xl focus:border-orange-600/50 transition-all placeholder:text-zinc-700 text-white"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-zinc-400">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="your@email.com"
                          className="h-14 bg-black/40 border-white/5 rounded-2xl focus:border-orange-600/50 transition-all placeholder:text-zinc-700 text-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="subject" className="text-xs font-black uppercase tracking-widest text-zinc-400">Service Type</Label>
                      <Input
                        id="subject"
                        placeholder="Tattoo, Piercing, or Consultation?"
                        className="h-14 bg-black/40 border-white/5 rounded-2xl focus:border-orange-600/50 transition-all placeholder:text-zinc-700 text-white"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="message" className="text-xs font-black uppercase tracking-widest text-zinc-400">Project Details</Label>
                      <Textarea
                        id="message"
                        placeholder="Describe your design, size, and placement..."
                        rows={4}
                        className="resize-none bg-black/40 border-white/5 rounded-3xl focus:border-orange-600/50 transition-all placeholder:text-zinc-700 text-white"
                      />
                    </div>

                    <Button type="submit" className="w-full h-16 gap-3 text-sm font-black uppercase tracking-[0.2em] bg-white text-black hover:bg-orange-600 hover:text-white rounded-full transition-all duration-500">
                      Send Inquiry
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </Card>
              </motion.div>

              {/* Contact Info & Working Hours */}
              <div className="lg:col-span-2 space-y-8">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                  {contactInfo.map((info, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <a href={info.href} className="block group">
                        <Card className="overflow-hidden rounded-3xl border-white/5 bg-zinc-900/40 p-6 transition-all duration-500 hover:border-orange-600/40 hover:bg-zinc-900/60 backdrop-blur-sm">
                          <div className="flex items-center gap-5">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-black border border-white/5 text-orange-600 transition-all duration-500 group-hover:bg-orange-600 group-hover:text-white group-hover:rotate-6">
                              <info.icon className="h-6 w-6" />
                            </div>
                            <div>
                              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                                {info.label}
                              </h3>
                              <p className="font-bold text-white group-hover:text-orange-600 transition-colors text-sm md:text-base">
                                {info.value}
                              </p>
                            </div>
                          </div>
                        </Card>
                      </a>
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                >
                  <Card className="rounded-[2rem] border-white/5 bg-zinc-900/40 p-8 backdrop-blur-sm relative overflow-hidden">
                    <div className="flex items-center gap-3 mb-6 text-orange-600">
                      <Clock className="h-5 w-5" />
                      <h3 className="text-sm font-black uppercase tracking-widest text-white">Studio Hours</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-xs uppercase font-bold tracking-tighter">
                        <span className="text-zinc-500">Mon — Fri</span>
                        <span className="text-white">10:00 AM - 08:00 PM</span>
                      </div>
                      <div className="flex justify-between items-center text-xs uppercase font-bold tracking-tighter border-t border-white/5 pt-4">
                        <span className="text-zinc-500">Sat — Sun</span>
                        <span className="text-white">11:00 AM - 06:00 PM</span>
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