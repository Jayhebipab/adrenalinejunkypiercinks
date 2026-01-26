"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Plus, Trash2, Loader2, UploadCloud,
    X, Maximize2, Sparkles, Search,
    ChevronRight, Zap, Syringe, User, Edit3, Save
} from "lucide-react"
import { Toaster, toast } from "sonner"

interface GalleryRow {
    id: number;
    placement: string;
    images: string[];
    artistId: string;
}

export default function TattooGallery() {
    // --- STATES ---
    const [galleryItems, setGalleryItems] = useState<any[]>([]);
    const [artists, setArtists] = useState<any[]>([]);
    const [fetching, setFetching] = useState(true);
    const [search, setSearch] = useState("");
    const [isUploadOpen, setIsUploadOpen] = useState(false);

    // --- EDIT STATES ---
    const [editingItem, setEditingItem] = useState<any | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editLoading, setEditLoading] = useState(false);

    const [rows, setRows] = useState<GalleryRow[]>([{
        id: Date.now(),
        placement: "",
        images: [],
        artistId: ""
    }]);
    const [uploading, setUploading] = useState(false);
    const [selectedImg, setSelectedImg] = useState<string | null>(null);

    // --- FETCH LOGIC ---
    const fetchData = async () => {
        setFetching(true);
        try {
            const [galleryRes, artistsRes] = await Promise.all([
                fetch("/api/tattoo"),
                fetch("/api/artists")
            ]);

            const galleryData = await galleryRes.json();
            const artistsData = await artistsRes.json();

            if (Array.isArray(galleryData)) {
                setGalleryItems(galleryData.filter((item) => item.category === "Tattoo"));
            }
            if (Array.isArray(artistsData)) {
                setArtists(artistsData.filter((a) => a.status === "active"));
            }
        } catch (err) {
            toast.error("Failed to fetch data.");
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredItems = galleryItems.filter(item =>
        item.placement.toLowerCase().includes(search.toLowerCase())
    );

    // --- FORM ACTIONS ---
    const addRow = () => setRows([...rows, { id: Date.now(), placement: "", images: [], artistId: "" }]);
    const removeRow = (id: number) => setRows(rows.filter(row => row.id !== id));

    const handleImageUpload = (id: number, files: FileList | null) => {
        if (!files) return;
        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                setRows(prev =>
                    prev.map(row =>
                        row.id === id ? { ...row, images: [...row.images, reader.result as string] } : row
                    )
                );
            };
        });
    };

    // --- SAVE LOGIC ---
    const saveAll = async () => {
        if (rows.some(r => r.placement === "" || r.images.length === 0 || r.artistId === "")) {
            toast.warning("Please fill in all fields including the artist.");
            return;
        }

        setUploading(true);
        try {
            for (const row of rows) {
                for (const img of row.images) {
                    await fetch("/api/tattoo", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            image: img,
                            placement: row.placement,
                            category: "Tattoo",
                            artistId: row.artistId
                        }),
                    });
                }
            }

            setRows([{ id: Date.now(), placement: "", images: [], artistId: "" }]);
            setIsUploadOpen(false);
            await fetchData();
            toast.success("New tattoos added to portfolio!");
        } catch (err) {
            toast.error("Failed to save tattoos.");
        } finally {
            setUploading(false);
        }
    };

    // --- UPDATE LOGIC ---
    const handleUpdate = async () => {
        if (!editingItem.artistId || !editingItem.placement) {
            toast.error("Please fill in all fields.");
            return;
        }

        setEditLoading(true);
        try {
            const res = await fetch("/api/tattoo", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: editingItem._id,
                    placement: editingItem.placement,
                    artistId: editingItem.artistId
                }),
            });

            if (res.ok) {
                toast.success("Updated successfully!");
                setIsEditOpen(false);
                fetchData();
            }
        } catch (err) {
            toast.error("Failed to update tattoo.");
        } finally {
            setEditLoading(false);
        }
    };

    const deleteItem = async (id: string) => {
        if (!confirm("Are you sure you want to delete this tattoo?")) return;
        try {
            const res = await fetch("/api/tattoo", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });
            if (res.ok) {
                toast.success("Deleted successfully.");
                fetchData();
            }
        } catch (err) {
            toast.error("Could not delete tattoo.");
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 bg-white min-h-screen text-black">
            <Toaster position="top-center" richColors theme="light" />

            {/* HEADER */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-zinc-900 p-8 rounded-[2.5rem] shadow-2xl text-white">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-white rounded-3xl -rotate-3 shadow-lg">
                        <Syringe className="text-black w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none">Tattoo</h1>
                        <p className="text-zinc-400 text-[10px] font-black uppercase tracking-[0.4em] mt-2">Body Art Portfolio</p>
                    </div>
                </div>
                <Button onClick={() => setIsUploadOpen(true)} className="bg-white hover:bg-zinc-200 text-black rounded-2xl h-14 px-8 font-black uppercase text-xs tracking-widest transition-all">
                    <Plus className="w-5 h-5 mr-2" /> Add Tattoo
                </Button>
            </header>

            {/* SEARCH BOX */}
            <div className="flex flex-col md:flex-row gap-4 items-center bg-zinc-50 p-4 rounded-3xl border border-zinc-100">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Search placement (e.g. Back, Sleeve)..."
                        className="w-full bg-white border-none pl-14 pr-6 py-4 rounded-2xl outline-none font-bold placeholder:text-zinc-300 shadow-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 px-4 text-zinc-400">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{filteredItems.length} Tattoos</span>
                </div>
            </div>

            {/* LIVE GALLERY */}
            <section className="space-y-6">
                {fetching ? (
                    <div className="flex flex-col items-center justify-center py-40 gap-4">
                        <Loader2 className="animate-spin w-12 h-12 text-black" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Fetching Portfolio</p>
                    </div>
                ) : filteredItems.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {filteredItems.map((item) => (
                            <div key={item._id} className="group relative aspect-[4/5] bg-zinc-100 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-zinc-100">
                                <img src={item.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={item.placement} />

                                {/* Overlay Controls */}
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                    <button onClick={() => setSelectedImg(item.image)} className="p-2 bg-white/90 backdrop-blur-md rounded-xl hover:bg-white text-black shadow-lg">
                                        <Maximize2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setEditingItem(item);
                                            setIsEditOpen(true);
                                        }}
                                        className="p-2 bg-black/90 backdrop-blur-md rounded-xl hover:bg-black text-white shadow-lg"
                                    >
                                        <Edit3 size={16} />
                                    </button>
                                    <button onClick={() => deleteItem(item._id)} className="p-2 bg-red-500/90 rounded-xl hover:bg-red-600 text-white shadow-lg">
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                {/* Artist & Info */}
                                <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black via-black/40 to-transparent">
                                    <p className="text-white font-black uppercase tracking-tighter italic text-sm mb-3">{item.placement}</p>

                                    <div className="flex items-center gap-3 pt-3 border-t border-white/10">
                                        <div className="w-8 h-8 rounded-full border border-white/20 overflow-hidden shrink-0">
                                            {item.artistImage ? (
                                                <img src={item.artistImage} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-[10px] text-white font-bold italic">{item.artistName?.[0]}</div>
                                            )}
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Done by</p>
                                            <p className="text-[11px] font-black text-white uppercase italic truncate">{item.artistName || "Unknown Artist"}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-40 bg-zinc-50 rounded-[3rem] border border-dashed border-zinc-200">
                        <Zap className="w-12 h-12 mx-auto text-zinc-200 mb-4" />
                        <p className="text-zinc-400 font-black uppercase text-[10px] tracking-widest">No Tattoos Found</p>
                    </div>
                )}
            </section>

{/* UPLOAD MODAL */}
{isUploadOpen && (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl p-8 md:p-12 animate-in zoom-in duration-300 relative max-h-[90vh] flex flex-col overflow-y-auto">
            {/* X CLOSE BUTTON */}
            <button
                onClick={() => setIsUploadOpen(false)}
                className="absolute top-8 right-8 p-2 hover:bg-zinc-100 rounded-full transition-colors"
            >
                <X className="w-6 h-6 text-zinc-600" />
            </button>

            {/* HEADER */}
            <div className="mb-8">
                <h2 className="text-3xl font-black italic uppercase tracking-tighter">New Tattoo Entry</h2>
                <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest">Assign Artist & Placement</p>
            </div>

            {/* FORM ROWS */}
            <div className="space-y-6">
                {rows.map((row, index) => (
                    <div key={row.id} className="p-6 bg-zinc-50 rounded-3xl border border-zinc-100 space-y-4 relative">
                        {/* Row Header */}
                        <div className="flex justify-between items-center text-[10px] font-black uppercase text-zinc-400 tracking-widest">
                            <span>Tattoo Set #{index + 1}</span>
                            {rows.length > 1 && (
                                <button
                                    onClick={() => removeRow(row.id)}
                                    className="text-red-400 hover:text-red-600 transition-colors font-bold"
                                >
                                    Remove Row
                                </button>
                            )}
                        </div>

                        {/* Artist Select */}
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <select
                                className="w-full pl-12 pr-4 py-4 bg-white border border-zinc-100 rounded-2xl outline-none focus:ring-2 ring-black font-bold shadow-sm appearance-none"
                                value={row.artistId}
                                onChange={(e) =>
                                    setRows(rows.map(r => r.id === row.id ? { ...r, artistId: e.target.value } : r))
                                }
                            >
                                <option value="">Select Artist...</option>
                                {artists.map(a => (
                                    <option key={a._id} value={a._id}>{a.fullName}</option>
                                ))}
                            </select>
                        </div>

                        {/* Placement Input */}
                        <div className="relative">
                            <Zap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <input
                                type="text"
                                placeholder="Placement (e.g. Back, Sleeve)"
                                className="w-full pl-12 pr-4 py-4 bg-white border border-zinc-100 rounded-2xl outline-none focus:ring-2 ring-black font-bold shadow-sm"
                                value={row.placement}
                                onChange={(e) =>
                                    setRows(rows.map(r => r.id === row.id ? { ...r, placement: e.target.value } : r))
                                }
                            />
                        </div>

                        {/* Upload Images Box */}
                        <label className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-zinc-200 hover:border-black rounded-2xl cursor-pointer transition bg-white group">
                            <UploadCloud className="w-8 h-8 text-zinc-300 group-hover:text-black mb-2" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-black">
                                Upload Tattoo Images
                            </span>
                            <input
                                type="file"
                                multiple
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(row.id, e.target.files)}
                            />
                        </label>

                        {/* Preview Uploaded Images */}
                        <div className="flex flex-wrap gap-2">
                            {row.images.map((img, i) => (
                                <div key={i} className="relative">
                                    <img
                                        src={img}
                                        className="w-16 h-16 rounded-xl object-cover border border-zinc-100"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex gap-4 mt-8">
                <Button
                    onClick={addRow}
                    variant="outline"
                    className="flex-1 h-16 rounded-2xl font-black uppercase text-[10px] tracking-widest border-zinc-200"
                >
                    New Row
                </Button>

                <Button
                    onClick={saveAll}
                    disabled={uploading}
                    className="flex-[2] h-16 bg-black hover:bg-zinc-800 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl"
                >
                    {uploading ? <Loader2 className="animate-spin mr-2" /> : "Save to Portfolio"}
                </Button>
            </div>
        </div>
    </div>
)}


            {/* EDIT MODAL */}
{isEditOpen && editingItem && (
    <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 md:p-10 shadow-2xl animate-in fade-in zoom-in duration-200 relative">

            {/* X CLOSE BUTTON */}
            <button
                onClick={() => setIsEditOpen(false)}
                className="absolute top-6 right-6 p-2 hover:bg-zinc-100 rounded-full transition-colors"
            >
                <X className="w-6 h-6 text-zinc-600" />
            </button>

            <div className="mb-6">
                <h2 className="text-2xl font-black uppercase tracking-tighter">Edit Tattoo</h2>
                <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest">Correction Mode</p>
            </div>

            <img src={editingItem.image} className="w-full h-48 object-cover rounded-3xl border border-zinc-100 mb-4 shadow-inner" />

            <div className="space-y-4">
                <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Assigned Artist</label>
                    <div className="relative">
                        <select
                            className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none focus:ring-2 ring-black font-bold"
                            value={editingItem.artistId}
                            onChange={(e) => setEditingItem({ ...editingItem, artistId: e.target.value })}
                        >
                            <option value="" disabled>Select Artist...</option>
                            {artists.map(a => (
                                <option key={a._id} value={a._id}>{a.fullName}</option>
                            ))}
                        </select>
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none">
                            <ChevronRight className="w-4 h-4 text-zinc-400 rotate-90" />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Placement</label>
                    <input
                        type="text"
                        className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none focus:ring-2 ring-black font-bold"
                        value={editingItem.placement}
                        onChange={(e) => setEditingItem({ ...editingItem, placement: e.target.value })}
                    />
                </div>
            </div>

            <Button
                onClick={handleUpdate}
                disabled={editLoading}
                className="mt-8 w-full h-16 bg-black hover:bg-zinc-800 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest"
            >
                {editLoading ? <Loader2 className="animate-spin mr-2" /> : "Save Changes"}
            </Button>

        </div>
    </div>
)}


            {/* LIGHTBOX */}
            {selectedImg && (
                <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4" onClick={() => setSelectedImg(null)}>
                    <img src={selectedImg} className="max-w-full max-h-[85vh] rounded-3xl object-contain shadow-2xl" />
                </div>
            )}
        </div>
    )
}
