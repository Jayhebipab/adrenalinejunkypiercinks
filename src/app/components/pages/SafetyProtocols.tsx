"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { 
  collection, onSnapshot, query, orderBy, 
  deleteDoc, doc, addDoc, updateDoc, serverTimestamp 
} from "firebase/firestore";
import { 
  Plus, Pencil, Trash2, Loader2, X, 
  Save, ShieldAlert, FileText, ImagePlus, 
  UploadCloud, CheckCircle2, ClipboardCheck, AlertCircle,
  Stethoscope, Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { uploadToCloudinary } from "@/lib/cloudinary"; 

export default function ProtocolManager() {
  const [protocols, setProtocols] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // --- Form States ---
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [safetyLevel, setSafetyLevel] = useState("Standard"); // Parang category dati
  
  const [waiverImageFile, setWaiverImageFile] = useState<File | null>(null);
  const [waiverPrev, setWaiverPrev] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "safety_protocols"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProtocols(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title) return alert("Protocol Title is required.");
    if (!waiverPrev && !waiverImageFile) return alert("Waiver Image/Reference is required.");

    setLoading(true);
    try {
      let finalImageUrl = waiverPrev;
      if (waiverImageFile) {
        finalImageUrl = await uploadToCloudinary(waiverImageFile);
      }

      const protocolData = {
        title,
        description,
        safetyLevel,
        waiverImage: finalImageUrl,
        updatedAt: serverTimestamp(),
      };

      if (editingId) {
        await updateDoc(doc(db, "safety_protocols", editingId), protocolData);
      } else {
        await addDoc(collection(db, "safety_protocols"), { 
          ...protocolData, 
          createdAt: serverTimestamp() 
        });
      }

      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      console.error(err);
      alert("Error: Failed to sync protocols.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setSafetyLevel("Standard");
    setWaiverImageFile(null);
    setWaiverPrev(null);
  };

  return (
    <div className="space-y-8">
      {/* HEADER PANEL */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-[1000] text-gray-900 uppercase tracking-tighter italic">
            Waiver Management
          </h2>
         
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="bg-black text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-[#d11a2a] transition-all shadow-xl shadow-red-100"
        >
          <ShieldAlert size={18} /> Add New Waiver
        </button>
      </div>

      {/* LIST OF PROTOCOLS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {protocols.map(item => (
          <motion.div 
            layout key={item.id}
            className="bg-white border border-gray-100 p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity flex gap-2">
                 <button onClick={() => {
                      setEditingId(item.id); setTitle(item.title); setDescription(item.description);
                      setSafetyLevel(item.safetyLevel); setWaiverPrev(item.waiverImage);
                      setIsModalOpen(true);
                  }} className="p-2 bg-gray-100 rounded-lg hover:bg-black hover:text-white transition-all"><Pencil size={14}/></button>
                 <button onClick={() => confirm("Delete this protocol?") && deleteDoc(doc(db, "safety_protocols", item.id))} className="p-2 bg-gray-100 rounded-lg hover:bg-red-500 hover:text-white transition-all"><Trash2 size={14}/></button>
            </div>

            <div className="w-12 h-12 bg-red-50 text-[#d11a2a] rounded-2xl flex items-center justify-center mb-4">
                <ClipboardCheck size={24} />
            </div>

            <h4 className="font-black text-gray-900 uppercase text-lg tracking-tighter leading-tight mb-1">{item.title}</h4>
            <div className="flex items-center gap-2 mb-4">
                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md ${item.safetyLevel === 'Critical' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                    {item.safetyLevel}
                </span>
            </div>
            
            <p className="text-gray-500 text-xs font-medium line-clamp-3 mb-6">{item.description}</p>
            
            <div className="pt-4 border-t border-dashed border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200">
                        <img src={item.waiverImage} className="w-full h-full object-cover" alt="Waiver Preview" />
                    </div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest text-[8px]">Waiver Active</span>
                </div>
                <Info size={14} className="text-gray-300" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* FULL-HEIGHT MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
            <motion.div 
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} 
              className="relative bg-white h-screen w-full max-w-xl shadow-2xl overflow-y-auto"
            >
              <div className="p-8 border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-md z-20 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-red-50 text-[#d11a2a] rounded-xl"><Stethoscope size={24}/></div>
                  <h3 className="font-black uppercase italic tracking-tighter text-2xl">Safety Sync</h3>
                </div>
                <button onClick={handleSubmit} disabled={loading} className="bg-black text-white px-8 py-4 rounded-full font-black uppercase text-[10px] tracking-[0.2em] hover:bg-[#d11a2a] flex items-center gap-3 transition-all disabled:opacity-50">
                  {loading ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>}
                  {loading ? "Syncing..." : "Update Protocol"}
                </button>
              </div>

              <div className="p-10 space-y-10 pb-20">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Protocol Name</label>
                    <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full text-2xl font-black uppercase outline-none border-b-2 border-gray-100 focus:border-[#d11a2a] pb-2 transition-all" placeholder="E.G. PIERCING PROCEDURE" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Severity Level</label>
                    <select value={safetyLevel} onChange={(e) => setSafetyLevel(e.target.value)} className="w-full bg-gray-50 rounded-xl p-4 text-xs font-black uppercase outline-none cursor-pointer">
                      <option>Standard</option>
                      <option>Required</option>
                      <option>Post-Procedure</option>
                    </select>
                  </div>
                </div>

                {/* WAIVER IMAGE UPLOAD */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase text-gray-400 flex items-center gap-2 tracking-widest">
                    <ClipboardCheck size={14}/> Waiver Form Reference (Image)
                  </label>
                  <div className="relative aspect-[3/4] max-w-[300px] mx-auto bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-100 flex items-center justify-center overflow-hidden hover:border-[#d11a2a] transition-all group">
                    {waiverPrev ? (
                      <img src={waiverPrev} className="w-full h-full object-cover" alt="Waiver preview" />
                    ) : (
                      <div className="text-center text-gray-300 group-hover:text-[#d11a2a]">
                        <UploadCloud size={40} className="mx-auto mb-2" />
                        <span className="text-[9px] font-black uppercase tracking-widest block">Upload Waiver Ref</span>
                      </div>
                    )}
                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => {
                      const f = e.target.files?.[0];
                      if(f) { setWaiverImageFile(f); setWaiverPrev(URL.createObjectURL(f)); }
                    }} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Procedure Guidelines</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full h-48 bg-gray-50 rounded-2xl p-6 text-sm font-bold outline-none focus:ring-2 focus:ring-[#d11a2a]/10 resize-none border-none" placeholder="Detailed instructions for the client or artist..." />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}