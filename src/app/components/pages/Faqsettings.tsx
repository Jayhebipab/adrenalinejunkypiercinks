"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, onSnapshot, query, deleteDoc, doc, updateDoc, orderBy } from "firebase/firestore";
import { Trash2, Plus, Edit2, Save, X, Settings, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  icon: string;
}

export default function FAQEditor() {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [newIcon, setNewIcon] = useState("🚀");
  
  // State para sa editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ question: "", answer: "", icon: "" });

  useEffect(() => {
    const q = query(collection(db, "faq_settings"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setFaqs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as FAQItem[]);
    });
    return () => unsubscribe();
  }, []);

  const handleAddFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion || !newAnswer) return;
    await addDoc(collection(db, "faq_settings"), {
      question: newQuestion,
      answer: newAnswer,
      icon: newIcon,
      createdAt: new Date()
    });
    setNewQuestion(""); setNewAnswer("");
  };

  const startEditing = (faq: FAQItem) => {
    setEditingId(faq.id);
    setEditForm({ question: faq.question, answer: faq.answer, icon: faq.icon });
  };

  const handleUpdateFaq = async (id: string) => {
    await updateDoc(doc(db, "faq_settings", id), {
      question: editForm.question,
      answer: editForm.answer,
      icon: editForm.icon
    });
    setEditingId(null);
  };

  const deleteFaq = async (id: string) => {
    if (confirm("Are you sure you want to delete this FAQ?")) {
      await deleteDoc(doc(db, "faq_settings", id));
    }
  };

  return (
    <div className="min-h-screen text-slate-900 p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2 text-slate-900">
              <Settings className="text-[#d11a2a] w-6 h-6" /> FAQ MANAGEMENT
            </h1>
            <p className="text-sm text-slate-500">Manage the automated responses for your chat widget.</p>
          </div>
        </header>

        {/* Form Card */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm mb-10">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Add New Entry</h2>
          <form onSubmit={handleAddFaq} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-1">
                <select 
                  value={newIcon} 
                  onChange={(e) => setNewIcon(e.target.value)}
                  className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg text-center cursor-pointer"
                >
                  <option value="🚀">🚀</option>
                  <option value="📩">📩</option>
                  <option value="🛠️">🛠️</option>
                  <option value="💡">💡</option>
                  <option value="❓">❓</option>
                </select>
              </div>
              <div className="md:col-span-4">
                <input
                  placeholder="Question text..."
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  className="w-full h-10 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#d11a2a]/20 outline-none transition-all"
                />
              </div>
              <div className="md:col-span-5">
                <input
                  placeholder="Bot response..."
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  className="w-full h-10 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#d11a2a]/20 outline-none transition-all"
                />
              </div>
              <div className="md:col-span-2">
                <Button type="submit" className="w-full h-10 bg-[#d11a2a] hover:bg-[#b01622] text-white rounded-lg transition-transform active:scale-95">
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </div>
            </div>
          </form>
        </div>

        {/* FAQ List */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2 px-2">Active FAQs ({faqs.length})</h2>
          {faqs.map((faq) => (
            <div key={faq.id} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:border-[#d11a2a]/30 transition-colors">
              {editingId === faq.id ? (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                   <select 
                    value={editForm.icon} 
                    onChange={(e) => setEditForm({...editForm, icon: e.target.value})}
                    className="md:col-span-1 h-9 bg-slate-50 border border-slate-200 rounded-md text-sm"
                  >
                    <option value="🚀">🚀</option>
                    <option value="📩">📩</option>
                    <option value="🛠️">🛠️</option>
                    <option value="💡">💡</option>
                  </select>
                  <input 
                    className="md:col-span-4 h-9 px-3 bg-slate-50 border border-slate-200 rounded-md text-sm font-bold"
                    value={editForm.question}
                    onChange={(e) => setEditForm({...editForm, question: e.target.value})}
                  />
                  <input 
                    className="md:col-span-5 h-9 px-3 bg-slate-50 border border-slate-200 rounded-md text-sm"
                    value={editForm.answer}
                    onChange={(e) => setEditForm({...editForm, answer: e.target.value})}
                  />
                  <div className="md:col-span-2 flex gap-2">
                    <button onClick={() => handleUpdateFaq(faq.id)} className="p-2 bg-emerald-50 text-emerald-600 rounded-md hover:bg-emerald-100"><Check className="w-4 h-4" /></button>
                    <button onClick={() => setEditingId(null)} className="p-2 bg-slate-100 text-slate-600 rounded-md"><X className="w-4 h-4" /></button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-lg text-xl border border-slate-100">
                      {faq.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm leading-tight">{faq.question}</h4>
                      <p className="text-xs text-slate-500 mt-1">{faq.answer}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => startEditing(faq)} 
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => deleteFaq(faq.id)} 
                      className="p-2 text-slate-400 hover:text-[#d11a2a] hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}