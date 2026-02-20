"use client"
import { useState, useEffect } from "react"
import {
    Package, X, Search,
    Loader2, Eye, EyeOff,
    Image as ImageIcon, Filter, ArrowUpRight,
    ChevronDown, RotateCcw, ShieldAlert, CheckCircle2
} from "lucide-react"
import { Toaster, toast } from "sonner"
import { db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { cn } from "@/lib/utils"

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface Product {
    id: string;
    name: string;
    category: string;
    description?: string;
    cost_price: number;
    selling_price?: number;
    quantity?: number;
    image?: string;
    isVisible?: boolean;
    updatedAt?: string;
    supplier_name?: string;
}

// ─── AUDIT TRAIL ──────────────────────────────────────────────────────────────
async function logAudit({ action, details, module = "Inventory" }: {
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

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function InventoryPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetching, setFetching] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("All");
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    const fetchData = async (showSpinner = false) => {
        if (showSpinner) setFetching(true);
        try {
            setLoading(true);
            const res = await fetch("/api/products");
            const data = await res.json();
            if (Array.isArray(data)) setProducts(data);
        } catch (err) {
            toast.error("Error loading products.");
        } finally {
            setLoading(false);
            setFetching(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // ─── TOGGLE VISIBILITY ────────────────────────────────────────────────────
    const handleToggleVisibility = async (prod: Product) => {
        const newVisibility = !prod.isVisible;

        // Optimistic update
        setProducts(prev => prev.map(p => p.id === prod.id ? { ...p, isVisible: newVisibility } : p));

        const doToggle = async () => {
            const res = await fetch("/api/products", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: prod.id, isVisible: newVisibility }),
            });
            if (!res.ok) throw new Error("Failed to update visibility.");

            // ✅ AUDIT LOG
            await logAudit({
                action: newVisibility ? "SHOWED PRODUCT" : "HID PRODUCT",
                details: `${newVisibility ? "Shown" : "Hidden"} product "${prod.name}" (ID: ${prod.id}) — Category: ${prod.category}`,
            });
        };

        try {
            await toast.promise(doToggle(), {
                loading: `${newVisibility ? "Publishing" : "Hiding"} ${prod.name}...`,
                success: `${prod.name} is now ${newVisibility ? "visible" : "hidden"} in the shop.`,
                error: (err: Error) => { fetchData(); return err.message; },
            });
        } catch { fetchData(); }
    };

    const categories = ["All", ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

    const filteredTable = products.filter(p => {
        const matchesSearch =
            (p.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
            (p.category?.toLowerCase() || "").includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === "All" || p.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const visibleCount = products.filter(p => p.isVisible).length;
    const hiddenCount = products.filter(p => !p.isVisible).length;
    const lowStockCount = products.filter(p => (p.quantity ?? 0) <= 5).length;

    return (
        <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
            <Toaster position="bottom-right" richColors />

            <div className="max-w-5xl mx-auto space-y-8">

                {/* ── HEADER ── */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.35em] text-muted-foreground mb-2 flex items-center gap-2">
                            <span className="h-px w-5 bg-current inline-block" /> Stock Management
                        </p>
                        <h1 className="text-5xl md:text-6xl font-black uppercase italic tracking-tighter leading-none">
                            The<br />
                            <span className="text-muted-foreground/30">Inventory</span>
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

                        {/* Category Filter */}
                        <div className="relative">
                            <button
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className="h-12 px-4 bg-card border border-border rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-muted transition-all"
                            >
                                <Filter size={14} />
                                {categoryFilter}
                                <ChevronDown size={12} className={cn("transition-transform", isFilterOpen && "rotate-180")} />
                            </button>
                            {isFilterOpen && (
                                <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-xl shadow-xl z-10 overflow-hidden">
                                    {categories.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => { setCategoryFilter(cat); setIsFilterOpen(false); }}
                                            className={cn(
                                                "w-full text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all",
                                                categoryFilter === cat
                                                    ? "bg-foreground text-background"
                                                    : "hover:bg-muted text-muted-foreground"
                                            )}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── STATS ── */}
                <div className="grid grid-cols-4 gap-4">
                    {[
                        { label: "Total Products", value: products.length,  icon: Package,       color: "text-foreground",  bg: "bg-muted" },
                        { label: "Visible",         value: visibleCount,     icon: Eye,           color: "text-emerald-500", bg: "bg-emerald-500/10" },
                        { label: "Hidden",          value: hiddenCount,      icon: EyeOff,        color: "text-amber-500",   bg: "bg-amber-500/10" },
                        { label: "Low Stock",       value: lowStockCount,    icon: ShieldAlert,   color: "text-red-500",     bg: "bg-red-500/10" },
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

                {/* ── SEARCH ── */}
                <div className="relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="text"
                        placeholder="Search products or categories..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-card border border-border rounded-xl py-3.5 pl-12 pr-6 text-sm font-bold uppercase tracking-widest outline-none focus:border-foreground transition-all"
                    />
                </div>

                {/* Active filter badge */}
                {categoryFilter !== "All" && (
                    <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Filtered by:</span>
                        <div className="inline-flex items-center gap-2 bg-foreground text-background px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest">
                            {categoryFilter}
                            <button onClick={() => setCategoryFilter("All")}><X size={12} /></button>
                        </div>
                    </div>
                )}

                {/* ── TABLE ── */}
                <div className="bg-card border border-border rounded-[2rem] overflow-hidden shadow-sm">
                    <div className="px-8 py-5 border-b border-border">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            {filteredTable.length} Products
                        </p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[700px]">
                            <thead>
                                <tr className="text-[9px] font-black uppercase tracking-widest text-muted-foreground border-b border-border/50">
                                    <th className="px-8 py-4">Product</th>
                                    <th className="px-8 py-4 text-center">Stock</th>
                                    <th className="px-8 py-4">Price</th>
                                    <th className="px-8 py-4 text-center">Visibility</th>
                                    <th className="px-8 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {loading ? (
                                    <tr><td colSpan={5} className="py-20 text-center">
                                        <Loader2 className="animate-spin mx-auto size-8 text-muted-foreground/30" />
                                    </td></tr>
                                ) : filteredTable.length === 0 ? (
                                    <tr><td colSpan={5} className="py-20 text-center">
                                        <Package className="mx-auto size-10 text-muted-foreground/20 mb-3" />
                                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">No products found</p>
                                    </td></tr>
                                ) : filteredTable.map(prod => (
                                    <tr key={prod.id} className={cn(
                                        "group hover:bg-muted/30 transition-all",
                                        !prod.isVisible && "opacity-50"
                                    )}>
                                        {/* Product */}
                                        <td className="px-8 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl overflow-hidden border border-border bg-muted flex items-center justify-center shrink-0">
                                                    {prod.image
                                                        ? <img src={prod.image} className="w-full h-full object-cover" alt={prod.name} />
                                                        : <Package size={18} className="text-muted-foreground" />
                                                    }
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black uppercase italic tracking-tight">{prod.name}</p>
                                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{prod.category}</p>
                                                    {prod.supplier_name && (
                                                        <p className="text-[9px] text-muted-foreground/60 uppercase tracking-widest">{prod.supplier_name}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Stock */}
                                        <td className="px-8 py-4 text-center">
                                            <span className={cn(
                                                "inline-flex items-center justify-center min-w-[40px] px-3 py-1 rounded-lg font-black text-xs border",
                                                (prod.quantity ?? 0) <= 5
                                                    ? "bg-red-500/10 text-red-500 border-red-500/20"
                                                    : "bg-muted text-muted-foreground border-border"
                                            )}>
                                                {prod.quantity ?? 0}
                                            </span>
                                        </td>

                                        {/* Price */}
                                        <td className="px-8 py-4">
                                            <span className="text-sm font-black">₱{prod.selling_price?.toLocaleString()}</span>
                                        </td>

                                        {/* Visibility status */}
                                        <td className="px-8 py-4 text-center">
                                            {prod.isVisible ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Visible
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-muted text-muted-foreground border border-border rounded-lg text-[9px] font-black uppercase tracking-widest">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" /> Hidden
                                                </span>
                                            )}
                                        </td>

                                        {/* Actions */}
                                        <td className="px-8 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                                                {/* Toggle visibility */}
                                                <button
                                                    onClick={() => handleToggleVisibility(prod)}
                                                    className={cn(
                                                        "h-9 w-9 rounded-xl border flex items-center justify-center transition-all",
                                                        prod.isVisible
                                                            ? "bg-muted border-border text-muted-foreground hover:bg-amber-500/10 hover:text-amber-500 hover:border-amber-500/20"
                                                            : "bg-muted border-border text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-500 hover:border-emerald-500/20"
                                                    )}
                                                    title={prod.isVisible ? "Hide from shop" : "Show in shop"}
                                                >
                                                    {prod.isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                                                </button>

                                                {/* View details */}
                                                <button
                                                    onClick={() => { setEditingProduct(prod); setIsEditModalOpen(true); }}
                                                    className="h-9 w-9 rounded-xl bg-foreground text-background border border-transparent flex items-center justify-center hover:opacity-80 transition-all"
                                                    title="View details"
                                                >
                                                    <ArrowUpRight size={14} />
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

            {/* ── PRODUCT DETAIL MODAL ── */}
            {isEditModalOpen && editingProduct && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-card border border-border w-full max-w-3xl rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex flex-col md:flex-row">

                            {/* Image side */}
                            <div className="md:w-1/3 bg-muted relative min-h-[200px]">
                                {editingProduct.image
                                    ? <img src={editingProduct.image} className="w-full h-full object-cover" alt={editingProduct.name} />
                                    : <div className="w-full h-full flex items-center justify-center text-muted-foreground"><ImageIcon size={40} /></div>
                                }
                                {/* Visibility badge over image */}
                                <div className="absolute top-4 left-4">
                                    {editingProduct.isVisible ? (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-[9px] font-black uppercase tracking-widest backdrop-blur-sm">
                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Visible
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-black/40 text-white/60 border border-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest backdrop-blur-sm">
                                            <span className="h-1.5 w-1.5 rounded-full bg-white/30" /> Hidden
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Details side */}
                            <div className="md:w-2/3 p-8 flex flex-col justify-between">
                                <div className="space-y-6">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{editingProduct.category}</p>
                                            <h2 className="text-2xl font-black uppercase italic tracking-tight mt-0.5">{editingProduct.name}</h2>
                                            {editingProduct.supplier_name && (
                                                <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest mt-1">by {editingProduct.supplier_name}</p>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => setIsEditModalOpen(false)}
                                            className="p-2.5 hover:bg-muted rounded-full transition-all text-muted-foreground"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 border-y border-border py-6">
                                        <div>
                                            <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest mb-1">Price</p>
                                            <p className="text-xl font-black italic">₱{editingProduct.selling_price?.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest mb-1">Stock</p>
                                            <p className={cn(
                                                "text-xl font-black italic",
                                                (editingProduct.quantity ?? 0) <= 5 ? "text-red-500" : ""
                                            )}>
                                                {editingProduct.quantity ?? 0}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest mb-1">Cost Price</p>
                                            <p className="text-xl font-black italic text-muted-foreground">₱{editingProduct.cost_price?.toLocaleString()}</p>
                                        </div>
                                    </div>

                                    <p className="text-xs text-muted-foreground leading-relaxed italic border-l-2 border-foreground pl-4">
                                        {editingProduct.description || "No description available."}
                                    </p>
                                </div>

                                <div className="flex gap-3 mt-8">
                                    <button
                                        onClick={() => { handleToggleVisibility(editingProduct); setIsEditModalOpen(false); }}
                                        className={cn(
                                            "flex-1 h-12 rounded-xl font-black uppercase text-[10px] tracking-widest border flex items-center justify-center gap-2 transition-all",
                                            editingProduct.isVisible
                                                ? "bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500 hover:text-white"
                                                : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500 hover:text-white"
                                        )}
                                    >
                                        {editingProduct.isVisible ? <><EyeOff size={14} /> Hide from Shop</> : <><Eye size={14} /> Show in Shop</>}
                                    </button>
                                    <button
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="h-12 px-6 rounded-xl bg-muted border border-border font-black uppercase text-[10px] tracking-widest hover:bg-foreground hover:text-background transition-all"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}