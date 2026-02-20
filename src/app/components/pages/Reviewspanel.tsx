"use client";

import { useState, useEffect, useMemo } from "react";
import {
    Trash2, Eye, EyeOff, Star, User,
    Search, Loader2, Image as ImageIcon,
    RotateCcw, MessageSquare, CheckCircle2, XCircle, X
} from "lucide-react";
import { Toaster, toast } from "sonner";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { cn } from "@/lib/utils";

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface Review {
    id: string;
    name: string;
    stars: number;
    description: string;
    userImage?: string;
    reviewImage?: string;
    isVisible: boolean;
    createdAt?: any;
}

// ─── AUDIT TRAIL ──────────────────────────────────────────────────────────────
async function logAudit({ action, details, module = "Client Reviews" }: {
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

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function ReviewsPanel() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [fetching, setFetching] = useState(true);
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState<"all" | "visible" | "hidden">("all");
    const [selectedReview, setSelectedReview] = useState<Review | null>(null);

    const fetchReviews = async (showSpinner = false) => {
        if (showSpinner) setFetching(true);
        try {
            const res = await fetch("/api/reviews");
            const data = await res.json();
            if (Array.isArray(data)) setReviews(data);
        } catch (err) {
            toast.error("Failed to load reviews from database.");
        } finally { setFetching(false); }
    };

    useEffect(() => { fetchReviews(); }, []);

    // ─── TOGGLE VISIBILITY ────────────────────────────────────────────────────
    const toggleVisibility = async (e: React.MouseEvent, rev: Review) => {
        e.stopPropagation();
        const doToggle = async () => {
            const res = await fetch("/api/reviews", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: rev.id, isVisible: !rev.isVisible }),
            });
            if (!res.ok) throw new Error("Visibility sync failed.");

            // ✅ AUDIT LOG
            await logAudit({
                action: rev.isVisible ? "HID REVIEW" : "PUBLISHED REVIEW",
                details: `${rev.isVisible ? "Hidden" : "Published"} review from "${rev.name}" — ${rev.stars}★ — ID: ${rev.id}`,
            });

            fetchReviews();
        };

        toast.promise(doToggle(), {
            loading: "Updating visibility...",
            success: rev.isVisible ? "Review hidden." : "Review published.",
            error: (err: Error) => err.message,
        });
    };

    // ─── DELETE ───────────────────────────────────────────────────────────────
    const deleteReview = async (e: React.MouseEvent, rev: Review) => {
        e.stopPropagation();
        if (!confirm(`Permanently delete review from "${rev.name.toUpperCase()}"?`)) return;

        const doDelete = async () => {
            const res = await fetch("/api/reviews", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: rev.id }),
            });
            if (!res.ok) throw new Error("Delete operation failed.");

            // ✅ AUDIT LOG
            await logAudit({
                action: "DELETED REVIEW",
                details: `Deleted review from "${rev.name}" — ${rev.stars}★ (ID: ${rev.id})`,
            });

            fetchReviews();
        };

        toast.promise(doDelete(), {
            loading: `Removing review from "${rev.name}"...`,
            success: "Review deleted permanently.",
            error: (err: Error) => `Error: ${err.message}`,
        });
    };

    const filteredReviews = useMemo(() => reviews.filter(rev => {
        const matchesSearch =
            rev.name.toLowerCase().includes(search.toLowerCase()) ||
            rev.description.toLowerCase().includes(search.toLowerCase());
        const matchesTab =
            activeTab === "all" ? true :
            activeTab === "visible" ? rev.isVisible : !rev.isVisible;
        return matchesSearch && matchesTab;
    }), [reviews, search, activeTab]);

    const visibleCount = reviews.filter(r => r.isVisible).length;
    const hiddenCount = reviews.filter(r => !r.isVisible).length;
    const avgStars = reviews.length
        ? (reviews.reduce((s, r) => s + r.stars, 0) / reviews.length).toFixed(1)
        : "—";

    return (
        <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
            <Toaster position="bottom-right" richColors />

            <div className="max-w-5xl mx-auto space-y-8">

                {/* ── HEADER ── */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.35em] text-muted-foreground mb-2 flex items-center gap-2">
                            <span className="h-px w-5 bg-current inline-block" /> Moderation
                        </p>
                        <h1 className="text-5xl md:text-6xl font-black uppercase italic tracking-tighter leading-none">
                            The<br />
                            <span className="text-muted-foreground/30">Reviews</span>
                        </h1>
                    </div>
                    <button
                        onClick={() => fetchReviews(true)}
                        disabled={fetching}
                        className="h-12 w-12 flex items-center justify-center bg-card border border-border rounded-xl hover:bg-muted transition-all disabled:opacity-40"
                    >
                        <RotateCcw size={16} className={cn(fetching && "animate-spin")} />
                    </button>
                </div>

                {/* ── STATS ── */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: "Total Reviews", value: reviews.length, icon: MessageSquare, color: "text-foreground",  bg: "bg-muted" },
                        { label: "Published",     value: visibleCount,   icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                        { label: "Hidden",        value: hiddenCount,    icon: XCircle,      color: "text-amber-500",   bg: "bg-amber-500/10" },
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

                {/* ── SEARCH + TABS ── */}
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <input
                            type="text"
                            placeholder="Search reviews or customers..."
                            className="w-full bg-card border border-border rounded-xl py-3.5 pl-12 pr-6 text-sm font-bold uppercase tracking-widest outline-none focus:border-foreground transition-all"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex bg-card border border-border p-1.5 rounded-xl gap-1">
                        {(["all", "visible", "hidden"] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={cn(
                                    "px-5 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                                    activeTab === tab
                                        ? "bg-foreground text-background shadow"
                                        : "text-muted-foreground hover:text-foreground"
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
                            {filteredReviews.length} Reviews
                        </p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[700px]">
                            <thead>
                                <tr className="text-[9px] font-black uppercase tracking-widest text-muted-foreground border-b border-border/50">
                                    <th className="px-8 py-4">Customer</th>
                                    <th className="px-8 py-4">Review</th>
                                    <th className="px-8 py-4">Rating</th>
                                    <th className="px-8 py-4 text-center">Status</th>
                                    <th className="px-8 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {fetching ? (
                                    <tr><td colSpan={5} className="py-20 text-center">
                                        <Loader2 className="animate-spin mx-auto size-8 text-muted-foreground/30" />
                                    </td></tr>
                                ) : filteredReviews.length === 0 ? (
                                    <tr><td colSpan={5} className="py-20 text-center">
                                        <MessageSquare className="mx-auto size-10 text-muted-foreground/20 mb-3" />
                                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">No reviews found</p>
                                    </td></tr>
                                ) : filteredReviews.map(rev => (
                                    <tr key={rev.id} onClick={() => setSelectedReview(rev)} className={cn("group hover:bg-muted/30 transition-all cursor-pointer", !rev.isVisible && "opacity-50")}>

                                        {/* Customer */}
                                        <td className="px-8 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden border border-border bg-muted transition-all",
                                                    rev.isVisible ? "text-emerald-500" : "text-muted-foreground group-hover:bg-foreground group-hover:text-background"
                                                )}>
                                                    {rev.userImage
                                                        ? <img src={rev.userImage} className="w-full h-full object-cover" alt={rev.name} />
                                                        : <User size={16} />
                                                    }
                                                </div>
                                                <span className="text-sm font-black uppercase italic tracking-tight">{rev.name}</span>
                                            </div>
                                        </td>

                                        {/* Review text */}
                                        <td className="px-8 py-4 max-w-[260px]">
                                            <p className="text-xs text-muted-foreground italic line-clamp-2 leading-relaxed">"{rev.description}"</p>
                                            {rev.reviewImage && (
                                                <div className="flex items-center gap-1 mt-1.5 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                                                    <ImageIcon size={10} /> Has photo
                                                </div>
                                            )}
                                        </td>

                                        {/* Rating */}
                                        <td className="px-8 py-4">
                                            <div className="flex items-center gap-0.5">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        size={12}
                                                        fill={i < rev.stars ? "currentColor" : "none"}
                                                        className={i < rev.stars ? "text-amber-400" : "text-muted-foreground/20"}
                                                    />
                                                ))}
                                                <span className="text-[10px] font-black text-muted-foreground ml-1.5">{rev.stars}/5</span>
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td className="px-8 py-4 text-center">
                                            {rev.isVisible ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Published
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-muted text-muted-foreground border border-border rounded-lg text-[9px] font-black uppercase tracking-widest">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" /> Hidden
                                                </span>
                                            )}
                                        </td>

                                        {/* Actions */}
                                        <td className="px-8 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={e => toggleVisibility(e, rev)}
                                                    className="h-9 w-9 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground hover:bg-foreground hover:text-background hover:border-transparent transition-all"
                                                    title={rev.isVisible ? "Hide review" : "Publish review"}
                                                >
                                                    {rev.isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                                                </button>
                                                <button
                                                    onClick={e => deleteReview(e, rev)}
                                                    className="h-9 w-9 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground hover:bg-destructive hover:text-white hover:border-transparent transition-all"
                                                    title="Delete review"
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

            {/* ── DETAIL MODAL ── */}
            {selectedReview && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
                    onClick={() => setSelectedReview(null)}
                >
                    <div
                        className="bg-card border border-border w-full max-w-md rounded-[2.5rem] shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Cover image — reviewImage takes priority, fallback to userImage */}
                        {(selectedReview.reviewImage || selectedReview.userImage) ? (
                            <div className="relative w-full h-56 bg-muted">
                                <img
                                    src={selectedReview.reviewImage || selectedReview.userImage}
                                    alt="Review photo"
                                    className="w-full h-full object-cover"
                                />
                                {/* Overlay gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                {/* Close button on top of image */}
                                <button
                                    onClick={() => setSelectedReview(null)}
                                    className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/70 rounded-full text-white transition-all"
                                >
                                    <X size={16} />
                                </button>
                                {/* Status badge on image */}
                                <div className="absolute bottom-4 left-5">
                                    {selectedReview.isVisible ? (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-[9px] font-black uppercase tracking-widest backdrop-blur-sm">
                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Published
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-black/40 text-white/60 border border-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest backdrop-blur-sm">
                                            <span className="h-1.5 w-1.5 rounded-full bg-white/30" /> Hidden
                                        </span>
                                    )}
                                </div>
                            </div>
                        ) : (
                            /* No image — just show close button in header */
                            <div className="flex justify-end px-6 pt-6">
                                <button
                                    onClick={() => setSelectedReview(null)}
                                    className="p-2.5 hover:bg-muted rounded-full transition-all text-muted-foreground"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        )}

                        {/* Info section */}
                        <div className="p-7 space-y-5">
                            {/* Avatar + Name + Stars */}
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl overflow-hidden border border-border bg-muted flex items-center justify-center shrink-0">
                                    {selectedReview.userImage
                                        ? <img src={selectedReview.userImage} className="w-full h-full object-cover" alt={selectedReview.name} />
                                        : <User size={22} className="text-muted-foreground" />
                                    }
                                </div>
                                <div>
                                    <h3 className="text-base font-black uppercase italic tracking-tight leading-tight">{selectedReview.name}</h3>
                                    <div className="flex items-center gap-0.5 mt-1">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                size={13}
                                                fill={i < selectedReview.stars ? "currentColor" : "none"}
                                                className={i < selectedReview.stars ? "text-amber-400" : "text-muted-foreground/20"}
                                            />
                                        ))}
                                        <span className="text-[10px] font-black text-muted-foreground ml-1.5">{selectedReview.stars}/5</span>
                                    </div>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="h-px bg-border" />

                            {/* Review text */}
                            <p className="text-sm text-muted-foreground italic leading-relaxed">
                                "{selectedReview.description}"
                            </p>

                            {/* Both images indicator */}
                            {selectedReview.reviewImage && selectedReview.userImage && (
                                <div className="flex gap-3">
                                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-border shrink-0">
                                        <img src={selectedReview.userImage} className="w-full h-full object-cover" alt="User" />
                                    </div>
                                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-border shrink-0">
                                        <img src={selectedReview.reviewImage} className="w-full h-full object-cover" alt="Review work" />
                                    </div>
                                    <div className="flex flex-col justify-center">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">User Photo</p>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mt-2">Work Photo</p>
                                    </div>
                                </div>
                            )}

                            {/* Action buttons */}
                            <div className="flex gap-3 pt-1">
                                <button
                                    onClick={e => { toggleVisibility(e, selectedReview); setSelectedReview(prev => prev ? { ...prev, isVisible: !prev.isVisible } : null); }}
                                    className="flex-1 h-11 rounded-xl border border-border bg-muted font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 text-muted-foreground hover:bg-foreground hover:text-background hover:border-transparent transition-all"
                                >
                                    {selectedReview.isVisible ? <><EyeOff size={13} /> Hide</> : <><Eye size={13} /> Publish</>}
                                </button>
                                <button
                                    onClick={e => { deleteReview(e, selectedReview); setSelectedReview(null); }}
                                    className="h-11 w-11 rounded-xl border border-border bg-muted flex items-center justify-center text-muted-foreground hover:bg-destructive hover:text-white hover:border-transparent transition-all"
                                    title="Delete review"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}