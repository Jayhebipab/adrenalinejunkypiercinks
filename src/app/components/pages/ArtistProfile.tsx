"use client";

import { useState, useEffect, useMemo } from "react";
import Script from "next/script";
import { Button } from "@/components/ui/button"; 
import ArtistModal from "../../components/ArtistModal";
import { 
    Plus, Loader2, ShieldCheck, UserPlus, 
    Search, Trash2, Mail, Phone, Instagram, 
    Eye, EyeOff, Circle, User, Briefcase
} from "lucide-react";
import { Toaster, toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ArtistProfile() {
    const [artists, setArtists] = useState<any[]>([]);
    const [fetching, setFetching] = useState(true);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<"all" | "active" | "inactive">("all");
    
    const [modal, setModal] = useState<{ isOpen: boolean; data: any | null }>({ 
        isOpen: false, 
        data: null 
    });

    useEffect(() => { fetchArtists(); }, []);

    const fetchArtists = async () => {
        setFetching(true);
        try {
            const res = await fetch("/api/artists");
            const data = await res.json();
            if (Array.isArray(data)) setArtists(data);
        } catch (err) {
            toast.error("Failed to load team data.");
        } finally { setFetching(false); }
    };

    const handleSave = async (payload: any) => {
        setLoading(true);
        try {
            const artistId = payload.id || payload._id;
            const isUpdate = !!artistId;
            const finalPayload = { ...payload, status: payload.status || "active" };

            const res = await fetch("/api/artists", {
                method: isUpdate ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(isUpdate ? { id: artistId, ...finalPayload } : finalPayload),
            });

            if (res.ok) {
                toast.success(isUpdate ? "Artist Sync successful" : "New Artist added");
                setModal({ isOpen: false, data: null });
                fetchArtists();
            }
        } catch (err) {
            toast.error("Operation failed");
        } finally { setLoading(false); }
    };

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
                toast.info(`Artist visibility: ${newStatus.toUpperCase()}`);
                fetchArtists();
            }
        } catch (err) {
            toast.error("Status update failed");
        }
    };

    const deleteArtist = async (id: string) => {
        if (!confirm("Delete this profile?")) return;
        try {
            const res = await fetch("/api/artists", { 
                method: "DELETE", 
                body: JSON.stringify({ id }),
                headers: { "Content-Type": "application/json" }
            });
            if (res.ok) {
                toast.error("Profile deleted");
                fetchArtists();
            }
        } catch (err) {
            toast.error("Delete failed");
        }
    };

    const filteredArtists = useMemo(() => {
        return artists.filter(a => {
            const fullName = a.fullName || "";
            const position = a.position || "";
            const matchesSearch = fullName.toLowerCase().includes(search.toLowerCase()) || 
                                 position.toLowerCase().includes(search.toLowerCase());
            const matchesTab = activeTab === "all" ? true : a.status === activeTab;
            return matchesSearch && matchesTab;
        });
    }, [artists, search, activeTab]);

    return (
        <div className="min-h-screen p-4 md:p-8 text-slate-900 dark:text-white">
            <Script src="https://upload-widget.cloudinary.com/global/all.js" strategy="afterInteractive" />
            <Toaster position="top-right" richColors />
            
            <div className="max-w-4xl mx-auto">
                {/* HEADER - Styled like your Promo/Shop List */}
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-4xl font-black uppercase italic tracking-tighter">The Crew</h1>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">Artist & Personnel Management</p>
                    </div>
                    <button 
                        onClick={() => setModal({ isOpen: true, data: { fullName: "", position: "", email: "", status: "active", artworks: [] } })}
                        className="bg-black dark:bg-white dark:text-black text-white px-8 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest flex items-center gap-3 hover:opacity-90 transition-all shadow-xl shadow-black/10"
                    >
                        <Plus size={16} /> New Artist
                    </button>
                </div>

                {/* FILTERS SECTION */}
                <div className="space-y-4 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="text"
                                placeholder="SEARCH BY NAME OR ROLE..."
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-12 pr-5 py-4 bg-slate-50 dark:bg-zinc-900 border border-transparent dark:border-zinc-800 rounded-2xl text-[11px] font-bold uppercase tracking-widest outline-none focus:bg-white dark:focus:bg-zinc-800 focus:border-black dark:focus:border-white transition-all"
                            />
                        </div>
                        <div className="flex bg-slate-50 dark:bg-zinc-900 p-1.5 rounded-2xl gap-1 border border-transparent dark:border-zinc-800">
                            {(["all", "active", "inactive"] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={cn(
                                        "flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                                        activeTab === tab 
                                            ? "bg-black text-white dark:bg-white dark:text-black shadow-lg" 
                                            : "text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300"
                                    )}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* LIST SECTION - Styled like your List items */}
                <div className="space-y-3">
                    {fetching ? (
                        <div className="text-center py-20"><Loader2 className="animate-spin mx-auto text-slate-200" size={32} /></div>
                    ) : filteredArtists.length === 0 ? (
                        <div className="text-center py-20 bg-slate-50 dark:bg-zinc-900 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-zinc-800">
                            <p className="text-[11px] font-black uppercase text-slate-400 tracking-widest">No artists found</p>
                        </div>
                    ) : filteredArtists.map((artist) => (
                        <div 
                            key={artist.id || artist._id}
                            onClick={() => setModal({ isOpen: true, data: artist })}
                            className={cn(
                                "bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-slate-100 dark:border-zinc-800 flex items-center gap-6 hover:shadow-2xl hover:shadow-slate-200/50 dark:hover:shadow-black/50 transition-all group cursor-pointer relative overflow-hidden",
                                artist.status === 'inactive' && "opacity-60 grayscale-[0.5]"
                            )}
                        >
                            {/* Profile Visual */}
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center border bg-slate-50 border-slate-200 dark:bg-zinc-800 dark:border-zinc-700 overflow-hidden shrink-0">
                                {artist.profileImage ? (
                                    <img src={artist.profileImage} className="w-full h-full object-cover" alt="" />
                                ) : (
                                    <User size={22} className="text-slate-400" />
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-black uppercase tracking-tight truncate flex items-center gap-2">
                                    {artist.fullName}
                                    {artist.status === 'active' && <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
                                </h3>
                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{artist.position}</p>
                            </div>

                            {/* Actions - Visible on hover to keep it clean */}
                            <div className="flex items-center gap-2 px-4 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                <button 
                                    onClick={(e) => toggleStatus(e, artist)}
                                    className="p-3 text-slate-400 hover:text-black dark:hover:text-white transition-all"
                                >
                                    {artist.status === 'active' ? <EyeOff size={18}/> : <Eye size={18}/>}
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); deleteArtist(artist.id || artist._id); }}
                                    className="p-3 text-slate-300 hover:text-red-500 transition-all"
                                >
                                    <Trash2 size={18}/>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <ArtistModal 
                isOpen={modal.isOpen} 
                artistData={modal.data} 
                onClose={() => setModal({ isOpen: false, data: null })} 
                onSave={handleSave} 
                loading={loading} 
            />
        </div>
    );
}