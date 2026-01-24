"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Mail, User, Clock, MessageSquare, X, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Inquiries() {
  const [inquiries, setInquiries] = useState([]);
  const [selectedInquiry, setSelectedInquiry] = useState<any>(null);

  const fetchInquiries = async () => {
    const res = await fetch("/api/contact");
    const data = await res.json();
    setInquiries(data);
  };

  const deleteInquiry = async (id: string) => {
    const res = await fetch("/api/contact", {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setInquiries(inquiries.filter((item: any) => item.id !== id));
      toast.success("Inquiry removed from list");
    }
  };

  useEffect(() => {
    fetchInquiries();
    const interval = setInterval(fetchInquiries, 10000); // Auto refresh 10s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-black uppercase italic text-white tracking-widest">
          Live Feed <span className="text-orange-600">({inquiries.length})</span>
        </h2>
      </div>

      <div className="grid gap-4">
        <AnimatePresence mode="popLayout">
          {inquiries.map((item: any) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="group relative bg-zinc-900/40 border border-white/5 hover:border-orange-600/30 rounded-2xl p-5 transition-all duration-300"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-orange-600 text-[9px] font-black uppercase tracking-tighter">
                      {item.service}
                    </Badge>
                    <span className="text-zinc-600 text-[10px] font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {item.timestamp}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-white font-black text-sm uppercase tracking-tight flex items-center gap-2">
                      <User className="w-3 h-3 text-orange-600" /> {item.name}
                    </h3>
                    <p className="text-zinc-500 text-[11px] font-medium italic">{item.email}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setSelectedInquiry(item)}
                    className="h-8 w-8 rounded-full bg-zinc-800/50 text-zinc-400 hover:bg-orange-600 hover:text-white"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteInquiry(item.id)}
                    className="h-8 w-8 rounded-full bg-zinc-800/50 text-zinc-400 hover:bg-red-600 hover:text-white"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {inquiries.length === 0 && (
          <div className="py-20 text-center border-2 border-dashed border-zinc-900 rounded-3xl">
            <p className="text-zinc-600 font-bold uppercase text-xs tracking-[0.2em]">No Active Inquiries</p>
          </div>
        )}
      </div>

      {/* --- MESSAGE MODAL --- */}
      <AnimatePresence>
        {selectedInquiry && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-lg bg-zinc-950 border border-orange-600/20 rounded-[2.5rem] p-8 relative overflow-hidden shadow-2xl"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-orange-600" />
              
              <button 
                onClick={() => setSelectedInquiry(null)}
                className="absolute top-6 right-6 text-zinc-500 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="mb-8">
                <Badge className="bg-orange-600 mb-4 uppercase text-[10px] font-black italic">
                  {selectedInquiry.service}
                </Badge>
                <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">
                  {selectedInquiry.name}
                </h2>
                <p className="text-zinc-500 font-bold text-xs">{selectedInquiry.email}</p>
              </div>

              <div className="bg-zinc-900/50 rounded-2xl p-6 border border-white/5">
                <p className="text-zinc-400 text-xs font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                  <MessageSquare className="w-3 h-3 text-orange-600" /> Project Details
                </p>
                <p className="text-zinc-200 text-sm leading-relaxed italic">
                  "{selectedInquiry.message}"
                </p>
              </div>

              <Button 
                onClick={() => setSelectedInquiry(null)}
                className="w-full mt-8 bg-zinc-100 text-black hover:bg-orange-600 hover:text-white font-black uppercase text-xs tracking-widest h-12 rounded-xl transition-all"
              >
                Close Message
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}