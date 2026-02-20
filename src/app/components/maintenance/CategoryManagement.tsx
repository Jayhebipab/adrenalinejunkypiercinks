"use client"
import { useState, useEffect } from "react"
import {
    Trash2, Edit3, Search, RotateCcw, Plus, X,
    Loader2, Tag, Layers, Lock, AlertCircle, ShieldAlert
} from "lucide-react"
import { Toaster, toast } from "sonner"
import { db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { cn } from "@/lib/utils"

interface Category {
    id: string;
    category_name: string;
}

// ─── AUDIT TRAIL HELPER ───────────────────────────────────────────────────────
async function logAudit({ action, details, module = "Categories" }: {
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
const SPECIAL_CHAR_REGEX = /[^a-zA-Z0-9\s\-'&]/;

function validateCategoryName(name: string): string | null {
    if (!name.trim()) return "Category name cannot be empty.";
    if (name.trim().length < 2) return "Category name must be at least 2 characters.";
    if (name.trim().length > 50) return "Category name cannot exceed 50 characters.";
    if (SPECIAL_CHAR_REGEX.test(name)) return "Special characters are not allowed (except - ' &).";
    return null;
}
// ─────────────────────────────────────────────────────────────────────────────

export default function CategoryMaintenance() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [usedCategories, setUsedCategories] = useState<Set<string>>(new Set());
    const [search, setSearch] = useState("");
    const [fetching, setFetching] = useState(true);
    const [saving, setSaving] = useState(false);

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
    const [newCategoryName, setNewCategoryName] = useState("");

    // Validation errors
    const [nameError, setNameError] = useState<string | null>(null);

    // ─── FETCH categories + check which ones are in use ───────────────────────
    const fetchCategories = async () => {
        setFetching(true);
        try {
            // Fetch categories and products in parallel
            const [catRes, prodRes] = await Promise.all([
                fetch("/api/categories"),
                fetch("/api/products"),
            ]);
            const catData = await catRes.json();
            const prodData = await prodRes.json();

            if (Array.isArray(catData)) setCategories(catData);

            // Build set of category names that are actively used in products
            if (Array.isArray(prodData)) {
                const used = new Set<string>(
                    prodData
                        .filter((p: any) => p.category)
                        .map((p: any) => p.category as string)
                );
                setUsedCategories(used);
            }
        } catch (err) {
            toast.error("API Connection Lost");
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => { fetchCategories(); }, []);

    // ─── ADD / EDIT ───────────────────────────────────────────────────────────
    const handleAction = async (e: React.FormEvent, method: string, payload: any) => {
        e.preventDefault();

        const nameToValidate = method === 'POST' ? newCategoryName : currentCategory?.category_name ?? "";
        const err = validateCategoryName(nameToValidate);
        if (err) {
            setNameError(err);
            toast.error(err);
            return;
        }

        setSaving(true);

        const doAction = async () => {
            const res = await fetch("/api/categories", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error || "Operation Failed");

            // ✅ AUDIT LOG
            if (method === 'POST') {
                await logAudit({
                    action: "ADDED CATEGORY",
                    details: `Added new category "${payload.category_name}"`,
                });
            } else {
                await logAudit({
                    action: "EDITED CATEGORY",
                    details: `Renamed category (ID: ${payload.id}) to "${payload.category_name}"`,
                });
            }

            setIsAddOpen(false);
            setIsEditOpen(false);
            setNewCategoryName("");
            setNameError(null);
            fetchCategories();
            return result;
        };

        try {
            await toast.promise(doAction(), {
                loading: "Checking Node Label...",
                success: "Registry Updated!",
                error: (err: Error) => err.message,
            });
        } finally {
            setSaving(false);
        }
    };

    // ─── DELETE with Protection ───────────────────────────────────────────────
    const handleDelete = async (cat: Category) => {
        // ✅ BLOCK if category is used in products
        if (usedCategories.has(cat.category_name)) {
            toast.error(
                `Cannot delete "${cat.category_name}" — it's used in products.`,
                { description: "Remove all products under this category first." }
            );
            return;
        }

        if (!confirm(`TERMINATE "${cat.category_name.toUpperCase()}"?`)) return;

        const doDelete = async () => {
            const res = await fetch("/api/categories", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: cat.id }),
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error || "Failed to delete.");

            // ✅ AUDIT LOG
            await logAudit({
                action: "DELETED CATEGORY",
                details: `Deleted category "${cat.category_name}" (ID: ${cat.id})`,
            });

            fetchCategories();
            return result;
        };

        toast.promise(doDelete(), {
            loading: `Purging "${cat.category_name}"...`,
            success: `"${cat.category_name}" has been deleted.`,
            error: (err: Error) => `Error: ${err.message}`,
        });
    };

    // ─── EDIT PROTECTION check ────────────────────────────────────────────────
    const handleEditOpen = (cat: Category) => {
        if (usedCategories.has(cat.category_name)) {
            toast.error(
                `Cannot edit "${cat.category_name}" — it's actively used in products/inventory.`,
                { description: "Editing would break existing product records." }
            );
            return;
        }
        setCurrentCategory(cat);
        setNameError(null);
        setIsEditOpen(true);
    };

    const filtered = categories.filter(c =>
        c.category_name.toLowerCase().includes(search.toLowerCase())
    );

    const usedCount = categories.filter(c => usedCategories.has(c.category_name)).length;
    const unusedCount = categories.length - usedCount;

    return (
        <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
            <Toaster position="bottom-right" richColors />

            <div className="max-w-4xl mx-auto space-y-8">

                {/* ── HEADER ── */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.35em] text-muted-foreground mb-2 flex items-center gap-2">
                            <span className="h-px w-5 bg-current inline-block" /> Classification System
                        </p>
                        <h1 className="text-5xl md:text-6xl font-black uppercase italic tracking-tighter leading-none">
                            The<br />
                            <span className="text-muted-foreground/30">Categories</span>
                        </h1>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={fetchCategories}
                            disabled={fetching}
                            className="h-12 w-12 flex items-center justify-center bg-card border border-border rounded-xl hover:bg-muted transition-all disabled:opacity-40"
                        >
                            <RotateCcw size={16} className={cn(fetching && "animate-spin")} />
                        </button>
                        <button
                            onClick={() => { setIsAddOpen(true); setNameError(null); setNewCategoryName(""); }}
                            className="h-12 px-6 bg-foreground text-background rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:opacity-90 transition-all shadow-lg"
                        >
                            <Plus size={16} /> Add New Class
                        </button>
                    </div>
                </div>

                {/* ── STATS ROW ── */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: "Total Classes",  value: categories.length, icon: Layers,     color: "text-foreground",  bg: "bg-muted" },
                        { label: "In Use",         value: usedCount,         icon: Tag,         color: "text-emerald-500", bg: "bg-emerald-500/10" },
                        { label: "Unused",         value: unusedCount,       icon: ShieldAlert, color: "text-amber-500",   bg: "bg-amber-500/10" },
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
                        placeholder="Search categories..."
                        className="w-full bg-card border border-border rounded-xl py-3.5 pl-12 pr-6 text-sm font-bold uppercase tracking-widest outline-none focus:border-foreground transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {/* ── TABLE ── */}
                <div className="bg-card border border-border rounded-[2rem] overflow-hidden shadow-sm">
                    <div className="px-8 py-5 border-b border-border">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            {filtered.length} Categories
                        </p>
                    </div>
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[9px] font-black uppercase tracking-widest text-muted-foreground border-b border-border/50">
                                <th className="px-8 py-4">Label</th>
                                <th className="px-8 py-4 text-center">Status</th>
                                <th className="px-8 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {fetching ? (
                                <tr>
                                    <td colSpan={3} className="py-20 text-center">
                                        <Loader2 className="animate-spin mx-auto size-8 text-muted-foreground/30" />
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="py-20 text-center">
                                        <Layers className="mx-auto size-10 text-muted-foreground/20 mb-3" />
                                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">No categories found</p>
                                    </td>
                                </tr>
                            ) : filtered.map((cat) => {
                                const isInUse = usedCategories.has(cat.category_name);
                                return (
                                    <tr key={cat.id} className="group hover:bg-muted/30 transition-all">
                                        <td className="px-8 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                                                    isInUse
                                                        ? "bg-emerald-500/10 text-emerald-500"
                                                        : "bg-muted text-muted-foreground group-hover:bg-foreground group-hover:text-background"
                                                )}>
                                                    <Tag size={16} />
                                                </div>
                                                <span className="text-sm font-black uppercase italic tracking-tight">
                                                    {cat.category_name}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Status badge */}
                                        <td className="px-8 py-4 text-center">
                                            {isInUse ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                    In Use
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-muted text-muted-foreground border border-border rounded-lg text-[9px] font-black uppercase tracking-widest">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
                                                    Unused
                                                </span>
                                            )}
                                        </td>

                                        {/* Actions */}
                                        <td className="px-8 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                                                {/* Edit — locked if in use */}
                                                <button
                                                    onClick={() => handleEditOpen(cat)}
                                                    className={cn(
                                                        "h-9 w-9 rounded-xl flex items-center justify-center border transition-all",
                                                        isInUse
                                                            ? "bg-muted border-border text-muted-foreground/30 cursor-not-allowed"
                                                            : "bg-muted border-border text-muted-foreground hover:bg-foreground hover:text-background hover:border-transparent"
                                                    )}
                                                    title={isInUse ? "Cannot edit — category is in use" : "Edit category"}
                                                >
                                                    {isInUse ? <Lock size={13} /> : <Edit3 size={14} />}
                                                </button>

                                                {/* Delete — locked if in use */}
                                                <button
                                                    onClick={() => handleDelete(cat)}
                                                    className={cn(
                                                        "h-9 w-9 rounded-xl flex items-center justify-center border transition-all",
                                                        isInUse
                                                            ? "bg-muted border-border text-muted-foreground/30 cursor-not-allowed"
                                                            : "bg-muted border-border text-muted-foreground hover:bg-destructive hover:text-white hover:border-transparent"
                                                    )}
                                                    title={isInUse ? "Cannot delete — category is in use" : "Delete category"}
                                                >
                                                    {isInUse ? <Lock size={13} /> : <Trash2 size={14} />}
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

            {/* ── MODAL: ADD / EDIT ── */}
            {(isAddOpen || isEditOpen) && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-card border border-border rounded-[2.5rem] shadow-2xl w-full max-w-sm animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-8 space-y-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-lg font-black uppercase italic tracking-tighter">
                                        {isAddOpen ? "Register Class" : "Modify Node"}
                                    </h2>
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                                        {isAddOpen ? "Add a new category to the registry" : `Editing: ${currentCategory?.category_name}`}
                                    </p>
                                </div>
                                <button
                                    onClick={() => { setIsAddOpen(false); setIsEditOpen(false); setNameError(null); }}
                                    className="p-2.5 hover:bg-muted rounded-full transition-all text-muted-foreground"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <form
                                onSubmit={(e) => handleAction(
                                    e,
                                    isAddOpen ? 'POST' : 'PUT',
                                    isAddOpen
                                        ? { category_name: newCategoryName }
                                        : { id: currentCategory?.id, category_name: currentCategory?.category_name }
                                )}
                                className="space-y-4"
                            >
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest ml-1">
                                        Category Name
                                    </label>
                                    <input
                                        required
                                        placeholder="Enter category name..."
                                        className={cn(
                                            "w-full bg-muted rounded-xl px-4 py-4 text-sm font-bold uppercase italic outline-none border-2 transition-all",
                                            nameError
                                                ? "border-destructive bg-destructive/5 focus:border-destructive"
                                                : "border-transparent focus:border-foreground"
                                        )}
                                        value={isAddOpen ? newCategoryName : currentCategory?.category_name ?? ""}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (isAddOpen) {
                                                setNewCategoryName(val);
                                            } else {
                                                setCurrentCategory({ ...currentCategory!, category_name: val });
                                            }
                                            // Live validation
                                            setNameError(validateCategoryName(val));
                                        }}
                                    />
                                    {nameError && (
                                        <div className="flex items-center gap-1.5 text-destructive text-[10px] font-bold ml-1">
                                            <AlertCircle className="size-3 flex-shrink-0" />
                                            {nameError}
                                        </div>
                                    )}
                                    {!nameError && (
                                        <p className="text-[9px] text-muted-foreground ml-1 uppercase tracking-widest">
                                            Allowed: letters, numbers, spaces, - ' &
                                        </p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={saving || !!nameError}
                                    className="w-full h-14 bg-foreground text-background rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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