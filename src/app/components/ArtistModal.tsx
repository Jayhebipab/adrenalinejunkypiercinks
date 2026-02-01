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

// Para hindi mag-error ang TypeScript sa window.cloudinary
declare global {
    interface Window {
        cloudinary: any;
    }
}

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

    // --- CLOUDINARY UPLOAD HANDLER WITH SAFETY CHECK ---
    const uploadToCloudinary = (type: "profile" | "artwork") => {
        // SAFETY CHECK: Siguraduhing load na ang script sa window
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
                clientAllowedFormats: ["png", "jpeg", "jpg", "webp"], // Optional: control formats
            },
            (error: any, result: any) => {
                if (!error && result && result.event === "success") {
                    const secureUrl = result.info.secure_url;
                    
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
                    // toast.error("Upload failed or cancelled.");
                }
                
                // Close event handling
                if (result.event === "close") {
                    setUploading(false);
                }
            }
        );
        widget.open();
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
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 selection:bg-orange-500/30">
            <div className="bg-white w-full max-w-7xl h-full lg:h-[90vh] rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col lg:flex-row animate-in zoom-in duration-300">
                
                <button onClick={onClose} className="absolute top-6 right-6 z-50 p-2 bg-zinc-100 rounded-full hover:bg-zinc-200 transition-all">
                    <X size={20}/>
                </button>

                {/* LEFT SIDE: PROFILE INFO */}
                <div className="w-full lg:w-[400px] bg-zinc-50 p-8 border-r border-zinc-100 overflow-y-auto shrink-0">
                    <div className="text-center space-y-4 mb-8">
                        <div 
                            onClick={() => uploadToCloudinary("profile")}
                            className="relative cursor-pointer group inline-block"
                        >
                            <div className="w-32 h-32 mx-auto rounded-4xl bg-white border-4 border-white shadow-xl overflow-hidden flex items-center justify-center transition-transform group-hover:scale-105">
                                {localData.profileImage ? (
                                    <img src={localData.profileImage} className="w-full h-full object-cover" alt="Profile" />
                                ) : (
                                    <Camera className="text-zinc-200" size={32} />
                                )}
                            </div>
                            {uploading && (
                                <div className="absolute inset-0 bg-black/60 rounded-4xl flex items-center justify-center">
                                    <Loader2 className="text-white animate-spin" />
                                </div>
                            )}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 rounded-4xl transition-opacity">
                                <Camera className="text-white" size={24} />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-2xl font-black uppercase italic tracking-tighter">{localData.fullName || "New Artist"}</h2>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Artist Profile Editor</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
                            <input placeholder="Full Name" className="w-full pl-10 pr-4 py-4 bg-white rounded-2xl text-xs font-bold border-none shadow-sm focus:ring-2 ring-black outline-none text-black" value={localData.fullName} onChange={e => setLocalData({...localData, fullName: e.target.value})} />
                        </div>
                        <div className="relative">
                            <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
                            <input placeholder="Position" className="w-full pl-10 pr-4 py-4 bg-white rounded-2xl text-xs font-bold border-none shadow-sm focus:ring-2 ring-black outline-none text-black" value={localData.position} onChange={e => setLocalData({...localData, position: e.target.value})} />
                        </div>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
                            <input placeholder="Email" className="w-full pl-10 pr-4 py-4 bg-white rounded-2xl text-xs font-bold border-none shadow-sm focus:ring-2 ring-black outline-none text-black" value={localData.email} onChange={e => setLocalData({...localData, email: e.target.value})} />
                        </div>
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
                            <input placeholder="Contact" className="w-full pl-10 pr-4 py-4 bg-white rounded-2xl text-xs font-bold border-none shadow-sm focus:ring-2 ring-black outline-none text-black" value={localData.contactNumber} onChange={e => setLocalData({...localData, contactNumber: e.target.value})} />
                        </div>
                        <div className="relative">
                            <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
                            <input placeholder="Instagram Link" className="w-full pl-10 pr-4 py-4 bg-white rounded-2xl text-xs font-bold border-none shadow-sm focus:ring-2 ring-black outline-none text-black" value={localData.socials.instagram} onChange={e => setLocalData({...localData, socials: {...localData.socials, instagram: e.target.value}})} />
                        </div>
                    </div>

                    <Button 
                        onClick={() => onSave(localData)} 
                        disabled={loading || uploading} 
                        className="w-full h-16 bg-black text-white rounded-[2rem] font-black uppercase tracking-widest text-[11px] mt-8 shadow-xl hover:bg-zinc-800 transition-all disabled:bg-zinc-300"
                    >
                        {loading ? <Loader2 className="animate-spin text-white" /> : "Sync Changes"}
                    </Button>
                </div>

                {/* RIGHT SIDE: GALLERY */}
                <div className="flex-1 p-10 overflow-y-auto bg-white relative">
                    <div className="flex justify-between items-center mb-8 sticky top-0 bg-white/95 backdrop-blur-md py-4 z-10">
                        <h3 className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-2 text-black">
                            <ImageIcon className="text-zinc-300" /> Portfolio
                        </h3>
                        <Button 
                            onClick={() => uploadToCloudinary("artwork")}
                            disabled={uploading}
                            className="bg-black text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 hover:bg-zinc-800 shadow-lg"
                        >
                            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} 
                            Add Work
                        </Button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 pb-32">
                        {localData.artworks && localData.artworks.length > 0 ? (
                            localData.artworks.map((art: any, idx: number) => (
                                <div 
                                    key={idx} 
                                    onClick={() => toggleSelect(idx)} 
                                    className={`relative aspect-square rounded-[2rem] overflow-hidden cursor-pointer transition-all border-4 ${selectedIndexes.includes(idx) ? 'border-black scale-95 shadow-2xl' : 'border-transparent shadow-sm hover:shadow-xl'}`}
                                >
                                    <img src={art.url} className="w-full h-full object-cover" alt={`Work ${idx}`} />
                                    <div className="absolute bottom-4 left-4">
                                        <span className="bg-black/70 backdrop-blur-md text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                                            {art.category}
                                        </span>
                                    </div>
                                    {selectedIndexes.includes(idx) && (
                                        <div className="absolute top-4 right-4 bg-white rounded-full p-1 shadow-lg">
                                            <CheckCircle2 className="text-black" size={20} fill="currentColor" stroke="white"/>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full py-20 border-4 border-dashed border-zinc-100 rounded-4xl flex flex-col items-center justify-center text-zinc-300 gap-4">
                                <ImageIcon size={48} />
                                <p className="text-xs font-black uppercase tracking-widest">No works uploaded yet</p>
                            </div>
                        )}
                    </div>

                    {/* Floating Toolbar */}
                    {selectedIndexes.length > 0 && (
                        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-black text-white p-5 rounded-[2.5rem] flex items-center gap-6 shadow-2xl animate-in slide-in-from-bottom-10 z-50 border border-white/10">
                            <div className="pl-4 pr-6 border-r border-white/20">
                                <p className="text-[10px] font-black uppercase text-zinc-400">Selected</p>
                                <p className="text-lg font-black">{selectedIndexes.length}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <input 
                                    placeholder="Set Tag..." 
                                    className="bg-zinc-800 rounded-xl px-4 py-3 text-xs font-bold outline-none w-48 text-white focus:ring-1 ring-white/20" 
                                    value={newCategory} 
                                    onChange={e => setNewCategory(e.target.value)} 
                                />
                                <Button onClick={applyCategory} className="bg-white text-black text-[10px] font-black h-11 rounded-xl px-6 hover:bg-zinc-200">Apply</Button>
                            </div>
                            <button onClick={deleteSelected} className="p-3 bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all">
                                <Trash2 size={20}/>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}