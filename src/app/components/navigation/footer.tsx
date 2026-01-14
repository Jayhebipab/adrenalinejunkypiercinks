"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowUp,
  Facebook,
  Github,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Twitter,
} from "lucide-react";

const footerLinks = [
  {
    title: "Product",
    links: ["Features", "Pricing", "Documentation", "API Reference"],
  },
  {
    title: "Company",
    links: ["About Us", "Careers", "Blog", "Press Kit"],
  },
  {
    title: "Resources",
    links: ["Community", "Help Center", "Partners", "Status"],
  },
  {
    title: "Legal",
    links: ["Privacy", "Terms", "Cookie Policy", "Licenses"],
  },
];

const socialLinks = [
  { icon: Twitter, label: "Twitter", href: "#" },
  { icon: Facebook, label: "Facebook", href: "#" },
  { icon: Instagram, label: "Instagram", href: "#" },
  { icon: Linkedin, label: "LinkedIn", href: "#" },
  { icon: Github, label: "GitHub", href: "#" },
];

export function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const shouldReduceMotion = useReducedMotion();

  return (
    <footer
      aria-labelledby="footer-heading"
      className="relative w-full overflow-hidden border-t border-border bg-card/90 backdrop-blur-xl"
    >
      {/* Background Glow Decorations */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <motion.div
          className="absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/20 blur-[160px]"
          animate={shouldReduceMotion ? {} : { opacity: [0.2, 0.45, 0.2], scale: [0.9, 1.05, 0.95] }}
          transition={shouldReduceMotion ? {} : { duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-6">
          {/* Brand & Newsletter */}
          <div className="lg:col-span-2">
            <div className="mb-4 inline-flex items-center gap-3">
              <Card className="rounded-2xl border border-border/60 bg-card/80 px-3 py-1 text-xs uppercase tracking-[0.32em] text-muted-foreground">
                INK & ART
              </Card>
              <Badge variant="outline" className="text-xs text-muted-foreground">Since 2018</Badge>
            </div>
            <p className="mb-6 max-w-md text-sm text-muted-foreground leading-relaxed">
              Premium tattoo studio providing custom art and professional sterilization. 
              Gawing sining ang iyong kwento.
            </p>

            {/* Newsletter */}
            <div className="mb-6">
              <p className="mb-2 text-sm font-medium text-foreground">Subscribe to our newsletter</p>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter email"
                  className="h-10 rounded-xl bg-background/60"
                />
                <Button size="sm" className="h-10 rounded-xl px-4">
                  <Mail className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Contact Details */}
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /> <span>Manila, Philippines</span></div>
              <div className="flex items-center gap-2"><Phone className="h-4 w-4" /> <span>+63 912 345 6789</span></div>
            </div>
          </div>

          {/* Links Mapping */}
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h4 className="mb-4 text-sm font-semibold text-foreground">{section.title}</h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-6 border-t border-border/50 pt-8 md:flex-row">
          <p className="text-sm text-muted-foreground">© 2024 Ink & Art Tattoo. All rights reserved.</p>
          
          <div className="flex gap-4">
            {socialLinks.map((social) => (
              <a key={social.label} href={social.href} className="text-muted-foreground hover:text-primary transition-colors">
                <social.icon className="h-5 w-5" />
              </a>
            ))}
          </div>

          <Button variant="outline" size="icon" onClick={scrollToTop} className="rounded-full">
            <ArrowUp className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </footer>
  );
}