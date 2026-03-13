"use client"

import { useState, useEffect } from "react"
import {
    Trash2, Edit3, Search, RotateCcw, Plus, X,
    Loader2, MapPin, Layers, Lock, AlertCircle, ShieldAlert
} from "lucide-react"
import { Toaster, toast } from "sonner"
import { db } from "@/lib/firebase"
import {
    collection, addDoc, getDocs, updateDoc,
    deleteDoc, doc, serverTimestamp, query, orderBy
} from "firebase/firestore"
import { cn } from "@/lib/utils"

interface Placement {
    id: string;
    placement_name: string;
}

// ─── AUDIT TRAIL ──────────────────────────────────────────────────────────────
async function logAudit({ action, details, module = "Placements" }: {
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
const SPECIAL_CHAR_REGEX = /[^a-zA-Z0-9\s\-'&.,()]/;

function validatePlacementName(name: string): string | null {
    if (!name.trim()) return "Placement name cannot be empty.";
    if (name.trim().length < 2) return "Placement name must be at least 2 characters.";
    if (name.trim().length > 60) return "Placement name cannot exceed 60 characters.";
    if (SPECIAL_CHAR_REGEX.test(name)) return "Special characters not allowed (except - ' & . , ()).";
    return null;
}

export default function PlacementMaintenance() {
    const [placements, setPlacements] = useState<Placement[]>([]);
    const [usedPlacements, setUsedPlacements] = useState<Set<string>>(new Set());
    const [search, setSearch] = useState("");
    const [fetching, setFetching] = useState(true);
    const [saving, setSaving] = useState(false);

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [currentPlacement, setCurrentPlacement] = useState<Placement | null>(null);
    const [newPlacementName, setNewPlacementName] = useState("");
    const [nameError, setNameError] = useState<string | null>(null);

    // ─── FETCH ────────────────────────────────────────────────────────────────
    const fetchData = async () => {
        setFetching(true);
        try {
            // Fetch placements directly from Firebase
            const q = query(collection(db, "placements"), orderBy("createdAt", "asc"));
            const snap = await getDocs(q);
            const data: Placement[] = snap.docs.map(d => ({
                id: d.id,
                placement_name: d.data().placement_name,
            }));
            setPlacements(data);

            // Check which placements are in use (from both tattoo_gallery and piercing_gallery)
            const [tattooSnap, piercingSnap] = await Promise.all([
                getDocs(collection(db, "tattoo_gallery")),
                getDocs(collection(db, "piercing_gallery")),
            ]);

            const used = new Set<string>();
            tattooSnap.forEach(d => { if (d.data().placement) used.add(d.data().placement); });
            piercingSnap.forEach(d => { if (d.data().placement) used.add(d.data().placement); });
            setUsedPlacements(used);

        } catch (err) {
            toast.error("Firebase connection error.");
            console.error(err);
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // ─── ADD ──────────────────────────────────────────────────────────────────
    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        const err = validatePlacementName(newPlacementName);
        if (err) { setNameError(err); toast.error(err); return; }

        // Check duplicate
        const isDuplicate = placements.some(
            p => p.placement_name.toLowerCase() === newPlacementName.trim().toLowerCase()
        );
        if (isDuplicate) { setNameError("This placement already exists."); toast.error("Duplicate placement."); return; }

        setSaving(true);
        try {
            const docRef = await addDoc(collection(db, "placements"), {
                placement_name: newPlacementName.trim(),
                createdAt: serverTimestamp(),
            });
            await logAudit({
                action: "ADDED PLACEMENT",
                details: `Added new placement "${newPlacementName.trim()}"`,
            });
            toast.success("Placement registered!");
            setIsAddOpen(false);
            setNewPlacementName("");
            setNameError(null);
            fetchData();
        } catch (err) {
            toast.error("Failed to add placement.");
        } finally {
            setSaving(false);
        }
    };

    // ─── EDIT ─────────────────────────────────────────────────────────────────
    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentPlacement) return;
        const err = validatePlacementName(currentPlacement.placement_name);
        if (err) { setNameError(err); toast.error(err); return; }

        setSaving(true);
        try {
            const ref = doc(db, "placements", currentPlacement.id);
            await updateDoc(ref, {
                placement_name: currentPlacement.placement_name.trim(),
                updatedAt: serverTimestamp(),
            });
            await logAudit({
                action: "EDITED PLACEMENT",
                details: `Renamed placement (ID: ${currentPlacement.id}) to "${currentPlacement.placement_name.trim()}"`,
            });
            toast.success("Placement updated!");
            setIsEditOpen(false);
            setCurrentPlacement(null);
            setNameError(null);
            fetchData();
        } catch (err) {
            toast.error("Failed to update placement.");
        } finally {
            setSaving(false);
        }
    };

    // ─── DELETE ───────────────────────────────────────────────────────────────
    const handleDelete = async (p: Placement) => {
        if (usedPlacements.has(p.placement_name)) {
            toast.error(`Cannot delete "${p.placement_name}" — it's used in gallery entries.`, {
                description: "Remove all gallery entries using this placement first.",
            });
            return;
        }
        if (!confirm(`TERMINATE "${p.placement_name.toUpperCase()}"?`)) return;

        try {
            await deleteDoc(doc(db, "placements", p.id));
            await logAudit({
                action: "DELETED PLACEMENT",
                details: `Deleted placement "${p.placement_name}" (ID: ${p.id})`,
            });
            toast.success(`"${p.placement_name}" deleted.`);
            fetchData();
        } catch (err) {
            toast.error("Failed to delete placement.");
        }
    };

    // ─── EDIT OPEN WITH PROTECTION ────────────────────────────────────────────
    const handleEditOpen = (p: Placement) => {
        if (usedPlacements.has(p.placement_name)) {
            toast.error(`Cannot edit "${p.placement_name}" — it's used in gallery entries.`, {
                description: "Editing would break existing records.",
            });
            return;
        }
        setCurrentPlacement(p);
        setNameError(null);
        setIsEditOpen(true);
    };

    const filtered = placements.filter(p =>
        p.placement_name.toLowerCase().includes(search.toLowerCase())
    );

    const usedCount = placements.filter(p => usedPlacements.has(p.placement_name)).length;
    const unusedCount = placements.length - usedCount;

    return (
        <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
            <Toaster position="bottom-right" richColors />

            <div className="max-w-4xl mx-auto space-y-8">

                {/* ── HEADER ── */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.35em] text-muted-foreground mb-2 flex items-center gap-2">
                            <span className="h-px w-5 bg-current inline-block" /> Placement Registry
                        </p>
                        <h1 className="text-5xl md:text-6xl font-black uppercase italic tracking-tighter leading-none">
                            The<br />
                            <span className="text-muted-foreground/30">Placements</span>
                        </h1>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={fetchData}
                            disabled={fetching}
                            className="h-12 w-12 flex items-center justify-center bg-card border border-border rounded-xl hover:bg-muted transition-all disabled:opacity-40"
                        >
                            <RotateCcw size={16} className={cn(fetching && "animate-spin")} />
                        </button>
                        <button
                            onClick={() => { setIsAddOpen(true); setNameError(null); setNewPlacementName(""); }}
                            className="h-12 px-6 bg-foreground text-background rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:opacity-90 transition-all shadow-lg"
                        >
                            <Plus size={16} /> Add New Placement
                        </button>
                    </div>
                </div>

                {/* ── STATS ── */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: "Total",   value: placements.length, icon: Layers,     color: "text-foreground",  bg: "bg-muted" },
                        { label: "In Use",  value: usedCount,         icon: MapPin,     color: "text-emerald-500", bg: "bg-emerald-500/10" },
                        { label: "Unused",  value: unusedCount,       icon: ShieldAlert, color: "text-amber-500",  bg: "bg-amber-500/10" },
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
                        placeholder="Search placements..."
                        className="w-full bg-card border border-border rounded-xl py-3.5 pl-12 pr-6 text-sm font-bold uppercase tracking-widest outline-none focus:border-foreground transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {/* ── TABLE ── */}
                <div className="bg-card border border-border rounded-[2rem] overflow-hidden shadow-sm">
                    <div className="px-8 py-5 border-b border-border">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            {filtered.length} Placements
                        </p>
                    </div>
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[9px] font-black uppercase tracking-widest text-muted-foreground border-b border-border/50">
                                <th className="px-8 py-4">Name</th>
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
                                        <MapPin className="mx-auto size-10 text-muted-foreground/20 mb-3" />
                                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">No placements found</p>
                                    </td>
                                </tr>
                            ) : filtered.map((p) => {
                                const isInUse = usedPlacements.has(p.placement_name);
                                return (
                                    <tr key={p.id} className="group hover:bg-muted/30 transition-all">
                                        <td className="px-8 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                                                    isInUse
                                                        ? "bg-emerald-500/10 text-emerald-500"
                                                        : "bg-muted text-muted-foreground group-hover:bg-foreground group-hover:text-background"
                                                )}>
                                                    <MapPin size={16} />
                                                </div>
                                                <span className="text-sm font-black uppercase italic tracking-tight">
                                                    {p.placement_name}
                                                </span>
                                            </div>
                                        </td>

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

                                        <td className="px-8 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEditOpen(p)}
                                                    className={cn(
                                                        "h-9 w-9 rounded-xl flex items-center justify-center border transition-all",
                                                        isInUse
                                                            ? "bg-muted border-border text-muted-foreground/30 cursor-not-allowed"
                                                            : "bg-muted border-border text-muted-foreground hover:bg-foreground hover:text-background hover:border-transparent"
                                                    )}
                                                    title={isInUse ? "Cannot edit — placement is in use" : "Edit placement"}
                                                >
                                                    {isInUse ? <Lock size={13} /> : <Edit3 size={14} />}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(p)}
                                                    className={cn(
                                                        "h-9 w-9 rounded-xl flex items-center justify-center border transition-all",
                                                        isInUse
                                                            ? "bg-muted border-border text-muted-foreground/30 cursor-not-allowed"
                                                            : "bg-muted border-border text-muted-foreground hover:bg-destructive hover:text-white hover:border-transparent"
                                                    )}
                                                    title={isInUse ? "Cannot delete — placement is in use" : "Delete placement"}
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
                                        {isAddOpen ? "Register Placement" : "Modify Placement"}
                                    </h2>
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                                        {isAddOpen ? "Add to placement registry" : `Editing: ${currentPlacement?.placement_name}`}
                                    </p>
                                </div>
                                <button
                                    onClick={() => { setIsAddOpen(false); setIsEditOpen(false); setNameError(null); }}
                                    className="p-2.5 hover:bg-muted rounded-full transition-all text-muted-foreground"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={isAddOpen ? handleAdd : handleEdit} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest ml-1">
                                        Placement Name
                                    </label>
                                    <input
                                        required
                                        placeholder="e.g. Upper Arm, Helix, Nostril..."
                                        className={cn(
                                            "w-full bg-muted rounded-xl px-4 py-4 text-sm font-bold uppercase italic outline-none border-2 transition-all",
                                            nameError
                                                ? "border-destructive bg-destructive/5 focus:border-destructive"
                                                : "border-transparent focus:border-foreground"
                                        )}
                                        value={isAddOpen ? newPlacementName : currentPlacement?.placement_name ?? ""}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (isAddOpen) {
                                                setNewPlacementName(val);
                                            } else {
                                                setCurrentPlacement({ ...currentPlacement!, placement_name: val });
                                            }
                                            setNameError(validatePlacementName(val));
                                        }}
                                    />
                                    {nameError ? (
                                        <div className="flex items-center gap-1.5 text-destructive text-[10px] font-bold ml-1">
                                            <AlertCircle className="size-3 flex-shrink-0" />
                                            {nameError}
                                        </div>
                                    ) : (
                                        <p className="text-[9px] text-muted-foreground ml-1 uppercase tracking-widest">
                                            Allowed: letters, numbers, spaces, - ' & . , ()
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