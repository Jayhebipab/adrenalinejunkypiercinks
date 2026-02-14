"use client";

import React, { useState, useEffect } from 'react';
import { Upload, Save, Trash2, RefreshCw, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { Toaster, toast } from "sonner";
import { cn } from "@/lib/utils";

// 1. Interface para sa main form state
interface PaymentSettings {
  gcash_name: string;
  gcash_number: string;
  gcash_qr: string;
  bpi_name: string;
  bpi_number: string;
  bpi_qr: string;
}

// 2. Interface para sa props ng PaymentCard
interface PaymentCardProps {
  title: string;
  qr: string;
  name: string;
  number: string;
  onNameChange: (val: string) => void;
  onNumberChange: (val: string) => void;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onReset: () => void;
}

export default function QrImagesManager() {
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState<PaymentSettings>({
    gcash_name: '',
    gcash_number: '',
    gcash_qr: '',
    bpi_name: '',
    bpi_number: '',
    bpi_qr: ''
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/payment-settings');
      const data = await res.json();
      if (data) setFormData(data);
    } catch (err) {
      toast.error("Failed to load current settings");
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'gcash_qr' | 'bpi_qr') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        toast.error('Image too large. Please use a file below 1MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/payment-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast.success('Payment settings updated successfully!');
      } else {
        throw new Error();
      }
    } catch (err) {
      toast.error('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = (type: 'GCASH' | 'BPI') => {
    if (confirm(`Are you sure you want to clear ${type} details?`)) {
      if (type === 'GCASH') {
        setFormData(prev => ({ ...prev, gcash_name: '', gcash_number: '', gcash_qr: '' }));
      } else {
        setFormData(prev => ({ ...prev, bpi_name: '', bpi_number: '', bpi_qr: '' }));
      }
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-10 font-sans text-slate-900 dark:text-slate-100 selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black ">
      
      <Toaster position="bottom-center" richColors />

      <div className="max-w-[1000px] mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="h-[1px] w-6 bg-black dark:bg-white"></span>
              <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
                Configuration
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter leading-none text-slate-900 dark:text-white">
              Payment Settings
            </h1>
          </div>

          <button 
            onClick={fetchSettings} 
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-zinc-800 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-900 transition-all text-[10px] font-bold uppercase tracking-widest"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Sync Data
          </button>
        </div>

        {/* CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <PaymentCard 
            title="GCash Configuration"
            qr={formData.gcash_qr}
            name={formData.gcash_name}
            number={formData.gcash_number}
            onNameChange={(val: string) => setFormData({...formData, gcash_name: val})}
            onNumberChange={(val: string) => setFormData({...formData, gcash_number: val})}
            onImageChange={(e: React.ChangeEvent<HTMLInputElement>) => handleImageChange(e, 'gcash_qr')}
            onReset={() => handleReset('GCASH')}
          />

          <PaymentCard 
            title="BPI Bank Configuration"
            qr={formData.bpi_qr}
            name={formData.bpi_name}
            number={formData.bpi_number}
            onNameChange={(val: string) => setFormData({...formData, bpi_name: val})}
            onNumberChange={(val: string) => setFormData({...formData, bpi_number: val})}
            onImageChange={(e: React.ChangeEvent<HTMLInputElement>) => handleImageChange(e, 'bpi_qr')}
            onReset={() => handleReset('BPI')}
          />
        </div>

        {/* SAVE BUTTON */}
        <div className="pt-8">
          <button 
            onClick={handleUpdate}
            disabled={loading}
            className="w-full bg-black dark:bg-white text-white dark:text-black py-5 rounded-[1.5rem] font-black uppercase text-[11px] tracking-[0.4em] transition-all flex justify-center items-center gap-4 hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
            Commit All Changes
          </button>
        </div>

      </div>
    </div>
  );
}

function PaymentCard({ 
  title, qr, name, number, 
  onNameChange, onNumberChange, onImageChange, onReset 
}: PaymentCardProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/40 dark:shadow-black/40 space-y-8 relative overflow-hidden group">
      
      <div className="flex justify-between items-center relative z-10">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 italic">
          {title}
        </h2>
        <button 
          onClick={onReset} 
          className="p-2 text-slate-300 hover:text-red-500 transition-colors rounded-lg border border-transparent hover:border-red-100 dark:hover:border-red-900"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="space-y-5 relative z-10">
        <div className="space-y-1.5">
          <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] block ml-1">Account Name</label>
          <input 
            value={name}
            placeholder="E.G. JUAN DELA CRUZ"
            onChange={(e) => onNameChange(e.target.value)}
            className="w-full bg-slate-50 dark:bg-black/40 border border-slate-100 dark:border-zinc-800 rounded-xl px-4 py-3.5 text-[11px] font-bold uppercase tracking-widest focus:border-black dark:focus:border-white outline-none transition-all placeholder:opacity-30" 
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] block ml-1">Account Number</label>
          <input 
            value={number}
            placeholder="0000 000 0000"
            onChange={(e) => onNumberChange(e.target.value)}
            className="w-full bg-slate-50 dark:bg-black/40 border border-slate-100 dark:border-zinc-800 rounded-xl px-4 py-3.5 text-[11px] font-bold uppercase tracking-widest focus:border-black dark:focus:border-white outline-none transition-all placeholder:opacity-30" 
          />
        </div>
      </div>

      <div className="relative z-10">
        <label className="block w-full aspect-square bg-slate-50 dark:bg-black/40 border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-[2rem] cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-800/50 transition-all overflow-hidden group/upload">
          {qr ? (
            <div className="w-full h-full relative group/img">
              <img src={qr} alt="QR Preview" className="w-full h-full object-contain p-6" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                 <span className="text-white text-[9px] font-black uppercase tracking-widest">Replace Image</span>
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 dark:text-zinc-600 group-hover/upload:text-slate-500 transition-colors">
              <Upload size={32} strokeWidth={1.5} className="mb-3" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em]">Upload QR Code</span>
            </div>
          )}
          <input type="file" accept="image/*" className="hidden" onChange={onImageChange} />
        </label>
      </div>

      {/* Decorative background element for that brutalist feel */}
      <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-slate-50 dark:bg-zinc-800/20 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
    </div>
  );
}