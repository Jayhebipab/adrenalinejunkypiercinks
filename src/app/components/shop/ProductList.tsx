"use client"
import { useState, useEffect, useRef } from "react"
import { 
    Package, X, Search, Edit3, 
    Loader2, Eye, EyeOff, ShoppingBag, Clock, Plus, Image as ImageIcon
} from "lucide-react"
import { Toaster, toast } from "sonner"
import { cn } from "@/lib/utils"

// --- INTERFACES ---
interface Product {
    _id: string;
    name: string;
    category: string;
    description?: string;
    cost_price: number;
    selling_price?: number;
    quantity?: number;
    image?: string;
    isVisible?: boolean; 
    updatedAt?: string;
}

export default function InventoryPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            const resProd = await fetch("/api/products");
            const dataProd = await resProd.json();
            if (Array.isArray(dataProd)) setProducts(dataProd);
        } catch (err) {
            toast.error("Error loading products");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // --- LOGIC: TOGGLE VISIBILITY (SHOW/HIDE) ---
    // In-update para sa /api/products para ma-update ang isVisible field
    const handleToggleVisibility = async (prod: Product) => {
        const newVisibility = !prod.isVisible;
        
        // Optimistic UI Update (Para mabilis ang response sa user)
        setProducts(prev => prev.map(p => p._id === prod._id ? { ...p, isVisible: newVisibility } : p));
        
        try {
            const res = await fetch("/api/products", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    id: prod._id, 
                    isVisible: newVisibility 
                })
            });
            
            if (res.ok) {
                toast.success(`${prod.name} is now ${newVisibility ? 'Visible' : 'Hidden'}`);
            } else {
                throw new Error();
            }
        } catch (error) {
            toast.error("Failed to update visibility");
            fetchData(); // I-refresh ang data kung nagka-error sa sync
        }
    };

    // --- LOGIC: IMAGE UPLOAD ---
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast.error("Image too large. Max 2MB.");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setEditingProduct(prev => prev ? { ...prev, image: reader.result as string } : null);
            };
            reader.readAsDataURL(file);
        }
    };
const handleQuickUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
        const res = await fetch("/api/products", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: editingProduct._id,
                image: editingProduct.image,
                description: editingProduct.description,
                quantity: editingProduct.quantity,
                sellingPrice: editingProduct.selling_price, // Siguraduhing ito ang key
                isVisible: editingProduct.isVisible
            })
        });

        if (res.ok) {
            toast.success("Saved successfully!");
            setIsEditModalOpen(false);
            fetchData();
        }
    } catch (error) {
        toast.error("Error updating product");
    }
};
    // FIXED: Added optional chaining (?.) and fallback string ('') para maiwasan ang "null toLowerCase" error
    const filteredTable = products.filter(p => 
        (p.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (p.category?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#F8F9FA] p-4 md:p-10 font-sans text-slate-900">
            <Toaster position="top-right" richColors />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* HEADER */}
                <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100 gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-black rounded-2xl text-white shadow-xl flex-shrink-0">
                            <ShoppingBag className="w-6 h-6 md:w-8 md:h-8" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter">Inventory Control</h1>
                            <p className="text-slate-400 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em]">Manage Product Specs & Visibility</p>
                        </div>
                    </div>
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" placeholder="Search product..." 
                            className="w-full pl-11 pr-4 py-4 bg-slate-50 rounded-2xl text-sm font-bold outline-none focus:ring-2 ring-black transition-all border-none"
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* TABLE SECTION */}
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[800px]">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <th className="px-8 py-6">Product</th>
                                    <th className="px-8 py-6 text-center">Stock Level</th>
                                    <th className="px-8 py-6">Price & Status</th>
                                    <th className="px-8 py-6 text-right">Controls</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr><td colSpan={4} className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-slate-300" /></td></tr>
                                ) : filteredTable.map((prod) => (
                                    <tr key={prod._id} className={cn(
                                        "group transition-all",
                                        !prod.isVisible ? "bg-slate-50/50 opacity-60" : "hover:bg-slate-50/50"
                                    )}>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center border overflow-hidden flex-shrink-0 shadow-sm">
                                                    {prod.image ? <img src={prod.image} className="w-full h-full object-cover" /> : <Package className="text-slate-300" />}
                                                </div>
                                                <div className="max-w-[200px]">
                                                    <span className="block font-black text-slate-800 uppercase italic truncate leading-tight">{prod.name || "Unnamed Product"}</span>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate block">{prod.category || "General"}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <div className={cn(
                                                "inline-block px-4 py-1.5 rounded-xl font-black text-lg italic",
                                                (prod.quantity || 0) <= 5 ? "bg-red-500 text-white animate-pulse" : "bg-zinc-900 text-white"
                                            )}>
                                                {prod.quantity || 0}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex flex-col">
                                                <span className="font-black text-slate-800">₱{prod.selling_price?.toLocaleString()}</span>
                                                <span className={cn("text-[9px] font-black uppercase mt-1 flex items-center gap-1", prod.isVisible ? "text-emerald-500" : "text-slate-400")}>
                                                    <div className={cn("w-1 h-1 rounded-full", prod.isVisible ? "bg-emerald-500" : "bg-slate-300")} />
                                                    {prod.isVisible ? "Visible in Shop" : "Hidden"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleToggleVisibility(prod)} className={cn("p-3 rounded-xl transition-all active:scale-90 border shadow-sm", prod.isVisible ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-100 text-slate-400")}>
                                                    {prod.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                                </button>
                                                <button onClick={() => { setEditingProduct(prod); setIsEditModalOpen(true); }} className="p-3 bg-black text-white rounded-xl active:scale-90 shadow-md">
                                                    <Edit3 className="w-4 h-4" />
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

            {/* MODAL */}
            {isEditModalOpen && editingProduct && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h2 className="text-2xl font-black uppercase italic tracking-tighter">Manage Media & Data</h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-2 mt-1">
                                    <Clock size={12}/> Updated: {editingProduct.updatedAt ? new Date(editingProduct.updatedAt).toLocaleDateString() : 'Never'}
                                </p>
                            </div>
                            <button onClick={() => setIsEditModalOpen(false)} className="p-3 hover:bg-white rounded-full transition-all border shadow-sm"><X /></button>
                        </div>

                        <form onSubmit={handleQuickUpdateSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                            <div className="grid md:grid-cols-2 gap-8">
                                {/* Left: Image */}
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Product Media</label>
                                    <div 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="aspect-square rounded-3xl bg-slate-100 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative group cursor-pointer shadow-inner"
                                    >
                                        {editingProduct.image ? (
                                            <img src={editingProduct.image} className="w-full h-full object-cover" />
                                        ) : (
                                            <ImageIcon className="w-10 h-10 text-slate-300" />
                                        )}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <p className="text-white text-[10px] font-black uppercase tracking-widest">Upload New</p>
                                        </div>
                                    </div>
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
                                    <p className="text-[9px] font-bold text-slate-400 uppercase text-center">Click image to update</p>
                                </div>

                                {/* Right: Inputs */}
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Item Name (Read Only)</label>
                                        <input value={editingProduct.name} readOnly className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-slate-400 cursor-not-allowed outline-none border-none" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Selling Price</label>
                                            <input 
                                                type="number" 
                                                value={editingProduct.selling_price} 
                                                onChange={(e) => setEditingProduct({...editingProduct, selling_price: parseFloat(e.target.value)})}
                                                className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none focus:ring-2 ring-emerald-500 text-emerald-600 outline-none" 
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Stock Level</label>
                                            <input 
                                                type="number" 
                                                value={editingProduct.quantity} 
                                                onChange={(e) => setEditingProduct({...editingProduct, quantity: parseInt(e.target.value)})}
                                                className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none focus:ring-2 ring-black outline-none" 
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Specs / Description</label>
                                        <textarea 
                                            rows={3} 
                                            value={editingProduct.description || ""} 
                                            onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                                            className="w-full p-4 bg-slate-50 rounded-2xl font-medium text-sm border-none focus:ring-2 ring-black outline-none resize-none" 
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-5 font-black uppercase text-[10px] tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Discard</button>
                                <button type="submit" className="flex-[2] py-5 bg-black text-white rounded-[2rem] font-black uppercase text-[10px] tracking-[0.3em] shadow-2xl hover:bg-zinc-800 active:scale-95 transition-all">Save All Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}