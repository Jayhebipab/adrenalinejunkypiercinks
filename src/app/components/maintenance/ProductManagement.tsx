"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Trash2, Edit3, Search, RotateCcw, Plus, X,
    Loader2, Package, Tag, ImageIcon, UploadCloud,
    ChevronDown, AlertCircle, ShieldAlert, Boxes, Lock
} from "lucide-react"
import { Toaster, toast } from "sonner"
import { db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { cn } from "@/lib/utils"

interface Product {
    id: string;
    name: string;
    category: string;
    cost_price: number;
    selling_price?: number;   // from inventory — used for validation
    quantity?: number;        // from inventory — used for delete protection
    image?: string;
    description: string;
}

interface Category {
    id: string;
    category_name: string;
}

// ─── ALLOWED IMAGE TYPES ──────────────────────────────────────────────────────
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"];
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png"];

function validateImage(file: File): string | null {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return `Invalid file type. Only JPG, JPEG, and PNG are allowed.`;
    }
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return `Invalid extension. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`;
    }
    return null;
}

// ─── AUDIT TRAIL HELPER ───────────────────────────────────────────────────────
async function logAudit({ action, details, module = "Products" }: {
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
// ─────────────────────────────────────────────────────────────────────────────

export default function ProductManagement() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [fetching, setFetching] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [currentProduct, setCurrentProduct] = useState<Product | null>(null);

    // Validation errors
    const [imageError, setImageError] = useState<string | null>(null);
    const [costPriceError, setCostPriceError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: "", category: "", cost_price: "", image: "", description: ""
    });

    const fetchData = async () => {
        setFetching(true);
        try {
            const [prodRes, catRes] = await Promise.all([
                fetch("/api/products"),
                fetch("/api/categories")
            ]);
            const prods = await prodRes.json();
            const cats = await catRes.json();
            if (Array.isArray(prods)) setProducts(prods);
            if (Array.isArray(cats)) setCategories(cats);
        } catch (err) {
            toast.error("Link to matrix failed.");
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // ─── IMAGE UPLOAD with Validation ────────────────────────────────────────
    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>, mode: 'add' | 'edit') => {
        const file = e.target.files?.[0];
        if (!file) return;

        // ✅ VALIDATE image type
        const imgErr = validateImage(file);
        if (imgErr) {
            setImageError(imgErr);
            toast.error(imgErr);
            e.target.value = ""; // reset file input
            return;
        }
        setImageError(null);

        setIsUploading(true);
        const cloudName = "diwrwmjgw";
        const uploadPreset = "adrenalinejunkypiercinks";

        const uploadData = new FormData();
        uploadData.append("file", file);
        uploadData.append("upload_preset", uploadPreset);

        try {
            const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                method: "POST",
                body: uploadData,
            });
            const data = await res.json();
            if (mode === 'add') {
                setFormData(prev => ({ ...prev, image: data.secure_url }));
            } else if (currentProduct) {
                setCurrentProduct({ ...currentProduct, image: data.secure_url });
            }
            toast.success("Image uploaded successfully.");
        } catch (error) {
            toast.error("Cloud upload failed.");
        } finally {
            setIsUploading(false);
        }
    };

    // ─── COST PRICE VALIDATION against selling_price ─────────────────────────
    const validateCostPrice = (newCostPrice: number, product?: Product | null): string | null => {
        const sellingPrice = product?.selling_price;
        if (sellingPrice !== undefined && newCostPrice > sellingPrice) {
            return `Cost price (₱${newCostPrice.toLocaleString()}) cannot exceed selling price (₱${sellingPrice.toLocaleString()}).`;
        }
        return null;
    };

    // ─── ADD / EDIT SUBMIT ────────────────────────────────────────────────────
    const handleAction = async (e: React.FormEvent, type: 'POST' | 'PUT') => {
        e.preventDefault();

        // ✅ BLOCK if cost price > selling price (edit mode)
        if (type === 'PUT' && currentProduct) {
            const costErr = validateCostPrice(currentProduct.cost_price, currentProduct);
            if (costErr) {
                setCostPriceError(costErr);
                toast.error(costErr);
                return;
            }
        }

        const payload = type === 'POST' ? formData : currentProduct;
        setSaving(true);

        const doAction = async () => {
            const res = await fetch("/api/products", {
                method: type,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error || "Action failed");

            // ✅ AUDIT LOG
            if (type === 'POST') {
                await logAudit({
                    action: "ADDED PRODUCT",
                    details: `Added new product "${(payload as any).name}" — Category: ${(payload as any).category}, Cost: ₱${Number((payload as any).cost_price).toLocaleString()}`,
                });
            } else {
                await logAudit({
                    action: "EDITED PRODUCT",
                    details: `Edited product "${(payload as any).name}" (ID: ${(payload as any).id}) — Cost: ₱${Number((payload as any).cost_price).toLocaleString()}`,
                });
            }

            setIsAddOpen(false);
            setIsEditOpen(false);
            setFormData({ name: "", category: "", cost_price: "", image: "", description: "" });
            setCostPriceError(null);
            setImageError(null);
            fetchData();
            return result;
        };

        try {
            await toast.promise(doAction(), {
                loading: 'Syncing Matrix...',
                success: 'Registry Updated!',
                error: (err: Error) => err.message,
            });
        } finally {
            setSaving(false);
        }
    };

    // ─── DELETE with Inventory Protection ────────────────────────────────────
    const handleDelete = async (prod: Product) => {
        // ✅ BLOCK delete if product has been assigned to inventory (has qty or selling price)
        const hasInventoryData = (prod.quantity !== undefined && prod.quantity > 0) ||
            (prod.selling_price !== undefined && prod.selling_price > 0);

        if (hasInventoryData) {
            toast.error(
                `Cannot delete "${prod.name}" — it has existing inventory records.`,
                { description: "You can only edit this product. Remove it from inventory first." }
            );
            return;
        }

        if (!confirm(`ARE YOU SURE YOU WANT TO PURGE ${prod.name.toUpperCase()}?`)) return;

        const doDelete = async () => {
            const res = await fetch("/api/products", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: prod.id }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to purge record.");

            // ✅ AUDIT LOG
            await logAudit({
                action: "DELETED PRODUCT",
                details: `Deleted product "${prod.name}" — Category: ${prod.category}, Cost: ₱${prod.cost_price.toLocaleString()}`,
            });

            fetchData();
            return data;
        };

        toast.promise(doDelete(), {
            loading: `Purging ${prod.name.toUpperCase()}...`,
            success: `${prod.name.toUpperCase()} has been deleted.`,
            error: (err: Error) => `Error: ${err.message}`,
        });
    };

    const filtered = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    // Stats
    const totalProducts = products.length;
    const withInventory = products.filter(p => (p.quantity ?? 0) > 0).length;
    const unassigned = products.filter(p => !p.quantity || p.quantity === 0).length;

    const currentImg = isAddOpen ? formData.image : currentProduct?.image;

    return (
        <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
            <Toaster position="bottom-right" richColors />

            <div className="max-w-6xl mx-auto space-y-8">

                {/* ── HEADER ── */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.35em] text-muted-foreground mb-2 flex items-center gap-2">
                            <span className="h-px w-5 bg-current inline-block" /> Product Registry
                        </p>
                        <h1 className="text-5xl md:text-6xl font-black uppercase italic tracking-tighter leading-none">
                            Products &<br />
                            <span className="text-muted-foreground/30">Materials</span>
                        </h1>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={fetchData}
                            disabled={fetching}
                            className="h-12 w-12 flex items-center justify-center bg-card border border-border rounded-xl hover:bg-muted transition-all disabled:opacity-40"
                        >
                            <RotateCcw size={16} className={cn(fetching && "animate-spin")} />
                        </button>
                        <button
                            onClick={() => { setIsAddOpen(true); setImageError(null); setCostPriceError(null); }}
                            className="h-12 px-6 bg-foreground text-background rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:opacity-90 transition-all shadow-lg"
                        >
                            <Plus size={16} /> Add New Item
                        </button>
                    </div>
                </div>

                {/* ── STATS ── */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: "Total Products", value: totalProducts,  icon: Boxes,      color: "text-foreground",  bg: "bg-muted" },
                        { label: "In Inventory",   value: withInventory,  icon: Package,    color: "text-emerald-500", bg: "bg-emerald-500/10" },
                        { label: "Unassigned",     value: unassigned,     icon: ShieldAlert,color: "text-amber-500",   bg: "bg-amber-500/10" },
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

                {/* ── SEARCH & FILTER ── */}
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex-1 relative">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <input
                            type="text"
                            placeholder="Search products..."
                            className="w-full bg-card border border-border rounded-xl py-3.5 pl-13 pr-6 text-sm font-bold uppercase tracking-widest outline-none focus:border-foreground transition-all pl-12"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="relative md:w-56">
                        <select
                            className="w-full bg-card border border-border rounded-xl py-3.5 px-5 pr-10 text-[10px] font-black uppercase tracking-widest outline-none appearance-none cursor-pointer"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                            <option value="All">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.category_name}>{cat.category_name}</option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                </div>

                {/* ── TABLE ── */}
                <div className="bg-card border border-border rounded-[2rem] overflow-hidden shadow-sm">
                    <div className="px-8 py-5 border-b border-border flex items-center justify-between">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{filtered.length} Products</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[700px]">
                            <thead>
                                <tr className="text-[9px] font-black uppercase tracking-widest text-muted-foreground border-b border-border/50">
                                    <th className="px-8 py-4">Product Details</th>
                                    <th className="px-8 py-4">Category</th>
                                    <th className="px-8 py-4">Cost Price</th>
                                    <th className="px-8 py-4">Inventory</th>
                                    <th className="px-8 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {fetching ? (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center">
                                            <Loader2 className="animate-spin mx-auto w-8 h-8 text-muted-foreground/30" />
                                        </td>
                                    </tr>
                                ) : filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center">
                                            <Package className="mx-auto size-10 text-muted-foreground/20 mb-3" />
                                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">No products found</p>
                                        </td>
                                    </tr>
                                ) : filtered.map((prod, index) => {
                                    const hasInventory = (prod.quantity ?? 0) > 0 || (prod.selling_price ?? 0) > 0;
                                    return (
                                        <tr key={prod.id || `prod-${index}`} className="group hover:bg-muted/30 transition-all">
                                            <td className="px-8 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-11 h-11 rounded-xl bg-muted border border-border overflow-hidden flex-shrink-0 flex items-center justify-center">
                                                        {prod.image
                                                            ? <img src={prod.image} className="w-full h-full object-cover" alt={prod.name} />
                                                            : <ImageIcon size={16} className="text-muted-foreground/30" />
                                                        }
                                                    </div>
                                                    <div>
                                                        <p className="font-black uppercase italic tracking-tight text-sm leading-none mb-0.5">{prod.name}</p>
                                                        <p className="text-[9px] text-muted-foreground lowercase truncate max-w-[180px]">
                                                            {prod.description || "no description"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-8 py-4">
                                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-muted border border-border rounded-lg text-[9px] font-black uppercase tracking-widest">
                                                    <Tag size={9} /> {prod.category}
                                                </span>
                                            </td>

                                            <td className="px-8 py-4">
                                                <p className="font-black italic text-sm">
                                                    ₱{Number(prod.cost_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </p>
                                            </td>

                                            {/* Inventory status badge */}
                                            <td className="px-8 py-4">
                                                {hasInventory ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-muted text-muted-foreground border border-border rounded-lg text-[9px] font-black uppercase tracking-widest">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                                                        Unassigned
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-8 py-4 text-right">
                                                <div className="flex justify-end gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => {
                                                            setCurrentProduct(prod);
                                                            setCostPriceError(null);
                                                            setImageError(null);
                                                            setIsEditOpen(true);
                                                        }}
                                                        className="h-9 w-9 rounded-xl bg-muted border border-border flex items-center justify-center hover:bg-foreground hover:text-background transition-all"
                                                        title="Edit product"
                                                    >
                                                        <Edit3 size={15} />
                                                    </button>

                                                    {/* ✅ Delete button — shows lock icon if has inventory */}
                                                    <button
                                                        onClick={() => handleDelete(prod)}
                                                        className={cn(
                                                            "h-9 w-9 rounded-xl flex items-center justify-center transition-all border",
                                                            hasInventory
                                                                ? "bg-muted border-border text-muted-foreground/30 cursor-not-allowed"
                                                                : "bg-muted border-border text-muted-foreground hover:bg-destructive hover:text-white hover:border-transparent"
                                                        )}
                                                        title={hasInventory ? "Cannot delete — has inventory records" : "Delete product"}
                                                    >
                                                        {hasInventory ? <Lock size={13} /> : <Trash2 size={15} />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ── MODAL: ADD / EDIT ── */}
            {(isAddOpen || isEditOpen) && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-card border border-border rounded-[2.5rem] shadow-2xl w-full max-w-sm animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="p-8 space-y-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-lg font-black uppercase italic tracking-tighter">
                                        {isAddOpen ? "Register Item" : "Modify Item"}
                                    </h2>
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                                        {isAddOpen ? "Add new product to registry" : `Editing: ${currentProduct?.name}`}
                                    </p>
                                </div>
                                <button
                                    onClick={() => { setIsAddOpen(false); setIsEditOpen(false); setImageError(null); setCostPriceError(null); }}
                                    className="p-2.5 hover:bg-muted rounded-full transition-all text-muted-foreground"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={(e) => handleAction(e, isAddOpen ? 'POST' : 'PUT')} className="space-y-4">
                                {/* ✅ IMAGE UPLOAD with type validation */}
                                <div className="space-y-1">
                                    <label className={cn(
                                        "relative cursor-pointer block border-2 border-dashed rounded-2xl p-4 transition-all text-center",
                                        imageError
                                            ? "border-destructive bg-destructive/5"
                                            : isUploading
                                                ? "opacity-50 border-border"
                                                : "border-border hover:border-foreground bg-muted"
                                    )}>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept=".jpg,.jpeg,.png"
                                            onChange={(e) => handleImageChange(e, isAddOpen ? 'add' : 'edit')}
                                            disabled={isUploading}
                                        />
                                        {isUploading ? (
                                            <div className="py-2">
                                                <Loader2 className="animate-spin mx-auto w-6 h-6 text-muted-foreground" />
                                                <p className="text-[9px] font-black uppercase text-muted-foreground mt-1">Uploading...</p>
                                            </div>
                                        ) : currentImg ? (
                                            <img src={currentImg} className="h-20 mx-auto rounded-xl object-cover" />
                                        ) : (
                                            <div className="py-2">
                                                <UploadCloud size={22} className="mx-auto text-muted-foreground/40 mb-1" />
                                                <p className="text-[9px] font-black uppercase text-muted-foreground">Upload Image</p>
                                                <p className="text-[8px] text-muted-foreground/60 mt-0.5">JPG, JPEG, PNG only</p>
                                            </div>
                                        )}
                                    </label>
                                    {imageError && (
                                        <div className="flex items-center gap-1.5 text-destructive text-[10px] font-bold ml-1">
                                            <AlertCircle className="size-3" /> {imageError}
                                        </div>
                                    )}
                                </div>

                                {/* Product Name */}
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest ml-1">Product Title</label>
                                    <input
                                        required
                                        className="w-full bg-muted border border-border rounded-xl px-4 py-3.5 text-xs font-bold uppercase outline-none focus:border-foreground transition-all"
                                        value={isAddOpen ? formData.name : currentProduct?.name ?? ""}
                                        onChange={e => isAddOpen
                                            ? setFormData({ ...formData, name: e.target.value })
                                            : setCurrentProduct({ ...currentProduct!, name: e.target.value })}
                                    />
                                </div>

                                {/* Category */}
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest ml-1">Category</label>
                                    <select
                                        required
                                        className="w-full bg-muted border border-border rounded-xl px-4 py-3.5 text-[10px] font-bold uppercase outline-none cursor-pointer focus:border-foreground transition-all"
                                        value={isAddOpen ? formData.category : currentProduct?.category ?? ""}
                                        onChange={e => isAddOpen
                                            ? setFormData({ ...formData, category: e.target.value })
                                            : setCurrentProduct({ ...currentProduct!, category: e.target.value })}
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map(c => (
                                            <option key={c.id} value={c.category_name}>{c.category_name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Cost Price + Description */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest ml-1">Cost (₱)</label>
                                        <input
                                            required
                                            type="number" step="0.01" min="0"
                                            className={cn(
                                                "w-full bg-foreground text-background rounded-xl px-4 py-3.5 text-xs font-bold outline-none transition-all border-2",
                                                costPriceError ? "border-destructive" : "border-transparent"
                                            )}
                                            value={isAddOpen ? formData.cost_price : currentProduct?.cost_price ?? 0}
                                            onChange={e => {
                                                const val = Number(e.target.value);
                                                if (isAddOpen) {
                                                    setFormData({ ...formData, cost_price: e.target.value });
                                                } else {
                                                    setCurrentProduct({ ...currentProduct!, cost_price: val });
                                                    // ✅ Live validation vs selling price
                                                    const err = validateCostPrice(val, currentProduct);
                                                    setCostPriceError(err);
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest ml-1">Description</label>
                                        <input
                                            className="w-full bg-muted border border-border rounded-xl px-4 py-3.5 text-xs font-bold uppercase outline-none focus:border-foreground transition-all"
                                            value={isAddOpen ? formData.description : currentProduct?.description ?? ""}
                                            onChange={e => isAddOpen
                                                ? setFormData({ ...formData, description: e.target.value })
                                                : setCurrentProduct({ ...currentProduct!, description: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Cost price error */}
                                {costPriceError && (
                                    <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-[10px] font-bold">
                                        <AlertCircle className="size-3.5 flex-shrink-0 mt-0.5" />
                                        {costPriceError}
                                    </div>
                                )}

                                {/* Selling price info (edit only, if available) */}
                                {isEditOpen && currentProduct?.selling_price !== undefined && (
                                    <div className="flex items-center justify-between p-3 bg-muted rounded-xl border border-border">
                                        <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Current Selling Price</p>
                                        <p className="text-sm font-black">₱{currentProduct.selling_price.toLocaleString()}</p>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isUploading || saving || !!costPriceError}
                                    className="w-full h-14 bg-foreground text-background rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {saving ? <Loader2 className="animate-spin size-4" /> : "Commit Record"}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}