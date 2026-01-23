"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { Mail, MapPin, Phone, Send, Clock, Sparkles, ImagePlus, Calendar as CalendarIcon, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Footer } from "../components/navigation/footer";
import { Navbar } from "../components/navigation/navbar";

import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const contactInfo = [
  {
    icon: Mail,
    label: "Email Us",
    value: "caranicolas.819@icloud.com",
    href: "mailto:caranicolas.819@icloud.com",
  },
  {
    icon: Phone,
    label: "Call/Text",
    value: "+63 935 595 5699",
  },
  {
    icon: MapPin,
    label: "Studio Location",
    value: "7/11, 2nd Flr, National Road, Putatan, Muntinlupa City",
    href: "#",
  },
];

export default function ContactPage() {
  const [date, setDate] = useState<Date>();

  return (
    <>
      <Navbar />
      
      <main className="bg-black min-h-screen">
        {/* --- HERO SECTION --- */}
        <section className="relative h-[50vh] w-full flex items-center justify-center overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 hover:scale-105"
            style={{ 
              backgroundImage: `url('https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?q=80&w=2071&auto=format&fit=crop')`, 
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/60 to-black"></div>
          </div>
          

        </section>

        {/* --- FORM SECTION --- */}
        <section id="contact" className="relative w-full px-6 pb-32 mt-0 z-20">
          <div className="mx-auto w-full max-w-7xl">
            <div className="grid gap-12 lg:grid-cols-5">
              
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
                      Booking Form
                    </h2>
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-2">Personalize your session details below</p>
                  </div>

                  <form className="space-y-10">
                    {/* CLIENT NAME */}
<div className="relative group">
  <Input
    id="name"
    placeholder=""
    className="peer bg-zinc-900/40 border border-zinc-800 rounded-lg px-4 focus-visible:ring-0 focus-visible:border-orange-600 transition-all placeholder:text-zinc-700 text-white font-medium text-sm h-12"
  />
  <Label 
    htmlFor="name" 
    className="absolute left-0 -top-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 peer-focus:text-orange-600 transition-colors"
  >
    Client Name
  </Label>
</div>

                    <div className="grid gap-10 sm:grid-cols-2 mt-10">
  {/* EMAIL ADDRESS */}
  <div className="relative group">
    <Input
      id="email"
      type="email"
      placeholder=""
      className="peer bg-zinc-900/40 border border-zinc-800 rounded-lg px-4 focus-visible:ring-0 focus-visible:border-orange-600 transition-all placeholder:text-zinc-700 text-white font-medium text-sm h-12"
    />
    <Label 
      htmlFor="email" 
      className="absolute left-0 -top-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 peer-focus:text-orange-600 transition-colors"
    >
      Email Address
    </Label>
  </div>

  {/* CONTACT NUMBER */}
  <div className="relative group">
    <Input
      id="phone"
      type="tel"
      placeholder=""
      className="peer bg-zinc-900/40 border border-zinc-800 rounded-lg px-4 focus-visible:ring-0 focus-visible:border-orange-600 transition-all placeholder:text-zinc-700 text-white font-medium text-sm h-12"
    />
    <Label 
      htmlFor="phone" 
      className="absolute left-0 -top-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 peer-focus:text-orange-600 transition-colors"
    >
      Contact Number
    </Label>
  </div>
</div>
                    <div className="grid gap-10 sm:grid-cols-2">
{/* --- CUSTOM CALENDAR PICKER (Boxed Design) --- */}
<div className="relative group">
  <Label 
    className="absolute left-0 -top-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 group-focus-within:text-orange-600 transition-colors flex items-center gap-2"
  >
    Preferred Date <CalendarIcon className="h-3 w-3" />
  </Label>
  
  <Popover>
    <PopoverTrigger asChild>
      <Button
        variant={"outline"}
        className={cn(
          "w-full justify-between text-left font-bold uppercase text-xs h-12 rounded-lg px-4 hover:bg-zinc-900/60 hover:border-orange-600 transition-all duration-300",
          !date && "text-zinc-500",
          date && "text-white"
        )}
      >
        {/* Ito yung magmumulang dd/mm/yyyy gaya ng sa screenshot mo */}
        {date ? format(date, "PPP") : <span></span>}
        
        {/* Icon sa dulo gaya ng native select */}
        <div className="text-zinc-500 group-hover:text-orange-600 transition-colors">
          <CalendarIcon className="h-4 w-4" />
        </div>
      </Button>
    </PopoverTrigger>
    
    <PopoverContent 
      className="w-auto p-0 bg-zinc-950 border-zinc-800 shadow-2xl rounded-xl overflow-hidden" 
      align="start"
    >
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        initialFocus
        className="p-3 text-white"
        classNames={{
          day_selected: "bg-orange-600 text-white hover:bg-orange-600 focus:bg-orange-600 rounded-md",
          day_today: "bg-zinc-800 text-orange-500 rounded-md",
          head_cell: "text-zinc-600 font-black uppercase text-[10px] tracking-widest p-2",
          nav_button: "border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-white transition-colors",
        }}
      />
    </PopoverContent>
  </Popover>
</div>
                      {/* SELECT ARTIST (NEW) */}
                      <div className="relative group">
                        <Label htmlFor="artist" className="absolute left-0 -top-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 peer-focus:text-orange-600 transition-colors flex items-center gap-2">
                          Select Artist <User className="h-3 w-3" />
                        </Label>
                        <select
                          id="artist"
                          defaultValue=""
                          className="peer w-full h-12 bg-transparent border-0 border-b-2 border-zinc-800 rounded-none px-0 focus:outline-none focus:border-orange-600 transition-all text-white font-bold uppercase text-sm appearance-none cursor-pointer"
                        >
                          <option value="" disabled className="bg-zinc-950 text-zinc-700">Choose your artist</option>
                          <option value="artist1" className="bg-zinc-950 text-white italic">Lead Artist 1</option>
                          <option value="artist2" className="bg-zinc-950 text-white italic">Artist 2</option>
                          <option value="any" className="bg-zinc-950 text-white italic">Any Available Artist</option>
                        </select>
                        <div className="absolute right-0 top-4 pointer-events-none text-zinc-500 peer-focus:text-orange-600 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                        </div>
                      </div>
                    </div>

                    {/* SERVICE TYPE */}
                    <div className="relative group">
                      <Label htmlFor="subject" className="absolute left-0 -top-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 peer-focus:text-orange-600 transition-colors">Service Type</Label>
                      <select
                        id="subject"
                        defaultValue=""
                        className="peer w-full h-12 bg-transparent border-0 border-b-2 border-zinc-800 rounded-none px-0 focus:outline-none focus:border-orange-600 transition-all text-white font-bold uppercase text-sm appearance-none cursor-pointer"
                      >
                        <option value="" disabled className="bg-zinc-950 text-zinc-700">Select a service</option>
                        <option value="tattoo" className="bg-zinc-950 text-white">Tattoo Session</option>
                        <option value="piercing" className="bg-zinc-950 text-white">Body Piercing</option>
                      </select>
                      <div className="absolute right-0 top-4 pointer-events-none text-zinc-500 peer-focus:text-orange-600 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                      </div>
                    </div>

                    {/* IMAGE UPLOAD ZONE */}
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Reference Image (Design Idea)</Label>
                      <div className="relative">
                        <label
                          htmlFor="image-upload"
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-zinc-800 rounded-2xl cursor-pointer hover:border-orange-600/50 hover:bg-zinc-900/30 transition-all group"
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <ImagePlus className="w-8 h-8 text-zinc-600 group-hover:text-orange-600 transition-colors mb-2" />
                            <p className="text-xs text-zinc-500 font-bold uppercase tracking-tighter">Click to upload reference photo</p>
                          </div>
                          <input id="image-upload" type="file" accept="image/*" className="hidden" />
                        </label>
                      </div>
                    </div>

                    {/* PROJECT DETAILS */}
                    <div className="relative group">
                      <Textarea
                        id="message"
                        placeholder=""
                        rows={3}
                        className="peer bg-transparent border-zinc-800 rounded-2xl p-4 focus-visible:ring-0 focus-visible:border-orange-600 transition-all placeholder:text-zinc-700 text-white font-medium text-sm"
                      />
                      <Label htmlFor="message" className="absolute left-0 -top-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 peer-focus:text-orange-600 transition-colors">Project Details</Label>
                    </div>

                    <Button type="submit" className="w-full h-16 gap-3 text-sm font-black uppercase tracking-[0.2em] bg-orange-600 text-white hover:bg-white hover:text-black rounded-xl transition-all duration-500 shadow-lg shadow-orange-600/20">
                      Send Booking Request
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
                            <p className="font-bold text-zinc-200 text-xs sm:text-sm group-hover:text-white leading-tight">{info.value}</p>
                          </div>
                        </div>
                      </a>
                    </motion.div>
                  ))}
                </div>
                {/* --- GOOGLE MAPS SECTION --- */}
<motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
  className="lg:col-span-2 space-y-6" // Idagdag ito sa dulo ng sidebar column
>
  <Card className="rounded-[2rem] border-white/5 bg-zinc-900/20 overflow-hidden backdrop-blur-sm h-[300px] relative group">
    {/* Overlay Label */}
    <div className="absolute top-4 left-4 z-10">
      <Badge className="bg-black/60 backdrop-blur-md text-orange-600 border-orange-600/20 font-black uppercase text-[10px] tracking-widest px-3 py-1">
        Find Our Studio
      </Badge>
    </div>

    {/* Google Maps Iframe */}
    <iframe
      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d262.38379125846643!2d121.04477512936309!3d14.39452277690819!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397d0fa06ec1541%3A0x2703c40b18fa6b04!2s7-Eleven%20BRUGER%200078!5e0!3m2!1sen!2sph!4v1757982559859!5m2!1sen!2sph"
      width="100%"
      height="100%"
      style={{ border: 0, filter: "grayscale(1) invert(0.9) contrast(1.2)" }} 
      allowFullScreen={true}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      className="opacity-60 group-hover:opacity-100 transition-opacity duration-700"
    ></iframe>
    
    {/* Map Button Trigger */}
    <a 
      href="https://www.google.com/maps/place/7-Eleven+BRUGER+0078/@14.3949748,121.0446121,18.92z/data=!4m10!1m2!2m1!1s7%2F11,2nd+Flr,+National+Road,+Putatan,+Muntinlupa+City!3m6!1s0x3397d0fa06ec1541:0x2703c40b18fa6b04!8m2!3d14.394639!4d121.044975!15sCjU3LzExLDJuZCBGbHIsIE5hdGlvbmFsIFJvYWQsIFB1dGF0YW4sIE11bnRpbmx1cGEgQ2l0eSIDiAEBWjQiMjcgMTEgMm5kIGZsciBuYXRpb25hbCByb2FkIHB1dGF0YW4gbXVudGlubHVwYSBjaXR5kgERY29udmVuaWVuY2Vfc3RvcmWaAURDaTlEUVVsUlFVTnZaRU5vZEhsalJqbHZUMjF3Umxrd1ZsZGlhbEpXVWpOT2NsWklVakpoVm1SbVYxZDRUbVZyUlJBQuABAPoBBQiWBxAT!16s%2Fg%2F1tf73193?entry=ttu&g_ep=EgoyMDI2MDEyMC4wIKXMDSoASAFQAw%3D%3D" 
      target="_blank" 
      className="absolute bottom-4 right-4 bg-orange-600 text-white p-3 rounded-full shadow-xl hover:scale-110 active:scale-95 transition-all"
    >
      <MapPin className="h-5 w-5" />
    </a>
  </Card>
</motion.div>
  


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
                        <span className="text-white font-bold text-sm">9:00 AM — 10:00 PM</span>
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