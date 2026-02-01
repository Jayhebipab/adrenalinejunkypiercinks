"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingCart, ChevronDown, User, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { CartButton } from "./CartButton";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setIsScrolled] = useState(false);
  const [isArtistHovered, setIsArtistHovered] = useState(false);
  const [dynamicArtists, setDynamicArtists] = useState<string[]>([]);
  const [mobileArtistsOpen, setMobileArtistsOpen] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);

// 1. Para sa Initial Setup (Artists Fetching at Scroll Listener)
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
}, []); // Laging empty array ito. Hindi magbabago ang size.

// 2. Para sa Scroll Lock (Mobile Menu)
useEffect(() => {
  if (isOpen) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "unset";
  }
  
  // Clean up para sigurado
  return () => {
    document.body.style.overflow = "unset";
  };
}, [isOpen]); // Laging [isOpen] ang laman nito. Hindi magbabago ang size.

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
        "fixed top-0 z-[100] w-full transition-all duration-700",
        scrolled
          ? "bg-black/90 backdrop-blur-md py-3 border-b border-white/5 shadow-2xl"
          : "bg-transparent py-8"
      )}
    >
      <div className="mx-auto max-w-[1400px] px-6 sm:px-10 lg:px-12">
        <div className="flex items-center justify-between">
          
          {/* LOGO */}
          <Link href="/home" className="flex items-center group relative z-[110]">
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="relative"
            >
              <motion.div
                className="absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-orange-500 to-transparent"
                initial={{ scaleX: 0 }}
                whileHover={{ scaleX: 1 }}
                transition={{ duration: 0.3 }}
              />
            </motion.div>
          </Link>

          {/* DESKTOP NAV */}
          <div className="hidden lg:block">
            <div className="flex items-center space-x-12">
              {navLinks.map((link) => (
                <div
                  key={link.name}
                  className="relative"
                  onMouseEnter={() => {
                    if (link.name === "Artists") setIsArtistHovered(true);
                    setHoveredLink(link.name);
                  }}
                  onMouseLeave={() => {
                    if (link.name === "Artists") setIsArtistHovered(false);
                    setHoveredLink(null);
                  }}
                >
                  {link.name === "Artists" ? (
                    <motion.button
                      className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.4em] text-zinc-400 cursor-pointer relative"
                      whileHover={{ y: -2 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      {link.name}
                      <motion.div
                        animate={{ rotate: isArtistHovered ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ChevronDown size={10} className={cn("transition-colors", isArtistHovered ? "text-orange-500" : "text-zinc-400")} />
                      </motion.div>
                      {hoveredLink === link.name && (
                        <motion.div
                          layoutId="nav-underline"
                          className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-transparent"
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ duration: 0.3 }}
                        />
                      )}
                    </motion.button>
                  ) : (
                    <motion.div
                      whileHover={{ y: -2 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <Link
                        href={link.href}
                        className="text-[11px] font-black uppercase tracking-[0.4em] text-zinc-400 transition-colors relative block"
                      >
                        {link.name}
                        {hoveredLink === link.name && (
                          <motion.div
                            layoutId={`nav-underline-${link.name}`}
                            className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-transparent"
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ duration: 0.3 }}
                          />
                        )}
                      </Link>
                    </motion.div>
                  )}

                  <AnimatePresence>
                    {link.name === "Artists" && isArtistHovered && (
                      <motion.div
                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 15, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                        className="absolute left-1/2 -translate-x-1/2 top-full pt-6 w-[240px]"
                      >
                        <motion.div className="bg-zinc-900/95 border border-white/10 backdrop-blur-xl rounded-2xl p-4 shadow-2xl shadow-orange-500/10">
                          <div className="flex flex-col gap-1">
                            {dynamicArtists.map((artist, idx) => (
                              <motion.div
                                key={artist}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                              >
                                <Link
                                  href={`/artists/${artist.toLowerCase().replace(/\s+/g, "-")}`}
                                  className="group flex items-center justify-between px-4 py-2.5 rounded-lg hover:bg-gradient-to-r hover:from-orange-500/10 hover:to-transparent transition-all"
                                >
                                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-orange-400 italic">
                                    {artist}
                                  </span>
                                  <motion.div
                                    whileHover={{ x: 3 }}
                                    transition={{ type: "spring", stiffness: 300 }}
                                  >
                                    <User size={10} className="text-zinc-700 group-hover:text-orange-500" />
                                  </motion.div>
                                </Link>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex items-center gap-4 md:gap-8 relative z-[110]">
{/* Ganito nalang sa Navbar mo par, wag mo na i-wrap ng another motion.div */}
<div className="flex items-center">
  <CartButton />
</div>

            <Link href="/book" className="hidden md:block">
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Button
                  size="lg"
                  className="rounded-full bg-gradient-to-r from-orange-500 to-red-600 text-white px-8 py-6 font-black text-[11px] uppercase tracking-[0.2em] hover:shadow-xl hover:shadow-orange-500/30 transition-all shadow-lg border border-orange-400/20"
                >
                  <span className="flex items-center gap-2">
                    Book Now
                    <Sparkles size={14} className="animate-pulse" />
                  </span>
                </Button>
              </motion.div>
            </Link>

            {/* MOBILE TOGGLE (PEN ICON) */}
            <div className="lg:hidden">
              <motion.div
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(!isOpen)}
                  className={cn(
                    "rounded-full h-12 w-12 transition-all duration-500 border",
                    isOpen
                      ? "bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg shadow-orange-900/40 border-orange-400/30"
                      : "text-white bg-white/5 border-white/10 hover:bg-white/10 hover:border-orange-500/30"
                  )}
                >
                  <AnimatePresence mode="wait">
                    {isOpen ? (
                      <motion.div
                        key="close"
                        initial={{ rotate: -90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: 90, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <X className="h-6 w-6" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="pen"
                        initial={{ rotate: 90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: -90, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
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
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE MENU */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 lg:hidden bg-black/95 backdrop-blur-xl pt-[120px] px-8 min-h-screen overflow-y-auto"
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="flex flex-col space-y-8"
            >
              {navLinks.map((link, idx) => (
                <motion.div
                  key={link.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + idx * 0.05 }}
                  className="border-b border-white/10 pb-4 hover:border-orange-500/30 transition-colors duration-300"
                >
                  {link.name === "Artists" ? (
                    <div className="flex flex-col">
                      <motion.button
                        onClick={() => setMobileArtistsOpen(!mobileArtistsOpen)}
                        className="flex items-center justify-between w-full text-lg sm:text-2xl md:text-3xl lg:text-4xl font-black uppercase italic tracking-tighter text-white"
                        whileHover={{ x: 4 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        {link.name}
                        <motion.div
                          animate={{ rotate: mobileArtistsOpen ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <ChevronDown
                            className={cn(
                              "transition-colors",
                              mobileArtistsOpen ? "text-orange-500" : "text-zinc-400"
                            )}
                          />
                        </motion.div>
                      </motion.button>
                      <AnimatePresence>
                        {mobileArtistsOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 200, damping: 25 }}
                            className="overflow-hidden pl-4 mt-6 space-y-5"
                          >
                            {dynamicArtists.map((artist, artistIdx) => (
                              <motion.div
                                key={artist}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: artistIdx * 0.05 }}
                              >
                                <Link
                                  href={`/artists/${artist.toLowerCase().replace(/\s+/g, "-")}`}
                                  onClick={() => setIsOpen(false)}
                                  className="block text-sm sm:text-base md:text-lg lg:text-xl font-bold uppercase text-zinc-500 hover:text-orange-500 italic transition-colors"
                                >
                                  {artist}
                                </Link>
                              </motion.div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <motion.div whileHover={{ x: 4 }} transition={{ type: "spring", stiffness: 300 }}>
                      <Link
                        href={link.href}
                        onClick={() => setIsOpen(false)}
                        className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-black uppercase italic tracking-tighter text-white hover:text-orange-500 transition-colors"
                      >
                        {link.name}
                      </Link>
                    </motion.div>
                  )}
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="pt-4"
              >
                <Link href="/book" onClick={() => setIsOpen(false)}>
                  <motion.div whileTap={{ scale: 0.95 }}>
                    <Button className="w-full h-16 sm:h-18 md:h-20 rounded-3xl bg-gradient-to-r from-orange-600 to-red-600 text-white font-black uppercase tracking-[0.2em] text-xs sm:text-sm md:text-base lg:text-lg shadow-2xl shadow-orange-900/40 border border-orange-400/30 hover:shadow-orange-500/40 transition-all">
                      Book Appointment
                    </Button>
                  </motion.div>
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
