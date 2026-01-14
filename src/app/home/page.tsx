"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { 
  ShoppingBag, ArrowRight, MapPin, Clock, 
  Phone, Instagram, Twitter, PlayCircle, Mail, Facebook 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Navbar } from "../components/navigation/navbar"
import { Footer } from "../components/navigation/footer"
import Image from "next/image"
import Swal from 'sweetalert2'

// --- Hero Section ---
const Hero = () => (
  <section id="home" className="relative flex min-h-[100vh] items-center justify-center overflow-hidden bg-black">
    <div 
      className="absolute inset-0 bg-cover bg-center"
      style={{ 
        backgroundImage: "url('/images/about2.jpeg')", 
        backgroundPosition: "center 45%" 
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-black"></div>
    </div>

    <div className="container relative z-10 mx-auto text-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9 }}
        className="space-y-6 md:space-y-8"
      >
        <p className="text-xs md:text-lg text-gray-300 uppercase tracking-[0.3em] font-medium">
          Adrenaline Junky Piercinks
        </p>

        <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-black leading-tight tracking-tighter text-white drop-shadow-[0_4px_15px_rgba(0,0,0,0.9)] uppercase">
          SERMON IS TEMPORARY,<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-orange-500 to-yellow-400">
            VANITY IS FOREVER!
          </span>
        </h1>

        <div className="flex flex-row flex-wrap gap-4 justify-center pt-8">
          <Button size="lg" className="h-12 md:h-14 rounded-full px-8 border border-white/30 bg-white/5 backdrop-blur-sm text-white font-bold hover:bg-white hover:text-black">
            View Gallery <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button size="lg" className="h-12 md:h-14 rounded-full px-8 border border-white/30 bg-transparent text-white font-bold hover:border-yellow-400 hover:text-yellow-400">
            Book Now
          </Button>
        </div>
      </motion.div>
    </div>
  </section>
)

// --- About Us Section (Centered & Not Wide) ---
const AboutUs = () => (
 <section id="about" className="relative flex min-h-[70vh] md:min-h-[85vh] items-center py-24 md:py-48 bg-black border-b border-white/5">
  <div className="container mx-auto px-6 max-w-6xl">
    <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
      
      {/* Left Side: Image */}
      <motion.div 
        initial={{ opacity: 0, x: -30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        className="relative aspect-[3/4] md:aspect-square lg:aspect-[4/5] overflow-hidden rounded-[2.5rem] border border-white/10"
      >
        <Image 
          src="/images/about3.png" 
          alt="Our Studio" 
          fill 
          className="object-cover"
        />
      </motion.div>

      {/* Right Side: Text content */}
      <motion.div 
        initial={{ opacity: 0, x: 30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        className="space-y-10"
      >
        <div className="inline-block bg-[#1a1a1a] text-white border-none rounded-md px-3 py-1 uppercase text-[10px] tracking-widest font-bold">
          SINCE 2018
        </div>
        
        <div className="space-y-4">
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase tracking-tight leading-[0.9] text-white">
            MORE THAN JUST INK.
          </h2>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase tracking-tight leading-[0.9] text-gray-500">
            IT&apos;S A LIFESTYLE.
          </h2>
        </div>

        {/* ✅ English translation & responsive text size (text-sm on mobile, text-lg on desktop) */}
        <p className="text-gray-400 text-sm md:text-lg leading-relaxed max-w-md">
          Adrenaline Junky Piercinks was established for those who are unafraid to express their true selves. From realism to fine line art, every single stroke tells a unique story.
        </p>

        <div className="pt-4">
          <Button 
            variant="outline" 
            className="h-14 rounded-full px-10 border-white/40 bg-transparent text-white hover:bg-white hover:text-black transition-all group"
          >
            <span className="flex items-center text-xs uppercase tracking-[0.2em] font-bold">
              View Stories <PlayCircle className="ml-2 h-5 w-5" />
            </span>
          </Button>
        </div>
      </motion.div>
    </div>
  </div>
</section>
)

// --- Contact Section (Centered & Uniform Inputs) ---
const ContactUs = () => {
  const [isSending, setIsSending] = useState(false)
  const [formData, setFormData] = useState({
    firstname: '', lastname: '', email: '', phone: '',
    date: '', time: '', service: '', info: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (Object.values(formData).some(val => val === '')) {
      Swal.fire({ icon: 'warning', title: 'Incomplete', text: 'Please fill all fields.', background: '#1a1a1a', color: '#fff' })
      return
    }
    setIsSending(true)
    setTimeout(() => {
      Swal.fire({ icon: 'success', title: 'Message Sent!', text: 'We will get back to you soon.', background: '#1a1a1a', color: '#fff', timer: 2000, showConfirmButton: false })
      setIsSending(false)
      setFormData({ firstname: '', lastname: '', email: '', phone: '', date: '', time: '', service: '', info: '' })
    }, 1500)
  }

  const inputStyle = "rounded-full bg-zinc-900/50 border-white/10 h-14 px-6 text-sm sm:text-base focus:border-yellow-500 focus:ring-0 transition-all placeholder:text-gray-600"

  return (
    <section id="contact" className="py-24 bg-black px-4">
  <div className="container mx-auto max-w-6xl">
    <div className="bg-[#0a0a0a] rounded-[3rem] p-8 md:p-16 border border-white/5">
      <div className="grid lg:grid-cols-2 gap-16">
        
        {/* Left Side: Info */}
        <div className="space-y-8">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white uppercase leading-none">
            Contact & <br/> Appointments
          </h2>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center text-yellow-500 border border-white/10">
                <Mail size={18}/>
              </div>
              <a href="mailto:caranicolas.819@icloud.com" className="text-sm md:text-base text-zinc-400 hover:text-white transition-colors">
                caranicolas.819@icloud.com
              </a>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center text-yellow-500 border border-white/10">
                <Phone size={18}/>
              </div>
              <p className="text-sm md:text-base text-zinc-400">+63 935 595 5699</p>
            </div>
            <div className="flex gap-6 pt-4 px-2">
              <Facebook className="text-zinc-500 hover:text-white cursor-pointer" size={22} />
              <Instagram className="text-zinc-500 hover:text-white cursor-pointer" size={22} />
            </div>
          </div>
        </div>

        {/* Right Side: Form with Labels Outside */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-4">First Name *</label>
              <Input value={formData.firstname} onChange={(e)=>setFormData({...formData, firstname: e.target.value})} className={inputStyle} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-4">Last Name *</label>
              <Input value={formData.lastname} onChange={(e)=>setFormData({...formData, lastname: e.target.value})} className={inputStyle} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-4">Email Address *</label>
              <Input type="email" value={formData.email} onChange={(e)=>setFormData({...formData, email: e.target.value})} className={inputStyle} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-4">Phone Number *</label>
              <Input value={formData.phone} onChange={(e)=>setFormData({...formData, phone: e.target.value})} className={inputStyle} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-4">Preferred Date *</label>
              <Input type="date" value={formData.date} onChange={(e)=>setFormData({...formData, date: e.target.value})} className={`${inputStyle} invert brightness-50`} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-4">Preferred Time *</label>
              <select value={formData.time} onChange={(e)=>setFormData({...formData, time: e.target.value})} className={inputStyle}>
                <option value="" className="bg-black">Select Time</option>
                <option value="9:00 AM" className="bg-black">9:00 AM</option>
                <option value="3:00 PM" className="bg-black">3:00 PM</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-4">Type of Service *</label>
            <select value={formData.service} onChange={(e)=>setFormData({...formData, service: e.target.value})} className={inputStyle}>
              <option value="" className="bg-black">Select Service</option>
              <option value="Tattoo" className="bg-black">Tattoo Art</option>
              <option value="Piercing" className="bg-black">Piercing</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-4">Inquiry Details *</label>
            <Textarea value={formData.info} onChange={(e)=>setFormData({...formData, info: e.target.value})} className="rounded-[2rem] bg-zinc-800/40 border-white/5 p-6 min-h-[120px] text-zinc-400 focus:border-yellow-500 outline-none resize-none" />
          </div>

          <Button disabled={isSending} className="w-full h-16 rounded-full bg-white text-black font-black uppercase tracking-[0.2em] hover:bg-yellow-400 transition-all text-xs mt-4">
            {isSending ? "Sending..." : "Submit Inquiry"}
          </Button>
        </form>
      </div>
    </div>
  </div>
</section>
  )
}

// --- Placeholder Sections to Complete the Page ---
const Gallery = () => (
  <section className="py-20 bg-black text-center">
    <h2 className="text-3xl font-black uppercase text-white mb-10">The Portfolio</h2>
    <div className="container mx-auto max-w-6xl grid grid-cols-2 md:grid-cols-3 gap-4 px-6">
      {[1,2,3,4,5,6].map(i => <div key={i} className="aspect-[4/5] bg-zinc-900 rounded-3xl border border-white/5"></div>)}
    </div>
  </section>
)

const Artists = () => (
  <section className="py-20 bg-zinc-950 text-center">
    <h2 className="text-3xl font-black uppercase text-white mb-10">Master Artists</h2>
    <div className="container mx-auto max-w-6xl grid grid-cols-2 md:grid-cols-3 gap-6 px-6">
      {[1,2,3].map(i => <div key={i} className="aspect-[3/4] bg-black rounded-[2rem] border border-white/5"></div>)}
    </div>
  </section>
)

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-yellow-400/30 font-sans">
      <Navbar />
      <main>
        <Hero />
        <AboutUs />
        <Gallery />
        <Artists />
        <ContactUs />
      </main>
      <Footer />
    </div>
  )
}