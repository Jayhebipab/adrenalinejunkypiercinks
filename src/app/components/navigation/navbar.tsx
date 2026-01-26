"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ShoppingCart, ChevronDown } from "lucide-react"; // Nagdagdag ng Chevron par
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link"; // Mas maganda gamitin ang Link kaysa <a> par

const navLinks = [
  { name: "Home", href: "/home" },
  { 
    name: "Artists", 
    href: "/artists",
    // Dito natin ilalagay yung mga names ng artists mo par
    subLinks: ["Artist One", "Artist Two", "Artist Three", "Artist Four"] 
  },
  { name: "Tattoo", href: "/tattoo" },
  { name: "Piercing", href: "/piercings" },
  { name: "Shop", href: "/shop" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setIsScrolled] = useState(false);
  const [isArtistHovered, setIsArtistHovered] = useState(false); // State para sa hover

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={cn(
        "fixed top-0 z-50 w-full transition-all duration-500",
        scrolled 
          ? "lg:border-b lg:border-white/5 lg:bg-black/80 lg:backdrop-blur-md lg:py-4" 
          : "bg-transparent py-8",
        "max-lg:bg-transparent max-lg:border-none max-lg:backdrop-blur-none max-lg:py-6"
      )}
    >
      <div className="mx-auto max-w-[1400px] px-6 sm:px-10 lg:px-12">
        <div className="flex items-center justify-between">
          
          {/* Logo Section */}
          <Link href="/" className="flex items-center gap-4">
            <div className="h-14 w-14 md:h-16 md:w-16 flex items-center justify-center">
              
            </div>
          </Link>

{/* Desktop Navigation */}
<div className="hidden lg:block">
  <div className="flex items-center space-x-10">
    {navLinks.map((link) => (
      <div 
        key={link.name}
        className="relative group"
        onMouseEnter={() => link.name === "Artists" && setIsArtistHovered(true)}
        onMouseLeave={() => link.name === "Artists" && setIsArtistHovered(false)}
      >
        {link.name === "Artists" ? (
          // Disabled link/trigger lang para sa Artists
          <div className="flex items-center gap-1 text-[13px] font-bold uppercase tracking-[0.2em] text-gray-400 cursor-default transition-all duration-300 group-hover:text-white">
            {link.name}
            <ChevronDown size={12} className={cn("transition-transform duration-300", isArtistHovered && "rotate-180")} />
          </div>
        ) : (
          // Normal link para sa iba
          <Link
            href={link.href}
            className="text-[13px] font-bold uppercase tracking-[0.2em] text-gray-400 transition-all duration-300 hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
          >
            {link.name}
          </Link>
        )}

        {/* --- ARTIST DROPDOWN MENU --- */}
        {link.subLinks && (
          <AnimatePresence>
            {isArtistHovered && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute left-1/2 -translate-x-1/2 top-full pt-4"
              >
                <div className="bg-transparent p-6 min-w-[200px]">
                  <div className="flex flex-col gap-6 items-center">
                    {link.subLinks.map((artist) => (
                      <Link 
                        key={artist}
                        href={`/artists/${artist.toLowerCase().replace(/\s+/g, '-')}`}
                        className="text-[12px] font-black uppercase tracking-[0.3em] text-zinc-500 hover:text-white transition-all duration-300 hover:scale-110"
                      >
                        {artist}
                      </Link>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    ))}
  </div>
</div>

          {/* Action Buttons */}
          <div className="hidden items-center gap-4 md:flex">
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="rounded-full text-gray-400 hover:bg-white/10 hover:text-white">
                <ShoppingCart className="h-5 w-5" />
              </Button>
            </Link>
            
            <Link href="/book">
              <Button size="lg" className="rounded-full bg-white text-black px-8 font-black uppercase tracking-widest transition-all hover:bg-gray-200 hover:scale-105 active:scale-95">
                Book Now
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
              className={cn(
                "rounded-full text-white transition-all duration-300",
                scrolled ? "bg-black/40 backdrop-blur-md border border-white/10" : "bg-transparent"
              )}
            >
              {isOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
            </Button>
          </div>
        </div>
      </div>

     {/* Mobile Menu Overlay */}
<AnimatePresence>
  {isOpen && (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="absolute left-4 right-4 top-20 z-50 overflow-hidden rounded-[2rem] border border-white/10 bg-black/95 p-8 shadow-2xl backdrop-blur-2xl lg:hidden"
    >
      <div className="flex flex-col space-y-6">
        {navLinks.map((link, i) => (
          <div key={link.name} className="flex flex-col items-center gap-4">
            {/* Main Link */}
            {link.name === "Artists" ? (
              // Sa mobile, label nalang ang "Artists" tapos nakabukas na yung sublinks
              <span className="text-center text-xs font-black uppercase tracking-[0.3em] text-orange-500/80">
                {link.name}
              </span>
            ) : (
              <Link
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="text-center text-sm font-bold uppercase tracking-[0.2em] text-gray-400 hover:text-white transition-colors"
              >
                {link.name}
              </Link>
            )}

            {/* Render Artist Sublinks sa Mobile */}
            {link.subLinks && (
              <div className="flex flex-col items-center gap-4 pb-2">
                {link.subLinks.map((artist) => (
                  <Link
                    key={artist}
                    href={`/artists/${artist.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => setIsOpen(false)}
                    className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-colors"
                  >
                    {artist}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}

        <div className="pt-6 border-t border-white/10">
          <Link href="/book" onClick={() => setIsOpen(false)}>
            <Button className="w-full h-14 rounded-full bg-white text-xs font-black uppercase tracking-widest text-black active:scale-95 transition-transform">
              Book Appointment
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  )}
</AnimatePresence>
    </nav>
  );
}