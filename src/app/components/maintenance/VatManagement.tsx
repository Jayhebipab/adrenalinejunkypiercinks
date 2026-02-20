"use client"
import { useState, useEffect } from "react"
import {
    Edit3, RotateCcw, X, Loader2, Percent, Calculator,
    Plus, Sparkles, ShieldCheck, AlertCircle, History,
    TrendingUp, Clock, CheckCircle2
} from "lucide-react"
import { Toaster, toast } from "sonner"
import { db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { cn } from "@/lib/utils"

interface VatRecord {
    id: string;
    percentage: number;
    vat_name?: string;
}

// ─── AUDIT TRAIL HELPER ───────────────────────────────────────────────────────
async function logAudit({ action, details, module = "VAT Management" }: {
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
interface FormErrors {
    percentage?: string;
    vat_name?: string;
}

function validateVat(data: { percentage: number; vat_name: string }): FormErrors {
    const errors: FormErrors = {};

    if (!data.vat_name.trim()) errors.vat_name = "Protocol name is required.";
    else if (data.vat_name.trim().length < 3) errors.vat_name = "Name must be at least 3 characters.";

    if (!data.percentage || isNaN(data.percentage)) errors.percentage = "Percentage is required.";
    else if (data.percentage < 1 || data.percentage > 99) errors.percentage = "Must be between 1% and 99%.";

    return errors;
}
// ─────────────────────────────────────────────────────────────────────────────

export default function VatManagement() {
    const [vatRecord, setVatRecord] = useState<VatRecord | null>(null);
    const [fetching, setFetching] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newPercentage, setNewPercentage] = useState<number>(12);
    const [vatName, setVatName] = useState("Standard VAT");
    const [formErrors, setFormErrors] = useState<FormErrors>({});

    const fetchVat = async () => {
        setFetching(true);
        try {
            const res = await fetch("/api/VAT");
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                setVatRecord(data[0]);
                setNewPercentage(data[0].percentage);
                setVatName(data[0].vat_name || "Standard VAT");
            } else {
                setVatRecord(null);
            }
        } catch {
            toast.error("Connection to database failed.");
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => { fetchVat(); }, []);

    // Live validate
    const liveValidate = (field: keyof FormErrors, value: string | number) => {
        const current = {
            percentage: field === "percentage" ? Number(value) : newPercentage,
            vat_name: field === "vat_name" ? String(value) : vatName,
        };
        const errors = validateVat(current);
        setFormErrors(prev => ({ ...prev, [field]: errors[field] }));
    };

    const handleAction = async (e: React.FormEvent) => {
        e.preventDefault();

        const errors = validateVat({ percentage: newPercentage, vat_name: vatName });
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            toast.error("Please fix the form errors before submitting.");
            return;
        }

        const method = vatRecord ? "PUT" : "POST";
        const body = vatRecord
            ? { id: vatRecord.id, percentage: newPercentage, vat_name: vatName }
            : { percentage: newPercentage, vat_name: vatName };

        const isUpdate = !!vatRecord;
        const previousRate = vatRecord?.percentage;
        setSaving(true);

        const doAction = async () => {
            const res = await fetch(`/api/VAT`, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error || "Action failed");

            // ✅ AUDIT LOG
            if (isUpdate) {
                await logAudit({
                    action: "UPDATED VAT RATE",
                    details: `Updated VAT "${vatName}" from ${previousRate}% to ${newPercentage}% (ID: ${vatRecord?.id})`,
                });
            } else {
                await logAudit({
                    action: "INITIALIZED VAT RATE",
                    details: `Initialized new VAT protocol "${vatName}" at ${newPercentage}%`,
                });
            }

            setIsModalOpen(false);
            setFormErrors({});
            fetchVat();
            return result;
        };

        try {
            await toast.promise(doAction(), {
                loading: "Syncing Tax Protocols...",
                success: isUpdate ? "Tax Matrix Updated!" : "Initial VAT Established!",
                error: (err: Error) => err.message,
            });
        } finally {
            setSaving(false);
        }
    };

    const openModal = () => {
        if (vatRecord) {
            setNewPercentage(vatRecord.percentage);
            setVatName(vatRecord.vat_name || "Standard VAT");
        } else {
            setNewPercentage(12);
            setVatName("Standard VAT");
        }
        setFormErrors({});
        setIsModalOpen(true);
    };

    return (
        <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
            <Toaster position="bottom-right" richColors />

            <div className="max-w-5xl mx-auto space-y-8">

                {/* ── HEADER ── */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.35em] text-muted-foreground mb-2 flex items-center gap-2">
                            <span className="h-px w-5 bg-current inline-block" /> Tax Configuration
                        </p>
                        <h1 className="text-5xl md:text-6xl font-black uppercase italic tracking-tighter leading-none">
                            The<br />
                            <span className="text-muted-foreground/30">Protocol</span>
                        </h1>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={fetchVat}
                            disabled={fetching}
                            className="h-12 w-12 flex items-center justify-center bg-card border border-border rounded-xl hover:bg-muted transition-all disabled:opacity-40"
                        >
                            <RotateCcw size={16} className={cn(fetching && "animate-spin")} />
                        </button>
                        {!vatRecord && !fetching && (
                            <button
                                onClick={openModal}
                                className="h-12 px-6 bg-foreground text-background rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:opacity-90 transition-all shadow-lg"
                            >
                                <Plus size={16} /> Initialize Protocol
                            </button>
                        )}
                    </div>
                </div>

                {/* ── STATS ROW ── */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        {
                            label: "Current Rate",
                            value: vatRecord ? `${vatRecord.percentage}%` : "—",
                            icon: Percent,
                            color: "text-foreground",
                            bg: "bg-muted"
                        },
                        {
                            label: "Protocol Name",
                            value: vatRecord?.vat_name || "—",
                            icon: ShieldCheck,
                            color: "text-emerald-500",
                            bg: "bg-emerald-500/10"
                        },
                        {
                            label: "System Status",
                            value: vatRecord ? "Active" : "Inactive",
                            icon: vatRecord ? CheckCircle2 : AlertCircle,
                            color: vatRecord ? "text-emerald-500" : "text-amber-500",
                            bg: vatRecord ? "bg-emerald-500/10" : "bg-amber-500/10"
                        },
                    ].map(stat => (
                        <div key={stat.label} className="bg-card border border-border rounded-[1.5rem] p-5 flex items-center gap-4">
                            <div className={cn("p-2.5 rounded-xl", stat.bg, stat.color)}>
                                <stat.icon className="size-4" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                                <p className="text-lg font-black truncate">{stat.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── MAIN VAT CARD ── */}
                <div className="bg-card border border-border rounded-[2rem] overflow-hidden shadow-sm">
                    <div className="px-8 py-5 border-b border-border flex items-center justify-between">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            VAT Configuration
                        </p>
                        {vatRecord && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
                            </span>
                        )}
                    </div>

                    <div className="p-8 md:p-16">
                        {fetching ? (
                            <div className="py-20 flex flex-col items-center gap-4">
                                <Loader2 className="animate-spin size-10 text-muted-foreground/30" />
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/50">Scanning Database...</p>
                            </div>

                        ) : vatRecord ? (
                            <div className="flex flex-col md:flex-row items-center justify-between gap-10">
                                {/* BIG PERCENTAGE DISPLAY */}
                                <div className="text-center md:text-left">
                                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground mb-2">
                                        {vatRecord.vat_name || "Standard VAT"}
                                    </p>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[7rem] md:text-[9rem] font-black tracking-tighter leading-none">
                                            {vatRecord.percentage}
                                        </span>
                                        <div className="flex flex-col items-start">
                                            <Percent size={36} strokeWidth={4} className="text-foreground" />
                                            <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mt-1">Rate</span>
                                        </div>
                                    </div>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2">
                                        Applied globally to all taxable items
                                    </p>
                                </div>

                                {/* INFO + ACTION */}
                                <div className="flex flex-col gap-4 w-full md:w-auto md:min-w-[220px]">
                                    <div className="bg-muted rounded-2xl p-5 space-y-3">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Calculator size={13} />
                                            <span className="text-[9px] font-black uppercase tracking-widest">Quick Calc</span>
                                        </div>
                                        {[100, 500, 1000].map(amount => (
                                            <div key={amount} className="flex justify-between items-center">
                                                <span className="text-[10px] font-bold text-muted-foreground">₱{amount.toLocaleString()}</span>
                                                <span className="text-[10px] font-black">
                                                    +₱{((amount * vatRecord.percentage) / 100).toFixed(2)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={openModal}
                                        className="h-12 px-6 bg-foreground text-background rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg group"
                                    >
                                        <Edit3 size={14} className="group-hover:rotate-12 transition-transform" />
                                        Modify Rate
                                    </button>
                                </div>
                            </div>

                        ) : (
                            <div className="py-20 flex flex-col items-center gap-6 text-center">
                                <div className="w-20 h-20 bg-muted rounded-[1.5rem] flex items-center justify-center border-2 border-dashed border-border">
                                    <Percent className="text-muted-foreground/30 size-8" />
                                </div>
                                <div>
                                    <h3 className="font-black uppercase italic text-2xl tracking-tighter">No Protocol Found</h3>
                                    <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1">Initialize global tax percentage</p>
                                </div>
                                <button
                                    onClick={openModal}
                                    className="h-12 px-8 bg-foreground text-background rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:opacity-90 transition-all shadow-lg"
                                >
                                    <Plus size={16} /> Initialize System
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── MODAL ── */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-card border border-border rounded-[2.5rem] shadow-2xl w-full max-w-sm animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="p-8 space-y-6">
                            {/* Modal Header */}
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-lg font-black uppercase italic tracking-tighter">
                                        {vatRecord ? "Modify Protocol" : "Init Protocol"}
                                    </h2>
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                                        {vatRecord ? "Override global tax matrix" : "Set initial tax configuration"}
                                    </p>
                                </div>
                                <button
                                    onClick={() => { setIsModalOpen(false); setFormErrors({}); }}
                                    className="p-2.5 hover:bg-muted rounded-full transition-all text-muted-foreground"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleAction} className="space-y-4">

                                {/* Protocol Name */}
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest ml-1">
                                        Protocol Name
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Standard VAT"
                                        className={cn(
                                            "w-full bg-muted rounded-xl px-4 py-3.5 text-xs font-bold uppercase outline-none border-2 transition-all",
                                            formErrors.vat_name ? "border-destructive bg-destructive/5" : "border-transparent focus:border-foreground"
                                        )}
                                        value={vatName}
                                        onChange={e => {
                                            setVatName(e.target.value);
                                            liveValidate("vat_name", e.target.value);
                                        }}
                                    />
                                    {formErrors.vat_name && (
                                        <div className="flex items-center gap-1.5 text-destructive text-[10px] font-bold ml-1">
                                            <AlertCircle className="size-3 flex-shrink-0" /> {formErrors.vat_name}
                                        </div>
                                    )}
                                </div>

                                {/* Tax Percentage — big input */}
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest ml-1 block text-center">
                                        Tax Percentage (%)
                                    </label>
                                    <div className="relative">
                                        <input
                                            required
                                            type="number"
                                            min="1"
                                            max="99"
                                            autoFocus
                                            className={cn(
                                                "w-full bg-foreground text-background rounded-2xl px-4 py-10 outline-none text-6xl font-black text-center tracking-tighter border-2 transition-all",
                                                formErrors.percentage ? "border-destructive" : "border-transparent"
                                            )}
                                            value={newPercentage}
                                            onChange={e => {
                                                const val = parseInt(e.target.value) || 0;
                                                setNewPercentage(val);
                                                liveValidate("percentage", val);
                                            }}
                                        />
                                        <Percent className="absolute right-6 top-1/2 -translate-y-1/2 text-background/20" size={36} />
                                    </div>
                                    {formErrors.percentage ? (
                                        <div className="flex items-center gap-1.5 text-destructive text-[10px] font-bold ml-1">
                                            <AlertCircle className="size-3 flex-shrink-0" /> {formErrors.percentage}
                                        </div>
                                    ) : (
                                        <p className="text-[8px] text-muted-foreground font-black uppercase text-center tracking-[0.2em] mt-1">
                                            Safe Range: 01% – 99%
                                        </p>
                                    )}
                                </div>

                                {/* Preview */}
                                {!formErrors.percentage && newPercentage >= 1 && (
                                    <div className="bg-muted rounded-xl p-4 space-y-2">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                                            <TrendingUp size={10} /> Preview
                                        </p>
                                        {[100, 500, 1000].map(amount => (
                                            <div key={amount} className="flex justify-between items-center">
                                                <span className="text-[10px] font-bold text-muted-foreground">₱{amount.toLocaleString()}</span>
                                                <span className="text-[10px] font-black">
                                                    → ₱{(amount + (amount * newPercentage) / 100).toFixed(2)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={saving || Object.values(formErrors).some(Boolean)}
                                    className="w-full h-14 bg-foreground text-background rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                                >
                                    {saving ? <Loader2 className="animate-spin size-4" /> : "Commit Protocol"}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => { setIsModalOpen(false); setFormErrors({}); }}
                                    className="w-full text-[10px] font-black text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors"
                                >
                                    Cancel
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}