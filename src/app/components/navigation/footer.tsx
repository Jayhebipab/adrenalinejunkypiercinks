"use client";

import React from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowUp,
  Facebook,
  Instagram,
  MapPin,
  Phone,
  ChevronRight,
  UserCircle,
  Mail,
  Sparkles,
} from "lucide-react";
import Image from "next/image";

const footerLinks = [
  {
    title: "Company",
    links: [
      { label: "Our Story", href: "/about" },
      { label: "Reviews", href: "/reviews" },
      { label: "Blog", href: "/blog" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Safety Protocols", href: "/protocols" },
    ],
  },
];

const socialLinks = [
  { icon: Facebook, label: "Facebook", href: "https://facebook.com/junkypiercing" },
  { icon: Instagram, label: "Instagram", href: "https://instagram.com/theadrenalinejunkypiercinks/" },
];

export function Footer() {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleJoin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (session) {
      router.push("/user-panel");
      return;
    }

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email")?.toString();

    if (!email) return;

    setIsSubmitting(true);

    try {
      await addDoc(collection(db, "subscribers"), {
        email: email.toLowerCase(),
        joinedAt: serverTimestamp(),
        source: "footer_join_the_cult",
        status: "pending_login",
      });

      await signIn("google");
    } catch (err) {
      console.error("Firebase Error:", err);
      await signIn("google");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="relative w-full overflow-hidden pt-20 pb-10">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              "url('https://res.cloudinary.com/diwrwmjgw/image/upload/v1769937840/qsb4nbgmhqqwbgaa8k8u.jpg')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/55 to-black/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
      </div>

      <div className="mx-auto max-w-6xl px-6 lg:px-8 relative z-10">

        {/* --- REGISTRATION / USER SECTION --- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center text-center space-y-8 mb-24"
        >
          <div className="space-y-2">
            <h2 className="text-3xl md:text-4xl font-black italic tracking-[0.1em] text-white uppercase">
              {session ? "Exclusive Access" : "Be the first in line"}
            </h2>
            <p className="text-[10px] tracking-[0.3em] text-zinc-400 uppercase font-black">
              {session
                ? `Welcome, ${session.user?.name?.split(' ')[0]}! Priority member active.`
                : "Join the cult for latest updates & priority booking"}
            </p>
          </div>

          {session ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex flex-col items-center gap-6"
            >
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Button
                  onClick={() => router.push("/user-panel")}
                  className="bg-white text-black px-10 py-7 rounded-lg uppercase tracking-[0.3em] font-black text-[10px] transition-all duration-300 flex items-center gap-3 group shadow-lg border border-white/20 hover:bg-zinc-200"
                >
                  <UserCircle size={18} className="text-black/50 group-hover:text-black transition-colors duration-300" />
                  Go to your panel <ChevronRight size={18} />
                </Button>
              </motion.div>
            </motion.div>
          ) : (
            <motion.form
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              onSubmit={handleJoin}
              className="relative w-full max-w-xl group"
            >
              <div className="flex items-center border-b-2 border-zinc-700 py-4 transition-all duration-300 focus-within:border-white hover:border-zinc-500">
                <Mail size={16} className="text-zinc-500 mr-3" />
                <input
                  name="email"
                  type="email"
                  placeholder={isSubmitting ? "SIGNING YOU UP..." : "Enter email to join"}
                  className="w-full bg-transparent px-2 text-lg outline-none text-white placeholder:text-zinc-500 placeholder:uppercase font-semibold disabled:opacity-50"
                  required
                  disabled={isSubmitting}
                />
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileHover={{ x: 3 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-white hover:text-zinc-300 transition-colors duration-300 disabled:text-zinc-600"
                >
                  {isSubmitting ? "..." : "Join"} <ChevronRight size={16} />
                </motion.button>
              </div>
            </motion.form>
          )}
        </motion.div>

        {/* --- LINKS SECTION --- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="grid gap-12 md:grid-cols-2 lg:grid-cols-5"
        >
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                className="relative w-25 h-25 flex-shrink-0"
              >
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 2 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="relative w-full h-full"
                >
                  <Image
                    src="/images/logo/pic4.png"
                    alt="INK Logo"
                    fill
                    className=""
                  />
                </motion.div>
              </motion.div>
            </div>
            <p className="max-w-sm text-sm text-zinc-300 leading-relaxed italic font-medium">
              To fulfill that commitment, we at the Adrenaline Junky Piercinks are ready to offer you extra service; Replacement of jewelries, cleaning of piercing & consultations for Free!
            </p>
          </div>

          {footerLinks.map((section, idx) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className="space-y-6"
            >
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white">
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <motion.li
                    key={link.label}
                    whileHover={{ x: 4 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Link
                      href={link.href}
                      className="text-xs text-zinc-400 hover:text-white transition-all duration-300 font-bold uppercase tracking-widest"
                    >
                      {link.label}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>

        {/* --- BOTTOM BAR --- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mt-20 flex flex-col items-center justify-between gap-8 border-t border-zinc-800 pt-8 md:flex-row"
        >
          <div className="space-y-2 text-center md:text-left">
            <p className="text-[9px] text-zinc-300 uppercase tracking-widest font-black">
              © {new Date().getFullYear()} Adrenaline Junky Piercinks.
            </p>
            <div className="flex flex-col gap-2 text-[9px] text-zinc-400 uppercase tracking-widest">
              <motion.div
                whileHover={{ x: 4 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="flex items-center gap-2 hover:text-white transition-colors duration-300 cursor-pointer"
              >
                <Phone size={10} />
                +63 935 595 5699
              </motion.div>
              <motion.div
                whileHover={{ x: 4 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="flex items-center gap-2 hover:text-white transition-colors duration-300 cursor-pointer"
              >
                <MapPin size={10} />
                7/11, 2nd Flr, National Road, Putatan, Muntinlupa City, PH
              </motion.div>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="flex gap-6">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  whileHover={{ scale: 1.2, y: -3 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="text-zinc-400 hover:text-white transition-colors duration-300"
                >
                  <social.icon className="h-5 w-5" />
                </motion.a>
              ))}
            </div>

            <motion.div
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <Button
                onClick={scrollToTop}
                className="h-10 w-10 rounded-full border-white/20 bg-white/10 text-white hover:border-white hover:bg-white hover:text-black transition-all duration-300"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}