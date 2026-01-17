"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
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
    title: "Studio",
    links: ["Gallery", "Artists", "Aftercare", "Book Now"],
  },
  {
    title: "Company",
    links: ["Our Story", "Reviews", "Blog", "Contact"],
  },
  {
    title: "Legal",
    links: ["Privacy Policy", "Terms of Service", "Safety Protocols"],
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
    <footer className="relative w-full border-t border-zinc-100 bg-white pt-20 pb-10">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        
        {/* --- REGISTRATION / USER SECTION --- */}
        <div className="flex flex-col items-center text-center space-y-8 mb-24">
          <div className="space-y-2">
            <h2 className="text-3xl md:text-4xl font-medium tracking-[0.15em] text-zinc-900 uppercase">
              {session ? "Exclusive Access" : "Be the first in line"}
            </h2>
            <p className="text-xs tracking-[0.2em] text-zinc-500 uppercase font-bold">
              {session 
                ? `Welcome, ${session.user?.name?.split(' ')[0]}! You are now a priority member.` 
                : "Receive latest updates & priority booking"}
            </p>
          </div>

          {session ? (
            /* --- USER PANEL BUTTON --- */
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-6"
            >
              <Button 
                onClick={() => router.push('/user-panel')}
                className="bg-black text-white hover:bg-zinc-800 px-10 py-7 rounded-none uppercase tracking-[0.3em] font-black text-[10px] transition-all flex items-center gap-3 border border-black group"
              >
                <UserCircle size={18} className="text-zinc-400 group-hover:text-white" />
                Go to your panel <ChevronRight size={18} />
              </Button>
              
              <div className="flex flex-col items-center gap-1">
                <p className="text-[9px] uppercase tracking-widest text-emerald-600 font-bold">
                  ✓ Member Account Active
                </p>
                <p className="text-[8px] uppercase tracking-[0.2em] text-zinc-400">
                  ID: {session.user?.email}
                </p>
              </div>
            </motion.div>
          ) : (
            /* --- JOIN FORM --- */
            <form onSubmit={handleJoin} className="relative w-full max-w-xl group">
              <div className="flex items-center border-b border-zinc-200 py-4 transition-colors focus-within:border-black">
                <input
                  type="email"
                  placeholder="Enter your email to join"
                  className="w-full bg-transparent px-2 text-lg outline-none placeholder:text-zinc-300 placeholder:uppercase"
                  required
                />
                <button 
                  type="submit"
                  className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-zinc-900 hover:text-red-600 transition-colors"
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
            <Badge variant="outline" className="text-[13px] uppercase tracking-widest border-zinc-200 px-4 py-1">
              Adrenaline Junky Piercinks
            </Badge>
            <p className="max-w-sm text-sm text-zinc-500 leading-relaxed italic">
              "Premium tattoo and piercing studio. Expressing your true self through 
              art and precision. Sermon is temporary, vanity is forever."
            </p>
          </div>

          {footerLinks.map((section) => (
            <div key={section.title} className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-900">
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-zinc-400 hover:text-black transition-colors font-medium">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* --- BOTTOM BAR --- */}
        <div className="mt-20 flex flex-col items-center justify-between gap-6 border-t border-zinc-100 pt-8 md:flex-row">
          <div className="space-y-1">
            <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">
              © {new Date().getFullYear()} Adrenaline Junky Piercinks.
            </p>
            <div className="flex flex-wrap gap-4 text-[9px] text-zinc-400 uppercase tracking-widest">
              <div className="flex items-center gap-1"><MapPin size={10}/> Manila, PH</div>
              <div className="flex items-center gap-1"><Phone size={10}/> +63 935 595 5699</div>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex gap-6">
              {socialLinks.map((social) => (
                <a key={social.label} href={social.href} target="_blank" className="text-zinc-400 hover:text-black transition-colors">
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>

            <Button 
              variant="outline" 
              size="icon" 
              onClick={scrollToTop} 
              className="h-8 w-8 rounded-full border-zinc-200 hover:bg-zinc-50"
            >
              <ArrowUp className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
}