"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronDown, User, Sparkles, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { CartButton } from "./CartButton";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setIsScrolled] = useState(false);
  const [isArtistHovered, setIsArtistHovered] = useState(false);
  const [dynamicArtists, setDynamicArtists] = useState<string[]>([]);
  const [mobileArtistsOpen, setMobileArtistsOpen] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);

  const hasTrackedRef = useRef(false);

  useEffect(() => {
    const trackActivity = async () => {
      if (hasTrackedRef.current) return;
      hasTrackedRef.current = true;

      try {
        if (pathname.startsWith('/admin') || pathname.startsWith('/dashboard')) return;

        const lastTracked = sessionStorage.getItem("last_tracked_page");
        if (lastTracked === pathname) return;

        let pageLabel = "";
        if (pathname === "/" || pathname === "/home") {
          pageLabel = "Home";
        } else {
          const firstSegment = pathname.split('/')[1];
          pageLabel = firstSegment.charAt(0).toUpperCase() + firstSegment.slice(1);
        }

        await addDoc(collection(db, "activity_logs"), {
          page: pageLabel,
          path: pathname,
          user: "Guest User",
          timestamp: serverTimestamp(),
          type: "visit"
        });

        sessionStorage.setItem("last_tracked_page", pathname);
      } catch (err) {
        console.error("Tracking Error:", err);
      }
    };

    trackActivity();
  }, [pathname]);

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

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

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
                className="absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-white to-transparent"
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
                        <ChevronDown
                          size={10}
                          className={cn(
                            "transition-colors",
                            isArtistHovered ? "text-white" : "text-zinc-400"
                          )}
                        />
                      </motion.div>
                      {hoveredLink === link.name && (
                        <motion.div
                          layoutId="nav-underline"
                          className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-white to-transparent"
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
                            className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-white to-transparent"
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
                        <motion.div className="bg-zinc-900/95 border border-white/10 backdrop-blur-xl rounded-2xl p-4 shadow-2xl shadow-white/5">
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
                                  className="group flex items-center justify-between px-4 py-2.5 rounded-lg hover:bg-white/5 transition-all"
                                >
                                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-white italic">
                                    {artist}
                                  </span>
                                  <motion.div
                                    whileHover={{ x: 3 }}
                                    transition={{ type: "spring", stiffness: 300 }}
                                  >
                                    <User size={10} className="text-zinc-700 group-hover:text-zinc-300" />
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
          <div className="flex items-center gap-4 md:gap-6 relative z-[110]">
            <div className="flex items-center">
              <CartButton />
            </div>

{/* User Panel Button (desktop) — shown when logged in */}
{session && (
  <Link href="/user-panel" className="hidden md:block">
    <motion.div
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Button
        size="lg"
        className="group rounded-full bg-transparent text-white px-6 py-6 font-black text-[11px] uppercase tracking-[0.2em] hover:bg-transparent transition-all border-white/20 flex items-center gap-2"
      >
        <LayoutDashboard 
          size={13} 
          className="transition-colors duration-300 group-hover:text-orange-500" 
        />
        {/* Kung may text ka dito, hindi rin siya kukulay, yung icon lang. */}
      </Button>
    </motion.div>
  </Link>
)}

            {/* Book Now Button (desktop) — always visible */}
            <Link href="/book" className="hidden md:block">
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Button
                  size="lg"
                  className="rounded-full bg-zinc-800 text-white px-8 py-6 font-black text-[11px] uppercase tracking-[0.2em] hover:bg-zinc-700 hover:shadow-xl hover:shadow-white/10 transition-all shadow-lg border border-white/10"
                >
                  <span className="flex items-center gap-2">
                    Book Now
                    <Sparkles size={14} className="animate-pulse" />
                  </span>
                </Button>
              </motion.div>
            </Link>

            {/* HAMBURGER TOGGLE (mobile) */}
            <div className="lg:hidden">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                  "relative flex flex-col justify-center items-center h-11 w-11 rounded-full border transition-all duration-300",
                  isOpen
                    ? "bg-white border-white/30"
                    : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                )}
                aria-label="Toggle menu"
              >
                <AnimatePresence mode="wait">
                  {isOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <X className="h-5 w-5 text-black" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="hamburger"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col gap-[5px]"
                    >
                      <span className="block w-5 h-[2px] bg-white rounded-full" />
                      <span className="block w-3.5 h-[2px] bg-white rounded-full ml-auto" />
                      <span className="block w-5 h-[2px] bg-white rounded-full" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE MENU */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 lg:hidden bg-black/97 backdrop-blur-xl pt-[100px] px-8 min-h-screen overflow-y-auto"
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="flex flex-col space-y-7"
            >
              {navLinks.map((link, idx) => (
                <motion.div
                  key={link.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + idx * 0.05 }}
                  className="border-b border-white/8 pb-4 hover:border-white/20 transition-colors duration-300"
                >
                  {link.name === "Artists" ? (
                    <div className="flex flex-col">
                      <motion.button
                        onClick={() => setMobileArtistsOpen(!mobileArtistsOpen)}
                        className="flex items-center justify-between w-full text-2xl sm:text-3xl font-black uppercase italic tracking-tighter text-white"
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
                              mobileArtistsOpen ? "text-white" : "text-zinc-400"
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
                            className="overflow-hidden pl-4 mt-5 space-y-4"
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
                                  className="block text-sm sm:text-base font-bold uppercase text-zinc-500 hover:text-white italic transition-colors"
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
                        className="text-2xl sm:text-3xl font-black uppercase italic tracking-tighter text-white hover:text-zinc-300 transition-colors"
                      >
                        {link.name}
                      </Link>
                    </motion.div>
                  )}
                </motion.div>
              ))}

              {/* Mobile User Panel Button — shown when logged in */}
              {session && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                >
                  <Link href="/user-panel" onClick={() => setIsOpen(false)}>
                    <motion.div whileTap={{ scale: 0.95 }}>
                      <Button className="w-full h-14 rounded-2xl bg-white text-black font-black uppercase tracking-[0.2em] text-xs sm:text-sm flex items-center justify-center gap-2 border border-white/20">
                        <LayoutDashboard size={15} />
                        Go to My Panel
                      </Button>
                    </motion.div>
                  </Link>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: session ? 0.4 : 0.3 }}
                className="pt-1 pb-10"
              >
                <Link href="/book" onClick={() => setIsOpen(false)}>
                  <motion.div whileTap={{ scale: 0.95 }}>
                    <Button className="w-full h-16 rounded-3xl bg-zinc-800 text-white font-black uppercase tracking-[0.2em] text-xs sm:text-sm shadow-2xl border border-white/10 hover:bg-zinc-700 transition-all">
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