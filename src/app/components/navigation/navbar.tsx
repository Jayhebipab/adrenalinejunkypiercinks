"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ShoppingCart, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setIsScrolled] = useState(false);
  const [isArtistHovered, setIsArtistHovered] = useState(false);
  const [dynamicArtists, setDynamicArtists] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/artists")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const names = data.map((a: any) => a.fullName);
          setDynamicArtists(names);
        }
      })
      .catch((err) => console.error("Error fetching nav artists:", err));

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", href: "/home" },
    { name: "Artists", href: "/artists", subLinks: dynamicArtists },
    { name: "Tattoo", href: "/tattoo" },
    { name: "Piercing", href: "/piercings" },
    { name: "Shop", href: "/shop" },
  ];

  return (
    <nav
      className={cn(
        "fixed top-0 z-50 w-full transition-all duration-700",
        scrolled 
          ? "lg:bg-black/90 lg:backdrop-blur-md lg:py-3 lg:border-b lg:border-white/5" 
          : "bg-transparent py-8",
        "max-lg:bg-transparent" 
      )}
    >
      <div className="mx-auto max-w-[1400px] px-6 sm:px-10 lg:px-12">
        <div className="flex items-center justify-between">
          
          {/* Logo Section - Malaki at Clear */}
          <Link href="/home" className="flex items-center gap-4 group">
            <div className="h-20 w-20 md:h-24 md:w-24 transition-transform duration-500 group-hover:scale-110">
              <img
                src="/images/logo/pic4.png" 
                alt="Adrenaline Junky Logo"
                className="h-full w-full object-contain drop-shadow-[0_0_8px_rgba(255,165,0,0.3)]"
              />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:block">
            <div className="flex items-center space-x-12">
              {navLinks.map((link) => (
                <div 
                  key={link.name}
                  className="relative group"
                  onMouseEnter={() => link.name === "Artists" && setIsArtistHovered(true)}
                  onMouseLeave={() => link.name === "Artists" && setIsArtistHovered(false)}
                >
                  {link.name === "Artists" ? (
                    <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.4em] text-zinc-400 cursor-pointer transition-all duration-300 group-hover:text-white italic">
                      {link.name}
                      <ChevronDown size={10} className={cn("transition-transform duration-500", isArtistHovered && "rotate-180 text-orange-500")} />
                    </div>
                  ) : (
                    <Link
                      href={link.href}
                      className="text-[13px] font-black uppercase tracking-[0.4em] text-zinc-400 transition-all duration-300 hover:text-white italic hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                    >
                      {link.name}
                    </Link>
                  )}

                  {/* ARTIST DROPDOWN - NO BACKGROUND */}
                  <AnimatePresence>
                    {link.name === "Artists" && isArtistHovered && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute left-1/2 -translate-x-1/2 top-full pt-4"
                      >
                        <div className="flex flex-col gap-4 items-center py-4">
                          {dynamicArtists.map((artist) => (
                            <Link 
                              key={artist}
                              href={`/artists/${artist.toLowerCase().replace(/\s+/g, '-')}`}
                              className="whitespace-nowrap text-[12px] font-black uppercase tracking-[0.3em] text-zinc-500 hover:text-orange-500 transition-all duration-300 hover:scale-110 italic drop-shadow-md"
                            >
                              {artist}
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="hidden items-center gap-6 md:flex">
            <Link href="/cart">
              <ShoppingCart className="h-5 w-5 text-zinc-400 hover:text-white transition-colors cursor-pointer" />
            </Link>
            <Link href="/book">
              <Button size="lg" className="rounded-full bg-white text-black px-10 py-6 font-black text-[10px] uppercase tracking-[0.2em] transition-all hover:bg-orange-600 hover:text-white hover:scale-105 active:scale-95 shadow-xl">
                Book Now
              </Button>
            </Link>
          </div>

{/* Mobile Menu Toggle - Custom Pen Icon */}
          <div className="lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
              className={cn(
                "relative group rounded-full h-12 w-12 transition-all duration-500",
                isOpen ? "bg-orange-600 text-white" : "text-white hover:bg-white/10"
              )}
            >
              <div className="relative h-6 w-6 flex items-center justify-center">
                <AnimatePresence mode="wait">
                  {isOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <X className="h-7 w-7" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="pen"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center justify-center"
                    >
                      {/* Ginamit ko ang Lucide 'Pen' icon pero pinatulis natin ang dating */}
                      <svg 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        className="h-6 w-6"
                      >
                        <path d="m12 19 7-7 3 3-7 7-3-3z" />
                        <path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                        <path d="m2 2 5 5" />
                        <path d="m8.5 8.5 1 1" />
                      </svg>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Button>
          </div>
        </div>
      </div>

      {/* MOBILE MENU - FULL SCREEN WITH BACKGROUND */}
{/* MOBILE MENU OVERLAY - ENHANCED VERSION */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            // Binalik natin ang background pero ginawa nating mas "glassy"
            className="absolute left-4 right-4 top-24 z-50 overflow-hidden rounded-[2.5rem] border border-white/10 bg-black/90 p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl lg:hidden"
          >
            <div className="flex flex-col space-y-8 items-center">
              {navLinks.map((link) => (
                <div key={link.name} className="flex flex-col items-center gap-5 w-full">
                  {link.name === "Artists" ? (
                    <div className="flex flex-col items-center gap-4">
                      <span className="text-[10px] font-black uppercase tracking-[0.5em] text-orange-500 italic opacity-80">
                        The Crew
                      </span>
                      <div className="flex flex-wrap justify-center gap-x-6 gap-y-4 pb-2 max-w-[280px]">
                        {link.subLinks && link.subLinks.map((artist) => (
                          <Link
                            key={artist}
                            href={`/artists/${artist.toLowerCase().replace(/\s+/g, '-')}`}
                            onClick={() => setIsOpen(false)}
                            className="text-[12px] font-black uppercase tracking-[0.2em] text-zinc-400 active:text-white italic transition-colors"
                          >
                            {artist}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <Link
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className="text-lg font-black uppercase tracking-[0.3em] text-zinc-100 italic transition-all active:text-orange-500 active:scale-95"
                    >
                      {link.name}
                    </Link>
                  )}
                </div>
              ))}

              {/* Action Button sa Mobile */}
              <div className="w-full pt-8 border-t border-white/5">
                <Link href="/book" onClick={() => setIsOpen(false)}>
                  <Button className="w-full h-16 rounded-full bg-white text-black text-[11px] font-black uppercase tracking-[0.3em] hover:bg-orange-600 hover:text-white transition-all shadow-lg active:scale-95">
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