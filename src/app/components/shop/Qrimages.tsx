"use client";

import React, { useState, useEffect } from 'react';
import {
  Upload, Save, Trash2, RefreshCw, AlertCircle,
  CreditCard, Smartphone, Building2, RotateCcw,
  Plus, Pencil, X, Wallet, Check, Loader2, ChevronDown
} from 'lucide-react';
import { Toaster, toast } from "sonner";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { cn } from "@/lib/utils";

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface PaymentMethod {
  id: string;
  type: string;
  icon: string;
  name: string;
  number: string;
  qr: string;
}

type DialogMode = "add" | "edit" | null;

// ─── ICON OPTIONS ─────────────────────────────────────────────────────────────
const ICON_OPTIONS = [
  { value: "gcash",    label: "GCash",        Icon: Smartphone },
  { value: "bank",     label: "Bank",         Icon: Building2  },
  { value: "wallet",   label: "E-Wallet",     Icon: Wallet     },
  { value: "card",     label: "Credit Card",  Icon: CreditCard },
];

function getIcon(icon: string, className = "size-4") {
  const match = ICON_OPTIONS.find(o => o.value === icon);
  const Icon  = match?.Icon ?? Wallet;
  return <Icon className={className} />;
}

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"];

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

// ─── EMPTY FORM ───────────────────────────────────────────────────────────────
const emptyForm = (): Omit<PaymentMethod, "id"> => ({
  type: "", icon: "wallet", name: "", number: "", qr: ""
});

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function QrImagesManager() {
  const [methods, setMethods]     = useState<PaymentMethod[]>([]);
  const [fetching, setFetching]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Dialog
  const [dialogMode, setDialogMode]   = useState<DialogMode>(null);
  const [editTarget, setEditTarget]   = useState<PaymentMethod | null>(null);
  const [form, setForm]               = useState(emptyForm());
  const [formError, setFormError]     = useState<Partial<Record<keyof typeof form, string>>>({});

  useEffect(() => { fetchMethods(); }, []);

  // ─── FETCH ──────────────────────────────────────────────────────────────────
  const fetchMethods = async () => {
    setFetching(true);
    try {
      const res  = await fetch('/api/payment-settings');
      const data = await res.json();
      setMethods(data.methods || []);
    } catch {
      toast.error("Failed to load payment methods.");
    } finally { setFetching(false); }
  };

  // ─── OPEN DIALOGS ───────────────────────────────────────────────────────────
  const openAdd = () => {
    setForm(emptyForm());
    setFormError({});
    setEditTarget(null);
    setDialogMode("add");
  };

  const openEdit = (method: PaymentMethod) => {
    setForm({ type: method.type, icon: method.icon, name: method.name, number: method.number, qr: method.qr });
    setFormError({});
    setEditTarget(method);
    setDialogMode("edit");
  };

  const closeDialog = () => { setDialogMode(null); setEditTarget(null); };

  // ─── VALIDATE ───────────────────────────────────────────────────────────────
  const validate = () => {
    const errs: typeof formError = {};
    if (!form.type.trim())  errs.type = "Payment type is required.";
    if (!form.name.trim())  errs.name = "Account name is required.";
    setFormError(errs);
    return Object.keys(errs).length === 0;
  };

  // ─── IMAGE CHANGE ───────────────────────────────────────────────────────────
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) { toast.error("Only JPG/PNG allowed."); return; }
    if (file.size > 1024 * 1024)                  { toast.error("Max 1MB per image."); return; }
    const reader = new FileReader();
    reader.onloadend = () => setForm(prev => ({ ...prev, qr: reader.result as string }));
    reader.readAsDataURL(file);
  };

  // ─── SAVE (ADD / EDIT) ──────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (dialogMode === "add") {
        const res = await fetch('/api/payment-settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error("Failed to add method.");
        const data = await res.json();
        setMethods(prev => [...prev, data.method]);
        toast.success(`${form.type} added!`);
        await logAudit({ action: "ADDED PAYMENT METHOD", details: `Added "${form.type}" — ${form.name} (${form.number})` });

      } else if (dialogMode === "edit" && editTarget) {
        const res = await fetch('/api/payment-settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editTarget.id, ...form }),
        });
        if (!res.ok) throw new Error("Failed to update method.");
        const data = await res.json();
        setMethods(prev => prev.map(m => m.id === editTarget.id ? data.method : m));
        toast.success(`${form.type} updated!`);
        await logAudit({ action: "UPDATED PAYMENT METHOD", details: `Updated "${form.type}" — ${form.name} (${form.number})` });
      }
      closeDialog();
    } catch (err: any) {
      toast.error(err.message || "Save failed.");
    } finally { setSaving(false); }
  };

  // ─── DELETE ─────────────────────────────────────────────────────────────────
  const handleDelete = async (method: PaymentMethod) => {
    if (!confirm(`Delete "${method.type}" (${method.name})?`)) return;
    setDeletingId(method.id);
    try {
      const res = await fetch('/api/payment-settings', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: method.id }),
      });
      if (!res.ok) throw new Error("Delete failed.");
      setMethods(prev => prev.filter(m => m.id !== method.id));
      toast.success(`${method.type} removed.`);
      await logAudit({ action: "DELETED PAYMENT METHOD", details: `Deleted "${method.type}" — ${method.name} (${method.number})` });
    } catch (err: any) {
      toast.error(err.message || "Delete failed.");
    } finally { setDeletingId(null); }
  };

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
          <div className="flex gap-3">
            <button
              onClick={fetchMethods}
              disabled={fetching}
              className="h-12 w-12 flex items-center justify-center bg-card border border-border rounded-xl hover:bg-muted transition-all disabled:opacity-40"
            >
              <RotateCcw size={16} className={cn(fetching && "animate-spin")} />
            </button>
            <button
              onClick={openAdd}
              className="h-12 px-6 flex items-center gap-2 bg-foreground text-background rounded-xl font-black uppercase text-[10px] tracking-widest hover:opacity-90 transition-all"
            >
              <Plus size={16} /> Add Method
            </button>
          </div>
        </div>

        {/* ── STATS ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-[1.5rem] p-5 flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-muted text-foreground">
              <CreditCard className="size-4" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Total Methods</p>
              <p className="text-2xl font-black">{methods.length}</p>
            </div>
          </div>
          {methods.slice(0, 3).map(m => (
            <div key={m.id} className="bg-card border border-border rounded-[1.5rem] p-5 flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
                {getIcon(m.icon)}
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground truncate">{m.type}</p>
                <p className="text-sm font-black text-emerald-500">Active</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── PAYMENT METHODS GRID ── */}
        {fetching ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-muted-foreground size-8" />
          </div>
        ) : methods.length === 0 ? (
          <div className="border-2 border-dashed border-border rounded-[2.5rem] py-20 flex flex-col items-center justify-center gap-4 text-muted-foreground">
            <CreditCard className="size-10 opacity-20" />
            <p className="text-[10px] font-black uppercase tracking-widest">No payment methods yet</p>
            <button
              onClick={openAdd}
              className="mt-2 h-12 px-8 bg-foreground text-background rounded-xl font-black uppercase text-[10px] tracking-widest hover:opacity-90 transition-all flex items-center gap-2"
            >
              <Plus size={14} /> Add First Method
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {methods.map(method => (
              <MethodCard
                key={method.id}
                method={method}
                deleting={deletingId === method.id}
                onEdit={() => openEdit(method)}
                onDelete={() => handleDelete(method)}
              />
            ))}

            {/* Add New — ghost card */}
            <button
              onClick={openAdd}
              className="border-2 border-dashed border-border rounded-[2rem] p-8 flex flex-col items-center justify-center gap-3 text-muted-foreground hover:border-foreground hover:text-foreground transition-all group min-h-[280px]"
            >
              <div className="h-12 w-12 rounded-xl border-2 border-current flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus size={22} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest">Add Payment Method</p>
            </button>
          </div>
        )}
      </div>

      {/* ── ADD / EDIT DIALOG ── */}
      {dialogMode && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-[2.5rem] w-full max-w-md p-8 space-y-6 shadow-2xl">

            {/* Dialog Header */}
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground">
                  {dialogMode === "add" ? "New Entry" : "Edit Entry"}
                </p>
                <h2 className="text-2xl font-black uppercase italic tracking-tighter mt-1">
                  {dialogMode === "add" ? "Add Method" : editTarget?.type}
                </h2>
              </div>
              <button onClick={closeDialog} className="p-2 rounded-xl hover:bg-muted transition-all text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            {/* Type */}
            <FormField label="Payment Type" error={formError.type}>
              <input
                value={form.type}
                placeholder="e.g. GCash, Maya, BPI, PayMaya..."
                onChange={e => { setForm(p => ({ ...p, type: e.target.value })); setFormError(p => ({ ...p, type: undefined })); }}
                className={cn(
                  "w-full bg-muted rounded-xl px-4 py-3.5 text-sm font-bold outline-none border-2 transition-all",
                  formError.type ? "border-destructive" : "border-transparent focus:border-foreground"
                )}
              />
            </FormField>

            {/* Icon Picker */}
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Icon</label>
              <div className="grid grid-cols-4 gap-2">
                {ICON_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm(p => ({ ...p, icon: opt.value }))}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-[9px] font-black uppercase tracking-wider",
                      form.icon === opt.value
                        ? "border-foreground bg-foreground text-background"
                        : "border-border hover:border-muted-foreground text-muted-foreground"
                    )}
                  >
                    <opt.Icon className="size-4" />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Account Name */}
            <FormField label="Account Name" error={formError.name}>
              <input
                value={form.name}
                placeholder="Full name on account..."
                onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setFormError(p => ({ ...p, name: undefined })); }}
                className={cn(
                  "w-full bg-muted rounded-xl px-4 py-3.5 text-sm font-bold outline-none border-2 transition-all",
                  formError.name ? "border-destructive" : "border-transparent focus:border-foreground"
                )}
              />
            </FormField>

            {/* Account Number */}
            <FormField label="Account Number / Details">
              <input
                value={form.number}
                placeholder="Number, IBAN, username..."
                onChange={e => setForm(p => ({ ...p, number: e.target.value }))}
                className="w-full bg-muted rounded-xl px-4 py-3.5 text-sm font-bold outline-none border-2 border-transparent focus:border-foreground transition-all"
              />
            </FormField>

            {/* QR Upload */}
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">QR Code (optional)</label>
              <label className="relative block w-full h-40 bg-muted/50 border-2 border-dashed border-border rounded-2xl cursor-pointer hover:border-foreground transition-all overflow-hidden group">
                {form.qr ? (
                  <>
                    <img src={form.qr} alt="QR" className="w-full h-full object-contain p-4" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-[9px] font-black uppercase tracking-widest">Replace</span>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors gap-2">
                    <Upload size={22} strokeWidth={1.5} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Upload QR</span>
                    <span className="text-[9px]">JPG, PNG · Max 1MB</span>
                  </div>
                )}
                <input type="file" accept=".jpg,.jpeg,.png" className="hidden" onChange={handleImageChange} />
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={closeDialog}
                className="flex-1 h-13 py-3.5 rounded-xl border border-border font-black uppercase text-[10px] tracking-widest hover:bg-muted transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-[2] h-13 py-3.5 bg-foreground text-background rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
              >
                {saving
                  ? <Loader2 className="animate-spin size-4" />
                  : <><Check size={14} /> {dialogMode === "add" ? "Add Method" : "Save Changes"}</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── METHOD CARD ─────────────────────────────────────────────────────────────
function MethodCard({
  method, deleting, onEdit, onDelete
}: {
  method: PaymentMethod;
  deleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="bg-card border border-border rounded-[2rem] p-6 space-y-5 shadow-sm group hover:shadow-lg hover:-translate-y-1 transition-all duration-300">

      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-muted text-muted-foreground">
            {getIcon(method.icon)}
          </div>
          <div>
            <p className="text-sm font-black uppercase italic tracking-tight leading-none">{method.type}</p>
            <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mt-0.5">● Active</p>
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="h-8 w-8 rounded-lg bg-muted hover:bg-foreground hover:text-background flex items-center justify-center transition-all"
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={onDelete}
            disabled={deleting}
            className="h-8 w-8 rounded-lg bg-muted hover:bg-destructive hover:text-white flex items-center justify-center transition-all disabled:opacity-40"
          >
            {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="space-y-1">
        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Account</p>
        <p className="font-black text-sm truncate">{method.name || "—"}</p>
        {method.number && (
          <p className="text-xs font-bold text-muted-foreground font-mono tracking-wider">{method.number}</p>
        )}
      </div>

      {/* QR */}
      <div className="h-36 w-full bg-muted/50 rounded-xl border border-border overflow-hidden flex items-center justify-center">
        {method.qr ? (
          <img src={method.qr} alt="QR" className="w-full h-full object-contain p-3" />
        ) : (
          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">No QR</p>
        )}
      </div>

      {/* Footer actions (always visible) */}
      <div className="flex gap-2 pt-1 border-t border-border">
        <button
          onClick={onEdit}
          className="flex-1 h-9 rounded-xl border border-border text-[9px] font-black uppercase tracking-widest hover:bg-muted transition-all flex items-center justify-center gap-1.5"
        >
          <Pencil size={11} /> Edit
        </button>
        <button
          onClick={onDelete}
          disabled={deleting}
          className="h-9 w-9 rounded-xl border border-border text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all flex items-center justify-center disabled:opacity-40"
        >
          {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
        </button>
      </div>
    </div>
  );
}

// ─── FORM FIELD ───────────────────────────────────────────────────────────────
function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">{label}</label>
      {children}
      {error && (
        <div className="flex items-center gap-1.5 text-destructive text-[10px] font-bold">
          <AlertCircle className="size-3 flex-shrink-0" /> {error}
        </div>
      )}
    </div>
  );
}