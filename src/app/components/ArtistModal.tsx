"use client";

import { useState, useEffect } from "react";
import { X, Trash2, Loader2, Plus, CheckCircle2, ImageIcon, Camera, User, Briefcase, Mail, Phone, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ArtistModalProps {
    isOpen: boolean;
    onClose: () => void;
    artistData: any;
    onSave: (data: any) => void;
    loading: boolean;
}

declare global {
    interface Window { cloudinary: any; }
}

// ─── ALLOWED IMAGE FORMATS ────────────────────────────────────────────────────
const ALLOWED_FORMATS = ["png", "jpeg", "jpg"];

export default function ArtistModal({ isOpen, onClose, artistData, onSave, loading }: ArtistModalProps) {
    const [localData, setLocalData] = useState<any>(null);
    const [selectedIndexes, setSelectedIndexes] = useState<number[]>([]);
    const [newCategory, setNewCategory] = useState("");
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (isOpen && artistData) {
            setLocalData({
                id: artistData.id || artistData._id || null,
                fullName: artistData.fullName || "",
                position: artistData.position || "",
                email: artistData.email || "",
                contactNumber: artistData.contactNumber || "",
                profileImage: artistData.profileImage || "",
                status: artistData.status || "active",
                socials: artistData.socials || { instagram: "", facebook: "" },
                artworks: artistData.artworks || []
            });
            setSelectedIndexes([]);
        }
    }, [artistData, isOpen]);

    if (!isOpen || !localData) return null;

    // ─── CLOUDINARY UPLOAD — format restricted ────────────────────────────────
    const uploadToCloudinary = (type: "profile" | "artwork") => {
        if (typeof window === "undefined" || !window.cloudinary) {
            toast.error("Cloudinary is still loading. Please wait a second.");
            return;
        }

        setUploading(true);
        const widget = window.cloudinary.createUploadWidget(
            {
                cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
                uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
                multiple: type === "artwork",
                maxFiles: type === "profile" ? 1 : 10,
                folder: "artists_crew",
                clientAllowedFormats: ALLOWED_FORMATS, // ✅ png, jpeg, jpg ONLY
                maxFileSize: 5000000, // 5MB max
            },
            (error: any, result: any) => {
                if (!error && result && result.event === "success") {
                    const secureUrl = result.info.secure_url;
                    const format = result.info.format?.toLowerCase();

                    // ✅ Double-check format even after Cloudinary widget (safety net)
                    if (!ALLOWED_FORMATS.includes(format)) {
                        toast.error(`Invalid format: "${format}". Only PNG, JPG, and JPEG are allowed.`);
                        setUploading(false);
                        return;
                    }

                    if (type === "profile") {
                        setLocalData((prev: any) => ({ ...prev, profileImage: secureUrl }));
                        toast.success("Profile photo updated!");
                    } else {
                        setLocalData((prev: any) => ({
                            ...prev,
                            artworks: [...(prev.artworks || []), { url: secureUrl, category: "Uncategorized" }]
                        }));
                        toast.success("Artwork added to portfolio!");
                    }
                    setUploading(false);
                } else if (error) {
                    setUploading(false);
                }
                if (result?.event === "close") {
                    setUploading(false);
                }
            }
        );
        widget.open();
    };

    // ─── FORM VALIDATION ─────────────────────────────────────────────────────
    const handleSaveClick = () => {
        if (!localData.fullName?.trim()) {
            toast.error("Artist name is required.");
            return;
        }
        if (localData.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(localData.email)) {
            toast.error("Invalid email format.");
            return;
        }
        if (localData.contactNumber?.trim() && !/^(09|\+639)\d{9}$/.test(localData.contactNumber.replace(/\s/g, ''))) {
            toast.error("Must be a valid PH contact number (e.g. 09XXXXXXXXX).");
            return;
        }
        onSave(localData);
    };

    const toggleSelect = (idx: number) => {
        setSelectedIndexes(prev =>
            prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
        );
    };

    const applyCategory = () => {
        if (!newCategory.trim()) return;
        const updated = localData.artworks.map((art: any, i: number) =>
            selectedIndexes.includes(i) ? { ...art, category: newCategory } : art
        );
        setLocalData({ ...localData, artworks: updated });
        setSelectedIndexes([]);
        setNewCategory("");
    };

    const deleteSelected = () => {
        const filtered = localData.artworks.filter((_: any, i: number) => !selectedIndexes.includes(i));
        setLocalData({ ...localData, artworks: filtered });
        setSelectedIndexes([]);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-card border border-border w-full max-w-7xl h-full lg:h-[90vh] rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col lg:flex-row animate-in zoom-in-95 duration-200">

                <button onClick={onClose} className="absolute top-6 right-6 z-50 p-2.5 hover:bg-muted rounded-full transition-all text-muted-foreground">
                    <X size={18} />
                </button>

                {/* ── LEFT: PROFILE INFO ── */}
                <div className="w-full lg:w-[360px] bg-muted/30 border-r border-border p-8 overflow-y-auto shrink-0">

                    {/* Profile photo */}
                    <div className="text-center space-y-4 mb-8">
                        <div
                            onClick={() => uploadToCloudinary("profile")}
                            className="relative cursor-pointer group inline-block"
                        >
                            <div className="w-28 h-28 mx-auto rounded-2xl overflow-hidden flex items-center justify-center bg-muted border-2 border-border shadow-lg transition-transform group-hover:scale-105">
                                {localData.profileImage ? (
                                    <img src={localData.profileImage} className="w-full h-full object-cover" alt="Profile" />
                                ) : (
                                    <Camera className="text-muted-foreground/30" size={28} />
                                )}
                            </div>
                            {uploading && (
                                <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center">
                                    <Loader2 className="text-white animate-spin" />
                                </div>
                            )}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity">
                                <Camera className="text-white" size={20} />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase italic tracking-tighter">
                                {localData.fullName || "New Artist"}
                            </h2>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                                PNG, JPG, JPEG only
                            </p>
                        </div>
                    </div>

                    {/* Fields */}
                    <div className="space-y-3">
                        {[
                            { icon: User, placeholder: "Full Name *", field: "fullName", type: "text" },
                            { icon: Briefcase, placeholder: "Position", field: "position", type: "text" },
                            { icon: Mail, placeholder: "Email", field: "email", type: "email" },
                            { icon: Phone, placeholder: "09XXXXXXXXX", field: "contactNumber", type: "tel" },
                            { icon: Instagram, placeholder: "Instagram Link", field: "instagram", type: "text", isSocial: true },
                        ].map(({ icon: Icon, placeholder, field, type, isSocial }) => (
                            <div key={field} className="relative">
                                <Icon className="absolute left-4 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/40" />
                                <input
                                    type={type}
                                    placeholder={placeholder}
                                    className="w-full pl-10 pr-4 py-3.5 bg-card border border-border rounded-xl text-xs font-bold outline-none focus:border-foreground transition-all"
                                    value={isSocial ? localData.socials?.instagram : localData[field]}
                                    onChange={e => {
                                        if (isSocial) {
                                            setLocalData({ ...localData, socials: { ...localData.socials, instagram: e.target.value } });
                                        } else {
                                            // Auto-strip non-digits for contact
                                            const val = field === "contactNumber"
                                                ? e.target.value.replace(/\D/g, '').slice(0, 11)
                                                : e.target.value;
                                            setLocalData({ ...localData, [field]: val });
                                        }
                                    }}
                                />
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={handleSaveClick}
                        disabled={loading || uploading}
                        className="w-full h-14 bg-foreground text-background rounded-2xl text-[10px] font-black uppercase tracking-widest mt-8 hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin size-4" /> : "Sync Changes"}
                    </button>
                </div>

                {/* ── RIGHT: PORTFOLIO GALLERY ── */}
                <div className="flex-1 p-8 overflow-y-auto bg-card relative">
                    <div className="flex justify-between items-center mb-6 sticky top-0 bg-card/95 backdrop-blur-md py-3 z-10">
                        <h3 className="text-lg font-black uppercase italic tracking-tighter flex items-center gap-2">
                            <ImageIcon className="text-muted-foreground/40 size-5" /> Portfolio
                        </h3>
                        <button
                            onClick={() => uploadToCloudinary("artwork")}
                            disabled={uploading}
                            className="h-10 px-5 bg-foreground text-background rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:opacity-90 transition-all disabled:opacity-40"
                        >
                            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                            Add Work
                        </button>
                    </div>

                    {/* Format notice */}
                    <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-4">
                        Accepted formats: PNG · JPG · JPEG only
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-32">
                        {localData.artworks && localData.artworks.length > 0 ? (
                            localData.artworks.map((art: any, idx: number) => (
                                <div
                                    key={idx}
                                    onClick={() => toggleSelect(idx)}
                                    className={`relative aspect-square rounded-2xl overflow-hidden cursor-pointer transition-all border-4 ${selectedIndexes.includes(idx) ? 'border-foreground scale-95 shadow-2xl' : 'border-transparent shadow-sm hover:shadow-xl'}`}
                                >
                                    <img src={art.url} className="w-full h-full object-cover" alt={`Work ${idx}`} />
                                    <div className="absolute bottom-3 left-3">
                                        <span className="bg-black/70 backdrop-blur-md text-white text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest">
                                            {art.category}
                                        </span>
                                    </div>
                                    {selectedIndexes.includes(idx) && (
                                        <div className="absolute top-3 right-3 bg-white rounded-full p-0.5 shadow-lg">
                                            <CheckCircle2 className="text-black" size={18} fill="currentColor" stroke="white" />
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full py-20 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-muted-foreground/30 gap-3">
                                <ImageIcon size={40} />
                                <p className="text-[10px] font-black uppercase tracking-widest">No works uploaded yet</p>
                            </div>
                        )}
                    </div>

                    {/* Floating Toolbar */}
                    {selectedIndexes.length > 0 && (
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-foreground text-background p-5 rounded-[2rem] flex items-center gap-5 shadow-2xl animate-in slide-in-from-bottom-8 z-50 border border-border/10">
                            <div className="pl-3 pr-5 border-r border-background/20">
                                <p className="text-[9px] font-black uppercase text-background/50">Selected</p>
                                <p className="text-lg font-black">{selectedIndexes.length}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    placeholder="Set Tag..."
                                    className="bg-background/10 rounded-xl px-4 py-2.5 text-xs font-bold outline-none w-40 text-background placeholder:text-background/40 focus:ring-1 ring-background/20"
                                    value={newCategory}
                                    onChange={e => setNewCategory(e.target.value)}
                                />
                                <button
                                    onClick={applyCategory}
                                    className="bg-background text-foreground text-[10px] font-black h-10 rounded-xl px-5 hover:opacity-90 transition-all"
                                >
                                    Apply
                                </button>
                            </div>
                            <button
                                onClick={deleteSelected}
                                className="p-2.5 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}