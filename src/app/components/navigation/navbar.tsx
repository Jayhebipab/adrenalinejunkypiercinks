"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  { name: "Home", href: "#home" },
  { name: "About", href: "#about" },
  { name: "Artists", href: "#artists" },
  { name: "Gallery", href: "#gallery" },
  { name: "Shop", href: "#shop" },
  { name: "Blog", href: "#blog" },
  { name: "Contact", href: "#contact" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setIsScrolled] = useState(false);

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
        // Desktop Scroll Logic
        scrolled 
          ? "lg:border-b lg:border-white/5 lg:bg-black/80 lg:backdrop-blur-md lg:py-4" 
          : "bg-transparent py-8",
        // Mobile View: Always transparent background but keeps icons
        "max-lg:bg-transparent max-lg:border-none max-lg:backdrop-blur-none max-lg:py-6"
      )}
    >
      <div className="mx-auto max-w-[1400px] px-6 sm:px-10 lg:px-12">
        <div className="flex items-center justify-between">
          
          {/* Logo Section - Placeholder muna */}
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 md:h-16 md:w-16 flex items-center justify-center">
              {/* Logo space temporarily empty as requested */}
              <span className="text-white font-black text-xl tracking-tighter"></span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:block">
            <div className="flex items-center space-x-10">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="group relative text-[12px] font-bold uppercase tracking-[0.2em] text-gray-300 transition-all duration-300 hover:text-white"
                >
                  {link.name}
                  <span className="absolute -bottom-1 left-1/2 h-[2px] w-0 -translate-x-1/2 rounded-full bg-white transition-all duration-300 group-hover:w-full"></span>
                </a>
              ))}
            </div>
          </div>

          {/* Desktop Action Buttons */}
          <div className="hidden items-center gap-4 md:flex">
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full text-gray-400 hover:bg-white/10 hover:text-white"
            >
              <ShoppingCart className="h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              className="rounded-full bg-white text-black px-8 font-black uppercase tracking-widest transition-all hover:bg-gray-200 hover:scale-105 active:scale-95"
            >
              Book Now
            </Button>
          </div>

          {/* Mobile Menu Toggle - Itinira natin ang hamburger */}
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
                <motion.a
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="text-center text-sm font-bold uppercase tracking-[0.2em] text-gray-400 hover:text-white transition-colors"
                >
                  {link.name}
                </motion.a>
              ))}
              <div className="pt-6 border-t border-white/10">
                <Button 
                  onClick={() => setIsOpen(false)}
                  className="w-full h-14 rounded-full bg-white text-xs font-black uppercase tracking-widest text-black active:scale-95 transition-transform"
                >
                  Book Appointment
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}