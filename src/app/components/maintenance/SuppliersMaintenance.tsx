"use client"
import { useState, useEffect } from "react"
import {
    Trash2, Edit3, Search, RotateCcw, Plus, X,
    Loader2, Truck, Phone, MapPin, Building2,
    Lock, AlertCircle, ShieldAlert, Users
} from "lucide-react"
import { Toaster, toast } from "sonner"
import { db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { cn } from "@/lib/utils"

interface Supplier {
    id: string;
    name: string;
    company_name: string;
    address: string;
    contact: string;
}

// ─── AUDIT TRAIL HELPER ───────────────────────────────────────────────────────
async function logAudit({ action, details, module = "Suppliers" }: {
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
const SPECIAL_CHAR_REGEX = /[^a-zA-Z0-9\s\-'&.,()]/;

interface FormErrors {
    name?: string;
    company_name?: string;
    contact?: string;
    address?: string;
}

function validateSupplier(data: { name: string; company_name: string; contact: string; address: string }): FormErrors {
    const errors: FormErrors = {};

    if (!data.name.trim()) errors.name = "Contact person name is required.";
    else if (SPECIAL_CHAR_REGEX.test(data.name)) errors.name = "Invalid characters in name.";

    if (!data.company_name.trim()) errors.company_name = "Company name is required.";
    else if (SPECIAL_CHAR_REGEX.test(data.company_name)) errors.company_name = "Invalid characters in company name.";

    if (!data.contact.trim()) errors.contact = "Contact number is required.";
    else if (!/^(09|\+639)\d{9}$/.test(data.contact.replace(/\s/g, ''))) {
        errors.contact = "Must be a valid PH number (e.g. 09XXXXXXXXX).";
    }

    if (!data.address.trim()) errors.address = "Address is required.";

    return errors;
}
// ─────────────────────────────────────────────────────────────────────────────

export default function SupplierMaintenance() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [usedCompanies, setUsedCompanies] = useState<Set<string>>(new Set());
    const [search, setSearch] = useState("");
    const [fetching, setFetching] = useState(true);
    const [saving, setSaving] = useState(false);

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [currentSupplier, setCurrentSupplier] = useState<Supplier | null>(null);
    const [formData, setFormData] = useState({ name: "", company_name: "", address: "", contact: "" });

    // Validation errors
    const [formErrors, setFormErrors] = useState<FormErrors>({});

    // ─── FETCH suppliers + check which companies are used in products/inventory ─
    const fetchSuppliers = async () => {
        setFetching(true);
        try {
            const [supRes, prodRes] = await Promise.all([
                fetch("/api/suppliers"),
                fetch("/api/products"),
            ]);
            const supData = await supRes.json();
            const prodData = await prodRes.json();

            if (Array.isArray(supData)) setSuppliers(supData);

            // Build set of company_names that are actively used in products as supplier_name
            if (Array.isArray(prodData)) {
                const used = new Set<string>(
                    prodData
                        .filter((p: any) => p.supplier_name)
                        .map((p: any) => p.supplier_name as string)
                );
                setUsedCompanies(used);
            }
        } catch (err) {
            toast.error("Link to database failed.");
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => { fetchSuppliers(); }, []);

    // ─── ADD / EDIT ───────────────────────────────────────────────────────────
    const handleAction = async (e: React.FormEvent, type: 'POST' | 'PUT') => {
        e.preventDefault();

        const dataToValidate = type === 'POST' ? formData : {
            name: currentSupplier?.name ?? "",
            company_name: currentSupplier?.company_name ?? "",
            contact: currentSupplier?.contact ?? "",
            address: currentSupplier?.address ?? "",
        };

        const errors = validateSupplier(dataToValidate);
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            toast.error("Please fix the form errors before submitting.");
            return;
        }

        const payload = type === 'POST' ? formData : currentSupplier;
        setSaving(true);

        const doAction = async () => {
            const res = await fetch("/api/suppliers", {
                method: type,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error || "Action failed");

            // ✅ AUDIT LOG
            if (type === 'POST') {
                await logAudit({
                    action: "ADDED SUPPLIER",
                    details: `Added new supplier "${(payload as any).company_name}" — Contact: ${(payload as any).name}, Number: ${(payload as any).contact}`,
                });
            } else {
                await logAudit({
                    action: "EDITED SUPPLIER",
                    details: `Edited supplier "${(payload as any).company_name}" (ID: ${(payload as any).id}) — Contact: ${(payload as any).name}, Number: ${(payload as any).contact}`,
                });
            }

            setIsAddOpen(false);
            setIsEditOpen(false);
            setFormData({ name: "", company_name: "", address: "", contact: "" });
            setFormErrors({});
            fetchSuppliers();
            return result;
        };

        try {
            await toast.promise(doAction(), {
                loading: "Syncing Matrix...",
                success: "Registry Updated!",
                error: (err: Error) => err.message,
            });
        } finally {
            setSaving(false);
        }
    };

    // ─── DELETE with Protection ───────────────────────────────────────────────
    const handleDelete = async (sup: Supplier) => {
        // ✅ BLOCK if company is used in products/inventory
        if (usedCompanies.has(sup.company_name)) {
            toast.error(
                `Cannot delete "${sup.company_name}" — it's assigned to existing products.`,
                { description: "Remove all products under this supplier first." }
            );
            return;
        }

        if (!confirm(`TERMINATE "${sup.company_name.toUpperCase()}"?`)) return;

        const doDelete = async () => {
            const res = await fetch("/api/suppliers", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: sup.id }),
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error || "Delete failed.");

            // ✅ AUDIT LOG
            await logAudit({
                action: "DELETED SUPPLIER",
                details: `Deleted supplier "${sup.company_name}" — Contact: ${sup.name} (${sup.contact})`,
            });

            fetchSuppliers();
            return result;
        };

        toast.promise(doDelete(), {
            loading: `Purging "${sup.company_name}"...`,
            success: `"${sup.company_name}" has been deleted.`,
            error: (err: Error) => `Error: ${err.message}`,
        });
    };

    // ─── OPEN EDIT — company_name locked if in use ────────────────────────────
    const handleEditOpen = (sup: Supplier) => {
        setCurrentSupplier(sup);
        setFormErrors({});
        setIsEditOpen(true);
    };

    // Live validate helper
    const liveValidate = (field: keyof FormErrors, value: string) => {
        const current = isAddOpen
            ? { ...formData, [field]: value }
            : { name: currentSupplier?.name ?? "", company_name: currentSupplier?.company_name ?? "", contact: currentSupplier?.contact ?? "", address: currentSupplier?.address ?? "", [field]: value };
        const errors = validateSupplier(current);
        setFormErrors(prev => ({ ...prev, [field]: errors[field] }));
    };

    const filtered = suppliers.filter(s =>
        s.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.company_name?.toLowerCase().includes(search.toLowerCase()) ||
        s.contact?.includes(search)
    );

    // Stats
    const activeCount = suppliers.filter(s => usedCompanies.has(s.company_name)).length;
    const inactiveCount = suppliers.length - activeCount;

    // Get current form values for the modal
    const getValue = (field: keyof typeof formData) =>
        isAddOpen ? formData[field] : (currentSupplier?.[field as keyof Supplier] ?? "");

    const isCompanyLocked = isEditOpen && currentSupplier
        ? usedCompanies.has(currentSupplier.company_name)
        : false;

    return (
        <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
            <Toaster position="bottom-right" richColors />

            <div className="max-w-5xl mx-auto space-y-8">

                {/* ── HEADER ── */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.35em] text-muted-foreground mb-2 flex items-center gap-2">
                            <span className="h-px w-5 bg-current inline-block" /> Supply Chain
                        </p>
                        <h1 className="text-5xl md:text-6xl font-black uppercase italic tracking-tighter leading-none">
                            The<br />
                            <span className="text-muted-foreground/30">Partners</span>
                        </h1>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={fetchSuppliers}
                            disabled={fetching}
                            className="h-12 w-12 flex items-center justify-center bg-card border border-border rounded-xl hover:bg-muted transition-all disabled:opacity-40"
                        >
                            <RotateCcw size={16} className={cn(fetching && "animate-spin")} />
                        </button>
                        <button
                            onClick={() => { setIsAddOpen(true); setFormErrors({}); setFormData({ name: "", company_name: "", address: "", contact: "" }); }}
                            className="h-12 px-6 bg-foreground text-background rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:opacity-90 transition-all shadow-lg"
                        >
                            <Plus size={16} /> Add New Partner
                        </button>
                    </div>
                </div>

                {/* ── STATS ROW ── */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: "Total Suppliers", value: suppliers.length, icon: Truck,       color: "text-foreground",  bg: "bg-muted" },
                        { label: "Active",           value: activeCount,      icon: Building2,   color: "text-emerald-500", bg: "bg-emerald-500/10" },
                        { label: "Inactive",         value: inactiveCount,    icon: ShieldAlert, color: "text-amber-500",   bg: "bg-amber-500/10" },
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

                {/* ── SEARCH ── */}
                <div className="relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="text"
                        placeholder="Search suppliers, companies, contacts..."
                        className="w-full bg-card border border-border rounded-xl py-3.5 pl-12 pr-6 text-sm font-bold uppercase tracking-widest outline-none focus:border-foreground transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {/* ── TABLE ── */}
                <div className="bg-card border border-border rounded-[2rem] overflow-hidden shadow-sm">
                    <div className="px-8 py-5 border-b border-border">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            {filtered.length} Suppliers
                        </p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[700px]">
                            <thead>
                                <tr className="text-[9px] font-black uppercase tracking-widest text-muted-foreground border-b border-border/50">
                                    <th className="px-8 py-4">Identity</th>
                                    <th className="px-8 py-4">Organization</th>
                                    <th className="px-8 py-4">Contact Info</th>
                                    <th className="px-8 py-4 text-center">Status</th>
                                    <th className="px-8 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {fetching ? (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center">
                                            <Loader2 className="animate-spin mx-auto size-8 text-muted-foreground/30" />
                                        </td>
                                    </tr>
                                ) : filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center">
                                            <Truck className="mx-auto size-10 text-muted-foreground/20 mb-3" />
                                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">No suppliers found</p>
                                        </td>
                                    </tr>
                                ) : filtered.map((sup) => {
                                    const isActive = usedCompanies.has(sup.company_name);
                                    return (
                                        <tr key={sup.id} className="group hover:bg-muted/30 transition-all">
                                            <td className="px-8 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                                                        isActive
                                                            ? "bg-emerald-500/10 text-emerald-500"
                                                            : "bg-muted text-muted-foreground group-hover:bg-foreground group-hover:text-background"
                                                    )}>
                                                        <Users size={16} />
                                                    </div>
                                                    <span className="text-sm font-black uppercase italic tracking-tight">{sup.name}</span>
                                                </div>
                                            </td>

                                            <td className="px-8 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Building2 size={13} className="text-muted-foreground/50 flex-shrink-0" />
                                                    <span className="text-xs font-bold text-muted-foreground uppercase truncate max-w-[150px]">{sup.company_name}</span>
                                                    {isActive && (
                                                        <Lock size={13} className="text-amber-500 flex-shrink-0 mt-0.5" aria-label="Company name is locked — in use" />
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-8 py-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1.5 text-xs font-bold">
                                                        <Phone size={11} className="text-muted-foreground/50" /> {sup.contact}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground italic truncate max-w-[160px]">
                                                        <MapPin size={10} className="flex-shrink-0" /> {sup.address}
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-8 py-4 text-center">
                                                {isActive ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-muted text-muted-foreground border border-border rounded-lg text-[9px] font-black uppercase tracking-widest">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" /> Inactive
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-8 py-4 text-right">
                                                <div className="flex justify-end gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                                                    {/* Edit — always allowed, but company_name locked if in use */}
                                                    <button
                                                        onClick={() => handleEditOpen(sup)}
                                                        className="h-9 w-9 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground hover:bg-foreground hover:text-background hover:border-transparent transition-all"
                                                        title="Edit supplier"
                                                    >
                                                        <Edit3 size={14} />
                                                    </button>

                                                    {/* Delete — locked if in use */}
                                                    <button
                                                        onClick={() => handleDelete(sup)}
                                                        className={cn(
                                                            "h-9 w-9 rounded-xl flex items-center justify-center border transition-all",
                                                            isActive
                                                                ? "bg-muted border-border text-muted-foreground/30 cursor-not-allowed"
                                                                : "bg-muted border-border text-muted-foreground hover:bg-destructive hover:text-white hover:border-transparent"
                                                        )}
                                                        title={isActive ? "Cannot delete — supplier is in use" : "Delete supplier"}
                                                    >
                                                        {isActive ? <Lock size={13} /> : <Trash2 size={14} />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ── MODAL: ADD / EDIT ── */}
            {(isAddOpen || isEditOpen) && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-card border border-border rounded-[2.5rem] shadow-2xl w-full max-w-sm animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="p-8 space-y-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-lg font-black uppercase italic tracking-tighter">
                                        {isAddOpen ? "Create Node" : "Modify Node"}
                                    </h2>
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                                        {isAddOpen ? "Register a new supplier" : `Editing: ${currentSupplier?.company_name}`}
                                    </p>
                                </div>
                                <button
                                    onClick={() => { setIsAddOpen(false); setIsEditOpen(false); setFormErrors({}); }}
                                    className="p-2.5 hover:bg-muted rounded-full transition-all text-muted-foreground"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Company name lock notice */}
                            {isCompanyLocked && (
                                <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-600 text-[10px] font-bold">
                                    <Lock className="size-3.5 flex-shrink-0 mt-0.5" />
                                    Company name is locked — it's actively used in inventory. Other fields can still be edited.
                                </div>
                            )}

                            <form
                                onSubmit={(e) => handleAction(e, isAddOpen ? 'POST' : 'PUT')}
                                className="space-y-4"
                            >
                                {/* Contact Person */}
                                <FormField
                                    label="Contact Person"
                                    error={formErrors.name}
                                    input={
                                        <input
                                            required
                                            placeholder="Full name..."
                                            className={cn(
                                                "w-full bg-muted rounded-xl px-4 py-3.5 text-xs font-bold uppercase outline-none border-2 transition-all",
                                                formErrors.name ? "border-destructive bg-destructive/5" : "border-transparent focus:border-foreground"
                                            )}
                                            value={getValue("name")}
                                            onChange={e => {
                                                const val = e.target.value;
                                                isAddOpen ? setFormData({ ...formData, name: val }) : setCurrentSupplier({ ...currentSupplier!, name: val });
                                                liveValidate("name", val);
                                            }}
                                        />
                                    }
                                />

                                {/* Company Name — locked if in use */}
                                <FormField
                                    label={
                                        <span className="flex items-center gap-1.5">
                                            Company Name
                                            {isCompanyLocked && <Lock className="size-2.5 text-amber-500" />}
                                        </span>
                                    }
                                    error={formErrors.company_name}
                                    input={
                                        isCompanyLocked ? (
                                            // READ ONLY if company is in use
                                            <div className="w-full bg-muted/50 rounded-xl px-4 py-3.5 text-xs font-bold uppercase border-2 border-amber-500/30 text-muted-foreground flex items-center justify-between">
                                                <span>{currentSupplier?.company_name}</span>
                                                <Lock size={12} className="text-amber-500" />
                                            </div>
                                        ) : (
                                            <input
                                                required
                                                placeholder="Company or org name..."
                                                className={cn(
                                                    "w-full bg-muted rounded-xl px-4 py-3.5 text-xs font-bold uppercase outline-none border-2 transition-all",
                                                    formErrors.company_name ? "border-destructive bg-destructive/5" : "border-transparent focus:border-foreground"
                                                )}
                                                value={getValue("company_name")}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    isAddOpen ? setFormData({ ...formData, company_name: val }) : setCurrentSupplier({ ...currentSupplier!, company_name: val });
                                                    liveValidate("company_name", val);
                                                }}
                                            />
                                        )
                                    }
                                />

                                {/* Contact + Address grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    <FormField
                                        label="Contact No."
                                        error={formErrors.contact}
                                        input={
                                            <input
                                                required
                                                placeholder="09XXXXXXXXX"
                                                maxLength={11}
                                                className={cn(
                                                    "w-full bg-foreground text-background rounded-xl px-4 py-3.5 text-xs font-bold outline-none border-2 transition-all",
                                                    formErrors.contact ? "border-destructive" : "border-transparent"
                                                )}
                                                value={getValue("contact")}
                                                onChange={e => {
                                                    const val = e.target.value.replace(/\D/g, '').slice(0, 11);
                                                    isAddOpen ? setFormData({ ...formData, contact: val }) : setCurrentSupplier({ ...currentSupplier!, contact: val });
                                                    liveValidate("contact", val);
                                                }}
                                            />
                                        }
                                    />
                                    <FormField
                                        label="Location"
                                        error={formErrors.address}
                                        input={
                                            <input
                                                required
                                                placeholder="City, Province..."
                                                className={cn(
                                                    "w-full bg-muted rounded-xl px-4 py-3.5 text-xs font-bold uppercase outline-none border-2 transition-all",
                                                    formErrors.address ? "border-destructive bg-destructive/5" : "border-transparent focus:border-foreground"
                                                )}
                                                value={getValue("address")}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    isAddOpen ? setFormData({ ...formData, address: val }) : setCurrentSupplier({ ...currentSupplier!, address: val });
                                                    liveValidate("address", val);
                                                }}
                                            />
                                        }
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={saving || Object.values(formErrors).some(Boolean)}
                                    className="w-full h-14 bg-foreground text-background rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                                >
                                    {saving ? <Loader2 className="animate-spin size-4" /> : "Commit Record"}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── REUSABLE FORM FIELD COMPONENT ───────────────────────────────────────────
function FormField({
    label, error, input
}: {
    label: React.ReactNode;
    error?: string;
    input: React.ReactNode;
}) {
    return (
        <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest ml-1 flex items-center gap-1">
                {label}
            </label>
            {input}
            {error && (
                <div className="flex items-center gap-1.5 text-destructive text-[10px] font-bold ml-1">
                    <AlertCircle className="size-3 flex-shrink-0" /> {error}
                </div>
            )}
        </div>
    );
}