"use client";

import { useState, useEffect, useMemo } from "react";
import Script from "next/script"; // IMPORTANTE: Para sa Cloudinary Widget
import { Button } from "@/components/ui/button"; 
import ArtistModal from "../../components/ArtistModal";
import { Plus, Loader2, ShieldCheck, UserPlus, Search, Trash2, Mail, Phone, Instagram, Eye, EyeOff, Circle } from "lucide-react";
import { Toaster, toast } from "sonner";

export default function ArtistProfile() {
    const [artists, setArtists] = useState<any[]>([]);
    const [fetching, setFetching] = useState(true);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    
    // TAB FILTER: Para ma-sort mo kung sino lang ang gusto mong makita sa Dashboard
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
            // Naka-array dapat ang data galing sa API route mo
            if (Array.isArray(data)) setArtists(data);
        } catch (err) {
            toast.error("Failed to load team data.");
        } finally { setFetching(false); }
    };

    const handleSave = async (payload: any) => {
        setLoading(true);
        try {
            // Check kung 'id' (Firebase) o '_id' (Old Mongo data) ang meron
            const artistId = payload.id || payload._id;
            const isUpdate = !!artistId;

            const finalPayload = { 
                ...payload, 
                status: payload.status || "active" 
            };

            const res = await fetch("/api/artists", {
                // Pinapasa natin yung 'id' sa PUT body para sa doc(db, "artists", id)
                method: isUpdate ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(isUpdate ? { id: artistId, ...finalPayload } : finalPayload),
            });

            if (res.ok) {
                toast.success(isUpdate ? "Artist Data Synced!" : "New Artist Registered!");
                setModal({ isOpen: false, data: null });
                fetchArtists();
            }
        } catch (err) {
            toast.error("Sync failed. Check connection.");
        } finally { setLoading(false); }
    };

    // --- QUICK STATUS TOGGLE ---
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
                toast.info(`Artist visibility set to ${newStatus}`);
                fetchArtists();
            }
        } catch (err) {
            toast.error("Failed to update status.");
        }
    };

    const deleteArtist = async (id: string) => {
        if (!confirm("Are you sure? This will delete the entire profile and portfolio.")) return;
        try {
            const res = await fetch("/api/artists", { 
                method: "DELETE", 
                body: JSON.stringify({ id }),
                headers: { "Content-Type": "application/json" }
            });
            if (res.ok) {
                toast.error("Artist profile deleted.");
                fetchArtists();
            }
        } catch (err) {
            toast.error("Delete failed.");
        }
    };

    // --- FILTER LOGIC ---
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
        <div className="p-6 md:p-12 max-w-7xl mx-auto space-y-10 bg-zinc-50 min-h-screen text-black font-sans">
            {/* Heto yung kailangan para gumana ang upload feature ng modal */}
            <Script src="https://upload-widget.cloudinary.com/global/all.js" strategy="afterInteractive" />
            
            <Toaster position="top-right" richColors />
            
            <header className="flex flex-col md:flex-row justify-between items-center bg-zinc-900 p-10 rounded-[2.5rem] text-white shadow-2xl gap-6">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-white rounded-3xl -rotate-6 shadow-xl">
                        <ShieldCheck size={32} className="text-black" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none">The Crew</h1>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.4em] mt-1">Management Portal</p>
                    </div>
                </div>
                <Button 
                    onClick={() => setModal({ isOpen: true, data: { fullName: "", position: "", email: "", status: "active", artworks: [] } })} 
                    className="bg-white text-black hover:bg-zinc-200 rounded-2xl h-14 px-10 font-black uppercase text-xs tracking-widest shadow-xl transition-all"
                >
                    <UserPlus size={20} className="mr-3"/> Add New Artist
                </Button>
            </header>

            {/* CONTROL BAR: SEARCH & TABS */}
            <div className="flex flex-col md:flex-row gap-6 justify-between items-center">
                <div className="flex bg-zinc-200/50 p-1.5 rounded-2xl w-full md:w-auto">
                    {(["all", "active", "inactive"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 md:flex-none px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? "bg-black text-white shadow-lg scale-105" : "text-zinc-400 hover:text-black"}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="relative group w-full md:w-96">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black transition-colors" />
                    <input type="text" placeholder="Search team by name or role..." className="w-full pl-16 pr-8 py-4 bg-white rounded-3xl shadow-sm outline-none font-bold focus:ring-2 ring-black transition-all text-black" onChange={e => setSearch(e.target.value)} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {fetching ? (
                    <div className="col-span-full py-40 flex flex-col items-center gap-4">
                        <Loader2 className="animate-spin text-zinc-200" size={48}/>
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-300">Loading Crew Members...</p>
                    </div>
                ) : filteredArtists.map((artist) => (
                    <div 
                        key={artist.id || artist._id} 
                        onClick={() => setModal({ isOpen: true, data: artist })} 
                        className={`group bg-white p-8 rounded-[2.5rem] shadow-sm border border-zinc-100 cursor-pointer hover:shadow-2xl transition-all relative overflow-hidden ${artist.status === 'inactive' ? 'opacity-60 grayscale-[0.8] hover:grayscale-0 hover:opacity-100' : ''}`}
                    >
                        {/* --- STATUS BADGE --- */}
                        <div className={`absolute top-8 left-8 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 border ${artist.status === 'inactive' ? 'bg-zinc-50 text-zinc-400 border-zinc-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                            <Circle size={8} fill="currentColor" className={artist.status === 'active' ? 'animate-pulse' : ''} />
                            {artist.status}
                        </div>

                        <div className="flex flex-col items-center">
                            <div className={`w-28 h-28 rounded-[2rem] overflow-hidden mb-6 border-4 shadow-inner transition-transform group-hover:rotate-3 ${artist.status === 'inactive' ? 'border-zinc-200' : 'border-white'}`}>
                                {artist.profileImage ? (
                                    <img src={artist.profileImage} className="w-full h-full object-cover" alt={artist.fullName} />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-white font-black text-2xl uppercase italic">
                                        {artist.fullName ? artist.fullName[0] : "?"}
                                    </div>
                                )}
                            </div>
                            <h3 className="text-2xl font-black uppercase italic tracking-tighter text-center leading-none">{artist.fullName}</h3>
                            <p className="text-[10px] font-bold text-zinc-400 text-center uppercase tracking-[0.2em] mt-2 mb-6">{artist.position}</p>
                            
                            <div className="w-full pt-6 border-t border-zinc-50 flex justify-center gap-6 text-zinc-300 group-hover:text-black transition-colors">
                                {artist.email && <Mail size={16} />}
                                {artist.contactNumber && <Phone size={16} />}
                                {artist.socials?.instagram && <Instagram size={16} />}
                            </div>
                        </div>

                        {/* --- ACTION BUTTONS --- */}
                        <div className="absolute top-6 right-6 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={(e) => toggleStatus(e, artist)} 
                                title={artist.status === 'active' ? 'Set Inactive' : 'Set Active'}
                                className={`p-2.5 rounded-xl transition-all ${artist.status === 'active' ? 'bg-zinc-100 text-zinc-500 hover:bg-black hover:text-white' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg scale-110'}`}
                            >
                                {artist.status === 'active' ? <EyeOff size={18}/> : <Eye size={18}/>}
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); deleteArtist(artist.id || artist._id); }} 
                                className="p-2.5 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                            >
                                <Trash2 size={18}/>
                            </button>
                        </div>
                    </div>
                ))}

                {!fetching && filteredArtists.length === 0 && (
                    <div className="col-span-full py-20 text-center border-2 border-dashed border-zinc-200 rounded-[2.5rem]">
                        <p className="text-zinc-400 font-black uppercase tracking-widest text-xs">No artists found in this category.</p>
                    </div>
                )}
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