"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection, onSnapshot, query, orderBy,
  deleteDoc, doc, addDoc, updateDoc, serverTimestamp
} from "firebase/firestore";
import {
  Plus, Pencil, Trash2, Loader2, Save,
  ShieldAlert, UploadCloud, ClipboardCheck,
  Stethoscope, RotateCcw, AlertCircle, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { toast, Toaster } from "sonner";
import { cn } from "@/lib/utils";

// ─── AUDIT TRAIL ──────────────────────────────────────────────────────────────
async function logAudit({ action, details, module = "Waiver Management" }: {
  action: string; details: string; module?: string;
}) {
  try {
    const stored = localStorage.getItem("user");
    const parsed = stored ? JSON.parse(stored) : null;
    await addDoc(collection(db, "audit_logs"), {
      adminName: parsed?.name ?? "Unknown Admin",
      adminEmail: parsed?.email ?? "—",
      action, details, module,
      timestamp: serverTimestamp(),
    });
  } catch (err) { console.warn("Audit log failed:", err); }
}
// ─────────────────────────────────────────────────────────────────────────────

// ─── VALIDATION ───────────────────────────────────────────────────────────────
interface FormErrors { title?: string; image?: string; }

function validateProtocol(data: { title: string; hasImage: boolean }): FormErrors {
  const errors: FormErrors = {};
  if (!data.title.trim()) errors.title = "Protocol title is required.";
  if (!data.hasImage) errors.image = "Waiver image is required.";
  return errors;
}
// ─────────────────────────────────────────────────────────────────────────────

export default function ProtocolManager() {
  const [protocols, setProtocols] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [safetyLevel, setSafetyLevel] = useState("Standard");
  const [waiverImageFile, setWaiverImageFile] = useState<File | null>(null);
  const [waiverPrev, setWaiverPrev] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "safety_protocols"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProtocols(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, []);

  // ─── SUBMIT ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateProtocol({ title, hasImage: !!(waiverPrev || waiverImageFile) });
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error("Please fix the errors before saving.");
      return;
    }

    setLoading(true);
    const doSave = async () => {
      let finalImageUrl = waiverPrev;
      if (waiverImageFile) finalImageUrl = await uploadToCloudinary(waiverImageFile);

      const protocolData = {
        title, description, safetyLevel,
        waiverImage: finalImageUrl,
        updatedAt: serverTimestamp(),
      };

      if (editingId) {
        await updateDoc(doc(db, "safety_protocols", editingId), protocolData);
        await logAudit({
          action: "EDITED WAIVER PROTOCOL",
          details: `Edited protocol "${title}" (ID: ${editingId}) — Safety Level: ${safetyLevel}`,
        });
      } else {
        const newDoc = await addDoc(collection(db, "safety_protocols"), {
          ...protocolData, createdAt: serverTimestamp(),
        });
        await logAudit({
          action: "ADDED WAIVER PROTOCOL",
          details: `Added new protocol "${title}" (ID: ${newDoc.id}) — Safety Level: ${safetyLevel}`,
        });
      }

      setIsModalOpen(false);
      resetForm();
    };

    try {
      await toast.promise(doSave(), {
        loading: editingId ? "Updating protocol..." : "Saving protocol...",
        success: editingId ? "Protocol updated!" : "Protocol added!",
        error: (err: Error) => err.message,
      });
    } finally { setLoading(false); }
  };

  // ─── DELETE ───────────────────────────────────────────────────────────────
  const handleDelete = async (item: any) => {
    if (!confirm(`Delete "${item.title.toUpperCase()}"?`)) return;
    const doDelete = async () => {
      await deleteDoc(doc(db, "safety_protocols", item.id));
      await logAudit({
        action: "DELETED WAIVER PROTOCOL",
        details: `Deleted protocol "${item.title}" (ID: ${item.id}) — Safety Level: ${item.safetyLevel}`,
      });
    };
    toast.promise(doDelete(), {
      loading: `Removing "${item.title}"...`,
      success: `"${item.title}" deleted.`,
      error: "Delete failed.",
    });
  };

  const resetForm = () => {
    setEditingId(null); setTitle(""); setDescription("");
    setSafetyLevel("Standard"); setWaiverImageFile(null);
    setWaiverPrev(null); setFormErrors({});
  };

  const criticalCount = protocols.filter(p => p.safetyLevel === "Critical" || p.safetyLevel === "Required").length;
  const standardCount = protocols.filter(p => p.safetyLevel === "Standard").length;

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <Toaster position="bottom-right" richColors />

      <div className="max-w-5xl mx-auto space-y-8">

        {/* ── HEADER ── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.35em] text-muted-foreground mb-2 flex items-center gap-2">
              <span className="h-px w-5 bg-current inline-block" /> Safety & Compliance
            </p>
            <h1 className="text-5xl md:text-6xl font-black uppercase italic tracking-tighter leading-none">
              The<br />
              <span className="text-muted-foreground/30">Waivers</span>
            </h1>
          </div>
          <button
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="h-12 px-6 bg-foreground text-background rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:opacity-90 transition-all shadow-lg"
          >
            <Plus size={16} /> Add New Waiver
          </button>
        </div>

        {/* ── STATS ── */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Protocols", value: protocols.length,  icon: ClipboardCheck, color: "text-foreground",  bg: "bg-muted" },
            { label: "Required",        value: criticalCount,      icon: ShieldAlert,    color: "text-red-500",    bg: "bg-red-500/10" },
            { label: "Standard",        value: standardCount,      icon: Stethoscope,    color: "text-emerald-500",bg: "bg-emerald-500/10" },
          ].map(stat => (
            <div key={stat.label} className="bg-card border border-border rounded-[1.5rem] p-5 flex items-center gap-4">
              <div className={cn("p-2.5 rounded-xl", stat.bg, stat.color)}>
                <stat.icon className="size-4" />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-black">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── TABLE ── */}
        <div className="bg-card border border-border rounded-[2rem] overflow-hidden shadow-sm">
          <div className="px-8 py-5 border-b border-border">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              {protocols.length} Protocols
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[640px]">
              <thead>
                <tr className="text-[9px] font-black uppercase tracking-widest text-muted-foreground border-b border-border/50">
                  <th className="px-8 py-4">Waiver</th>
                  <th className="px-8 py-4">Protocol Name</th>
                  <th className="px-8 py-4">Safety Level</th>
                  <th className="px-8 py-4">Guidelines</th>
                  <th className="px-8 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {protocols.length === 0 ? (
                  <tr><td colSpan={5} className="py-20 text-center">
                    <ClipboardCheck className="mx-auto size-10 text-muted-foreground/20 mb-3" />
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">No protocols yet</p>
                  </td></tr>
                ) : protocols.map(item => (
                  <tr key={item.id} className="group hover:bg-muted/30 transition-all">
                    <td className="px-8 py-4">
                      <div className="w-12 h-16 rounded-xl overflow-hidden border border-border bg-muted">
                        <img src={item.waiverImage} className="w-full h-full object-cover" alt="Waiver" />
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <span className="text-sm font-black uppercase italic tracking-tight">{item.title}</span>
                    </td>
                    <td className="px-8 py-4">
                      <span className={cn(
                        "inline-flex items-center px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                        item.safetyLevel === "Required" ? "bg-red-500/10 text-red-500 border-red-500/20" :
                        item.safetyLevel === "Post-Procedure" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                        "bg-muted text-muted-foreground border-border"
                      )}>
                        {item.safetyLevel}
                      </span>
                    </td>
                    <td className="px-8 py-4 max-w-[220px]">
                      <p className="text-xs text-muted-foreground line-clamp-2">{item.description || "—"}</p>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEditingId(item.id); setTitle(item.title); setDescription(item.description);
                            setSafetyLevel(item.safetyLevel); setWaiverPrev(item.waiverImage);
                            setFormErrors({}); setIsModalOpen(true);
                          }}
                          className="h-9 w-9 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground hover:bg-foreground hover:text-background hover:border-transparent transition-all"
                          title="Edit protocol"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="h-9 w-9 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground hover:bg-destructive hover:text-white hover:border-transparent transition-all"
                          title="Delete protocol"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── SLIDE-IN MODAL ── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="relative bg-card border-l border-border h-screen w-full max-w-xl shadow-2xl overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="p-8 border-b border-border sticky top-0 bg-card/80 backdrop-blur-md z-20 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-black uppercase italic tracking-tighter">
                    {editingId ? "Modify Protocol" : "Create Node"}
                  </h3>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                    {editingId ? `Editing: ${title}` : "Register a new waiver protocol"}
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2.5 hover:bg-muted rounded-full transition-all text-muted-foreground"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-8 space-y-8 pb-20">

                {/* Protocol Name */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest ml-1">Protocol Name</label>
                  <input
                    value={title}
                    onChange={e => {
                      setTitle(e.target.value);
                      if (formErrors.title) setFormErrors(prev => ({ ...prev, title: undefined }));
                    }}
                    className={cn(
                      "w-full bg-muted rounded-xl px-4 py-3.5 text-sm font-black uppercase outline-none border-2 transition-all",
                      formErrors.title ? "border-destructive bg-destructive/5" : "border-transparent focus:border-foreground"
                    )}
                    placeholder="E.G. PIERCING PROCEDURE"
                  />
                  {formErrors.title && (
                    <div className="flex items-center gap-1.5 text-destructive text-[10px] font-bold ml-1">
                      <AlertCircle className="size-3" /> {formErrors.title}
                    </div>
                  )}
                </div>

                {/* Safety Level */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest ml-1">Safety Level</label>
                  <select
                    value={safetyLevel}
                    onChange={e => setSafetyLevel(e.target.value)}
                    className="w-full bg-muted rounded-xl px-4 py-3.5 text-xs font-black uppercase outline-none border-2 border-transparent focus:border-foreground transition-all"
                  >
                    <option>Standard</option>
                    <option>Required</option>
                    <option>Post-Procedure</option>
                  </select>
                </div>

                {/* Waiver Image */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest ml-1 flex items-center gap-1.5">
                    <ClipboardCheck size={12} /> Waiver Form Reference (Image)
                  </label>
                  <label className={cn(
                    "relative aspect-[3/4] max-w-[260px] mx-auto flex items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed cursor-pointer transition-all group bg-muted/50",
                    formErrors.image ? "border-destructive" : "border-border hover:border-foreground"
                  )}>
                    {waiverPrev ? (
                      <img src={waiverPrev} className="w-full h-full object-cover" alt="Waiver preview" />
                    ) : (
                      <div className="text-center">
                        <UploadCloud className="size-8 text-muted-foreground mx-auto mb-2 group-hover:text-foreground transition-colors" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Upload Waiver Ref</span>
                        <span className="block text-[9px] text-muted-foreground mt-1">JPG, JPEG, PNG only</span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={e => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        const allowed = ["image/jpeg", "image/jpg", "image/png"];
                        if (!allowed.includes(f.type)) { toast.error("Only JPG, JPEG, PNG allowed."); return; }
                        setWaiverImageFile(f);
                        setWaiverPrev(URL.createObjectURL(f));
                        setFormErrors(prev => ({ ...prev, image: undefined }));
                      }}
                    />
                  </label>
                  {formErrors.image && (
                    <div className="flex items-center gap-1.5 text-destructive text-[10px] font-bold ml-1 justify-center">
                      <AlertCircle className="size-3" /> {formErrors.image}
                    </div>
                  )}
                </div>

                {/* Guidelines */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest ml-1">Procedure Guidelines</label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={6}
                    className="w-full bg-muted rounded-xl px-4 py-3.5 text-xs font-medium outline-none border-2 border-transparent focus:border-foreground transition-all resize-none leading-relaxed"
                    placeholder="Detailed instructions for the client or artist..."
                  />
                </div>

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={loading || Object.values(formErrors).some(Boolean)}
                  className="w-full h-14 bg-foreground text-background rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin size-4" /> : <><Save size={14} /> Commit Record</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}