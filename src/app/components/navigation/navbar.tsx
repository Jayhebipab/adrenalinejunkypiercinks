"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Scissors, ShoppingCart, Image as GalleryIcon, Users, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Updated links para sa Tattoo Theme
const navLinks = [
  { name: "Home", href: "#home" },
  { name: "About", href: "#about" },
  { name: "Artists", href: "#artists" }, // Bago
  { name: "Gallery", href: "#gallery" }, // Bago
  { name: "Shop", href: "#shop" },
  { name: "Blog", href: "#blog" },
  { name: "Contact", href: "#contact" }, // Bago
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={cn(
        "fixed top-0 z-50 w-full transition-all duration-300",
        scrolled 
          ? "border-b border-border/40 bg-background/80 backdrop-blur-xl py-3" 
          : "bg-transparent py-5"
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Logo Section */}
          <div className="flex items-center gap-2">
            <motion.div 
              whileHover={{ rotate: 15 }}
              className="rounded-xl bg-primary p-2 text-primary-foreground shadow-lg shadow-primary/20"
            >
              <Scissors className="h-5 w-5" />
            </motion.div>
          </div>

          {/* Desktop Navigation - Clean & Spaced */}
          <div className="hidden lg:block">
            <div className="flex items-center space-x-6">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-xs font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:text-primary"
                >
                  {link.name}
                </a>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="hidden items-center gap-3 md:flex">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10 hover:text-primary">
              <ShoppingCart className="h-5 w-5" />
            </Button>
            <Button size="sm" className="rounded-full px-6 font-bold uppercase tracking-tight shadow-md transition-transform hover:scale-105 active:scale-95">
              Book Now
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
              className="text-foreground"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute left-0 top-full w-full border-b border-border bg-background/95 backdrop-blur-xl lg:hidden"
          >
            <div className="flex flex-col space-y-1 px-6 pb-8 pt-4">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between border-b border-border/50 py-4 text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-primary"
                >
                  {link.name}
                </a>
              ))}
              <div className="pt-6">
                <Button className="w-full rounded-xl py-6 text-base font-bold uppercase tracking-widest">
                  Secure Your Slot
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}