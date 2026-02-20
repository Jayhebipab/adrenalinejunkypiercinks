"use client"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils";
import {
    Package, Plus, X, Search, 
    Trash2, Save, Loader2, Edit3, 
    Clock, Image as ImageIcon, AlertCircle,
    CheckCircle2, TrendingUp, TrendingDown, 
    Boxes, ArrowUpRight
} from "lucide-react"
import { Toaster, toast } from "sonner"
import { db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"

interface Product {
    id: string;
    name: string;
    category: string;
    cost_price: number;
    selling_price?: number;
    quantity?: number;
    supplier_name?: string;
    image?: string;
    updatedAt?: any;
}

interface Supplier {
    id: string;
    company_name: string;
}

interface DeliveryItem {
    productId: string;
    productName: string;
    quantity: number;
    sellingPrice: number;
}

// ─── AUDIT TRAIL HELPER ───────────────────────────────────────────────────────
async function logAudit({ action, details, module = "Inventory" }: {
    action: string; details: string; module?: string;
}) {
    try {
        const stored = localStorage.getItem("users");
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

const MAX_QUANTITY = 1000;

export default function InventoryPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    // Assignment form
    const [selectedSupplier, setSelectedSupplier] = useState("");
    const [deliveryDate, setDeliveryDate] = useState("");
    const [selectedItems, setSelectedItems] = useState<DeliveryItem[]>([]);

    // Validation errors for assign modal items
    const [itemQtyErrors, setItemQtyErrors] = useState<Record<number, string>>({});

    // Quick edit
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [qtyError, setQtyError] = useState<string | null>(null);
    const [priceError, setPriceError] = useState<string | null>(null);

    const today = new Date().toISOString().split('T')[0];
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const minDate = twoWeeksAgo.toISOString().split('T')[0];

    const fetchData = async () => {
        try {
            setLoading(true);
            const [resProd, resSupp] = await Promise.all([
                fetch("/api/products"),
                fetch("/api/suppliers")
            ]);
            const dataProd = await resProd.json();
            const dataSupp = await resSupp.json();
            if (Array.isArray(dataProd)) setProducts(dataProd);
            if (Array.isArray(dataSupp)) setSuppliers(dataSupp);
        } catch (err) {
            toast.error("Error loading data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // ─── DELIVERY ITEM MANAGEMENT ─────────────────────────────────────────────
    const addItemToDelivery = (productId: string) => {
        const prod = products.find(p => p.id === productId);
        if (!prod) return;
        if (selectedItems.find(i => i.productId === productId)) {
            toast.warning("Already in list");
            return;
        }
        setSelectedItems([...selectedItems, {
            productId: prod.id,
            productName: prod.name,
            quantity: 1,
            sellingPrice: prod.selling_price || 0
        }]);
    };

    const updateItemRow = (index: number, field: keyof DeliveryItem, value: any) => {
        const newList = [...selectedItems];
        newList[index] = { ...newList[index], [field]: value };
        setSelectedItems(newList);

        // ✅ QUANTITY VALIDATION for assign modal
        if (field === "quantity") {
            const newErrors = { ...itemQtyErrors };
            if (Number(value) > MAX_QUANTITY) {
                newErrors[index] = `Max ${MAX_QUANTITY} units allowed per delivery.`;
            } else if (Number(value) < 1) {
                newErrors[index] = "Minimum quantity is 1.";
            } else {
                delete newErrors[index];
            }
            setItemQtyErrors(newErrors);
        }
    };

    // ─── ASSIGN SUBMIT ────────────────────────────────────────────────────────
    const handleAssignSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSupplier || !deliveryDate || selectedItems.length === 0) {
            return toast.error("Please fill up all fields");
        }
        if (Object.keys(itemQtyErrors).length > 0) {
            return toast.error("Fix quantity errors before submitting.");
        }

        setSaving(true);
        try {
            const res = await fetch("/api/inventory", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    supplier: selectedSupplier,
                    date: deliveryDate,
                    items: selectedItems
                })
            });

            if (res.ok) {
                toast.success("Inventory assigned successfully!");

                // ✅ AUDIT LOG
                await logAudit({
                    action: "ASSIGNED INVENTORY",
                    details: `Delivery from ${selectedSupplier} on ${deliveryDate} — Items: ${selectedItems.map(i => `${i.productName} x${i.quantity}`).join(', ')}`,
                });

                setIsAssignModalOpen(false);
                setSelectedItems([]);
                setSelectedSupplier("");
                setDeliveryDate("");
                setItemQtyErrors({});
                fetchData();
            } else {
                toast.error("Failed to save assignment");
            }
        } catch (error) {
            toast.error("Failed to save assignment");
        } finally {
            setSaving(false);
        }
    };

    // ─── QUICK UPDATE SUBMIT ──────────────────────────────────────────────────
    const handleQuickUpdateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProduct) return;

        // ✅ VALIDATE QUANTITY
        if ((editingProduct.quantity ?? 0) > MAX_QUANTITY) {
            setQtyError(`Quantity cannot exceed ${MAX_QUANTITY}.`);
            return;
        }
        if ((editingProduct.quantity ?? 0) < 0) {
            setQtyError("Quantity cannot be negative.");
            return;
        }

        // ✅ VALIDATE SELLING PRICE
        if ((editingProduct.selling_price ?? 0) < (editingProduct.cost_price ?? 0)) {
            setPriceError("Selling price must be higher than cost price.");
            return;
        }

        const prevProduct = products.find(p => p.id === editingProduct.id);
        const prevQty = prevProduct?.quantity ?? 0;
        const newQty = editingProduct.quantity ?? 0;
        const qtyChanged = prevQty !== newQty;

        setSaving(true);

        // ✅ FIX: Huwag gamitin .finally() sa toast.promise return — 
        // i-wrap na lang sa sariling async IIFE para type-safe
        const doUpdate = async () => {
            // STEP 1: Update product info
            const productRes = await fetch(`/api/products`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: editingProduct.id,
                    name: editingProduct.name,
                    category: editingProduct.category,
                    cost_price: editingProduct.cost_price,
                    image: editingProduct.image
                }),
            });
            if (!productRes.ok) throw new Error("Product update failed");

            // STEP 2: Update stock & price
            const inventoryRes = await fetch("/api/inventory", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: editingProduct.id,
                    quantity: editingProduct.quantity,
                    sellingPrice: editingProduct.selling_price
                })
            });
            if (!inventoryRes.ok) throw new Error("Inventory update failed");

            // ✅ STEP 3: Sync to delivery_reports if qty changed
            if (qtyChanged) {
                await addDoc(collection(db, "delivery_reports"), {
                    item_name: editingProduct.name,
                    action: "MANUAL_STOCK_UPDATE",
                    details: {
                        quantity: newQty,
                        price: editingProduct.selling_price ?? 0,
                        category: editingProduct.category ?? "General",
                        previousQuantity: prevQty,
                    },
                    createdAt: serverTimestamp(),
                });
            }

            // ✅ AUDIT LOG
            await logAudit({
                action: "UPDATED PRODUCT",
                details: `Updated "${editingProduct.name}" — Qty: ${prevQty} → ${newQty}, Selling Price: ₱${editingProduct.selling_price?.toLocaleString()}, Cost: ₱${editingProduct.cost_price?.toLocaleString()}`,
            });

            setIsEditModalOpen(false);
            setQtyError(null);
            setPriceError(null);
            fetchData();
        };

        try {
            await toast.promise(doUpdate(), {
                loading: 'Syncing updates...',
                success: 'Inventory updated successfully!',
                error: (err: Error) => `Sync failed: ${err.message}`,
            });
        } finally {
            setSaving(false);
        }
    };

    const filteredTable = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const freshProducts = products.filter(p => !p.quantity || p.quantity === 0);

    const profit = ((editingProduct?.selling_price ?? 0) - (editingProduct?.cost_price ?? 0));
    const isPriceValid = (editingProduct?.selling_price ?? 0) >= (editingProduct?.cost_price ?? 0);

    // Summary stats
    const totalProducts = products.length;
    const lowStock = products.filter(p => (p.quantity ?? 0) <= 5 && (p.quantity ?? 0) > 0).length;
    const outOfStock = products.filter(p => !p.quantity || p.quantity === 0).length;

    return (
        <div className="min-h-screen bg-background p-4 md:p-8 text-foreground">
            <Toaster position="top-right" richColors />

            <div className="max-w-7xl mx-auto space-y-8">

                {/* ── HEADER ── */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.35em] text-muted-foreground mb-2 flex items-center gap-2">
                            <span className="h-px w-5 bg-current inline-block" /> Stock Control
                        </p>
                        <h1 className="text-5xl md:text-6xl font-black uppercase italic tracking-tighter leading-none">
                            Inventory<br />
                            <span className="text-muted-foreground/30">Control</span>
                        </h1>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search product..."
                                className="w-full pl-11 pr-4 h-12 bg-card border border-border rounded-xl text-sm font-bold outline-none focus:border-foreground transition-all"
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={() => setIsAssignModalOpen(true)}
                            className="h-12 px-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
                        >
                            <Plus className="w-4 h-4" /> Assign New
                        </button>
                    </div>
                </div>

                {/* ── STATS ROW ── */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: "Total Products", value: totalProducts, icon: Boxes,         color: "text-foreground",    bg: "bg-muted" },
                        { label: "Low Stock",       value: lowStock,     icon: TrendingDown,   color: "text-amber-500",     bg: "bg-amber-500/10" },
                        { label: "Out of Stock",    value: outOfStock,   icon: AlertCircle,    color: "text-red-500",       bg: "bg-red-500/10" },
                    ].map((stat) => (
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

                {/* ── MAIN TABLE ── */}
                <div className="bg-card rounded-[2rem] border border-border overflow-hidden shadow-sm">
                    <div className="px-8 py-5 border-b border-border">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{filteredTable.length} Products</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[700px]">
                            <thead>
                                <tr className="text-[9px] font-black uppercase tracking-widest text-muted-foreground border-b border-border/50">
                                    <th className="px-8 py-4">Product & Supplier</th>
                                    <th className="px-8 py-4 text-center">Stock Level</th>
                                    <th className="px-8 py-4">Selling Price</th>
                                    <th className="px-8 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="py-20 text-center">
                                            <Loader2 className="animate-spin mx-auto text-muted-foreground" />
                                        </td>
                                    </tr>
                                ) : filteredTable.map((prod, i) => {
                                    const qty = prod.quantity ?? 0;
                                    const stockStatus =
                                        qty === 0 ? { label: "Out of Stock", class: "bg-red-500/10 text-red-500 border-red-500/20 animate-pulse" } :
                                        qty <= 5  ? { label: `${qty} — Critical`, class: "bg-red-500/10 text-red-500 border-red-500/20" } :
                                        qty <= 20 ? { label: `${qty} — Low`, class: "bg-amber-500/10 text-amber-500 border-amber-500/20" } :
                                                    { label: `${qty} — OK`, class: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" };
                                    return (
                                        <tr key={prod.id} className="group hover:bg-muted/30 transition-all">
                                            <td className="px-8 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-11 h-11 rounded-xl bg-muted border border-border overflow-hidden flex-shrink-0 flex items-center justify-center font-black text-muted-foreground">
                                                        {prod.image
                                                            ? <img src={prod.image} className="w-full h-full object-cover" alt={prod.name} />
                                                            : <span className="uppercase text-sm">{prod.name.charAt(0)}</span>
                                                        }
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-black uppercase italic tracking-tight text-sm leading-none mb-1 truncate">{prod.name}</p>
                                                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest truncate">
                                                            {prod.supplier_name || "Unassigned"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-8 py-4 text-center">
                                                <span className={cn(
                                                    "inline-flex items-center px-3 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest",
                                                    stockStatus.class
                                                )}>
                                                    {stockStatus.label}
                                                </span>
                                            </td>

                                            <td className="px-8 py-4">
                                                <p className="font-black italic text-sm">₱{Number(prod.selling_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                            </td>

                                            <td className="px-8 py-4 text-right">
                                                <button
                                                    disabled={!prod.supplier_name}
                                                    onClick={() => {
                                                        setEditingProduct(prod);
                                                        setQtyError(null);
                                                        setPriceError(null);
                                                        setIsEditModalOpen(true);
                                                    }}
                                                    title={!prod.supplier_name ? "Assign a supplier first" : "Edit product"}
                                                    className={cn(
                                                        "h-9 w-9 rounded-xl flex items-center justify-center transition-all",
                                                        prod.supplier_name
                                                            ? "bg-muted hover:bg-foreground hover:text-background text-muted-foreground cursor-pointer"
                                                            : "bg-muted text-muted-foreground/30 cursor-not-allowed"
                                                    )}
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ── MODAL 1: ASSIGN ── */}
            {isAssignModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-card w-full max-w-4xl rounded-[3rem] shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-10 max-h-[90vh] overflow-y-auto space-y-8">
                            <div className="flex justify-between items-center pb-6 border-b border-border">
                                <div>
                                    <h2 className="text-2xl font-black uppercase italic tracking-tighter">New Delivery Assignment</h2>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Assign supplier & incoming stock</p>
                                </div>
                                <button onClick={() => { setIsAssignModalOpen(false); setItemQtyErrors({}); }} className="p-2.5 hover:bg-muted rounded-full transition-all">
                                    <X className="size-5" />
                                </button>
                            </div>

                            <form onSubmit={handleAssignSubmit} className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Select Supplier</label>
                                        <select
                                            required
                                            value={selectedSupplier}
                                            onChange={(e) => setSelectedSupplier(e.target.value)}
                                            className="w-full h-14 px-4 bg-muted rounded-xl font-bold text-sm outline-none border-2 border-transparent focus:border-foreground transition-all"
                                        >
                                            <option value="">Choose supplier...</option>
                                            {suppliers.map(s => <option key={s.id} value={s.company_name}>{s.company_name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Delivery Date</label>
                                        <input
                                            required type="date"
                                            min={minDate} max={today}
                                            value={deliveryDate}
                                            onChange={(e) => setDeliveryDate(e.target.value)}
                                            className="w-full h-14 px-4 bg-muted rounded-xl font-bold outline-none border-2 border-transparent focus:border-foreground transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Add Product</label>
                                    <select
                                        className="w-full h-14 px-4 bg-foreground text-background rounded-xl font-bold outline-none"
                                        onChange={(e) => { if (e.target.value) addItemToDelivery(e.target.value); e.target.value = ""; }}
                                    >
                                        <option value="">Search products to add...</option>
                                        {freshProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>

                                {/* Items List */}
                                <div className="bg-muted rounded-2xl p-4 max-h-56 overflow-y-auto border border-border space-y-2">
                                    {selectedItems.length === 0 ? (
                                        <p className="text-center py-6 text-muted-foreground text-[10px] font-black uppercase">No products added yet</p>
                                    ) : selectedItems.map((item, idx) => (
                                        <div key={item.productId} className="space-y-1">
                                            <div className="flex items-center gap-3 bg-card p-3 rounded-xl border border-border">
                                                <span className="flex-1 font-black uppercase italic text-xs">{item.productName}</span>

                                                {/* ✅ Qty input with validation */}
                                                <div className="flex flex-col items-end gap-1">
                                                    <input
                                                        type="number" placeholder="Qty" required
                                                        max={MAX_QUANTITY} min={1}
                                                        className={cn(
                                                            "w-24 p-2 rounded-xl text-center font-bold text-sm border-2 outline-none transition-all",
                                                            itemQtyErrors[idx]
                                                                ? "border-destructive bg-destructive/10 text-destructive"
                                                                : "border-border bg-muted focus:border-foreground"
                                                        )}
                                                        onChange={(e) => updateItemRow(idx, 'quantity', parseInt(e.target.value))}
                                                    />
                                                </div>

                                                <input
                                                    type="number" step="0.01" required placeholder="Price"
                                                    className="w-28 p-2 border border-border rounded-xl text-center font-bold text-sm bg-muted focus:border-foreground outline-none transition-all text-emerald-600"
                                                    onChange={(e) => updateItemRow(idx, 'sellingPrice', parseFloat(e.target.value))}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedItems(selectedItems.filter((_, i) => i !== idx));
                                                        const newErr = { ...itemQtyErrors };
                                                        delete newErr[idx];
                                                        setItemQtyErrors(newErr);
                                                    }}
                                                    className="text-muted-foreground hover:text-destructive transition-all p-1.5"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                            {itemQtyErrors[idx] && (
                                                <div className="flex items-center gap-1.5 text-destructive text-[10px] font-bold ml-1">
                                                    <AlertCircle className="size-3" /> {itemQtyErrors[idx]}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div className="flex gap-4 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => { setIsAssignModalOpen(false); setItemQtyErrors({}); }}
                                        className="flex-1 h-14 font-black uppercase text-xs text-muted-foreground hover:text-foreground transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving || Object.keys(itemQtyErrors).length > 0}
                                        className="flex-1 h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black uppercase text-xs tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
                                    >
                                        {saving ? <Loader2 className="animate-spin mx-auto size-4" /> : "Assign Inventory"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL 2: QUICK EDIT ── */}
            {isEditModalOpen && editingProduct && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-card w-full max-w-lg rounded-[3rem] shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200">

                        {/* Product Image Banner */}
                        <div className="h-44 bg-muted relative group border-b border-border">
                            {editingProduct.image ? (
                                <img src={editingProduct.image} className="w-full h-full object-cover" alt="preview" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
                                    <ImageIcon className="w-14 h-14" />
                                </div>
                            )}
                            <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                <div className="bg-white text-black px-4 py-2 rounded-xl flex items-center gap-2 shadow-xl text-xs font-black uppercase">
                                    <Edit3 className="w-4 h-4" /> Change Image
                                </div>
                                <input
                                    type="file" accept="image/*" className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => setEditingProduct({ ...editingProduct, image: reader.result as string });
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                />
                            </label>
                            <div className="absolute bottom-3 left-4 bg-black/60 backdrop-blur px-3 py-1 rounded-lg flex items-center gap-2">
                                <Clock className="w-3 h-3 text-white/60" />
                                <span className="text-[9px] font-black uppercase text-white/80 tracking-wider">Quick Edit Mode</span>
                            </div>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="flex justify-between items-start">
                                <div className="flex-1 mr-4">
                                    <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-1">Product Name</p>
                                    <input
                                        type="text"
                                        value={editingProduct.name || ""}
                                        onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                                        className="w-full text-xl font-black uppercase italic tracking-tighter bg-transparent border-b-2 border-transparent focus:border-foreground outline-none transition-all"
                                    />
                                </div>
                                <button
                                    onClick={() => { setIsEditModalOpen(false); setQtyError(null); setPriceError(null); }}
                                    className="p-2.5 hover:bg-muted rounded-full transition-all"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>

                            <form onSubmit={handleQuickUpdateSubmit} className="space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Cost Price (read-only) */}
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Cost Price</label>
                                        <div className="h-14 px-4 flex items-center bg-muted rounded-xl border border-border font-bold text-muted-foreground text-sm">
                                            ₱{editingProduct.cost_price?.toLocaleString()}
                                        </div>
                                    </div>

                                    {/* Selling Price with validation */}
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Selling Price</label>
                                        <input
                                            type="number" step="0.01"
                                            value={editingProduct.selling_price || 0}
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value);
                                                setEditingProduct({ ...editingProduct, selling_price: val });
                                                setPriceError(val < editingProduct.cost_price ? "Selling price must be ≥ cost price." : null);
                                            }}
                                            className={cn(
                                                "w-full h-14 px-4 rounded-xl font-bold text-sm outline-none border-2 transition-all",
                                                priceError
                                                    ? "border-destructive bg-destructive/10 text-destructive"
                                                    : "border-transparent bg-muted focus:border-foreground"
                                            )}
                                        />
                                        {priceError && (
                                            <div className="flex items-center gap-1.5 text-destructive text-[10px] font-bold">
                                                <AlertCircle className="size-3" /> {priceError}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Quantity with validation */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Override Quantity</label>
                                        <span className="text-[9px] font-bold text-muted-foreground uppercase">Max: {MAX_QUANTITY.toLocaleString()}</span>
                                    </div>
                                    <input
                                        type="number" min={0} max={MAX_QUANTITY}
                                        value={editingProduct.quantity || 0}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value);
                                            setEditingProduct({ ...editingProduct, quantity: val });
                                            if (val > MAX_QUANTITY) setQtyError(`Maximum quantity is ${MAX_QUANTITY.toLocaleString()}.`);
                                            else if (val < 0) setQtyError("Cannot be negative.");
                                            else setQtyError(null);
                                        }}
                                        className={cn(
                                            "w-full h-14 px-4 rounded-xl font-black text-xl outline-none border-2 transition-all",
                                            qtyError
                                                ? "border-destructive bg-destructive/10 text-destructive"
                                                : "border-transparent bg-muted focus:border-foreground"
                                        )}
                                    />
                                    {qtyError && (
                                        <div className="flex items-center gap-1.5 text-destructive text-[10px] font-bold">
                                            <AlertCircle className="size-3" /> {qtyError}
                                        </div>
                                    )}
                                </div>

                                {/* Profit indicator + save button */}
                                <div className={cn(
                                    "p-5 rounded-2xl flex justify-between items-center transition-colors",
                                    !isPriceValid ? "bg-destructive" : "bg-foreground"
                                )}>
                                    <div>
                                        <p className="text-[8px] font-black text-white/50 uppercase tracking-[0.2em]">
                                            {!isPriceValid ? "⚠ Selling at a Loss" : "Est. Profit per Unit"}
                                        </p>
                                        <p className="text-white font-black italic text-lg">
                                            {!isPriceValid ? "-" : "+"} ₱{Math.abs(profit).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="h-8 w-px bg-white/20" />
                                    <button
                                        type="submit"
                                        disabled={!isPriceValid || !!qtyError || saving}
                                        className={cn(
                                            "font-black uppercase text-[10px] tracking-widest flex items-center gap-2 transition-all",
                                            !isPriceValid || !!qtyError || saving
                                                ? "text-white/30 cursor-not-allowed"
                                                : "text-emerald-400 hover:text-emerald-300 active:scale-95"
                                        )}
                                    >
                                        {saving
                                            ? <Loader2 className="animate-spin size-4" />
                                            : <><Save className="w-4 h-4" /> Update Everything</>
                                        }
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}