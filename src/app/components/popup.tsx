"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Calendar, Info, X, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BookingPopup() {
  const [isOpen, setIsOpen] = useState(false);

  // Popup appears 1.5 seconds after page load
  useEffect(() => {
    const timer = setTimeout(() => setIsOpen(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          {/* Backdrop Closer */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="absolute inset-0"
          />

          {/* Popup Card */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-[2.5rem] overflow-hidden shadow-2xl border border-zinc-100"
          >
            {/* Close Button */}
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-6 right-6 p-2 hover:bg-zinc-100 rounded-full transition-colors z-10"
            >
              <X className="size-5 text-zinc-400" />
            </button>

            {/* Header / Banner */}
            <div className="bg-zinc-900 p-8 text-white relative overflow-hidden">
                <div className="absolute -right-4 -top-4 opacity-10">
                    <MessageCircle size={150} />
                </div>
                <Badge className="bg-[#d11a2a] text-white border-none mb-4 rounded-full px-4 font-black italic tracking-widest text-[10px]">
                    READ BEFORE BOOKING
                </Badge>
                <h2 className="text-3xl font-black uppercase italic leading-none tracking-tighter">
                    Consult <span className="text-[#d11a2a]">First</span>,<br />Book Later.
                </h2>
            </div>

            {/* Content */}
            <div className="p-8 space-y-6">
              <p className="text-zinc-500 text-sm font-medium leading-relaxed">
                To ensure the best experience, <span className="text-black font-black uppercase italic">we highly recommend</span> chatting with us before filling out the booking form.
              </p>

              <div className="grid gap-4">
                {/* Artist Availability */}
                <div className="flex gap-4 p-4 rounded-2xl bg-zinc-50 border border-zinc-100 group hover:border-red-100 transition-colors">
                  <div className="size-10 bg-white rounded-xl shadow-sm flex items-center justify-center shrink-0">
                    <Calendar className="size-5 text-[#d11a2a]" />
                  </div>
                  <div>
                    <h4 className="font-black uppercase italic text-xs tracking-wider">Artist Availability</h4>
                    <p className="text-[11px] text-zinc-400 font-bold uppercase">Confirm if your preferred artist is available on your desired date.</p>
                  </div>
                </div>

                {/* Gmail Instruction */}
                <div className="flex gap-4 p-4 rounded-2xl bg-red-50/50 border border-red-100 group transition-colors">
                  <div className="size-10 bg-white rounded-xl shadow-sm flex items-center justify-center shrink-0 border border-red-100">
                    <Mail className="size-5 text-[#d11a2a]" />
                  </div>
                  <div>
                    <h4 className="font-black uppercase italic text-xs tracking-wider text-red-700">Live Chat Access</h4>
                    <p className="text-[11px] text-zinc-500 font-bold uppercase leading-tight">
                        You can use your <span className="text-red-600 underline">Gmail account</span> to log in and use our Customer Service chat box.
                    </p>
                  </div>
                </div>
              </div>

              {/* Chat Hint */}
              <div className="bg-zinc-900 p-4 rounded-2xl flex items-center gap-3">
                <Info className="size-5 text-[#d11a2a] shrink-0" />
                <p className="text-[10px] font-black uppercase text-zinc-300 tracking-tight leading-tight">
                  Our team is ready to help! Look for the chat bubble at the corner of your screen for immediate assistance.
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-3">
                <Button 
                  onClick={() => setIsOpen(false)}
                  className="w-full bg-black hover:bg-zinc-800 text-white h-14 rounded-full font-black uppercase tracking-[0.2em] text-xs shadow-lg shadow-black/10 transition-transform active:scale-95"
                >
                  Proceed to Booking Form
                </Button>
                <p className="text-center text-[9px] font-bold text-zinc-300 uppercase tracking-widest">
                  Adrenalin Junky Piercinks • Official Session Portal
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <span className={`inline-block py-1 px-3 text-xs font-bold rounded ${className}`}>
            {children}
        </span>
    );
}