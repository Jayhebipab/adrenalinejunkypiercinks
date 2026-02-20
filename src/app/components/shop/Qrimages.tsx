"use client";

import React, { useState, useEffect } from 'react';
import { Upload, Save, Trash2, RefreshCw, AlertCircle, CreditCard, Smartphone, Building2, RotateCcw } from 'lucide-react';
import { Toaster, toast } from "sonner";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { cn } from "@/lib/utils";

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface PaymentSettings {
  gcash_name: string;
  gcash_number: string;
  gcash_qr: string;
  bpi_name: string;
  bpi_number: string;
  bpi_qr: string;
}

interface FormErrors {
  gcash_name?: string;
  gcash_number?: string;
  bpi_name?: string;
  bpi_number?: string;
}

// ─── AUDIT TRAIL ──────────────────────────────────────────────────────────────
async function logAudit({ action, details, module = "Payment Settings" }: {
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
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"];

function validateSettings(data: PaymentSettings): FormErrors {
  const errors: FormErrors = {};
  if (data.gcash_name && !/^[a-zA-Z\s.\-']+$/.test(data.gcash_name))
    errors.gcash_name = "Invalid characters in GCash name.";
  if (data.gcash_number && !/^(09|\+639)\d{9}$/.test(data.gcash_number.replace(/\s/g, '')))
    errors.gcash_number = "Must be a valid PH number (09XXXXXXXXX).";
  if (data.bpi_name && !/^[a-zA-Z\s.\-']+$/.test(data.bpi_name))
    errors.bpi_name = "Invalid characters in BPI name.";
  if (data.bpi_number && !/^\d[\d\s\-]{5,20}$/.test(data.bpi_number.replace(/\s/g, '')))
    errors.bpi_number = "Invalid BPI account number.";
  return errors;
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function QrImagesManager() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const [formData, setFormData] = useState<PaymentSettings>({
    gcash_name: '', gcash_number: '', gcash_qr: '',
    bpi_name: '', bpi_number: '', bpi_qr: '',
  });

  useEffect(() => { fetchSettings(); }, []);

  // ─── FETCH ────────────────────────────────────────────────────────────────
  const fetchSettings = async () => {
    setFetching(true);
    try {
      const res = await fetch('/api/payment-settings');
      const data = await res.json();
      if (data) setFormData(data);
    } catch (err) {
      toast.error("Failed to load current settings.");
    } finally { setFetching(false); }
  };

  // ─── IMAGE CHANGE ─────────────────────────────────────────────────────────
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'gcash_qr' | 'bpi_qr') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Invalid file type. Only JPG, JPEG, and PNG are allowed.");
      return;
    }
    if (file.size > 1024 * 1024) {
      toast.error("Image too large. Please use a file below 1MB.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, [field]: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  // ─── SAVE ─────────────────────────────────────────────────────────────────
  const handleUpdate = async () => {
    const errors = validateSettings(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error("Please fix the errors before saving.");
      return;
    }
    setFormErrors({});
    setLoading(true);

    const doSave = async () => {
      const res = await fetch('/api/payment-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to update settings.");

      // ✅ AUDIT LOG
      await logAudit({
        action: "UPDATED PAYMENT SETTINGS",
        details: `Updated payment settings — GCash: "${formData.gcash_name}" (${formData.gcash_number}), BPI: "${formData.bpi_name}" (${formData.bpi_number})`,
      });
    };

    try {
      await toast.promise(doSave(), {
        loading: "Saving payment settings...",
        success: "Payment settings updated!",
        error: (err: Error) => err.message,
      });
    } finally { setLoading(false); }
  };

  // ─── RESET ────────────────────────────────────────────────────────────────
  const handleReset = async (type: 'GCASH' | 'BPI') => {
    if (!confirm(`Clear ${type} details?`)) return;
    if (type === 'GCASH') {
      setFormData(prev => ({ ...prev, gcash_name: '', gcash_number: '', gcash_qr: '' }));
      setFormErrors(prev => ({ ...prev, gcash_name: undefined, gcash_number: undefined }));
    } else {
      setFormData(prev => ({ ...prev, bpi_name: '', bpi_number: '', bpi_qr: '' }));
      setFormErrors(prev => ({ ...prev, bpi_name: undefined, bpi_number: undefined }));
    }

    // ✅ AUDIT LOG
    await logAudit({
      action: "CLEARED PAYMENT METHOD",
      details: `Cleared ${type} payment details from the form.`,
    });

    toast.info(`${type} details cleared.`);
  };

  const hasGcash = !!(formData.gcash_name || formData.gcash_number || formData.gcash_qr);
  const hasBpi   = !!(formData.bpi_name   || formData.bpi_number   || formData.bpi_qr);

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <Toaster position="bottom-right" richColors />

      <div className="max-w-5xl mx-auto space-y-8">

        {/* ── HEADER ── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.35em] text-muted-foreground mb-2 flex items-center gap-2">
              <span className="h-px w-5 bg-current inline-block" /> Configuration
            </p>
            <h1 className="text-5xl md:text-6xl font-black uppercase italic tracking-tighter leading-none">
              The<br />
              <span className="text-muted-foreground/30">Payments</span>
            </h1>
          </div>
          <button
            onClick={fetchSettings}
            disabled={fetching}
            className="h-12 w-12 flex items-center justify-center bg-card border border-border rounded-xl hover:bg-muted transition-all disabled:opacity-40"
          >
            <RotateCcw size={16} className={cn(fetching && "animate-spin")} />
          </button>
        </div>

        {/* ── STATS ── */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Payment Methods", value: [hasGcash, hasBpi].filter(Boolean).length + " / 2", icon: CreditCard,  color: "text-foreground",  bg: "bg-muted" },
            { label: "GCash",           value: hasGcash ? "Active" : "Empty",                       icon: Smartphone,  color: hasGcash ? "text-emerald-500" : "text-muted-foreground", bg: hasGcash ? "bg-emerald-500/10" : "bg-muted" },
            { label: "BPI Bank",        value: hasBpi   ? "Active" : "Empty",                       icon: Building2,   color: hasBpi   ? "text-emerald-500" : "text-muted-foreground", bg: hasBpi   ? "bg-emerald-500/10" : "bg-muted" },
          ].map(stat => (
            <div key={stat.label} className="bg-card border border-border rounded-[1.5rem] p-5 flex items-center gap-4">
              <div className={cn("p-2.5 rounded-xl", stat.bg, stat.color)}>
                <stat.icon className="size-4" />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                <p className="text-lg font-black">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── PAYMENT CARDS ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* GCash */}
          <PaymentCard
            title="GCash"
            subtitle="Mobile Wallet"
            icon={<Smartphone className="size-4" />}
            qr={formData.gcash_qr}
            name={formData.gcash_name}
            number={formData.gcash_number}
            nameError={formErrors.gcash_name}
            numberError={formErrors.gcash_number}
            namePlaceholder="Account name..."
            numberPlaceholder="09XXXXXXXXX"
            onNameChange={val => {
              setFormData(prev => ({ ...prev, gcash_name: val }));
              if (formErrors.gcash_name) setFormErrors(prev => ({ ...prev, gcash_name: undefined }));
            }}
            onNumberChange={val => {
              setFormData(prev => ({ ...prev, gcash_number: val.replace(/\D/g, '').slice(0, 11) }));
              if (formErrors.gcash_number) setFormErrors(prev => ({ ...prev, gcash_number: undefined }));
            }}
            onImageChange={e => handleImageChange(e, 'gcash_qr')}
            onReset={() => handleReset('GCASH')}
          />

          {/* BPI */}
          <PaymentCard
            title="BPI Bank"
            subtitle="Online Banking"
            icon={<Building2 className="size-4" />}
            qr={formData.bpi_qr}
            name={formData.bpi_name}
            number={formData.bpi_number}
            nameError={formErrors.bpi_name}
            numberError={formErrors.bpi_number}
            namePlaceholder="Account name..."
            numberPlaceholder="Account number..."
            onNameChange={val => {
              setFormData(prev => ({ ...prev, bpi_name: val }));
              if (formErrors.bpi_name) setFormErrors(prev => ({ ...prev, bpi_name: undefined }));
            }}
            onNumberChange={val => {
              setFormData(prev => ({ ...prev, bpi_number: val }));
              if (formErrors.bpi_number) setFormErrors(prev => ({ ...prev, bpi_number: undefined }));
            }}
            onImageChange={e => handleImageChange(e, 'bpi_qr')}
            onReset={() => handleReset('BPI')}
          />
        </div>

        {/* ── SAVE BUTTON ── */}
        <button
          onClick={handleUpdate}
          disabled={loading || Object.values(formErrors).some(Boolean)}
          className="w-full h-14 bg-foreground text-background rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
        >
          {loading ? <RefreshCw className="animate-spin size-4" /> : <Save size={16} />}
          Commit All Changes
        </button>
      </div>
    </div>
  );
}

// ─── PAYMENT CARD ─────────────────────────────────────────────────────────────
interface PaymentCardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  qr: string;
  name: string;
  number: string;
  nameError?: string;
  numberError?: string;
  namePlaceholder: string;
  numberPlaceholder: string;
  onNameChange: (val: string) => void;
  onNumberChange: (val: string) => void;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onReset: () => void;
}

function PaymentCard({
  title, subtitle, icon, qr, name, number,
  nameError, numberError, namePlaceholder, numberPlaceholder,
  onNameChange, onNumberChange, onImageChange, onReset,
}: PaymentCardProps) {
  return (
    <div className="bg-card border border-border rounded-[2rem] p-8 space-y-6 shadow-sm">

      {/* Card Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-muted text-muted-foreground">
            {icon}
          </div>
          <div>
            <p className="text-sm font-black uppercase italic tracking-tight leading-none">{title}</p>
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">{subtitle}</p>
          </div>
        </div>
        <button
          onClick={onReset}
          className="h-9 w-9 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground hover:bg-destructive hover:text-white hover:border-transparent transition-all"
          title={`Clear ${title} details`}
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Fields */}
      <div className="space-y-4">
        <FormField
          label="Account Name"
          error={nameError}
          input={
            <input
              value={name}
              placeholder={namePlaceholder}
              onChange={e => onNameChange(e.target.value)}
              className={cn(
                "w-full bg-muted rounded-xl px-4 py-3.5 text-xs font-bold uppercase outline-none border-2 transition-all",
                nameError ? "border-destructive bg-destructive/5" : "border-transparent focus:border-foreground"
              )}
            />
          }
        />
        <FormField
          label="Account Number"
          error={numberError}
          input={
            <input
              value={number}
              placeholder={numberPlaceholder}
              onChange={e => onNumberChange(e.target.value)}
              className={cn(
                "w-full bg-muted rounded-xl px-4 py-3.5 text-xs font-bold uppercase outline-none border-2 transition-all",
                numberError ? "border-destructive bg-destructive/5" : "border-transparent focus:border-foreground"
              )}
            />
          }
        />
      </div>

      {/* QR Upload */}
      <div className="space-y-1.5">
        <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest ml-1">QR Code</label>
        <label className="relative block w-full aspect-square bg-muted/50 border-2 border-dashed border-border rounded-2xl cursor-pointer hover:border-foreground transition-all overflow-hidden group">
          {qr ? (
            <div className="w-full h-full relative">
              <img src={qr} alt="QR Preview" className="w-full h-full object-contain p-6" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-[9px] font-black uppercase tracking-widest">Replace Image</span>
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors">
              <Upload size={28} strokeWidth={1.5} className="mb-3" />
              <span className="text-[9px] font-black uppercase tracking-widest">Upload QR Code</span>
              <span className="text-[9px] text-muted-foreground mt-1">JPG, JPEG, PNG · Max 1MB</span>
            </div>
          )}
          <input type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" className="hidden" onChange={onImageChange} />
        </label>
      </div>
    </div>
  );
}

// ─── REUSABLE FORM FIELD ──────────────────────────────────────────────────────
function FormField({ label, error, input }: { label: string; error?: string; input: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest ml-1">{label}</label>
      {input}
      {error && (
        <div className="flex items-center gap-1.5 text-destructive text-[10px] font-bold ml-1">
          <AlertCircle className="size-3 flex-shrink-0" /> {error}
        </div>
      )}
    </div>
  );
}