"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import {
  ArrowUp,
  Facebook,
  Instagram,
  Mail,
  MapPin,
  Phone,
  Send,
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
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer
      aria-labelledby="footer-heading"
      className="relative w-full border-t border-zinc-100 bg-white" // ✅ Solid White Background
    >
      <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          
          {/* Brand & Newsletter */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-[15px] uppercase tracking-widest border-zinc-200">
                Adrenaline Junky Piercinks
              </Badge>
            </div>
            
            <p className="max-w-sm text-sm text-zinc-500 leading-relaxed">
              Premium tattoo and piercing studio. Expressing your true self through 
              art and precision. Sermon is temporary, vanity is forever.
            </p>

            {/* Newsletter */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-800">Stay Updated</p>
              <div className="flex gap-2 max-w-sm">
                <Input
                  type="email"
                  placeholder="Your email address"
                  className="h-12 rounded-full border-zinc-200 bg-zinc-50 px-6 focus-visible:ring-yellow-500"
                />
                <Button size="icon" className="h-12 w-12 rounded-full bg-black hover:bg-zinc-800">
                  <Send className="h-4 w-4 text-white" />
                </Button>
              </div>
            </div>
          </div>

          {/* Links Mapping */}
          {footerLinks.map((section) => (
            <div key={section.title} className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-900">
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-zinc-500 hover:text-black transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 flex flex-col items-center justify-between gap-6 border-t border-zinc-100 pt-8 md:flex-row">
          <div className="space-y-1">
            <p className="text-xs text-zinc-400">
              © {new Date().getFullYear()} Adrenaline Junky Piercinks. All rights reserved.
            </p>
            <div className="flex gap-4 text-[10px] text-zinc-400 uppercase tracking-widest">
              <div className="flex items-center gap-1"><MapPin size={12}/> Manila, PH</div>
              <div className="flex items-center gap-1"><Phone size={12}/> +63 935 595 5699</div>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex gap-5">
              {socialLinks.map((social) => (
                <a 
                  key={social.label} 
                  href={social.href} 
                  target="_blank"
                  className="text-zinc-400 hover:text-black transition-colors"
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>

            <Button 
              variant="outline" 
              size="icon" 
              onClick={scrollToTop} 
              className="rounded-full border-zinc-200 hover:bg-zinc-50"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
}