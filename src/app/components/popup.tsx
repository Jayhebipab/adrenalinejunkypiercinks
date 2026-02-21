"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Calendar, Info, X, Mail, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BookingPopup() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsOpen(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="absolute inset-0"
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative w-full max-w-md bg-white rounded-[2rem] overflow-hidden shadow-2xl border border-zinc-100"
          >
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2 hover:bg-zinc-100 rounded-full z-20 bg-white/10 backdrop-blur-md md:bg-transparent"
            >
              <X className="size-5 text-zinc-400 md:text-zinc-500" />
            </button>

            {/* Header */}
            <div className="bg-zinc-900 p-6 text-white relative overflow-hidden">
                <div className="absolute -right-2 -top-2 opacity-10">
                    <MessageCircle size={100} />
                </div>
                <Badge className="bg-[#d11a2a] text-[9px] mb-3 tracking-widest">
                    IMPORTANT NOTICE
                </Badge>
                <h2 className="text-2xl font-black uppercase italic leading-tight tracking-tighter">
                    Verify <span className="text-[#d11a2a]">Details</span>,<br />Then Book.
                </h2>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              <p className="text-zinc-500 text-[11px] font-medium leading-snug">
                To avoid double-bookings or cancellations, please verify your schedule with us before submitting the form.
              </p>

              <div className="grid gap-2">
                {/* Artist Availability */}
                <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-50 border border-zinc-100">
                  <div className="size-8 bg-white rounded-lg shadow-sm flex items-center justify-center shrink-0 border border-zinc-100">
                    <Calendar className="size-4 text-[#d11a2a]" />
                  </div>
                  <div>
                    <h4 className="font-black uppercase italic text-[10px] tracking-wider">Confirm Date & Time</h4>
                    <p className="text-[9px] text-zinc-400 font-bold uppercase leading-tight">
                        Message us first to reserve your slot. Dates are not guaranteed until confirmed via chat.
                    </p>
                  </div>
                </div>

                {/* Gmail & Portal Instruction */}
                <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50/50 border border-red-100">
                  <div className="size-8 bg-white rounded-lg shadow-sm flex items-center justify-center shrink-0 border border-red-100">
                    <Mail className="size-4 text-[#d11a2a]" />
                  </div>
                  <div>
                    <h4 className="font-black uppercase italic text-[10px] tracking-wider text-red-700">Gmail Login Required</h4>
                    <p className="text-[9px] text-zinc-500 font-bold uppercase leading-tight">
                        You must log in using a <span className="text-red-600 underline text-bold">Gmail account</span> to access the <b>Live Chat</b> and your <b>Customer Portal</b>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Requirements Summary */}
              <div className="flex items-center justify-between px-1 py-1 border-y border-zinc-50">
                <div className="flex items-center gap-1">
                    <CheckCircle2 className="size-3 text-green-600" />
                    <span className="text-[8px] font-black uppercase text-zinc-400">Portal Access</span>
                </div>
                <div className="flex items-center gap-1">
                    <CheckCircle2 className="size-3 text-green-600" />
                    <span className="text-[8px] font-black uppercase text-zinc-400">Live Support</span>
                </div>
                <div className="flex items-center gap-1">
                    <CheckCircle2 className="size-3 text-green-600" />
                    <span className="text-[8px] font-black uppercase text-zinc-400">Session Tracking</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-3">
                <Button 
                  onClick={() => setIsOpen(false)}
                  className="w-full bg-black hover:bg-zinc-800 text-white h-12 rounded-full font-black uppercase tracking-widest text-[10px] shadow-lg transition-transform active:scale-95"
                >
                  Confirm & Proceed
                </Button>
                <div className="flex items-center justify-center gap-2">
                    <Info className="size-3 text-[#d11a2a]" />
                    <p className="text-[8px] font-bold text-zinc-300 uppercase tracking-widest text-center">
                        Adrenaline Junky Piercinks Official
                    </p>
                </div>
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
        <span className={`inline-block py-0.5 px-3 text-[9px] font-black italic rounded-full border-none ${className}`}>
            {children}
        </span>
    );
}