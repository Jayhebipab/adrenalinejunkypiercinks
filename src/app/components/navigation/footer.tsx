"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link"; // Import Link for routing
import {
  ArrowUp,
  Facebook,
  Instagram,
  MapPin,
  Phone,
  ChevronRight,
  UserCircle,
} from "lucide-react";

const footerLinks = [

  {
    title: "Company",
    links: [
      { label: "Our Story", href: "/about" }, // About page
      { label: "Reviews", href: "/reviews" },
      { label: "Blog", href: "/blog" },       // Blog page
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Safety Protocols", href: "/safety" },
    ],
  },
];

const socialLinks = [
  { icon: Facebook, label: "Facebook", href: "https://facebook.com/junkypiercing" },
  { icon: Instagram, label: "Instagram", href: "https://instagram.com/theadrenalinejunkypiercinks/" },
];

export function Footer() {
  const { data: session } = useSession();
  const router = useRouter();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      signIn("google");
    }
  };

  return (
    <footer className="relative w-full border-t border-zinc-900 bg-black pt-20 pb-10">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        
        {/* --- REGISTRATION / USER SECTION --- */}
        <div className="flex flex-col items-center text-center space-y-8 mb-24">
          <div className="space-y-2">
            <h2 className="text-3xl md:text-4xl font-black italic tracking-[0.1em] text-white uppercase">
              {session ? "Exclusive Access" : "Be the first in line"}
            </h2>
            <p className="text-[10px] tracking-[0.3em] text-zinc-500 uppercase font-black">
              {session 
                ? `Welcome, ${session.user?.name?.split(' ')[0]}! Priority member active.` 
                : "Join the cult for latest updates & priority booking"}
            </p>
          </div>

          {session ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-6"
            >
              <Button 
                onClick={() => router.push('/user-panel')}
                className="bg-orange-600 text-white hover:bg-orange-700 px-10 py-7 rounded-none uppercase tracking-[0.3em] font-black text-[10px] transition-all flex items-center gap-3 group"
              >
                <UserCircle size={18} className="text-white/70 group-hover:text-white" />
                Go to your panel <ChevronRight size={18} />
              </Button>
            </motion.div>
          ) : (
            <form onSubmit={handleJoin} className="relative w-full max-w-xl group">
              <div className="flex items-center border-b border-zinc-800 py-4 transition-colors focus-within:border-orange-600">
                <input
                  type="email"
                  placeholder="Enter email to join"
                  className="w-full bg-transparent px-2 text-lg outline-none text-white placeholder:text-zinc-700 placeholder:uppercase"
                  required
                />
                <button 
                  type="submit"
                  className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-white hover:text-orange-600 transition-colors"
                >
                  Join <ChevronRight size={16} />
                </button>
              </div>
            </form>
          )}
        </div>

        {/* --- LINKS SECTION --- */}
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2 space-y-6">
            <Badge variant="outline" className="text-[11px] font-black uppercase tracking-[0.2em] border-orange-600/50 text-orange-600 px-4 py-1">
              Adrenaline Junky Piercinks
            </Badge>
            <p className="max-w-sm text-sm text-zinc-500 leading-relaxed italic font-medium">
              To fulfill that commitment, we at the Adrenaline Junky Piercinks are ready to offer you extra service; Replacement of jewelries, cleaning of piercing & consultations for Free!
            </p>
          </div>

          {footerLinks.map((section) => (
            <div key={section.title} className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white">
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link 
                      href={link.href} 
                      className="text-xs text-zinc-500 hover:text-orange-600 transition-all font-bold uppercase tracking-widest"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* --- BOTTOM BAR --- */}
        <div className="mt-20 flex flex-col items-center justify-between gap-6 border-t border-zinc-900 pt-8 md:flex-row">
          <div className="space-y-1 text-center md:text-left">
            <p className="text-[9px] text-zinc-600 uppercase tracking-widest font-black">
              © {new Date().getFullYear()} Adrenaline Junky Piercinks.
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-[9px] text-zinc-700 uppercase tracking-widest">
              <div className="flex items-center gap-1"><Phone size={10}/> +63 935 595 5699</div>
              <div className="flex items-center gap-1"><MapPin size={10}/> 7/11, 2nd Flr, National Road, Putatan, Muntinlupa City, PH</div>
              
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex gap-6">
              {socialLinks.map((social) => (
                <a key={social.label} href={social.href} target="_blank" className="text-zinc-600 hover:text-orange-600 transition-colors">
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>

            <Button 
              variant="outline" 
              size="icon" 
              onClick={scrollToTop} 
              className="h-10 w-10 rounded-full border-zinc-800 bg-transparent text-zinc-500 hover:border-orange-600 hover:text-orange-600 transition-all"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
}