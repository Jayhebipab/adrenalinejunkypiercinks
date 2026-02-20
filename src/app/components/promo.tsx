"use client"

import { useState, useEffect } from "react"
import {
    Plus, Trash2, X,
    Save, Loader2,
    Search, Calendar, ChevronDown, PenTool,
    Slack, MinusCircle, AlertCircle
} from "lucide-react"
import { Toaster, toast } from "sonner"
import { cn } from "@/lib/utils"
import { db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"

interface ArtistData {
    fullName: string;
    position: string;
}

// ─── AUDIT TRAIL HELPER ───────────────────────────────────────────────────────
async function logAudit({
    action,
    details,
    module = "Promos",
}: {
    action: string;
    details: string;
    module?: string;
}) {
    try {
        const stored = localStorage.getItem("user");
        const parsed = stored ? JSON.parse(stored) : null;
        const adminName = parsed?.name ?? "Unknown Admin";
        const adminEmail = parsed?.email ?? "—";

        await addDoc(collection(db, "audit_logs"), {
            adminName,
            adminEmail,
            action,
            details,
            module,
            timestamp: serverTimestamp(),
        });
    } catch (err) {
        console.warn("Audit log failed:", err);
    }
}
// ─────────────────────────────────────────────────────────────────────────────

// ─── VALIDATION HELPERS ───────────────────────────────────────────────────────
const SPECIAL_CHAR_REGEX = /[^a-zA-Z0-9\s\-'.]/;

function validateClientName(name: string): string | null {
    if (!name.trim()) return "Client name is required.";
    if (SPECIAL_CHAR_REGEX.test(name)) return "Special characters are not allowed in client name.";
    return null;
}
// ─────────────────────────────────────────────────────────────────────────────

export default function PromoPage() {
    const [promos, setPromos] = useState<any[]>([]);
    const [allArtists, setAllArtists] = useState<ArtistData[]>([]);
    const [inventoryProducts, setInventoryProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // DATE RANGE STATES
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);

    // VALIDATION ERRORS
    const [clientNameError, setClientNameError] = useState<string | null>(null);
    const [quantityErrors, setQuantityErrors] = useState<Record<number, string>>({});

    const defaultName = "500 𝐃𝐄𝐀𝐋𝐒 | 𝐌𝐈𝐍𝐈𝐌𝐀𝐋𝐈𝐒𝐓 𝐓𝐀𝐓𝐓𝐎𝐎 𝐀𝐍𝐃 𝐏𝐈𝐄𝐑𝐂𝐈𝐍𝐆";

    const [editingPromo, setEditingPromo] = useState<any>({
        type: "Tattoo",
        name: defaultName,
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
        if (editingPromo.type === "Piercing") return artist.position?.toLowerCase().includes("piercer");
        return artist.position?.toLowerCase().includes("tattoo");
    });

    const getPromoDate = (promo: any): Date | null => {
        if (!promo?.createdAt) return null;
        if (typeof promo.createdAt.seconds === 'number') return new Date(promo.createdAt.seconds * 1000);
        const d = new Date(promo.createdAt);
        return isNaN(d.getTime()) ? null : d;
    };

    const filteredPromos = promos.filter((promo) => {
        const matchesSearch =
            promo.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            promo.artist?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

    // ─── PRODUCT ROW MANAGEMENT ──────────────────────────────────────────────
    const updateProductRow = (index: number, field: string, value: any) => {
        const updated = [...editingPromo.productsUsed];
        updated[index] = { ...updated[index], [field]: value };

        // Auto-add row pag may pinili na sa last row
        if (field === "name" && value !== "" && index === updated.length - 1) {
            updated.push({ name: "", quantity: 1 });
        }

        // ✅ QUANTITY VALIDATION: I-check kung sobra sa available stock
        if (field === "quantity") {
            const productName = updated[index].name;
            const product = inventoryProducts.find(p => p.name === productName);
            const available = product ? (product.stock ?? product.quantity ?? 0) : Infinity;
            const newErrors = { ...quantityErrors };

            if (Number(value) > available) {
                newErrors[index] = `Only ${available} left in stock!`;
            } else {
                delete newErrors[index];
            }
            setQuantityErrors(newErrors);
        }

        // ✅ ALSO VALIDATE on product name change — reset qty error for that row
        if (field === "name") {
            const newErrors = { ...quantityErrors };
            delete newErrors[index];
            setQuantityErrors(newErrors);
        }

        setEditingPromo({ ...editingPromo, productsUsed: updated });
    };

    const removeProductRow = (index: number) => {
        if (editingPromo.productsUsed.length > 1) {
            const updated = editingPromo.productsUsed.filter((_: any, i: number) => i !== index);
            const newErrors = { ...quantityErrors };
            delete newErrors[index];
            setQuantityErrors(newErrors);
            setEditingPromo({ ...editingPromo, productsUsed: updated });
        }
    };

    // ─── SAVE HANDLER ────────────────────────────────────────────────────────
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        // ✅ VALIDATE client name
        const nameErr = validateClientName(editingPromo.clientname);
        if (nameErr) {
            setClientNameError(nameErr);
            toast.error(nameErr);
            return;
        }

        // ✅ VALIDATE no quantity errors
        if (Object.keys(quantityErrors).length > 0) {
            toast.error("Please fix inventory quantity errors before saving.");
            return;
        }

        // ✅ VALIDATE each product qty vs stock (double-check pag direct save)
        const cleanedProducts = editingPromo.productsUsed.filter((p: any) => p.name !== "");
        for (const row of cleanedProducts) {
            const product = inventoryProducts.find(p => p.name === row.name);
            const available = product ? (product.stock ?? product.quantity ?? 0) : Infinity;
            if (row.quantity > available) {
                toast.error(`Not enough stock for "${row.name}". Only ${available} available.`);
                return;
            }
        }

        if (!editingPromo.artist) {
            toast.error("Please select an artist/personnel");
            return;
        }

        setSaving(true);
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

                // ✅ AUDIT LOG
                await logAudit({
                    action: "CREATED PROMO",
                    details: `New ${editingPromo.type} promo for client "${editingPromo.clientname}" — ₱${editingPromo.price} — Artist: ${editingPromo.artist}${cleanedProducts.length > 0 ? ` — Materials: ${cleanedProducts.map((p: any) => `${p.name} x${p.quantity}`).join(', ')}` : ''}`,
                });

                setIsModalOpen(false);
                setClientNameError(null);
                setQuantityErrors({});
                fetchData();
            } else {
                toast.error("Failed to save promo");
            }
        } catch (err) {
            toast.error("Network error");
        } finally {
            setSaving(false);
        }
    };

    // ─── DELETE HANDLER ──────────────────────────────────────────────────────
    const handleDelete = async (id: string) => {
        if (!confirm("Delete this promo? This won't undo inventory changes.")) return;
        const target = promos.find(p => (p._id || p.id) === id);
        const res = await fetch(`/api/promos?id=${id}`, { method: "DELETE" });
        if (res.ok) {
            toast.success("Promo deleted!");

            // ✅ AUDIT LOG
            await logAudit({
                action: "DELETED PROMO",
                details: `Deleted ${target?.type ?? ''} promo "${target?.name ?? id}" — Client: ${target?.clientname ?? '—'} — Artist: ${target?.artist ?? '—'}`,
            });

            fetchData();
        }
    };

    const openNewModal = () => {
        setEditingPromo({
            type: "Tattoo",
            name: defaultName,
            price: 500,
            clientname: "",
            artist: "",
            productsUsed: [{ name: "", quantity: 1 }]
        });
        setClientNameError(null);
        setQuantityErrors({});
        setIsModalOpen(true);
    };

    return (
        <div className="min-h-screen p-4 md:p-8 text-foreground">
            <Toaster position="top-right" richColors />

            <div className="max-w-4xl mx-auto">
                {/* HEADER */}
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-4xl font-black uppercase italic tracking-tighter">Promos</h1>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em]">Minimalist Deals & Inventory</p>
                    </div>
                    <button
                        onClick={openNewModal}
                        className="bg-foreground text-background px-8 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest flex items-center gap-3 hover:opacity-90 transition-all shadow-xl shadow-black/10"
                    >
                        <Plus size={16} /> New Deal
                    </button>
                </div>

                {/* FILTERS */}
                <div className="space-y-4 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search promos, artists, clients..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-5 py-4 bg-muted border border-transparent rounded-2xl text-[11px] font-bold uppercase tracking-widest outline-none focus:bg-card focus:border-foreground transition-all"
                            />
                        </div>
                        <button
                            onClick={() => setIsDateFilterOpen(!isDateFilterOpen)}
                            className={cn(
                                "w-full px-5 py-4 bg-muted border border-transparent rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-between hover:bg-card transition-all",
                                (dateFrom || dateTo) && "border-foreground bg-card"
                            )}
                        >
                            <span className="flex items-center gap-3">
                                <Calendar size={16} />
                                {dateFrom || dateTo ? "Date Filter Active" : "Filter by Date Range"}
                            </span>
                            <ChevronDown className={cn("w-4 h-4 transition-transform", isDateFilterOpen && "rotate-180")} />
                        </button>
                    </div>

                    {isDateFilterOpen && (
                        <div className="grid grid-cols-2 gap-4 p-6 bg-muted rounded-[2rem] border border-border animate-in slide-in-from-top-2 duration-200">
                            {[
                                { label: "From", value: dateFrom, setter: setDateFrom },
                                { label: "To",   value: dateTo,   setter: setDateTo },
                            ].map(({ label, value, setter }) => (
                                <div key={label} className="space-y-2">
                                    <label className="text-[9px] font-black uppercase text-muted-foreground ml-1 tracking-widest">{label}</label>
                                    <input
                                        type="date"
                                        value={value}
                                        onChange={(e) => setter(e.target.value)}
                                        className="w-full p-3 bg-card rounded-xl text-[11px] font-bold border border-border focus:border-foreground outline-none transition-all"
                                    />
                                </div>
                            ))}
                            {(dateFrom || dateTo) && (
                                <button
                                    onClick={() => { setDateFrom(""); setDateTo(""); }}
                                    className="col-span-2 text-[9px] font-black uppercase text-destructive hover:opacity-80 transition-all text-center mt-2"
                                >
                                    Clear Date Filters
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* LIST */}
                <div className="space-y-3">
                    {loading ? (
                        <div className="text-center py-20">
                            <Loader2 className="animate-spin mx-auto text-muted-foreground" size={32} />
                        </div>
                    ) : filteredPromos.length === 0 ? (
                        <div className="text-center py-20 bg-muted rounded-[2rem] border-2 border-dashed border-border">
                            <p className="text-[11px] font-black uppercase text-muted-foreground tracking-widest">No deals found</p>
                        </div>
                    ) : filteredPromos.map((p) => (
                        <div
                            key={p._id || p.id}
                            className="bg-card p-6 rounded-[2rem] border border-border flex items-center gap-6 hover:shadow-xl transition-all group"
                        >
                            <div className={cn(
                                "w-14 h-14 rounded-2xl flex items-center justify-center border flex-shrink-0",
                                p.type === "Tattoo"
                                    ? "bg-foreground text-background border-foreground"
                                    : "bg-muted text-foreground border-border"
                            )}>
                                {p.type === "Tattoo" ? <PenTool size={22} /> : <Slack size={22} />}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="text-sm font-black uppercase tracking-tight truncate">{p.name}</h3>
                                    {p.clientname && (
                                        <span className="text-[9px] bg-muted px-2 py-0.5 rounded-md font-bold text-muted-foreground border border-border">
                                            @{p.clientname.toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                                    {p.artist} • {p.type}
                                </p>
                            </div>

                            <div className="text-right px-6 border-l border-border">
                                <p className="text-lg font-black">₱{p.price}</p>
                            </div>

                            <button
                                onClick={() => handleDelete(p._id || p.id)}
                                className="p-3 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── MODAL ── */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-card w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-border">
                        <div className="p-10 max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-black uppercase italic tracking-tighter">Deal Config</h2>
                                <button
                                    onClick={() => { setIsModalOpen(false); setClientNameError(null); setQuantityErrors({}); }}
                                    className="p-3 bg-muted hover:bg-foreground hover:text-background rounded-full transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSave} className="space-y-6">
                                {/* TYPE TOGGLE */}
                                <div className="flex bg-muted p-1.5 rounded-2xl gap-1.5">
                                    {["Tattoo", "Piercing"].map((t) => (
                                        <button
                                            key={t} type="button"
                                            onClick={() => setEditingPromo({ ...editingPromo, type: t, artist: "" })}
                                            className={cn(
                                                "flex-1 py-3.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all",
                                                editingPromo.type === t
                                                    ? "bg-foreground text-background shadow-lg"
                                                    : "text-muted-foreground hover:text-foreground"
                                            )}
                                        >{t}</button>
                                    ))}
                                </div>

                                {/* PROMO NAME */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">Promo Name</label>
                                    <input
                                        required
                                        className="w-full bg-muted p-4 rounded-2xl text-[13px] font-bold border-2 border-transparent focus:border-foreground focus:bg-card outline-none transition-all"
                                        value={editingPromo.name || ""}
                                        onChange={(e) => setEditingPromo({ ...editingPromo, name: e.target.value })}
                                    />
                                </div>

                                {/* ✅ CLIENT NAME with Validation */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">Client Name</label>
                                    <input
                                        required
                                        placeholder="ENTER CLIENT NAME..."
                                        className={cn(
                                            "w-full bg-muted p-4 rounded-2xl text-[13px] font-bold border-2 outline-none transition-all uppercase",
                                            clientNameError
                                                ? "border-destructive bg-destructive/5 focus:border-destructive"
                                                : "border-transparent focus:border-foreground focus:bg-card"
                                        )}
                                        value={editingPromo.clientname || ""}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setEditingPromo({ ...editingPromo, clientname: val });
                                            // Live validation
                                            const err = validateClientName(val);
                                            setClientNameError(err);
                                        }}
                                    />
                                    {clientNameError && (
                                        <div className="flex items-center gap-2 text-destructive text-[10px] font-bold ml-1">
                                            <AlertCircle className="size-3 flex-shrink-0" />
                                            {clientNameError}
                                        </div>
                                    )}
                                </div>

                                {/* PRICE & ARTIST */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">Price (₱)</label>
                                        <input
                                            type="number" required
                                            className="w-full bg-muted p-4 rounded-2xl text-[13px] font-bold border-2 border-transparent focus:border-foreground focus:bg-card outline-none transition-all"
                                            value={editingPromo.price}
                                            onChange={(e) => setEditingPromo({ ...editingPromo, price: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">Personnel</label>
                                        <select
                                            required
                                            className="w-full bg-muted p-4 rounded-2xl text-[13px] font-bold border-2 border-transparent focus:border-foreground focus:bg-card outline-none transition-all appearance-none"
                                            value={editingPromo.artist}
                                            onChange={(e) => setEditingPromo({ ...editingPromo, artist: e.target.value })}
                                        >
                                            <option value="">Select Artist...</option>
                                            {filteredArtists.map(a => (
                                                <option key={a.fullName} value={a.fullName}>{a.fullName}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* ✅ INVENTORY DEDUCTION with Quantity Validation */}
                                <div className="pt-6 border-t border-border space-y-3">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest block">
                                        Inventory Deduction
                                    </label>
                                    <div className="space-y-3">
                                        {editingPromo.productsUsed.map((row: any, index: number) => {
                                            const product = inventoryProducts.find(p => p.name === row.name);
                                            const available = product ? (product.stock ?? product.quantity ?? 0) : null;
                                            const hasError = !!quantityErrors[index];

                                            return (
                                                <div key={index} className="space-y-1">
                                                    <div className="flex gap-3 items-center">
                                                        <select
                                                            className="flex-1 bg-muted p-4 rounded-2xl text-[11px] font-black tracking-widest outline-none border-2 border-transparent focus:border-foreground transition-all"
                                                            value={row.name}
                                                            onChange={(e) => updateProductRow(index, "name", e.target.value)}
                                                        >
                                                            <option value="">+ Add Item</option>
                                                            {inventoryProducts.map(p => (
                                                                <option key={p.id || p._id} value={p.name}>
                                                                    {p.name.toUpperCase()} ({p.stock ?? p.quantity ?? 0} LEFT)
                                                                </option>
                                                            ))}
                                                        </select>

                                                        {row.name && (
                                                            <>
                                                                <input
                                                                    type="number" min="1"
                                                                    max={available ?? undefined}
                                                                    className={cn(
                                                                        "w-20 p-4 rounded-2xl text-center text-[11px] font-black outline-none border-2 transition-all",
                                                                        hasError
                                                                            ? "bg-destructive/10 border-destructive text-destructive"
                                                                            : "bg-muted border-transparent focus:border-foreground"
                                                                    )}
                                                                    value={row.quantity}
                                                                    onChange={(e) => updateProductRow(index, "quantity", Number(e.target.value))}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeProductRow(index)}
                                                                    className="p-2 text-muted-foreground hover:text-destructive transition-all"
                                                                >
                                                                    <MinusCircle size={22} />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>

                                                    {/* Stock error message */}
                                                    {hasError && (
                                                        <div className="flex items-center gap-2 text-destructive text-[10px] font-bold ml-1">
                                                            <AlertCircle className="size-3 flex-shrink-0" />
                                                            {quantityErrors[index]}
                                                        </div>
                                                    )}

                                                    {/* Available stock hint */}
                                                    {row.name && available !== null && !hasError && (
                                                        <p className="text-[9px] font-bold text-muted-foreground ml-1 uppercase tracking-widest">
                                                            Available: {available} in stock
                                                        </p>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={saving || !!clientNameError || Object.keys(quantityErrors).length > 0}
                                    className="w-full bg-foreground text-background py-5 rounded-[2rem] font-black uppercase text-[12px] tracking-[0.3em] hover:opacity-90 shadow-2xl shadow-black/20 transition-all flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    {saving ? <Loader2 className="animate-spin size-5" /> : <><Save size={18} /> Confirm & Save Deal</>}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}