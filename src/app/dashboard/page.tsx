"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, Scissors, PenTool, Star, ArrowRight, ChevronUp, Facebook, Instagram, Twitter, ShieldCheck, Flame } from "lucide-react"

export default function TattooShopLanding() {
    const [isScrolled, setIsScrolled] = useState(false)
    const [isNavOpen, setIsNavOpen] = useState(false)

    // Ganti dengan logo Tattoo Shop Anda
    const LOGO_TEXT = "INK & IRON" 

    const navLinks = [
        { name: "Portfolio", href: "/portfolio" },
        { name: "Artists", href: "/artists" },
        { name: "Aftercare", href: "/aftercare" },
        { name: "Contact", href: "/contact" },
    ]

    const artistData = [
        {
            title: "Blackwork Master",
            category: "Traditional",
            description: "Spesialis dalam garis tegas dan kontras tinggi. Mengubah kulit menjadi kanvas abadi.",
            image: "https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?q=80&w=2071"
        },
        {
            title: "Fine Line Specialist",
            category: "Minimalist",
            description: "Detail mikroskopis untuk makna yang mendalam. Presisi adalah segalanya.",
            image: "https://images.unsplash.com/photo-1560707303-4e980ce876ad?q=80&w=1932"
        }
    ]

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 50)
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-[#d11a2a]/30 selection:text-white overflow-x-hidden">

            {/* --- 1. NAVIGATION --- */}
            <nav className={`fixed top-0 left-0 w-full z-[1000] transition-all duration-500 ${isScrolled ? "py-3 bg-black/90 backdrop-blur-md" : "py-6"}`}>
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    
                    <Link href="/" className="relative z-10">
                        <span className="text-2xl font-black tracking-tighter text-white">
                            {LOGO_TEXT}<span className="text-[#d11a2a]">.</span>
                        </span>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden lg:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <Link key={link.name} href={link.href} className="text-[10px] font-bold uppercase tracking-[0.2em] hover:text-[#d11a2a] transition-colors">
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    <div className="hidden lg:block relative z-10">
                        <Link href="/book" className="bg-[#d11a2a] text-white px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all">
                            Book Session
                        </Link>
                    </div>

                    <button className="lg:hidden p-2" onClick={() => setIsNavOpen(true)}>
                        <Menu size={28} />
                    </button>
                </div>
            </nav>

            {/* --- 2. HERO SECTION --- */}
            <section className="relative h-screen flex items-center justify-center overflow-hidden">
                <motion.div 
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 0.4 }}
                    transition={{ duration: 2 }}
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url('https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-[#0a0a0a]" />

                <div className="relative z-10 px-6 text-center">
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[#d11a2a] text-sm font-black uppercase tracking-[0.5em] mb-4 block">
                        Skin Artistry & Legacy
                    </motion.span>
                    <motion.h1 
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="text-7xl md:text-9xl font-black uppercase tracking-tighter leading-[0.8] mb-8"
                    >
                        INKED FOR <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-500">ETERNITY</span>
                    </motion.h1>
                    <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 italic">
                        "Bukan sekadar tato, tapi cerita yang dipahat secara permanen dengan standar medis tertinggi."
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button className="bg-white text-black px-10 py-4 rounded-full font-black uppercase tracking-widest hover:bg-[#d11a2a] hover:text-white transition-all">View Gallery</button>
                        <button className="border border-white/20 backdrop-blur-md px-10 py-4 rounded-full font-black uppercase tracking-widest hover:bg-white/10 transition-all">Our Artists</button>
                    </div>
                </div>
            </section>

            {/* --- 3. ABOUT / WHY US --- */}
            <section className="py-32 px-6 bg-[#0a0a0a]">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-20 items-center mb-32">
                        <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                            <h2 className="text-5xl md:text-6xl font-black tracking-tighter uppercase mb-8">
                                STERILE. <br /><span className="text-[#d11a2a]">PROFESSIONAL.</span> <br />ARTISTIC.
                            </h2>
                            <p className="text-gray-400 text-lg leading-relaxed mb-8">
                                Di Ink & Iron, kami menggabungkan teknik tradisional dengan inovasi modern. Setiap jarum yang kami gunakan 100% sekali pakai, dan setiap tinta yang kami pilih adalah kualitas premium dunia.
                            </p>
                            <div className="grid grid-cols-2 gap-6">
                                {[["10k+", "Happy Skins"], ["15+", "Award Winning"]].map(([val, label]) => (
                                    <div key={label} className="border-l-2 border-[#d11a2a] pl-4">
                                        <div className="text-3xl font-black">{val}</div>
                                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                        <div className="relative rounded-2xl overflow-hidden grayscale hover:grayscale-0 transition-all duration-700">
                            <img src="https://images.unsplash.com/photo-1590201772213-913076e01a40?q=80&w=2070" alt="Tattoo Artist" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { icon: ShieldCheck, title: "Safety First", desc: "Protokol sterilisasi tingkat medis dan penggunaan peralatan premium bersertifikat." },
                            { icon: PenTool, title: "Custom Design", desc: "Kami tidak sekadar menempel gambar; kami mendesain karya unik khusus untuk Anda." },
                            { icon: Flame, title: "Culture", desc: "Lebih dari sekadar studio, ini adalah tempat berkumpulnya komunitas seni urban." }
                        ].map((item, i) => (
                            <div key={i} className="p-10 rounded-2xl bg-white/5 border border-white/10 hover:border-[#d11a2a]/50 transition-all group">
                                <item.icon size={40} className="text-[#d11a2a] mb-6 group-hover:scale-110 transition-transform" />
                                <h3 className="text-xl font-black uppercase mb-4">{item.title}</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- 4. FEATURED ARTISTS --- */}
            <section className="py-32 bg-[#0f0f0f] border-y border-white/5">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-20">
                        <span className="text-[#d11a2a] text-[10px] font-black uppercase tracking-[0.4em] mb-4 block">The Hands Behind the Ink</span>
                        <h2 className="text-5xl font-black uppercase tracking-tighter">MEET THE <span className="text-[#d11a2a]">ARTISTS</span></h2>
                    </div>

                    <div className="flex flex-wrap justify-center gap-10">
                        {artistData.map((artist, idx) => (
                            <div key={idx} className="group relative h-[600px] w-full lg:w-[450px] rounded-3xl overflow-hidden grayscale hover:grayscale-0 transition-all duration-500">
                                <img src={artist.image} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={artist.title} />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                                <div className="absolute inset-0 p-10 flex flex-col justify-end">
                                    <span className="bg-[#d11a2a] text-[9px] font-black uppercase px-3 py-1 rounded-sm w-fit mb-4">{artist.category}</span>
                                    <h3 className="text-3xl font-black mb-2 uppercase">{artist.title}</h3>
                                    <p className="text-gray-400 text-sm mb-6">{artist.description}</p>
                                    <div className="flex items-center gap-3 text-white text-[10px] font-bold uppercase tracking-widest group-hover:text-[#d11a2a] transition-colors">
                                        View Portfolio <ArrowRight size={14} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- 5. FOOTER --- */}
            <footer className="bg-black pt-24 pb-12">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
                        <div className="col-span-1">
                            <h2 className="text-2xl font-black mb-6">{LOGO_TEXT}<span className="text-[#d11a2a]">.</span></h2>
                            <p className="text-gray-500 text-sm mb-8">Studio tato premium yang mengutamakan kualitas, sterilisasi, dan kepuasan batin pelanggan.</p>
                            <div className="flex gap-4">
                                <Instagram className="hover:text-[#d11a2a] cursor-pointer" />
                                <Facebook className="hover:text-[#d11a2a] cursor-pointer" />
                                <Twitter className="hover:text-[#d11a2a] cursor-pointer" />
                            </div>
                        </div>
                        <div>
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-[#d11a2a] mb-6">Open Hours</h4>
                            <ul className="text-gray-400 text-sm space-y-2">
                                <li>Mon - Fri: 12pm - 9pm</li>
                                <li>Sat - Sun: 11am - 10pm</li>
                            </ul>
                        </div>
                        <div className="md:col-span-2 bg-[#d11a2a] p-10 rounded-3xl">
                            <h4 className="text-2xl font-black uppercase mb-4 text-white">Ready to get inked?</h4>
                            <p className="text-black/70 font-medium mb-6">Konsultasikan ide desainmu secara gratis dengan artist kami hari ini.</p>
                            <button className="bg-black text-white px-8 py-4 rounded-full text-xs font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all">
                                Get a Quote
                            </button>
                        </div>
                    </div>
                    <div className="pt-12 border-t border-white/5 flex justify-between items-center text-[10px] text-gray-600 font-bold uppercase tracking-[0.2em]">
                        <p>© 2026 {LOGO_TEXT} COLLECTIVE. ALL RIGHTS RESERVED.</p>
                        <button onClick={() => window.scrollTo({top:0, behavior:'smooth'})} className="hover:text-white flex items-center gap-2">TOP <ChevronUp size={14}/></button>
                    </div>
                </div>
            </footer>
        </div>
    )
}