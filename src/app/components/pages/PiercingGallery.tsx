"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Plus, Trash2, Loader2, UploadCloud,
    X, Maximize2, Sparkles, Search,
    Zap, Syringe, User, Edit3, Save,
    LayoutGrid, List
} from "lucide-react"
import { Toaster, toast } from "sonner"
import { cn } from "@/lib/utils"

interface GalleryRow {
    id: number;
    placement: string;
    files: File[];
    previews: string[];
    artistId: string;
}

export default function PiercingGallery() {
    // --- STATES (No changes in logic) ---
    const [galleryItems, setGalleryItems] = useState<any[]>([]);
    const [artists, setArtists] = useState<any[]>([]);
    const [fetching, setFetching] = useState(true);
    const [search, setSearch] = useState("");
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [editingItem, setEditingItem] = useState<any | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editLoading, setEditLoading] = useState(false);
    const [rows, setRows] = useState<GalleryRow[]>([{
        id: Date.now(),
        placement: "",
        files: [],
        previews: [],
        artistId: ""
    }]);
    const [selectedImg, setSelectedImg] = useState<string | null>(null);

    const API_PATH = "/api/gallery"; 

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
                setGalleryItems(galleryData.filter(i => i.category === "Piercing"));
            }
            if (Array.isArray(artistsData)) {
                setArtists(artistsData.filter((a) => a.status === "active").map(a => ({
                    ...a,
                    _id: a._id || a.id
                })));
            }
        } catch (err) {
            toast.error("Failed to fetch data.");
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const uploadToCloudinary = async (file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "adrenalinejunkypiercinks"); 
        const res = await fetch(`https://api.cloudinary.com/v1_1/diwrwmjgw/image/upload`, {
            method: "POST",
            body: formData,
        });
        const data = await res.json();
        return data.secure_url;
    };

    const addRow = () => setRows([...rows, { id: Date.now(), placement: "", files: [], previews: [], artistId: "" }]);
    const removeRow = (id: number) => setRows(rows.filter(row => row.id !== id));

    const handleImageChange = (rowId: number, files: FileList | null) => {
        if (!files) return;
        const newFiles = Array.from(files);
        const newPreviews = newFiles.map(file => URL.createObjectURL(file));

        setRows(prev => prev.map(row => 
            row.id === rowId 
            ? { ...row, files: [...row.files, ...newFiles], previews: [...row.previews, ...newPreviews] } 
            : row
        ));
    };

    const saveAll = async () => {
        const isValid = rows.every(r => r.placement && r.artistId && r.files.length > 0);
        if (!isValid) return toast.warning("Paki-fill up lahat ng fields.");

        setUploading(true);
        try {
            const allItems = [];
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
            if (res.ok) {
                toast.success("Piercings added to portfolio!");
                setRows([{ id: Date.now(), placement: "", files: [], previews: [], artistId: "" }]);
                setIsUploadOpen(false);
                fetchData();
            }
        } catch (err) {
            toast.error("Upload failed.");
        } finally { setUploading(false); }
    };

    const handleUpdate = async () => {
        if (!editingItem.artistId || !editingItem.placement) return toast.error("Fill up all fields.");
        setEditLoading(true);
        try {
            const artist = artists.find(a => a._id === editingItem.artistId);
            const updatedData = { ...editingItem, artistName: artist?.fullName, artistImage: artist?.profileImage || "" };
            const res = await fetch(API_PATH, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedData),
            });
            if (res.ok) {
                toast.success("Updated successfully!");
                setIsEditOpen(false);
                fetchData();
            }
        } catch (err) {
            toast.error("Update failed.");
        } finally { setEditLoading(false); }
    };

    const deleteItem = async (id: string) => {
        if (!confirm("Sigurado ka par? Mabubura ito sa database.")) return;
        try {
            const res = await fetch(`${API_PATH}?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                toast.error("Deleted from portfolio");
                fetchData();
            }
        } catch (err) {
            toast.error("Could not delete.");
        }
    };

    const filteredItems = galleryItems.filter(item =>
        item.placement?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen p-4 md:p-8 text-slate-900 dark:text-white">
            <Toaster position="top-right" richColors />

            <div className="max-w-6xl mx-auto space-y-10">
                {/* HEADER - Consistent with Shop/Crew UI */}
                <div className="flex justify-between items-center bg-zinc-900 dark:bg-zinc-900/50 p-8 rounded-[2.5rem] text-white shadow-2xl">
                    <div className="flex items-center gap-5">
                        <div className="p-4 bg-white rounded-3xl -rotate-6 shadow-xl">
                            <Syringe size={32} className="text-black" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none">Piercing</h1>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.4em] mt-1">Portfolio Management</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setIsUploadOpen(true)}
                        className="bg-white text-black hover:bg-zinc-200 rounded-2xl h-14 px-10 font-black uppercase text-xs tracking-widest shadow-xl transition-all"
                    >
                        <Plus size={20} className="mr-3 inline"/> Add New
                    </button>
                </div>

                {/* SEARCH BAR - Consistent UI */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-black dark:group-focus-within:text-white transition-colors" />
                        <input 
                            type="text" 
                            placeholder="SEARCH BY PLACEMENT..." 
                            className="w-full pl-16 pr-8 py-5 bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-3xl shadow-sm outline-none font-bold focus:ring-2 ring-black dark:ring-white transition-all text-xs tracking-widest uppercase"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)} 
                        />
                    </div>
                    <div className="flex items-center justify-end px-6 text-slate-400">
                        <Sparkles size={16} className="mr-2" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{filteredItems.length} ENTRIES FOUND</span>
                    </div>
                </div>

                {/* LIST SECTION - Row Style based on your preference */}
                <div className="space-y-4">
                    {fetching ? (
                        <div className="flex flex-col items-center py-40 gap-4">
                            <Loader2 className="animate-spin text-slate-300" size={48}/>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Portfolio...</p>
                        </div>
                    ) : filteredItems.length === 0 ? (
                        <div className="text-center py-20 bg-slate-50 dark:bg-zinc-900/50 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-zinc-800">
                             <Zap className="w-12 h-12 mx-auto text-zinc-200 mb-4" />
                            <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Gallery Empty</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredItems.map((item) => (
                                <div 
                                    key={item._id} 
                                    className="bg-white dark:bg-zinc-900 p-4 rounded-[2rem] border border-slate-100 dark:border-zinc-800 flex items-center gap-5 group hover:shadow-2xl transition-all relative overflow-hidden"
                                >
                                    {/* Small Image Preview */}
                                    <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 border dark:border-zinc-800">
                                        <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-black uppercase tracking-tighter italic leading-none">{item.placement}</h3>
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className="w-5 h-5 rounded-full overflow-hidden border border-slate-200 dark:border-zinc-700">
                                                <img src={item.artistImage || "/placeholder-user.jpg"} className="w-full h-full object-cover" />
                                            </div>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.artistName}</span>
                                        </div>
                                    </div>

                                    {/* Floating Actions */}
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                        <button onClick={() => setSelectedImg(item.image)} className="p-2.5 bg-slate-50 dark:bg-zinc-800 rounded-xl hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors">
                                            <Maximize2 size={16} />
                                        </button>
                                        <button onClick={() => { setEditingItem(item); setIsEditOpen(true); }} className="p-2.5 bg-slate-50 dark:bg-zinc-800 rounded-xl hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors">
                                            <Edit3 size={16} />
                                        </button>
                                        <button onClick={() => deleteItem(item._id)} className="p-2.5 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* UPLOAD MODAL - Re-skinned */}
            {isUploadOpen && (
                <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-[3rem] p-8 md:p-12 shadow-2xl animate-in zoom-in duration-300 relative max-h-[90vh] flex flex-col border dark:border-zinc-800">
                        <button onClick={() => setIsUploadOpen(false)} className="absolute top-10 right-10 p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                            <X size={24} />
                        </button>
                        
                        <div className="mb-8">
                            <h2 className="text-4xl font-black italic uppercase tracking-tighter">New Entry</h2>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Batch Upload Piercing Photos</p>
                        </div>

                        <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar flex-1">
                            {rows.map((row, index) => (
                                <div key={row.id} className="p-6 bg-slate-50 dark:bg-black/40 rounded-3xl border border-slate-100 dark:border-zinc-800 space-y-4 relative">
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                        <span>ROW #{index + 1}</span>
                                        {rows.length > 1 && (
                                            <button onClick={() => removeRow(row.id)} className="text-red-500 hover:underline">Remove</button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                            <select
                                                className="w-full pl-12 pr-4 py-4 bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-2xl outline-none focus:ring-2 ring-black dark:ring-white font-bold text-xs uppercase appearance-none"
                                                value={row.artistId}
                                                onChange={(e) => setRows(rows.map(r => r.id === row.id ? { ...r, artistId: e.target.value } : r))}
                                            >
                                                <option value="">Artist...</option>
                                                {artists.map(a => <option key={a._id} value={a._id}>{a.fullName}</option>)}
                                            </select>
                                        </div>
                                        <div className="relative">
                                            <Zap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                            <input
                                                type="text"
                                                placeholder="PLACEMENT..."
                                                className="w-full pl-12 pr-4 py-4 bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-2xl outline-none focus:ring-2 ring-black dark:ring-white font-bold text-xs uppercase"
                                                value={row.placement}
                                                onChange={(e) => setRows(rows.map(r => r.id === row.id ? { ...r, placement: e.target.value } : r))}
                                            />
                                        </div>
                                    </div>

                                    <label className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-slate-200 dark:border-zinc-800 hover:border-black dark:hover:border-white rounded-3xl cursor-pointer transition bg-white dark:bg-zinc-900 group">
                                        <UploadCloud className="w-8 h-8 text-slate-300 group-hover:text-black dark:group-hover:text-white mb-2" />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">DROP OR CLICK TO UPLOAD</span>
                                        <input type="file" multiple className="hidden" accept="image/*" onChange={(e) => handleImageChange(row.id, e.target.files)} />
                                    </label>

                                    {row.previews.length > 0 && (
                                        <div className="flex flex-wrap gap-2 pt-2">
                                            {row.previews.map((src, i) => (
                                                <img key={i} src={src} className="w-14 h-14 rounded-xl object-cover border dark:border-zinc-700" />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-4 mt-8 pt-6 border-t dark:border-zinc-800">
                            <button onClick={addRow} className="flex-1 py-5 border border-slate-200 dark:border-zinc-800 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors">Add Row</button>
                            <button 
                                onClick={saveAll} 
                                disabled={uploading} 
                                className="flex-[2] py-5 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl disabled:opacity-50"
                            >
                                {uploading ? <Loader2 className="animate-spin mx-auto" size={20} /> : "Finalize & Save"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT MODAL - Re-skinned */}
            {isEditOpen && editingItem && (
                <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-[2.5rem] p-8 md:p-10 shadow-2xl animate-in zoom-in duration-200 relative border dark:border-zinc-800">
                        <button onClick={() => setIsEditOpen(false)} className="absolute top-8 right-8 p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full">
                            <X size={20} />
                        </button>
                        <div className="mb-6">
                            <h2 className="text-2xl font-black uppercase tracking-tighter italic">Edit Portfolio</h2>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Update Details</p>
                        </div>
                        <img src={editingItem.image} className="w-full h-56 object-cover rounded-3xl border dark:border-zinc-800 mb-6" />
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2">Assigned Artist</label>
                                <select
                                    className="w-full px-6 py-4 bg-slate-50 dark:bg-black border dark:border-zinc-800 rounded-2xl outline-none focus:ring-2 ring-black dark:ring-white font-bold text-xs uppercase"
                                    value={editingItem.artistId}
                                    onChange={(e) => setEditingItem({ ...editingItem, artistId: e.target.value })}
                                >
                                    {artists.map(a => <option key={a._id} value={a._id}>{a.fullName}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2">Placement Name</label>
                                <input
                                    type="text"
                                    className="w-full px-6 py-4 bg-slate-50 dark:bg-black border dark:border-zinc-800 rounded-2xl outline-none focus:ring-2 ring-black dark:ring-white font-bold text-xs uppercase"
                                    value={editingItem.placement}
                                    onChange={(e) => setEditingItem({ ...editingItem, placement: e.target.value })}
                                />
                            </div>
                        </div>
                        <button 
                            onClick={handleUpdate} 
                            disabled={editLoading} 
                            className="mt-8 w-full py-5 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl disabled:opacity-50"
                        >
                            {editLoading ? <Loader2 className="animate-spin mx-auto" /> : "Update Portfolio"}
                        </button>
                    </div>
                </div>
            )}

            {/* LIGHTBOX */}
            {selectedImg && (
                <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 cursor-zoom-out" onClick={() => setSelectedImg(null)}>
                    <img src={selectedImg} className="max-w-full max-h-[90vh] rounded-[2rem] object-contain shadow-2xl animate-in zoom-in duration-300" />
                    <button className="absolute top-10 right-10 text-white p-4 hover:scale-110 transition-transform">
                        <X size={40} />
                    </button>
                </div>
            )}
        </div>
    )
}