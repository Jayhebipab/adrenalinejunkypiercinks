"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { 
    Plus, Trash2, Loader2, UploadCloud, ImageIcon, 
    X, Maximize2, Sparkles, Search, Filter, 
    ChevronRight, Zap, Syringe
} from "lucide-react"
import { Toaster, toast } from "sonner" 

interface GalleryRow {
    id: number;
    placement: string;
    images: string[];
}

export default function PiercingGallery() {
    // --- STATES ---
    const [galleryItems, setGalleryItems] = useState<any[]>([]);
    const [fetching, setFetching] = useState(true);
    const [search, setSearch] = useState("");
    const [isUploadOpen, setIsUploadOpen] = useState(false);

    const [rows, setRows] = useState<GalleryRow[]>([{ id: Date.now(), placement: "", images: [] }]);
    const [uploading, setUploading] = useState(false);
    const [selectedImg, setSelectedImg] = useState<string | null>(null);

    // --- FETCH LOGIC ---
    const fetchGallery = async () => {
        setFetching(true);
        try {
            const res = await fetch("/api/gallery"); 
            const data = await res.json();
            // Filter only piercing category from general gallery API
            if (Array.isArray(data)) {
                setGalleryItems(data.filter(item => item.category === "Piercing"));
            }
        } catch (err) {
            toast.error("Failed to fetch piercings.");
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => { fetchGallery(); }, []);

    // --- FILTER LOGIC ---
    const filteredItems = galleryItems.filter(item => 
        item.placement.toLowerCase().includes(search.toLowerCase())
    );

    // --- FORM ACTIONS ---
    const addRow = () => setRows([...rows, { id: Date.now(), placement: "", images: [] }]);
    const removeRow = (id: number) => setRows(rows.filter(row => row.id !== id));

    const handleImageUpload = (id: number, files: FileList | null) => {
        if (!files) return;
        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                setRows(prev => prev.map(row => 
                    row.id === id ? { ...row, images: [...row.images, reader.result as string] } : row
                ));
            };
        });
    };

    // --- SAVE LOGIC ---
    const saveAll = async () => {
        if (rows.some(r => r.placement === "" || r.images.length === 0)) {
            toast.warning("Paki-fill up lahat ng placement at images.");
            return;
        }

        setUploading(true);
        const uploadPromise = async () => {
            for (const row of rows) {
                for (const img of row.images) {
                    const res = await fetch("/api/gallery", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            image: img,
                            placement: row.placement,
                            category: "Piercing"
                        }),
                    });
                    if (!res.ok) throw new Error("Upload failed");
                }
            }
            setRows([{ id: Date.now(), placement: "", images: [] }]);
            setIsUploadOpen(false);
            await fetchGallery();
        };

        toast.promise(uploadPromise(), {
            loading: 'Saving your piercing works...',
            success: 'New piercings added to portfolio!',
            error: 'Failed to save works.',
        });
        setUploading(false);
    };

    // --- DELETE LOGIC ---
    const deleteItem = async (id: string) => {
        if(!confirm("Burahin ito sa piercing gallery?")) return;
        const deletePromise = async () => {
            const res = await fetch("/api/gallery", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });
            if (!res.ok) throw new Error("Delete failed");
            await fetchGallery();
        };

        toast.promise(deletePromise(), {
            loading: 'Deleting image...',
            success: 'Deleted successfully.',
            error: 'Could not delete image.',
        });
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 bg-white min-h-screen text-black">
            <Toaster position="top-center" richColors theme="light" />
            
            {/* HEADER: PIERCING SECTION */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-zinc-900 p-8 rounded-[2.5rem] shadow-2xl text-white">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-white rounded-3xl -rotate-3 shadow-lg">
                        <Syringe className="text-black w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none">Piercing</h1>
                        
                        <p className="text-zinc-400 text-[10px] font-black uppercase tracking-[0.4em] mt-2">Body Art Portfolio</p>
                    </div>
                </div>
                <Button onClick={() => setIsUploadOpen(true)} className="bg-white hover:bg-zinc-200 text-black rounded-2xl h-14 px-8 font-black uppercase text-xs tracking-widest transition-all active:scale-95">
                    <Plus className="w-5 h-5 mr-2" /> Add Piercing
                </Button>
            </header>

            {/* SEARCH & FILTER BOX */}
            <div className="flex flex-col md:flex-row gap-4 items-center bg-zinc-50 p-4 rounded-3xl border border-zinc-100">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                    <input 
                        type="text" 
                        placeholder="Search body part (e.g. Septum, Helix, Navel)..."
                        className="w-full bg-white border-none pl-14 pr-6 py-4 rounded-2xl outline-none font-bold placeholder:text-zinc-300 shadow-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 px-4 text-zinc-400">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{filteredItems.length} Piercings</span>
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
                            <div key={item._id} className="group relative aspect-square bg-zinc-100 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-zinc-100">
                                <img src={item.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={item.placement} />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 p-6 flex flex-col justify-end">
                                    <div className="flex gap-2 absolute top-4 right-4">
                                        <button onClick={() => setSelectedImg(item.image)} className="p-3 bg-white/20 backdrop-blur-md rounded-2xl hover:bg-white text-black transition">
                                            <Maximize2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => deleteItem(item._id)} className="p-3 bg-red-500/20 backdrop-blur-md rounded-2xl hover:bg-red-500 text-white transition">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <p className="text-white font-black uppercase tracking-tighter italic text-sm">{item.placement}</p>
                                    <p className="text-white/50 text-[9px] font-bold uppercase tracking-widest">Master Piercer</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-40 bg-zinc-50 rounded-[3rem] border border-dashed border-zinc-200">
                        <Zap className="w-12 h-12 mx-auto text-zinc-200 mb-4" />
                        <p className="text-zinc-400 font-black uppercase text-[10px] tracking-widest">No Piercings Found</p>
                    </div>
                )}
            </section>

            {/* UPLOAD MODAL */}
            {isUploadOpen && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl p-8 md:p-12 animate-in zoom-in duration-300 relative max-h-[90vh] flex flex-col">
                        <button onClick={() => setIsUploadOpen(false)} className="absolute top-8 right-8 p-2 hover:bg-zinc-100 rounded-full transition-colors"><X className="w-6 h-6" /></button>
                        
                        <div className="mb-8">
                            <h2 className="text-3xl font-black italic uppercase tracking-tighter">New Piercing Entry</h2>
                            <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest">Portfolio Update</p>
                        </div>

                        <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar flex-1">
                            {rows.map((row, index) => (
                                <div key={row.id} className="p-6 bg-zinc-50 rounded-3xl border border-zinc-100 space-y-4 relative">
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase text-zinc-400 tracking-widest">
                                        <span>Piercing Set #{index + 1}</span>
                                        {rows.length > 1 && <button onClick={() => removeRow(row.id)} className="text-red-400 hover:text-red-600 transition-colors font-bold uppercase text-[9px]">Remove Row</button>}
                                    </div>
                                    <div className="space-y-4">
                                        <div className="relative">
                                            <Zap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                            <input
                                                type="text"
                                                placeholder="Placement (e.g. Septum Piercing)"
                                                className="w-full pl-12 pr-4 py-4 bg-white border border-zinc-100 rounded-2xl outline-none focus:ring-2 ring-black font-bold shadow-sm"
                                                value={row.placement}
                                                onChange={(e) => setRows(rows.map(r => r.id === row.id ? {...r, placement: e.target.value} : r))}
                                            />
                                        </div>
                                        <label className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-zinc-200 hover:border-black rounded-2xl cursor-pointer transition bg-white group">
                                            <UploadCloud className="w-8 h-8 text-zinc-300 group-hover:text-black mb-2" />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-black">Upload Piercing Shots</span>
                                            <input type="file" multiple className="hidden" onChange={(e) => handleImageUpload(row.id, e.target.files)} accept="image/*" />
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {row.images.map((img, i) => (
                                                <img key={i} src={img} className="w-16 h-16 rounded-xl object-cover border border-zinc-100 shadow-sm" alt="preview" />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-4 mt-8">
                            <Button onClick={addRow} variant="outline" className="flex-1 h-16 rounded-2xl font-black uppercase text-[10px] tracking-widest border-zinc-200">New Row</Button>
                            <Button onClick={saveAll} disabled={uploading} className="flex-[2] h-16 bg-black hover:bg-zinc-800 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">
                                {uploading ? <Loader2 className="animate-spin mr-2" /> : "Save to Portfolio"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* LIGHTBOX */}
            {selectedImg && (
                <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-xl animate-in fade-in" onClick={() => setSelectedImg(null)}>
                    <button className="absolute top-10 right-10 text-white/50 hover:text-white transition-colors"><X className="w-10 h-10" /></button>
                    <img src={selectedImg} className="max-w-full max-h-[85vh] rounded-3xl shadow-2xl object-contain" onClick={(e) => e.stopPropagation()} alt="Maximized" />
                </div>
            )}
        </div>
    );
}