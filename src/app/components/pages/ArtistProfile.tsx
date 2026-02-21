"use client";

import { useState, useEffect, useMemo } from "react";
import Script from "next/script";
import ArtistModal from "../../components/ArtistModal";
import {
    Plus, Loader2, Search, Trash2,
    Eye, EyeOff, User, Lock
} from "lucide-react";
import { Toaster, toast } from "sonner";
import { cn } from "@/lib/utils";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// ─── AUDIT TRAIL HELPER ───────────────────────────────────────────────────────
async function logAudit({ action, details, module = "Artist Management" }: {
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

export default function ArtistProfile() {
    const [artists, setArtists] = useState<any[]>([]);
    // ✅ Set of artist NAMES (lowercase) that are in an APPROVED booking
    const [approvedNames, setApprovedNames] = useState<Set<string>>(new Set());
    const [fetching, setFetching] = useState(true);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<"all" | "active" | "inactive">("all");

    const [modal, setModal] = useState<{
        isOpen: boolean;
        data: any | null;
        nameIsLocked: boolean;  // ✅ passed to ArtistModal to disable fullName field
    }>({ isOpen: false, data: null, nameIsLocked: false });

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        setFetching(true);
        try {
            const [artistRes, bookingRes] = await Promise.all([
                fetch("/api/artists"),
                fetch("/api/bookings"),
            ]);
            const artistData = await artistRes.json();
            const bookingData = await bookingRes.json();

            if (Array.isArray(artistData)) setArtists(artistData);

            // ✅ Build set of names from APPROVED bookings only
            const list = bookingData?.bookings ?? (Array.isArray(bookingData) ? bookingData : []);
            const names = new Set<string>(
                list
                    .filter((b: any) => b.status?.toLowerCase() === "approved")
                    .map((b: any) => (b.artist ?? b.artistName ?? "").toLowerCase().trim())
                    .filter(Boolean)
            );
            setApprovedNames(names);
        } catch (err) {
            toast.error("Failed to load team data.");
        } finally { setFetching(false); }
    };

    // ✅ Check by name — bookings store artist name, not ID
    const isNameLocked = (artist: any) =>
        approvedNames.has((artist.fullName ?? "").toLowerCase().trim());

    // ─── DUPLICATE VALIDATION ─────────────────────────────────────────────────
    const checkDuplicates = (payload: any, excludeId?: string): string | null => {
        for (const artist of artists) {
            const id = artist.id || artist._id;
            if (id === excludeId) continue;
            if (artist.fullName?.toLowerCase().trim() === payload.fullName?.toLowerCase().trim())
                return `Artist name "${payload.fullName}" is already registered.`;
            if (payload.email?.trim() && artist.email?.toLowerCase() === payload.email?.toLowerCase().trim())
                return `Email "${payload.email}" is already in use.`;
            if (payload.contactNumber?.trim() && artist.contactNumber === payload.contactNumber?.trim())
                return `Contact number "${payload.contactNumber}" is already registered.`;
        }
        return null;
    };

    // ─── HANDLE SAVE ─────────────────────────────────────────────────────────
    const handleSave = async (payload: any) => {
        const artistId = payload.id || payload._id;
        const isUpdate = !!artistId;

        // ✅ If fullName is locked, force-revert it to original — even if modal tried to send a new value
        if (isUpdate && isNameLocked({ fullName: payload.fullName })) {
            const original = artists.find(a => (a.id || a._id) === artistId);
            if (original) payload.fullName = original.fullName;
        }

        if (!payload.fullName?.trim()) {
            toast.error("Artist name is required.");
            return;
        }

        const dupeError = checkDuplicates(payload, artistId);
        if (dupeError) { toast.error(dupeError); return; }

        setLoading(true);
        try {
            const finalPayload = { ...payload, status: payload.status || "active" };
            const res = await fetch("/api/artists", {
                method: isUpdate ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(isUpdate ? { id: artistId, ...finalPayload } : finalPayload),
            });
            if (res.ok) {
                await logAudit({
                    action: isUpdate ? "EDITED ARTIST" : "ADDED ARTIST",
                    details: isUpdate
                        ? `Edited artist "${payload.fullName}" (${payload.position}) — ID: ${artistId}`
                        : `Added new artist "${payload.fullName}" (${payload.position || "No position"})`,
                });
                toast.success(isUpdate ? "Artist updated!" : "New artist added!");
                setModal({ isOpen: false, data: null, nameIsLocked: false });
                fetchAll();
            } else {
                const err = await res.json();
                toast.error(err.error || "Operation failed.");
            }
        } catch { toast.error("Operation failed."); }
        finally { setLoading(false); }
    };

    // ─── TOGGLE STATUS — always allowed ──────────────────────────────────────
    const toggleStatus = async (e: React.MouseEvent, artist: any) => {
        e.stopPropagation();
        const artistId = artist.id || artist._id;
        const newStatus = artist.status === "inactive" ? "active" : "inactive";
        try {
            const res = await fetch("/api/artists", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...artist, id: artistId, status: newStatus }),
            });
            if (res.ok) {
                await logAudit({
                    action: "TOGGLED ARTIST STATUS",
                    details: `Artist "${artist.fullName}" status changed to ${newStatus.toUpperCase()}`,
                });
                toast.info(`${artist.fullName}: ${newStatus.toUpperCase()}`);
                fetchAll();
            }
        } catch { toast.error("Status update failed."); }
    };

    // ─── DELETE — blocked if name is in an approved booking ──────────────────
    const deleteArtist = async (e: React.MouseEvent, artist: any) => {
        e.stopPropagation();
        const artistId = artist.id || artist._id;

        if (isNameLocked(artist)) {
            toast.error(`Cannot delete "${artist.fullName}"`, {
                description: "This artist has an approved booking. Complete or cancel it first.",
            });
            return;
        }

        if (!confirm(`DELETE "${artist.fullName.toUpperCase()}"?`)) return;

        try {
            const res = await fetch("/api/artists", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: artistId }),
            });
            if (res.ok) {
                await logAudit({
                    action: "DELETED ARTIST",
                    details: `Deleted artist "${artist.fullName}" (${artist.position || "No position"}) — ID: ${artistId}`,
                });
                toast.success(`"${artist.fullName}" has been removed.`);
                fetchAll();
            }
        } catch { toast.error("Delete failed."); }
    };

    // ─── OPEN MODAL — always open; pass nameIsLocked so modal can disable field ─
    const handleRowClick = (artist: any) => {
        setModal({ isOpen: true, data: artist, nameIsLocked: isNameLocked(artist) });
    };

    const filteredArtists = useMemo(() => artists.filter(a => {
        const matchesSearch =
            (a.fullName || "").toLowerCase().includes(search.toLowerCase()) ||
            (a.position || "").toLowerCase().includes(search.toLowerCase());
        const matchesTab = activeTab === "all" ? true : a.status === activeTab;
        return matchesSearch && matchesTab;
    }), [artists, search, activeTab]);

    return (
        <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
            <Script src="https://upload-widget.cloudinary.com/global/all.js" strategy="afterInteractive" />
            <Toaster position="bottom-right" richColors />

            <div className="max-w-5xl mx-auto space-y-8">

                {/* ── HEADER ── */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.35em] text-muted-foreground mb-2 flex items-center gap-2">
                            <span className="h-px w-5 bg-current inline-block" /> Studio Management
                        </p>
                        <h1 className="text-5xl md:text-6xl font-black uppercase italic tracking-tighter leading-none">
                            The<br />
                            <span className="text-muted-foreground/30">Crew</span>
                        </h1>
                    </div>
                    <button
                        onClick={() => setModal({
                            isOpen: true,
                            data: { fullName: "", position: "", email: "", status: "active", artworks: [] },
                            nameIsLocked: false,
                        })}
                        className="h-12 px-6 bg-foreground text-background rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:opacity-90 transition-all shadow-lg"
                    >
                        <Plus size={16} /> New Artist
                    </button>
                </div>

                {/* ── STATS ── */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: "Total Artists",       value: artists.length,                                    color: "text-foreground",  bg: "bg-muted" },
                        { label: "Active",              value: artists.filter(a => a.status === "active").length, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                        { label: "In Approved Booking", value: approvedNames.size,                                color: "text-amber-500",   bg: "bg-amber-500/10" },
                    ].map(stat => (
                        <div key={stat.label} className="bg-card border border-border rounded-[1.5rem] p-5 flex items-center gap-4">
                            <div className={cn("p-2.5 rounded-xl", stat.bg, stat.color)}>
                                <User className="size-4" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                                <p className="text-2xl font-black">{stat.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── SEARCH + TABS ── */}
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name or role..."
                            className="w-full bg-card border border-border rounded-xl py-3.5 pl-12 pr-6 text-sm font-bold uppercase tracking-widest outline-none focus:border-foreground transition-all"
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex bg-card border border-border p-1.5 rounded-xl gap-1">
                        {(["all", "active", "inactive"] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={cn(
                                    "px-5 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                                    activeTab === tab ? "bg-foreground text-background shadow" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── TABLE ── */}
                <div className="bg-card border border-border rounded-[2rem] overflow-hidden shadow-sm">
                    <div className="px-8 py-5 border-b border-border">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            {filteredArtists.length} Artists
                        </p>
                    </div>

                    <div className="divide-y divide-border/50">
                        {fetching ? (
                            <div className="py-20 text-center">
                                <Loader2 className="animate-spin mx-auto size-8 text-muted-foreground/30" />
                            </div>
                        ) : filteredArtists.length === 0 ? (
                            <div className="py-20 text-center">
                                <User className="mx-auto size-10 text-muted-foreground/20 mb-3" />
                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">No artists found</p>
                            </div>
                        ) : filteredArtists.map(artist => {
                            const artistId = artist.id || artist._id;
                            const locked = isNameLocked(artist);

                            return (
                                <div
                                    key={artistId}
                                    onClick={() => handleRowClick(artist)}
                                    className="group flex items-center gap-5 px-8 py-5 cursor-pointer hover:bg-muted/30 transition-all"
                                >
                                    {/* Avatar */}
                                    <div className={cn(
                                        "w-11 h-11 rounded-xl overflow-hidden flex items-center justify-center shrink-0 transition-all",
                                        locked
                                            ? "bg-amber-500/10 text-amber-500"
                                            : "bg-muted text-muted-foreground group-hover:bg-foreground group-hover:text-background"
                                    )}>
                                        {artist.profileImage
                                            ? <img src={artist.profileImage} className="w-full h-full object-cover" alt="" />
                                            : <User size={16} />
                                        }
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="text-sm font-black uppercase italic tracking-tight truncate">{artist.fullName}</h3>
                                            {artist.status === "active" && !locked && (
                                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                            )}
                                            {/* ✅ Name Locked badge */}
                                            {locked && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-md text-[8px] font-black uppercase tracking-widest">
                                                    <Lock size={8} /> Name Locked
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest truncate">{artist.position}</p>
                                    </div>

                                    {/* Status badge */}
                                    <span className={cn(
                                        "hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                                        artist.status === "active"
                                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                            : "bg-muted text-muted-foreground border-border"
                                    )}>
                                        <span className={cn("h-1.5 w-1.5 rounded-full", artist.status === "active" ? "bg-emerald-400 animate-pulse" : "bg-muted-foreground/30")} />
                                        {artist.status}
                                    </span>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {/* Toggle — always allowed */}
                                        <button
                                            onClick={e => toggleStatus(e, artist)}
                                            className="h-9 w-9 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground hover:bg-foreground hover:text-background hover:border-transparent transition-all"
                                            title={artist.status === "active" ? "Deactivate" : "Activate"}
                                        >
                                            {artist.status === "active" ? <EyeOff size={14} /> : <Eye size={14} />}
                                        </button>

                                        {/* ✅ Delete — shows Lock icon if in approved booking, disabled */}
                                        <button
                                            onClick={e => deleteArtist(e, artist)}
                                            disabled={locked}
                                            className={cn(
                                                "h-9 w-9 rounded-xl border flex items-center justify-center transition-all",
                                                locked
                                                    ? "bg-muted border-border text-muted-foreground/20 cursor-not-allowed"
                                                    : "bg-muted border-border text-muted-foreground hover:bg-destructive hover:text-white hover:border-transparent"
                                            )}
                                            title={locked ? "Cannot delete — has an approved booking" : "Delete artist"}
                                        >
                                            {locked ? <Lock size={13} /> : <Trash2 size={14} />}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ✅ nameIsLocked passed so modal can disable fullName input */}
            <ArtistModal
                isOpen={modal.isOpen}
                artistData={modal.data}
                onClose={() => setModal({ isOpen: false, data: null, nameIsLocked: false })}
                onSave={handleSave}
                loading={loading}
                nameIsLocked={modal.nameIsLocked}
            />
        </div>
    );
}