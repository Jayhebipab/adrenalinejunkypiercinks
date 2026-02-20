"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
    Calendar, Loader2, Plus, Trash2, Edit3, X, Save,
    UploadCloud, Sparkles, FileText, RotateCcw, AlertCircle, BookOpen
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { cn } from "@/lib/utils";

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface BlogPost {
    id: string;
    title: string;
    category: string;
    image: string;
    content: string;
    slug: string;
    createdAt?: { seconds: number; nanoseconds: number } | string | Date;
}

interface FormErrors {
    title?: string;
    image?: string;
    content?: string;
}

// ─── AUDIT TRAIL ──────────────────────────────────────────────────────────────
async function logAudit({ action, details, module = "Studio Journal" }: {
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
const SPECIAL_CHAR_REGEX = /[^a-zA-Z0-9\s\-'&.,()!?:]/;
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png"];

function validatePost(data: { title: string; image: string; content: string; hasFile: boolean }): FormErrors {
    const errors: FormErrors = {};
    if (!data.title.trim()) errors.title = "Title is required.";
    else if (SPECIAL_CHAR_REGEX.test(data.title)) errors.title = "Invalid characters in title.";
    if (!data.image && !data.hasFile) errors.image = "Cover image is required.";
    if (!data.content.trim()) errors.content = "Content is required.";
    return errors;
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const formatDate = (dateObj: any) => {
    if (!dateObj) return "Recent";
    if (dateObj.seconds) return new Date(dateObj.seconds * 1000).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
    return new Date(dateObj).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
};

const generateSlug = (title: string) =>
    title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function BlogAdminPage() {
    const [blogs, setBlogs] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetching, setFetching] = useState(false);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState("");
    const [formErrors, setFormErrors] = useState<FormErrors>({});
    const [currentPost, setCurrentPost] = useState<BlogPost>({
        id: "", title: "", category: "Tattoo Culture", image: "", content: "", slug: ""
    });

    const fetchData = useCallback(async (showSpinner = false) => {
        if (showSpinner) setFetching(true);
        try {
            const res = await fetch("/api/blogs");
            const data = await res.json();
            if (Array.isArray(data)) setBlogs(data);
        } catch (err) {
            toast.error("Failed to load journals.");
        } finally {
            setLoading(false);
            setFetching(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    // ─── IMAGE CHANGE ─────────────────────────────────────────────────────────
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!ALLOWED_TYPES.includes(file.type)) {
            toast.error("Invalid file type. Only JPG, JPEG, and PNG are allowed.");
            return;
        }
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        setFormErrors(prev => ({ ...prev, image: undefined }));
    };

    // ─── TITLE CHANGE ─────────────────────────────────────────────────────────
    const onTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setCurrentPost(prev => ({
            ...prev,
            title: val,
            slug: prev.id ? prev.slug : generateSlug(val),
        }));
        const errs = validatePost({ title: val, image: currentPost.image, content: currentPost.content, hasFile: !!selectedFile });
        setFormErrors(prev => ({ ...prev, title: errs.title }));
    };

    // ─── SAVE ─────────────────────────────────────────────────────────────────
    const handleSave = async () => {
        const errors = validatePost({ title: currentPost.title, image: currentPost.image, content: currentPost.content, hasFile: !!selectedFile });
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            toast.error("Please fix the form errors before saving.");
            return;
        }

        setActionLoading(true);
        const doSave = async () => {
            let finalImageUrl = currentPost.image;
            if (selectedFile) {
                const uploaded = await uploadToCloudinary(selectedFile);
                if (uploaded) finalImageUrl = uploaded;
            }

            const method = currentPost.id ? "PUT" : "POST";
            const res = await fetch("/api/blogs", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...currentPost, image: finalImageUrl }),
            });
            if (!res.ok) throw new Error("Failed to save.");

            // ✅ AUDIT LOG
            if (currentPost.id) {
                await logAudit({
                    action: "EDITED JOURNAL POST",
                    details: `Edited blog post "${currentPost.title}" (ID: ${currentPost.id}) — Category: ${currentPost.category}`,
                });
            } else {
                await logAudit({
                    action: "PUBLISHED JOURNAL POST",
                    details: `Published new blog post "${currentPost.title}" — Category: ${currentPost.category}, Slug: ${currentPost.slug}`,
                });
            }

            setIsEditorOpen(false);
            resetForm();
            fetchData();
        };

        try {
            await toast.promise(doSave(), {
                loading: currentPost.id ? "Updating journal..." : "Publishing story...",
                success: currentPost.id ? "Journal updated!" : "New story published!",
                error: (err: Error) => err.message,
            });
        } finally { setActionLoading(false); }
    };

    // ─── DELETE ───────────────────────────────────────────────────────────────
    const deletePost = async (post: BlogPost) => {
        if (!confirm(`Remove "${post.title.toUpperCase()}" permanently?`)) return;

        const doDelete = async () => {
            const res = await fetch("/api/blogs", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: post.id }),
            });
            if (!res.ok) throw new Error("Delete failed.");

            // ✅ AUDIT LOG
            await logAudit({
                action: "DELETED JOURNAL POST",
                details: `Deleted blog post "${post.title}" (ID: ${post.id}) — Category: ${post.category}`,
            });

            fetchData();
        };

        toast.promise(doDelete(), {
            loading: `Removing "${post.title}"...`,
            success: `"${post.title}" deleted.`,
            error: (err: Error) => `Error: ${err.message}`,
        });
    };

    const resetForm = () => {
        setCurrentPost({ id: "", title: "", category: "Tattoo Culture", image: "", content: "", slug: "" });
        setSelectedFile(null);
        setFormErrors({});
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl("");
    };

    const categoryCounts = blogs.reduce((acc: Record<string, number>, b) => {
        acc[b.category] = (acc[b.category] || 0) + 1;
        return acc;
    }, {});

    return (
        <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
            <Toaster position="bottom-right" richColors />

            <div className="max-w-5xl mx-auto space-y-8">

                {/* ── HEADER ── */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.35em] text-muted-foreground mb-2 flex items-center gap-2">
                            <span className="h-px w-5 bg-current inline-block" /> Content Management
                        </p>
                        <h1 className="text-5xl md:text-6xl font-black uppercase italic tracking-tighter leading-none">
                            The<br />
                            <span className="text-muted-foreground/30">Journal</span>
                        </h1>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => fetchData(true)}
                            disabled={fetching}
                            className="h-12 w-12 flex items-center justify-center bg-card border border-border rounded-xl hover:bg-muted transition-all disabled:opacity-40"
                        >
                            <RotateCcw size={16} className={cn(fetching && "animate-spin")} />
                        </button>
                        <button
                            onClick={() => { resetForm(); setIsEditorOpen(true); }}
                            className="h-12 px-6 bg-foreground text-background rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:opacity-90 transition-all shadow-lg"
                        >
                            <Plus size={16} /> New Entry
                        </button>
                    </div>
                </div>

                {/* ── STATS ── */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: "Total Posts",   value: blogs.length,                            icon: BookOpen,  color: "text-foreground",  bg: "bg-muted" },
                        { label: "Tattoo Culture", value: categoryCounts["Tattoo Culture"] || 0, icon: Sparkles,  color: "text-emerald-500", bg: "bg-emerald-500/10" },
                        { label: "Aftercare",      value: categoryCounts["Aftercare Tips"] || 0, icon: FileText,  color: "text-amber-500",   bg: "bg-amber-500/10" },
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

                {/* ── TABLE ── */}
                <div className="bg-card border border-border rounded-[2rem] overflow-hidden shadow-sm">
                    <div className="px-8 py-5 border-b border-border">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            {blogs.length} Posts
                        </p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[640px]">
                            <thead>
                                <tr className="text-[9px] font-black uppercase tracking-widest text-muted-foreground border-b border-border/50">
                                    <th className="px-8 py-4">Cover</th>
                                    <th className="px-8 py-4">Title</th>
                                    <th className="px-8 py-4">Category</th>
                                    <th className="px-8 py-4">Date</th>
                                    <th className="px-8 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {loading ? (
                                    <tr><td colSpan={5} className="py-20 text-center">
                                        <Loader2 className="animate-spin mx-auto size-8 text-muted-foreground/30" />
                                    </td></tr>
                                ) : blogs.length === 0 ? (
                                    <tr><td colSpan={5} className="py-20 text-center">
                                        <BookOpen className="mx-auto size-10 text-muted-foreground/20 mb-3" />
                                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">No journal entries yet</p>
                                    </td></tr>
                                ) : blogs.map((post) => (
                                    <tr key={post.id} className="group hover:bg-muted/30 transition-all">
                                        <td className="px-8 py-4">
                                            <div className="w-14 h-14 rounded-xl overflow-hidden border border-border bg-muted relative">
                                                <Image src={post.image || "/placeholder.jpg"} alt={post.title} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                                            </div>
                                        </td>
                                        <td className="px-8 py-4">
                                            <div>
                                                <p className="text-sm font-black uppercase italic tracking-tight leading-tight line-clamp-1">{post.title}</p>
                                                <p className="text-[9px] text-muted-foreground font-mono mt-0.5">/{post.slug}</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-4">
                                            <span className={cn(
                                                "inline-flex items-center px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                                                post.category === "Tattoo Culture" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                                                post.category === "Studio News"    ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                                                                                     "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                            )}>
                                                {post.category}
                                            </span>
                                        </td>
                                        <td className="px-8 py-4">
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <Calendar size={12} />
                                                <span className="font-bold">{formatDate(post.createdAt)}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => { setCurrentPost(post); setPreviewUrl(post.image); setFormErrors({}); setIsEditorOpen(true); }}
                                                    className="h-9 w-9 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground hover:bg-foreground hover:text-background hover:border-transparent transition-all"
                                                    title="Edit post"
                                                >
                                                    <Edit3 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => deletePost(post)}
                                                    className="h-9 w-9 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground hover:bg-destructive hover:text-white hover:border-transparent transition-all"
                                                    title="Delete post"
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

            {/* ── EDITOR MODAL ── */}
            <AnimatePresence>
                {isEditorOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                            onClick={() => setIsEditorOpen(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-card border border-border w-full max-w-4xl rounded-[2.5rem] shadow-2xl relative z-10 max-h-[90vh] overflow-y-auto"
                        >
                            {/* Modal Header */}
                            <div className="p-8 border-b border-border flex justify-between items-start">
                                <div>
                                    <h2 className="text-lg font-black uppercase italic tracking-tighter">
                                        {currentPost.id ? "Modify Entry" : "Create Node"}
                                    </h2>
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                                        {currentPost.id ? `Editing: ${currentPost.title}` : "Publish a new journal entry"}
                                    </p>
                                </div>
                                <button onClick={() => setIsEditorOpen(false)} className="p-2.5 hover:bg-muted rounded-full transition-all text-muted-foreground">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="p-8">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                                    {/* ── LEFT: Cover Image ── */}
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest ml-1">Cover Image</label>
                                        <label className={cn(
                                            "relative aspect-[4/3] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all group bg-muted/50",
                                            formErrors.image ? "border-destructive" : "border-border hover:border-foreground"
                                        )}>
                                            {previewUrl || currentPost.image ? (
                                                <Image src={previewUrl || currentPost.image} alt="Preview" fill className="object-cover" />
                                            ) : (
                                                <div className="text-center">
                                                    <UploadCloud className="size-8 text-muted-foreground mx-auto mb-2 group-hover:text-foreground transition-colors" />
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Click to upload</p>
                                                    <p className="text-[9px] text-muted-foreground mt-1">JPG, JPEG, PNG only</p>
                                                </div>
                                            )}
                                            <input type="file" className="hidden" onChange={handleImageChange} accept=".jpg,.jpeg,.png,image/jpeg,image/png" />
                                        </label>
                                        {formErrors.image && (
                                            <div className="flex items-center gap-1.5 text-destructive text-[10px] font-bold ml-1">
                                                <AlertCircle className="size-3" /> {formErrors.image}
                                            </div>
                                        )}
                                        <p className="text-[9px] text-muted-foreground text-center">Best size: 1200×800px (4:3)</p>
                                    </div>

                                    {/* ── RIGHT: Details ── */}
                                    <div className="space-y-4">
                                        {/* Title */}
                                        <FormField
                                            label="Title"
                                            error={formErrors.title}
                                            input={
                                                <input
                                                    type="text"
                                                    placeholder="Entry headline..."
                                                    className={cn(
                                                        "w-full bg-muted rounded-xl px-4 py-3.5 text-xs font-bold uppercase outline-none border-2 transition-all",
                                                        formErrors.title ? "border-destructive bg-destructive/5" : "border-transparent focus:border-foreground"
                                                    )}
                                                    value={currentPost.title}
                                                    onChange={onTitleChange}
                                                />
                                            }
                                        />

                                        <div className="grid grid-cols-2 gap-3">
                                            {/* Category */}
                                            <FormField
                                                label="Category"
                                                input={
                                                    <select
                                                        className="w-full bg-muted rounded-xl px-4 py-3.5 text-xs font-bold uppercase outline-none border-2 border-transparent focus:border-foreground transition-all"
                                                        value={currentPost.category}
                                                        onChange={e => setCurrentPost({ ...currentPost, category: e.target.value })}
                                                    >
                                                        <option value="Tattoo Culture">Culture</option>
                                                        <option value="Studio News">Studio</option>
                                                        <option value="Aftercare Tips">Aftercare</option>
                                                    </select>
                                                }
                                            />
                                            {/* Slug */}
                                            <FormField
                                                label="Slug (Auto)"
                                                input={
                                                    <input
                                                        type="text"
                                                        readOnly
                                                        className="w-full bg-muted/50 rounded-xl px-4 py-3.5 font-mono text-[10px] text-muted-foreground outline-none border-2 border-transparent cursor-default"
                                                        value={currentPost.slug}
                                                    />
                                                }
                                            />
                                        </div>

                                        {/* Content */}
                                        <FormField
                                            label="Content"
                                            error={formErrors.content}
                                            input={
                                                <textarea
                                                    rows={6}
                                                    placeholder="Tell the story behind this entry..."
                                                    className={cn(
                                                        "w-full bg-muted rounded-xl px-4 py-3.5 text-xs font-medium outline-none border-2 transition-all resize-none leading-relaxed",
                                                        formErrors.content ? "border-destructive bg-destructive/5" : "border-transparent focus:border-foreground"
                                                    )}
                                                    value={currentPost.content}
                                                    onChange={e => {
                                                        setCurrentPost({ ...currentPost, content: e.target.value });
                                                        if (formErrors.content) setFormErrors(prev => ({ ...prev, content: undefined }));
                                                    }}
                                                />
                                            }
                                        />

                                        <button
                                            onClick={handleSave}
                                            disabled={actionLoading || Object.values(formErrors).some(Boolean)}
                                            className="w-full h-14 bg-foreground text-background rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                                        >
                                            {actionLoading ? <Loader2 className="animate-spin size-4" /> : <><Save size={14} /> Commit Record</>}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── REUSABLE FORM FIELD ──────────────────────────────────────────────────────
function FormField({ label, error, input }: { label: React.ReactNode; error?: string; input: React.ReactNode }) {
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