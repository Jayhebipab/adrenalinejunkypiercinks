"use client"

import { useState, useEffect } from "react"
import {
    Plus, Trash2, Edit3, X,
    Save, Loader2, Scissors, Paintbrush,
    Package, Users, ArrowRight, MinusCircle,
    Search, Calendar, ChevronDown, PhilippinePeso, PenTool,
    Slack
} from "lucide-react"
import { Toaster, toast } from "sonner"
import { cn } from "@/lib/utils"

interface ArtistData {
    fullName: string;
    position: string;
}

export default function PromoPage() {
    const [promos, setPromos] = useState<any[]>([]);
    const [allArtists, setAllArtists] = useState<ArtistData[]>([]);
    const [inventoryProducts, setInventoryProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // DATE RANGE STATES
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);

    const defaultName = "500 𝐃𝐄𝐀𝐋𝐒 | 𝐌𝐈𝐍𝐈𝐌𝐀𝐋𝐈𝐒𝐓 𝐓𝐀𝐓𝐓𝐎𝐎 𝐀𝐍𝐃 𝐏𝐈𝐄𝐑𝐂𝐈𝐍𝐆";

    const [editingPromo, setEditingPromo] = useState<any>({
        type: "Tattoo",
        name: defaultName, // Eto para sa page load
        price: 500,
        clientname: "",
        artist: "",
        productsUsed: [{ name: "", quantity: 1 }]
    });

    useEffect(() => {
        const loadResources = async () => {
            setLoading(true);
            try {
                const [resArtists, resProducts] = await Promise.all([
                    fetch("/api/artists"),
                    fetch("/api/products")
                ]);

                const artistsData = await resArtists.json();
                const productsData = await resProducts.json();

                setAllArtists(Array.isArray(artistsData) ? artistsData : artistsData.artists || []);
                setInventoryProducts(Array.isArray(productsData) ? productsData : productsData.products || []);

                await fetchData();
            } catch (err) {
                toast.error("Failed to load initial data");
            } finally {
                setLoading(false);
            }
        };
        loadResources();
    }, []);

    const fetchData = async () => {
        try {
            const res = await fetch("/api/promos");
            const data = await res.json();
            if (Array.isArray(data)) setPromos(data);
            else if (data.promos) setPromos(data.promos);
        } catch (error) {
            console.error("Fetch error:", error);
        }
    };

    const filteredArtists = allArtists.filter(artist => {
        if (editingPromo.type === "Piercing") {
            return artist.position?.toLowerCase().includes("piercer");
        }
        return artist.position?.toLowerCase().includes("tattoo");
    });

    const getPromoDate = (promo: any): Date | null => {
        if (!promo?.createdAt) return null;
        if (typeof promo.createdAt.seconds === 'number') {
            return new Date(promo.createdAt.seconds * 1000);
        }
        const d = new Date(promo.createdAt);
        return isNaN(d.getTime()) ? null : d;
    };

    const filteredPromos = promos.filter((promo) => {
        const matchesSearch =
            promo.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            promo.artist?.toLowerCase().includes(searchTerm.toLowerCase());
        promo.clientname?.toLowerCase().includes(searchTerm.toLowerCase());

        let matchesDate = true;
        const promoDate = getPromoDate(promo);

        if ((dateFrom || dateTo) && promoDate) {
            const from = dateFrom ? new Date(dateFrom) : null;
            const to = dateTo ? new Date(dateTo) : null;
            const pDate = new Date(promoDate.setHours(0, 0, 0, 0));
            if (from && pDate < new Date(from.setHours(0, 0, 0, 0))) matchesDate = false;
            if (to && pDate > new Date(to.setHours(0, 0, 0, 0))) matchesDate = false;
        }
        return matchesSearch && matchesDate;
    });

    const updateProductRow = (index: number, field: string, value: any) => {
        const updated = [...editingPromo.productsUsed];
        updated[index] = { ...updated[index], [field]: value };
        if (field === "name" && value !== "" && index === updated.length - 1) {
            updated.push({ name: "", quantity: 1 });
        }
        setEditingPromo({ ...editingPromo, productsUsed: updated });
    };

    const removeProductRow = (index: number) => {
        if (editingPromo.productsUsed.length > 1) {
            const updated = editingPromo.productsUsed.filter((_: any, i: number) => i !== index);
            setEditingPromo({ ...editingPromo, productsUsed: updated });
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const cleanedProducts = editingPromo.productsUsed.filter((p: any) => p.name !== "");
        if (!editingPromo.artist) {
            toast.error("Please select an artist/personnel");
            return;
        }

        try {
            const res = await fetch("/api/promos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...editingPromo,
                    productsUsed: cleanedProducts,
                    createdAt: new Date().toISOString()
                })
            });

            if (res.ok) {
                toast.success("Promo saved successfully!");
                setIsModalOpen(false);
                fetchData();
            } else {
                toast.error("Failed to save promo");
            }
        } catch (err) {
            toast.error("Network error");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this promo? This won't undo inventory changes.")) return;
        const res = await fetch(`/api/promos?id=${id}`, { method: "DELETE" });
        if (res.ok) {
            toast.success("Promo deleted!");
            fetchData();
        }
    };

    return (
        <div className="min-h-screen p-4 md:p-8 text-slate-900 dark:text-white">
            <Toaster position="top-right" richColors />

            <div className="max-w-4xl mx-auto">
                {/* HEADER */}
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-4xl font-black uppercase italic tracking-tighter">Promos</h1>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">Minimalist Deals & Inventory</p>
                    </div>
                    <button
                        onClick={() => {
                            setEditingPromo({ type: "Tattoo", name: defaultName, price: 500, artist: "", productsUsed: [{ name: "", quantity: 1 }] });
                            setIsModalOpen(true);
                        }}
                        className="bg-black dark:bg-white dark:text-black text-white px-8 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest flex items-center gap-3 hover:opacity-90 transition-all shadow-xl shadow-black/10"
                    >
                        <Plus size={16} /> New Deal
                    </button>
                </div>

                {/* FILTERS SECTION */}
                <div className="space-y-4 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="SEARCH PROMOS OR ARTISTS..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-5 py-4 bg-slate-50 dark:bg-zinc-900 border border-transparent dark:border-zinc-800 rounded-2xl text-[11px] font-bold uppercase tracking-widest outline-none focus:bg-white dark:focus:bg-zinc-800 focus:border-black dark:focus:border-white transition-all"
                            />
                        </div>
                        <button
                            onClick={() => setIsDateFilterOpen(!isDateFilterOpen)}
                            className={cn(
                                "w-full px-5 py-4 bg-slate-50 dark:bg-zinc-900 border border-transparent dark:border-zinc-800 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-between hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all",
                                (dateFrom || dateTo) && "border-black dark:border-white bg-white dark:bg-zinc-800"
                            )}
                        >
                            <span className="flex items-center gap-3">
                                <Calendar size={16} />
                                {dateFrom || dateTo ? "Date Filter Active" : "Filter by Date Range"}
                            </span>
                            <ChevronDown className={cn("w-4 h-4 transition-transform", isDateFilterOpen && "rotate-180")} />
                        </button>
                    </div>

                    {/* COLLAPSIBLE DATE RANGE INPUTS */}
                    {isDateFilterOpen && (
                        <div className="grid grid-cols-2 gap-4 p-6 bg-slate-50 dark:bg-zinc-900 rounded-[2rem] border border-slate-100 dark:border-zinc-800 animate-in slide-in-from-top-2 duration-200">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase text-slate-400 ml-1">From</label>
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="w-full p-3 bg-white dark:bg-zinc-800 rounded-xl text-[11px] font-bold border border-slate-200 dark:border-zinc-700 focus:border-black dark:focus:border-white outline-none transition-all uppercase text-slate-900 dark:text-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase text-slate-400 ml-1">To</label>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="w-full p-3 bg-white dark:bg-zinc-800 rounded-xl text-[11px] font-bold border border-slate-200 dark:border-zinc-700 focus:border-black dark:focus:border-white outline-none transition-all uppercase text-slate-900 dark:text-white"
                                />
                            </div>
                            {(dateFrom || dateTo) && (
                                <button
                                    onClick={() => { setDateFrom(""); setDateTo(""); }}
                                    className="col-span-2 text-[9px] font-black uppercase text-red-500 hover:text-red-600 transition-all text-center mt-2"
                                >
                                    Clear Date Filters
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* LIST SECTION */}
                <div className="space-y-3">
                    {loading ? (
                        <div className="text-center py-20"><Loader2 className="animate-spin mx-auto text-slate-200" size={32} /></div>
                    ) : filteredPromos.length === 0 ? (
                        <div className="text-center py-20 bg-slate-50 dark:bg-zinc-900 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-zinc-800">
                            <p className="text-[11px] font-black uppercase text-slate-400 tracking-widest">No deals found</p>
                        </div>
                    ) : filteredPromos.map((p) => (
                        <div key={p._id || p.id} className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-slate-100 dark:border-zinc-800 flex items-center gap-6 hover:shadow-2xl hover:shadow-slate-200/50 dark:hover:shadow-black/50 transition-all group">
                            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border",
                                p.type === "Tattoo"
                                    ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white"
                                    : "bg-white text-black border-slate-200 dark:bg-zinc-800 dark:text-white dark:border-zinc-700")}>
                                {p.type === "Tattoo" ? <PenTool size={22} /> : <Slack size={22} />}
                            </div>
                            {/* LIST SECTION - Update the text part */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-black uppercase tracking-tight truncate">{p.name}</h3>
                                    {/* Badge para sa Client Name */}
                                    {p.clientname && (
                                        <span className="text-[9px] bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md font-bold text-slate-500">
                                            @{p.clientname.toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                    {p.artist} • {p.type}
                                </p>
                            </div>
                            <div className="text-right px-6 border-l border-slate-100 dark:border-zinc-800">
                                <p className="text-lg font-black">₱{p.price}</p>
                            </div>
                            <button onClick={() => handleDelete(p._id || p.id)} className="p-3 text-slate-300 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* MODAL CONFIG */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 dark:bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-zinc-950 w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border dark:border-zinc-800">
                        <div className="p-10 max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-black uppercase italic tracking-tighter text-black dark:text-white">Deal Config</h2>
                                <button onClick={() => setIsModalOpen(false)} className="p-3 bg-slate-100 dark:bg-zinc-900 dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black rounded-full transition-all"><X size={20} /></button>
                            </div>

                            <form onSubmit={handleSave} className="space-y-6">
                                <div className="flex bg-slate-100 dark:bg-zinc-900 p-1.5 rounded-2xl gap-1.5">
                                    {["Tattoo", "Piercing"].map((t) => (
                                        <button
                                            key={t} type="button"
                                            onClick={() => setEditingPromo({ ...editingPromo, type: t, artist: "" })}
                                            className={cn("flex-1 py-3.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all",
                                                editingPromo.type === t
                                                    ? "bg-black text-white dark:bg-white dark:text-black shadow-lg"
                                                    : "text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300")}
                                        >{t}</button>
                                    ))}
                                </div>

                                <div className="space-y-5">
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-slate-400 dark:text-zinc-500 ml-1 tracking-widest">
                                            Promo Name
                                        </label>
                                        <input
                                            required
                                            className="w-full bg-slate-50 dark:bg-zinc-900 p-4 rounded-2xl text-[13px] font-bold border-2 border-transparent focus:border-black dark:focus:border-white focus:bg-white dark:focus:bg-zinc-800 outline-none transition-all dark:text-white"
                                            value={editingPromo.name || ""}
                                            onChange={(e) => setEditingPromo({ ...editingPromo, name: e.target.value })}
                                        />
                                    </div>

                                    {/* CLIENT NAME INPUT */}
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-slate-400 dark:text-zinc-500 ml-1 tracking-widest">Client Name</label>
                                        <input
                                            required
                                            placeholder="ENTER CLIENT NAME..."
                                            className="w-full bg-slate-50 dark:bg-zinc-900 p-4 rounded-2xl text-[13px] font-bold border-2 border-transparent focus:border-black dark:focus:border-white focus:bg-white dark:focus:bg-zinc-800 outline-none transition-all dark:text-white uppercase"
                                            value={editingPromo.clientname || ""}
                                            onChange={e => setEditingPromo({ ...editingPromo, clientname: e.target.value })}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-slate-400 dark:text-zinc-500 ml-1 tracking-widest">Price (₱)</label>
                                            <input
                                                type="number" required className="w-full bg-slate-50 dark:bg-zinc-900 p-4 rounded-2xl text-[13px] font-bold border-2 border-transparent focus:border-black dark:focus:border-white focus:bg-white dark:focus:bg-zinc-800 outline-none transition-all dark:text-white"
                                                value={editingPromo.price} onChange={e => setEditingPromo({ ...editingPromo, price: Number(e.target.value) })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-slate-400 dark:text-zinc-500 ml-1 tracking-widest">Personnel</label>
                                            <select
                                                required className="w-full bg-slate-50 dark:bg-zinc-900 p-4 rounded-2xl text-[13px] font-bold border-2 border-transparent focus:border-black dark:focus:border-white focus:bg-white dark:focus:bg-zinc-800 outline-none transition-all appearance-none dark:text-white"
                                                value={editingPromo.artist} onChange={e => setEditingPromo({ ...editingPromo, artist: e.target.value })}
                                            >
                                                <option value="" className="dark:bg-zinc-900">SELECT ARTIST...</option>
                                                {filteredArtists.map(a => <option key={a.fullName} value={a.fullName} className="dark:bg-zinc-900">{a.fullName}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-slate-100 dark:border-zinc-800">
                                    <label className="text-[10px] font-black uppercase text-slate-400 dark:text-zinc-500 mb-4 block tracking-widest">Inventory Deduction</label>
                                    <div className="space-y-3">
                                        {editingPromo.productsUsed.map((row: any, index: number) => (
                                            <div key={index} className="flex gap-3 items-center">
                                                <select
                                                    className="flex-1 bg-slate-50 dark:bg-zinc-900 p-4 rounded-2xl text-[11px] font-black tracking-widest outline-none border-2 border-transparent focus:border-black dark:focus:border-white transition-all dark:text-white"
                                                    value={row.name} onChange={e => updateProductRow(index, "name", e.target.value)}
                                                >
                                                    <option value="" className="dark:bg-zinc-900">+ ADD ITEM</option>
                                                    {inventoryProducts.map(p => (
                                                        <option key={p.id || p._id} value={p.name} className="dark:bg-zinc-900">
                                                            {p.name.toUpperCase()} ({p.stock || p.quantity || 0} LEFT)
                                                        </option>
                                                    ))}
                                                </select>
                                                {row.name && (
                                                    <>
                                                        <input type="number" min="1" className="w-20 bg-slate-100 dark:bg-zinc-800 p-4 rounded-2xl text-center text-[11px] font-black outline-none border-2 border-transparent focus:border-black dark:focus:border-white dark:text-white" value={row.quantity} onChange={e => updateProductRow(index, "quantity", Number(e.target.value))} />
                                                        <button type="button" onClick={() => removeProductRow(index)} className="p-2 text-slate-300 dark:text-zinc-600 hover:text-red-500 transition-all"><MinusCircle size={22} /></button>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button type="submit" className="w-full bg-black text-white dark:bg-white dark:text-black py-5 rounded-[2rem] font-black uppercase text-[12px] tracking-[0.3em] hover:opacity-90 shadow-2xl shadow-black/20 transition-all flex items-center justify-center gap-3">
                                    <Save size={18} /> Confirm & Save Deal
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}