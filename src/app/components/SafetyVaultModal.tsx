"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Download, ClipboardCheck, Loader2, CheckCircle2, X, ShieldCheck
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from "firebase/firestore";

interface SafetyVaultProps {
  isOpen: boolean;
  onClose: () => void;
  userSession?: any; // Para sa auto-fill
}

export default function SafetyVaultModal({ isOpen, onClose, userSession }: SafetyVaultProps) {
  const [protocols, setProtocols] = useState<any[]>([]);
  const [selectedProtocol, setSelectedProtocol] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Auto-fill pag may session
  useEffect(() => {
    if (userSession?.user) {
      setFormData({
        name: userSession.user.name || "",
        email: userSession.user.email || "",
      });
    }
  }, [userSession]);

  // Fetch protocols logic
  useEffect(() => {
    const q = query(collection(db, "safety_protocols"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProtocols(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const handleDownload = async (protocol: any) => {
    setSelectedProtocol(protocol);
    setIsSubmitting(true);

    try {
      await addDoc(collection(db, "protocol_access_logs"), {
        requesterName: formData.name,
        requesterEmail: formData.email,
        protocolTitle: protocol.title,
        accessedAt: serverTimestamp(),
      });

      if (protocol.waiverImage) {
        const imageUrl = protocol.waiverImage.replace("/upload/", "/upload/fl_attachment/");
        const link = document.createElement('a');
        link.href = imageUrl;
        link.setAttribute('download', `${protocol.title.replace(/\s+/g, '_')}_Waiver.jpg`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      setIsSuccess(true);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} 
            className="absolute inset-0 bg-black/90 backdrop-blur-xl" 
          />
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-zinc-950 w-full max-w-2xl rounded-[2.5rem] border border-white/10 p-8 md:p-12 overflow-hidden shadow-2xl"
          >
            <button onClick={onClose} className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors">
              <X size={24} />
            </button>

            {!isSuccess ? (
              <div className="space-y-8">
                <div>
                  <div className="flex items-center gap-2 text-[#d11a2a] mb-2">
                    <ShieldCheck size={18} />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Optional for Booking</span>
                  </div>
                  <h2 className="text-3xl font-[1000] uppercase italic tracking-tighter text-white">Safety <span className="text-[#d11a2a]">Vault</span></h2>
                  <p className="text-zinc-500 text-xs font-bold uppercase mt-1">Select a waiver to download</p>
                </div>

                <div className="grid gap-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                  {protocols.map((p) => (
                    <div key={p.id} className="group flex items-center justify-between p-5">
                      <div>
                        <h3 className="font-black uppercase italic text-sm text-white">{p.title}</h3>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{p.safetyLevel}</p>
                      </div>
                      <button 
                        onClick={() => handleDownload(p)}
                        disabled={isSubmitting}
                        className="h-12 w-12 bg-[#d11a2a] rounded-xl flex items-center justify-center text-white hover:scale-105 transition-transform disabled:opacity-50"
                      >
                        {isSubmitting && selectedProtocol?.id === p.id ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-6 mx-auto">
                  <CheckCircle2 size={40} />
                </div>
                <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white mb-2">Waiver Downloaded</h2>
                <p className="text-zinc-400 text-xs font-medium mb-8 max-w-xs mx-auto">Please print or keep a digital copy. You will need to present this during your session.</p>
                <button onClick={() => { setIsSuccess(false); onClose(); }} className="w-full bg-white text-black py-4 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-[#d11a2a] hover:text-white transition-all">Got it, Thanks!</button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}