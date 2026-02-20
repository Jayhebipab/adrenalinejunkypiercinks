"use client"

import { useState, useEffect } from "react"
import {
    Plus, Trash2, Loader2, UploadCloud,
    X, Maximize2, Sparkles, Search,
    Zap, Syringe, User, Edit3, RotateCcw,
    AlertCircle, Lock, ShieldAlert, Users, ImageIcon
} from "lucide-react"
import { Toaster, toast } from "sonner"
import { db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { cn } from "@/lib/utils"

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface GalleryRow {
    id: number;
    placement: string;
    files: File[];
    previews: string[];
    artistId: string;
}

interface GalleryItem {
    _id: string;
    image: string;
    placement: string;
    category: string;
    artistId: string;
    artistName: string;
    artistImage: string;
}

interface FormErrors {
    placement?: string;
    artistId?: string;
}

// ─── AUDIT TRAIL ──────────────────────────────────────────────────────────────
async function logAudit({ action, details, module = "Piercing Gallery" }: {
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

function validateRow(data: { placement: string; artistId: string; filesCount: number }): FormErrors {
    const errors: FormErrors = {};
    if (!data.placement.trim()) errors.placement = "Placement is required.";
    else if (SPECIAL_CHAR_REGEX.test(data.placement)) errors.placement = "Invalid characters in placement.";
    if (!data.artistId) errors.artistId = "Please select a Master Piecer.";
    return errors;
}

function validateEditForm(data: { placement: string; artistId: string }): FormErrors {
    const errors: FormErrors = {};
    if (!data.placement.trim()) errors.placement = "Placement is required.";
    else if (SPECIAL_CHAR_REGEX.test(data.placement)) errors.placement = "Invalid characters in placement.";
    if (!data.artistId) errors.artistId = "Please select a Master Piecer.";
    return errors;
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function PiercingGallery() {
    const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
    const [artists, setArtists] = useState<any[]>([]);
    const [fetching, setFetching] = useState(true);
    const [search, setSearch] = useState("");
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editLoading, setEditLoading] = useState(false);
    const [editErrors, setEditErrors] = useState<FormErrors>({});
    const [selectedImg, setSelectedImg] = useState<string | null>(null);
    const [rows, setRows] = useState<GalleryRow[]>([{
        id: Date.now(), placement: "", files: [], previews: [], artistId: ""
    }]);
    const [rowErrors, setRowErrors] = useState<Record<number, FormErrors>>({});

    const API_PATH = "/api/gallery";

    // ─── FETCH ────────────────────────────────────────────────────────────────
    const fetchData = async () => {
        setFetching(true);
        try {
            const [galleryRes, artistsRes] = await Promise.all([
                fetch(API_PATH),
                fetch("/api/artists")
            ]);
            const galleryData = await galleryRes.json();
            const artistsData = await artistsRes.json();

            if (Array.isArray(galleryData)) {
                setGalleryItems(galleryData.filter((i: any) => i.category === "Piercing"));
            }
            if (Array.isArray(artistsData)) {
                // ✅ FILTER: Only Master Piercers
                setArtists(artistsData
                    .filter((a: any) => a.status === "active" && a.position === "Master Piercer")
                    .map((a: any) => ({ ...a, _id: a._id || a.id }))
                );
            }
        } catch (err) {
            toast.error("Failed to fetch data.");
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // ─── CLOUDINARY ──────────────────────────────────────────────────────────
    const uploadToCloudinary = async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "adrenalinejunkypiercinks");
        const res = await fetch(`https://api.cloudinary.com/v1_1/diwrwmjgw/image/upload`, {
            method: "POST", body: formData,
        });
        const data = await res.json();
        return data.secure_url;
    };

    // ─── ROW MANAGEMENT ──────────────────────────────────────────────────────
    const addRow = () => setRows(prev => [...prev, {
        id: Date.now(), placement: "", files: [], previews: [], artistId: ""
    }]);

    const removeRow = (id: number) => {
        const row = rows.find(r => r.id === id);
        row?.previews.forEach(p => URL.revokeObjectURL(p));
        setRows(prev => prev.filter(r => r.id !== id));
        setRowErrors(prev => { const e = { ...prev }; delete e[id]; return e; });
    };

    const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png"];

    const handleImageChange = (rowId: number, files: FileList | null) => {
        if (!files) return;
        const allFiles = Array.from(files);
        const invalidFiles = allFiles.filter(f => !ALLOWED_TYPES.includes(f.type));
        if (invalidFiles.length > 0) {
            toast.error(`Invalid file type: only JPG, JPEG, and PNG are allowed.`);
            return;
        }
        const newFiles = allFiles;
        const newPreviews = newFiles.map(f => URL.createObjectURL(f));
        setRows(prev => prev.map(r =>
            r.id === rowId ? { ...r, files: [...r.files, ...newFiles], previews: [...r.previews, ...newPreviews] } : r
        ));
    };

    const liveValidateRow = (rowId: number, field: keyof FormErrors, value: string) => {
        const row = rows.find(r => r.id === rowId);
        if (!row) return;
        const errs = validateRow({ placement: field === "placement" ? value : row.placement, artistId: field === "artistId" ? value : row.artistId, filesCount: row.files.length });
        setRowErrors(prev => ({ ...prev, [rowId]: { ...prev[rowId], [field]: errs[field] } }));
    };

    // ─── SAVE ALL ────────────────────────────────────────────────────────────
    const saveAll = async () => {
        // Validate all rows
        const newErrors: Record<number, FormErrors> = {};
        let hasErrors = false;
        for (const row of rows) {
            const errs = validateRow({ placement: row.placement, artistId: row.artistId, filesCount: row.files.length });
            if (row.files.length === 0) errs.placement = errs.placement || "At least 1 image required.";
            if (Object.keys(errs).length > 0) { newErrors[row.id] = errs; hasErrors = true; }
        }
        if (hasErrors) {
            setRowErrors(newErrors);
            toast.error("Please fix all errors before saving.");
            return;
        }

        setUploading(true);
        const doSave = async () => {
            const allItems: any[] = [];
            for (const row of rows) {
                const artist = artists.find(a => a._id === row.artistId);
                for (const file of row.files) {
                    const imageUrl = await uploadToCloudinary(file);
                    allItems.push({
                        image: imageUrl,
                        placement: row.placement,
                        category: "Piercing",
                        artistId: artist?._id,
                        artistName: artist?.fullName,
                        artistImage: artist?.profileImage || ""
                    });
                }
            }
            const res = await fetch(API_PATH, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(allItems)
            });
            if (!res.ok) throw new Error("Failed to save.");

            // ✅ AUDIT LOG
            await logAudit({
                action: "ADDED PIERCING ENTRIES",
                details: `Uploaded ${allItems.length} piercing photo(s): ${allItems.map(i => `"${i.placement}" by ${i.artistName}`).join(", ")}`,
            });

            rows.forEach(r => r.previews.forEach(p => URL.revokeObjectURL(p)));
            setRows([{ id: Date.now(), placement: "", files: [], previews: [], artistId: "" }]);
            setRowErrors({});
            setIsUploadOpen(false);
            fetchData();
        };

        try {
            await toast.promise(doSave(), {
                loading: "Uploading to portfolio...",
                success: "Piercings added to portfolio!",
                error: (err: Error) => err.message,
            });
        } finally { setUploading(false); }
    };

    // ─── UPDATE ──────────────────────────────────────────────────────────────
    const handleUpdate = async () => {
        if (!editingItem) return;
        const errors = validateEditForm({ placement: editingItem.placement, artistId: editingItem.artistId });
        if (Object.keys(errors).length > 0) { setEditErrors(errors); toast.error("Please fix the errors."); return; }

        setEditLoading(true);
        const doUpdate = async () => {
            const artist = artists.find(a => a._id === editingItem.artistId);
            const updatedData = { ...editingItem, artistName: artist?.fullName, artistImage: artist?.profileImage || "" };
            const res = await fetch(API_PATH, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedData),
            });
            if (!res.ok) throw new Error("Update failed.");

            // ✅ AUDIT LOG
            await logAudit({
                action: "EDITED PIERCING ENTRY",
                details: `Edited piercing entry ID: ${editingItem._id} — Placement: "${editingItem.placement}", Artist: ${artist?.fullName}`,
            });

            setIsEditOpen(false);
            setEditErrors({});
            fetchData();
        };

        try {
            await toast.promise(doUpdate(), {
                loading: "Updating entry...",
                success: "Updated successfully!",
                error: (err: Error) => err.message,
            });
        } finally { setEditLoading(false); }
    };

    // ─── DELETE ──────────────────────────────────────────────────────────────
    const deleteItem = async (item: GalleryItem) => {
        if (!confirm(`Remove "${item.placement.toUpperCase()}" from portfolio?`)) return;

        const doDelete = async () => {
            const res = await fetch(`${API_PATH}?id=${item._id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Could not delete.");

            // ✅ AUDIT LOG
            await logAudit({
                action: "DELETED PIERCING ENTRY",
                details: `Deleted piercing entry "${item.placement}" by ${item.artistName} (ID: ${item._id})`,
            });

            fetchData();
        };

        toast.promise(doDelete(), {
            loading: `Removing "${item.placement}"...`,
            success: `"${item.placement}" removed from portfolio.`,
            error: (err: Error) => `Error: ${err.message}`,
        });
    };

    const filteredItems = galleryItems.filter(item =>
        item.placement?.toLowerCase().includes(search.toLowerCase()) ||
        item.artistName?.toLowerCase().includes(search.toLowerCase())
    );

    // Stats
    const uniqueArtists = new Set(galleryItems.map(i => i.artistId)).size;

    return (
        <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
            <Toaster position="bottom-right" richColors />

            <div className="max-w-5xl mx-auto space-y-8">

                {/* ── HEADER ── */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.35em] text-muted-foreground mb-2 flex items-center gap-2">
                            <span className="h-px w-5 bg-current inline-block" /> Portfolio / Piercings
                        </p>
                        <h1 className="text-5xl md:text-6xl font-black uppercase italic tracking-tighter leading-none">
                            The<br />
                            <span className="text-muted-foreground/30">Piercings</span>
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
                            onClick={() => { setIsUploadOpen(true); setRowErrors({}); setRows([{ id: Date.now(), placement: "", files: [], previews: [], artistId: "" }]); }}
                            className="h-12 px-6 bg-foreground text-background rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:opacity-90 transition-all shadow-lg"
                        >
                            <Plus size={16} /> Add New Entry
                        </button>
                    </div>
                </div>

                {/* ── STATS ── */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: "Total Entries", value: galleryItems.length, icon: ImageIcon,   color: "text-foreground",  bg: "bg-muted" },
                        { label: "Placements",    value: new Set(galleryItems.map(i => i.placement)).size, icon: Syringe,   color: "text-emerald-500", bg: "bg-emerald-500/10" },
                        { label: "Piercers",      value: uniqueArtists,        icon: Users,      color: "text-amber-500",   bg: "bg-amber-500/10" },
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
                        placeholder="Search by placement or artist..."
                        className="w-full bg-card border border-border rounded-xl py-3.5 pl-12 pr-6 text-sm font-bold uppercase tracking-widest outline-none focus:border-foreground transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {/* ── GALLERY TABLE ── */}
                <div className="bg-card border border-border rounded-[2rem] overflow-hidden shadow-sm">
                    <div className="px-8 py-5 border-b border-border">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            {filteredItems.length} Entries
                        </p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[600px]">
                            <thead>
                                <tr className="text-[9px] font-black uppercase tracking-widest text-muted-foreground border-b border-border/50">
                                    <th className="px-8 py-4">Photo</th>
                                    <th className="px-8 py-4">Placement</th>
                                    <th className="px-8 py-4">Piercer</th>
                                    <th className="px-8 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {fetching ? (
                                    <tr><td colSpan={4} className="py-20 text-center">
                                        <Loader2 className="animate-spin mx-auto size-8 text-muted-foreground/30" />
                                    </td></tr>
                                ) : filteredItems.length === 0 ? (
                                    <tr><td colSpan={4} className="py-20 text-center">
                                        <Syringe className="mx-auto size-10 text-muted-foreground/20 mb-3" />
                                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">No entries found</p>
                                    </td></tr>
                                ) : filteredItems.map((item) => (
                                    <tr key={item._id} className="group hover:bg-muted/30 transition-all">
                                        <td className="px-8 py-4">
                                            <div
                                                className="w-14 h-14 rounded-xl overflow-hidden border border-border cursor-zoom-in"
                                                onClick={() => setSelectedImg(item.image)}
                                            >
                                                <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={item.placement} />
                                            </div>
                                        </td>
                                        <td className="px-8 py-4">
                                            <span className="text-sm font-black uppercase italic tracking-tight">{item.placement}</span>
                                        </td>
                                        <td className="px-8 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full overflow-hidden border border-border bg-muted">
                                                    <img src={item.artistImage || "/placeholder-user.jpg"} className="w-full h-full object-cover" alt={item.artistName} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold uppercase">{item.artistName}</p>
                                                    <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Master Piecer</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => setSelectedImg(item.image)}
                                                    className="h-9 w-9 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground hover:bg-foreground hover:text-background hover:border-transparent transition-all"
                                                    title="View full image"
                                                >
                                                    <Maximize2 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => { setEditingItem(item); setEditErrors({}); setIsEditOpen(true); }}
                                                    className="h-9 w-9 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground hover:bg-foreground hover:text-background hover:border-transparent transition-all"
                                                    title="Edit entry"
                                                >
                                                    <Edit3 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => deleteItem(item)}
                                                    className="h-9 w-9 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground hover:bg-destructive hover:text-white hover:border-transparent transition-all"
                                                    title="Delete entry"
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

            {/* ── UPLOAD MODAL ── */}
            {isUploadOpen && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-card border border-border w-full max-w-2xl rounded-[2.5rem] shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                        <div className="p-8 border-b border-border flex justify-between items-start">
                            <div>
                                <h2 className="text-lg font-black uppercase italic tracking-tighter">New Entries</h2>
                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Batch upload piercing photos</p>
                            </div>
                            <button onClick={() => setIsUploadOpen(false)} className="p-2.5 hover:bg-muted rounded-full transition-all text-muted-foreground">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-8 space-y-4 overflow-y-auto flex-1">
                            {rows.map((row, index) => (
                                <div key={row.id} className="p-6 bg-muted/40 rounded-2xl border border-border space-y-4">
                                    <div className="flex justify-between items-center">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Row #{index + 1}</p>
                                        {rows.length > 1 && (
                                            <button onClick={() => removeRow(row.id)} className="text-[9px] font-black uppercase text-destructive hover:underline tracking-widest">Remove</button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        {/* Artist Select */}
                                        <FormField
                                            label="Master Piecer"
                                            error={rowErrors[row.id]?.artistId}
                                            input={
                                                <div className="relative">
                                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                                                    <select
                                                        className={cn(
                                                            "w-full pl-9 pr-3 py-3.5 bg-background rounded-xl text-xs font-bold uppercase outline-none border-2 transition-all appearance-none",
                                                            rowErrors[row.id]?.artistId ? "border-destructive" : "border-transparent focus:border-foreground"
                                                        )}
                                                        value={row.artistId}
                                                        onChange={e => {
                                                            setRows(prev => prev.map(r => r.id === row.id ? { ...r, artistId: e.target.value } : r));
                                                            liveValidateRow(row.id, "artistId", e.target.value);
                                                        }}
                                                    >
                                                        <option value="">Select piercer...</option>
                                                        {artists.map(a => <option key={a._id} value={a._id}>{a.fullName}</option>)}
                                                    </select>
                                                </div>
                                            }
                                        />

                                        {/* Placement */}
                                        <FormField
                                            label="Placement"
                                            error={rowErrors[row.id]?.placement}
                                            input={
                                                <div className="relative">
                                                    <Syringe className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. Helix, Nostril..."
                                                        className={cn(
                                                            "w-full pl-9 pr-3 py-3.5 bg-background rounded-xl text-xs font-bold uppercase outline-none border-2 transition-all",
                                                            rowErrors[row.id]?.placement ? "border-destructive bg-destructive/5" : "border-transparent focus:border-foreground"
                                                        )}
                                                        value={row.placement}
                                                        onChange={e => {
                                                            setRows(prev => prev.map(r => r.id === row.id ? { ...r, placement: e.target.value } : r));
                                                            liveValidateRow(row.id, "placement", e.target.value);
                                                        }}
                                                    />
                                                </div>
                                            }
                                        />
                                    </div>

                                    {/* File Upload */}
                                    <label className={cn(
                                        "flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-2xl cursor-pointer transition-all group",
                                        "border-border hover:border-foreground bg-background"
                                    )}>
                                        <UploadCloud className="size-8 text-muted-foreground group-hover:text-foreground mb-2 transition-colors" />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Drop or click to upload</span>
                                        <input type="file" multiple className="hidden" accept=".jpg,.jpeg,.png,image/jpeg,image/png" onChange={e => handleImageChange(row.id, e.target.files)} />
                                    </label>

                                    {row.previews.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {row.previews.map((src, i) => (
                                                <img key={i} src={src} className="w-12 h-12 rounded-xl object-cover border border-border" alt="preview" />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="p-8 pt-0 flex gap-3 border-t border-border mt-0">
                            <button onClick={addRow} className="flex-1 h-12 border border-border rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-muted transition-all">Add Row</button>
                            <button
                                onClick={saveAll}
                                disabled={uploading}
                                className="flex-[2] h-12 bg-foreground text-background rounded-xl font-black uppercase text-[10px] tracking-widest hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {uploading ? <Loader2 className="animate-spin size-4" /> : "Finalize & Save"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── EDIT MODAL ── */}
            {isEditOpen && editingItem && (
                <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-card border border-border w-full max-w-sm rounded-[2.5rem] shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="p-8 space-y-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-lg font-black uppercase italic tracking-tighter">Modify Entry</h2>
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Editing: {editingItem.placement}</p>
                                </div>
                                <button onClick={() => { setIsEditOpen(false); setEditErrors({}); }} className="p-2.5 hover:bg-muted rounded-full transition-all text-muted-foreground">
                                    <X size={18} />
                                </button>
                            </div>

                            <img src={editingItem.image} className="w-full h-48 object-cover rounded-2xl border border-border" alt={editingItem.placement} />

                            <div className="space-y-4">
                                <FormField
                                    label="Master Piecer"
                                    error={editErrors.artistId}
                                    input={
                                        <select
                                            className={cn(
                                                "w-full bg-muted rounded-xl px-4 py-3.5 text-xs font-bold uppercase outline-none border-2 transition-all",
                                                editErrors.artistId ? "border-destructive" : "border-transparent focus:border-foreground"
                                            )}
                                            value={editingItem.artistId}
                                            onChange={e => {
                                                setEditingItem({ ...editingItem, artistId: e.target.value });
                                                const errs = validateEditForm({ placement: editingItem.placement, artistId: e.target.value });
                                                setEditErrors(prev => ({ ...prev, artistId: errs.artistId }));
                                            }}
                                        >
                                            <option value="">Select piercer...</option>
                                            {artists.map(a => <option key={a._id} value={a._id}>{a.fullName}</option>)}
                                        </select>
                                    }
                                />

                                <FormField
                                    label="Placement"
                                    error={editErrors.placement}
                                    input={
                                        <input
                                            type="text"
                                            className={cn(
                                                "w-full bg-muted rounded-xl px-4 py-3.5 text-xs font-bold uppercase outline-none border-2 transition-all",
                                                editErrors.placement ? "border-destructive bg-destructive/5" : "border-transparent focus:border-foreground"
                                            )}
                                            value={editingItem.placement}
                                            onChange={e => {
                                                setEditingItem({ ...editingItem, placement: e.target.value });
                                                const errs = validateEditForm({ placement: e.target.value, artistId: editingItem.artistId });
                                                setEditErrors(prev => ({ ...prev, placement: errs.placement }));
                                            }}
                                        />
                                    }
                                />
                            </div>

                            <button
                                onClick={handleUpdate}
                                disabled={editLoading || Object.values(editErrors).some(Boolean)}
                                className="w-full h-14 bg-foreground text-background rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {editLoading ? <Loader2 className="animate-spin size-4" /> : "Commit Record"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── LIGHTBOX ── */}
            {selectedImg && (
                <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 cursor-zoom-out" onClick={() => setSelectedImg(null)}>
                    <img src={selectedImg} className="max-w-full max-h-[90vh] rounded-[2rem] object-contain shadow-2xl animate-in zoom-in duration-300" alt="full preview" />
                    <button className="absolute top-10 right-10 text-white p-3 hover:bg-white/10 rounded-full transition-all">
                        <X size={32} />
                    </button>
                </div>
            )}
        </div>
    );
}

// ─── REUSABLE FORM FIELD ──────────────────────────────────────────────────────
function FormField({ label, error, input }: { label: React.ReactNode; error?: string; input: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest ml-1 flex items-center gap-1">{label}</label>
            {input}
            {error && (
                <div className="flex items-center gap-1.5 text-destructive text-[10px] font-bold ml-1">
                    <AlertCircle className="size-3 flex-shrink-0" /> {error}
                </div>
            )}
        </div>
    );
}