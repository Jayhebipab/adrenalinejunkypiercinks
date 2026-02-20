"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection, addDoc, onSnapshot, query,
  deleteDoc, doc, updateDoc, orderBy, serverTimestamp
} from "firebase/firestore";
import { Trash2, Plus, Edit2, X, Check, HelpCircle, RotateCcw, AlertCircle, MessageSquare } from "lucide-react";
import { toast, Toaster } from "sonner";
import { cn } from "@/lib/utils";

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface FAQItem {
  id: string;
  question: string;
  answer: string;
  icon: string;
}

interface FormErrors { question?: string; answer?: string; }

// ─── AUDIT TRAIL ──────────────────────────────────────────────────────────────
async function logAudit({ action, details, module = "FAQ Management" }: {
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

// ─── VALIDATION ───────────────────────────────────────────────────────────────
const SPECIAL_CHAR_REGEX = /[^a-zA-Z0-9\s\-'&.,()!?:]/;

function validateFaq(data: { question: string; answer: string }): FormErrors {
  const errors: FormErrors = {};
  if (!data.question.trim()) errors.question = "Question is required.";
  else if (SPECIAL_CHAR_REGEX.test(data.question)) errors.question = "Invalid characters in question.";
  if (!data.answer.trim()) errors.answer = "Answer is required.";
  return errors;
}

const ICON_OPTIONS = ["🚀", "📩", "🛠️", "💡", "❓", "📌", "🎯", "✅"];

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function FAQEditor() {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [fetching, setFetching] = useState(true);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [newIcon, setNewIcon] = useState("🚀");
  const [addErrors, setAddErrors] = useState<FormErrors>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ question: "", answer: "", icon: "" });
  const [editErrors, setEditErrors] = useState<FormErrors>({});

  useEffect(() => {
    const q = query(collection(db, "faq_settings"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setFaqs(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as FAQItem[]);
      setFetching(false);
    });
    return () => unsubscribe();
  }, []);

  // ─── ADD ──────────────────────────────────────────────────────────────────
  const handleAddFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateFaq({ question: newQuestion, answer: newAnswer });
    if (Object.keys(errors).length > 0) { setAddErrors(errors); toast.error("Please fix the errors."); return; }

    const doAdd = async () => {
      const newDoc = await addDoc(collection(db, "faq_settings"), {
        question: newQuestion, answer: newAnswer, icon: newIcon,
        createdAt: serverTimestamp(),
      });
      await logAudit({
        action: "ADDED FAQ ENTRY",
        details: `Added FAQ: "${newQuestion}" (ID: ${newDoc.id})`,
      });
      setNewQuestion(""); setNewAnswer(""); setNewIcon("🚀"); setAddErrors({});
    };

    toast.promise(doAdd(), {
      loading: "Adding FAQ...",
      success: "FAQ added!",
      error: "Failed to add FAQ.",
    });
  };

  // ─── EDIT ─────────────────────────────────────────────────────────────────
  const startEditing = (faq: FAQItem) => {
    setEditingId(faq.id);
    setEditForm({ question: faq.question, answer: faq.answer, icon: faq.icon });
    setEditErrors({});
  };

  const handleUpdateFaq = async (faq: FAQItem) => {
    const errors = validateFaq({ question: editForm.question, answer: editForm.answer });
    if (Object.keys(errors).length > 0) { setEditErrors(errors); toast.error("Please fix the errors."); return; }

    const doUpdate = async () => {
      await updateDoc(doc(db, "faq_settings", faq.id), {
        question: editForm.question, answer: editForm.answer, icon: editForm.icon,
      });
      await logAudit({
        action: "EDITED FAQ ENTRY",
        details: `Edited FAQ (ID: ${faq.id}): "${editForm.question}"`,
      });
      setEditingId(null);
    };

    toast.promise(doUpdate(), {
      loading: "Updating...",
      success: "FAQ updated!",
      error: "Update failed.",
    });
  };

  // ─── DELETE ───────────────────────────────────────────────────────────────
  const deleteFaq = async (faq: FAQItem) => {
    if (!confirm(`Delete "${faq.question}"?`)) return;
    const doDelete = async () => {
      await deleteDoc(doc(db, "faq_settings", faq.id));
      await logAudit({
        action: "DELETED FAQ ENTRY",
        details: `Deleted FAQ (ID: ${faq.id}): "${faq.question}"`,
      });
    };
    toast.promise(doDelete(), {
      loading: "Deleting...",
      success: "FAQ deleted.",
      error: "Delete failed.",
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <Toaster position="bottom-right" richColors />

      <div className="max-w-5xl mx-auto space-y-8">

        {/* ── HEADER ── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.35em] text-muted-foreground mb-2 flex items-center gap-2">
              <span className="h-px w-5 bg-current inline-block" /> Chat Widget
            </p>
            <h1 className="text-5xl md:text-6xl font-black uppercase italic tracking-tighter leading-none">
              The<br />
              <span className="text-muted-foreground/30">FAQs</span>
            </h1>
          </div>
        </div>

        {/* ── STATS ── */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total FAQs",  value: faqs.length,                                    icon: HelpCircle,    color: "text-foreground",  bg: "bg-muted" },
            { label: "Active",      value: faqs.length,                                    icon: MessageSquare, color: "text-emerald-500", bg: "bg-emerald-500/10" },
            { label: "Categories",  value: new Set(faqs.map(f => f.icon)).size,            icon: MessageSquare, color: "text-amber-500",   bg: "bg-amber-500/10" },
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

        {/* ── ADD FORM ── */}
        <div className="bg-card border border-border rounded-[2rem] p-8">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-6">Add New Entry</p>
          <form onSubmit={handleAddFaq}>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">

              {/* Icon picker */}
              <div className="md:col-span-1">
                <select
                  value={newIcon}
                  onChange={e => setNewIcon(e.target.value)}
                  className="w-full h-11 bg-muted rounded-xl text-center outline-none border-2 border-transparent focus:border-foreground transition-all cursor-pointer text-lg"
                >
                  {ICON_OPTIONS.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>

              {/* Question */}
              <div className="md:col-span-4 space-y-1.5">
                <input
                  placeholder="Question text..."
                  value={newQuestion}
                  onChange={e => {
                    setNewQuestion(e.target.value);
                    if (addErrors.question) setAddErrors(prev => ({ ...prev, question: undefined }));
                  }}
                  className={cn(
                    "w-full h-11 px-4 bg-muted rounded-xl text-xs font-bold uppercase outline-none border-2 transition-all",
                    addErrors.question ? "border-destructive bg-destructive/5" : "border-transparent focus:border-foreground"
                  )}
                />
                {addErrors.question && (
                  <div className="flex items-center gap-1 text-destructive text-[10px] font-bold ml-1">
                    <AlertCircle className="size-3" /> {addErrors.question}
                  </div>
                )}
              </div>

              {/* Answer */}
              <div className="md:col-span-5 space-y-1.5">
                <input
                  placeholder="Bot response..."
                  value={newAnswer}
                  onChange={e => {
                    setNewAnswer(e.target.value);
                    if (addErrors.answer) setAddErrors(prev => ({ ...prev, answer: undefined }));
                  }}
                  className={cn(
                    "w-full h-11 px-4 bg-muted rounded-xl text-xs font-bold outline-none border-2 transition-all",
                    addErrors.answer ? "border-destructive bg-destructive/5" : "border-transparent focus:border-foreground"
                  )}
                />
                {addErrors.answer && (
                  <div className="flex items-center gap-1 text-destructive text-[10px] font-bold ml-1">
                    <AlertCircle className="size-3" /> {addErrors.answer}
                  </div>
                )}
              </div>

              {/* Submit */}
              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="w-full h-11 bg-foreground text-background rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:opacity-90 transition-all"
                >
                  <Plus size={14} /> Add
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* ── TABLE ── */}
        <div className="bg-card border border-border rounded-[2rem] overflow-hidden shadow-sm">
          <div className="px-8 py-5 border-b border-border">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              {faqs.length} Active FAQs
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[640px]">
              <thead>
                <tr className="text-[9px] font-black uppercase tracking-widest text-muted-foreground border-b border-border/50">
                  <th className="px-8 py-4 w-16">Icon</th>
                  <th className="px-8 py-4">Question</th>
                  <th className="px-8 py-4">Bot Response</th>
                  <th className="px-8 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {fetching ? (
                  <tr><td colSpan={4} className="py-20 text-center">
                    <div className="animate-pulse mx-auto size-8 rounded-full bg-muted-foreground/20" />
                  </td></tr>
                ) : faqs.length === 0 ? (
                  <tr><td colSpan={4} className="py-20 text-center">
                    <HelpCircle className="mx-auto size-10 text-muted-foreground/20 mb-3" />
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">No FAQs yet</p>
                  </td></tr>
                ) : faqs.map(faq => (
                  <tr key={faq.id} className="group hover:bg-muted/30 transition-all">
                    {editingId === faq.id ? (
                      // ── INLINE EDIT ROW ──
                      <>
                        <td className="px-8 py-3">
                          <select
                            value={editForm.icon}
                            onChange={e => setEditForm({ ...editForm, icon: e.target.value })}
                            className="w-12 h-10 bg-muted rounded-xl text-center outline-none border-2 border-transparent focus:border-foreground transition-all text-lg"
                          >
                            {ICON_OPTIONS.map(i => <option key={i} value={i}>{i}</option>)}
                          </select>
                        </td>
                        <td className="px-8 py-3">
                          <div className="space-y-1">
                            <input
                              className={cn(
                                "w-full h-10 px-4 bg-muted rounded-xl text-xs font-bold uppercase outline-none border-2 transition-all",
                                editErrors.question ? "border-destructive" : "border-transparent focus:border-foreground"
                              )}
                              value={editForm.question}
                              onChange={e => {
                                setEditForm({ ...editForm, question: e.target.value });
                                if (editErrors.question) setEditErrors(prev => ({ ...prev, question: undefined }));
                              }}
                            />
                            {editErrors.question && (
                              <div className="flex items-center gap-1 text-destructive text-[10px] font-bold ml-1">
                                <AlertCircle className="size-3" /> {editErrors.question}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-3">
                          <div className="space-y-1">
                            <input
                              className={cn(
                                "w-full h-10 px-4 bg-muted rounded-xl text-xs font-medium outline-none border-2 transition-all",
                                editErrors.answer ? "border-destructive" : "border-transparent focus:border-foreground"
                              )}
                              value={editForm.answer}
                              onChange={e => {
                                setEditForm({ ...editForm, answer: e.target.value });
                                if (editErrors.answer) setEditErrors(prev => ({ ...prev, answer: undefined }));
                              }}
                            />
                            {editErrors.answer && (
                              <div className="flex items-center gap-1 text-destructive text-[10px] font-bold ml-1">
                                <AlertCircle className="size-3" /> {editErrors.answer}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleUpdateFaq(faq)}
                              className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all"
                              title="Save"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="h-9 w-9 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground hover:bg-foreground hover:text-background transition-all"
                              title="Cancel"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      // ── DISPLAY ROW ──
                      <>
                        <td className="px-8 py-4">
                          <div className="w-10 h-10 flex items-center justify-center bg-muted rounded-xl text-xl border border-border">
                            {faq.icon}
                          </div>
                        </td>
                        <td className="px-8 py-4">
                          <span className="text-sm font-black uppercase italic tracking-tight">{faq.question}</span>
                        </td>
                        <td className="px-8 py-4 max-w-[280px]">
                          <p className="text-xs text-muted-foreground line-clamp-2">{faq.answer}</p>
                        </td>
                        <td className="px-8 py-4 text-right">
                          <div className="flex justify-end gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => startEditing(faq)}
                              className="h-9 w-9 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground hover:bg-foreground hover:text-background hover:border-transparent transition-all"
                              title="Edit FAQ"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => deleteFaq(faq)}
                              className="h-9 w-9 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground hover:bg-destructive hover:text-white hover:border-transparent transition-all"
                              title="Delete FAQ"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}