"use client"
import { useState, useEffect } from "react"
import { 
    Package, X, Search, 
    Loader2, Eye, EyeOff, 
    Image as ImageIcon, Filter, ArrowUpRight
} from "lucide-react"
import { Toaster, toast } from "sonner"
import { cn } from "@/lib/utils"

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
    supplier_name?: string;
}

export default function InventoryPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
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

    const handleToggleVisibility = async (prod: Product) => {
        const newVisibility = !prod.isVisible;
        setProducts(prev => prev.map(p => p._id === prod._id ? { ...p, isVisible: newVisibility } : p));
        
        try {
            const res = await fetch("/api/products", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: prod._id, isVisible: newVisibility })
            });
            if (!res.ok) throw new Error();
            toast.success(`${prod.name} updated`);
        } catch (error) {
            toast.error("Failed to update visibility");
            fetchData();
        }
    };

    const filteredTable = products.filter(p => 
        (p.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (p.category?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#F8F9FA] p-4 md:p-6 lg:p-10 font-sans text-slate-900 selection:bg-black selection:text-white">
            <Toaster position="bottom-center" richColors />

            <div className="max-w-[1300px] mx-auto space-y-6">
                
                {/* --- HEADER (Downsized) --- */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="h-[1px] w-6 bg-black"></span>
                            <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-slate-400">Inventory</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter leading-none text-slate-900">
                            Stock <br />
                        </h1>
                    </div>

                    <div className="flex gap-3 w-full lg:w-auto">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Search assets..." 
                                className="w-full sm:w-64 pl-10 pr-4 py-3 bg-white rounded-xl text-[11px] font-bold uppercase tracking-wider outline-none shadow-sm border border-slate-100 focus:border-black transition-all"
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button className="bg-black text-white px-4 rounded-xl hover:bg-zinc-800 transition-all shadow-md">
                            <Filter className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* --- TABLE SECTION (Refined) --- */}
                <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-50 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                    <th className="px-8 py-6">Product Details</th>
                                    <th className="px-8 py-6 text-center">Stock</th>
                                    <th className="px-8 py-6">Valuation</th>
                                    <th className="px-8 py-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="py-20 text-center">
                                            <Loader2 className="animate-spin w-6 h-6 text-slate-200 mx-auto" />
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTable.map((prod) => (
                                        <tr key={prod._id} className={cn(
                                            "group transition-all duration-300",
                                            !prod.isVisible ? "bg-slate-50/40" : "hover:bg-slate-50/50"
                                        )}>
                                            <td className="px-8 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="relative w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0 overflow-hidden">
                                                        {prod.image ? (
                                                            <img src={prod.image} className="w-full h-full object-cover" alt={prod.name} />
                                                        ) : (
                                                            <Package className="w-5 h-5 text-slate-300" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <span className="block font-bold text-slate-900 uppercase italic truncate text-base tracking-tight group-hover:text-orange-600 transition-colors">
                                                            {prod.name}
                                                        </span>
                                                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">
                                                            {prod.category}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-4 text-center">
                                                <span className={cn(
                                                    "inline-flex items-center justify-center min-w-[45px] py-1 rounded-lg font-bold text-xs",
                                                    (prod.quantity ?? 0) <= 5 ? "bg-red-50 text-red-500" : "bg-slate-100 text-slate-600"
                                                )}>
                                                    {prod.quantity ?? 0}
                                                </span>
                                            </td>
                                            <td className="px-8 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900 text-sm tracking-tight">
                                                        ₱{prod.selling_price?.toLocaleString()}
                                                    </span>
                                                    <span className={cn("text-[7px] font-black uppercase tracking-widest flex items-center gap-1", prod.isVisible ? "text-emerald-500" : "text-slate-300")}>
                                                        {prod.isVisible ? "Online" : "Hidden"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleToggleVisibility(prod)} className="p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                                                        {prod.isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-slate-300" />}
                                                    </button>
                                                    <button onClick={() => { setEditingProduct(prod); setIsEditModalOpen(true); }} className="p-2.5 bg-black text-white rounded-lg hover:bg-orange-600 transition-colors">
                                                        <ArrowUpRight className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* --- MODAL (Scaled Down) --- */}
            {isEditModalOpen && editingProduct && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden">
                        <div className="flex flex-col md:flex-row h-full max-h-[85vh]">
                            <div className="md:w-1/3 bg-slate-50 relative">
                                {editingProduct.image ? (
                                    <img src={editingProduct.image} className="w-full h-full object-cover" alt={editingProduct.name} />
                                ) : (
                                    <div className="w-full h-64 flex items-center justify-center text-slate-200"><ImageIcon size={40} /></div>
                                )}
                            </div>
                            <div className="md:w-2/3 p-8 flex flex-col justify-between">
                                <div className="space-y-6">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-orange-600 text-[8px] font-bold uppercase tracking-widest">{editingProduct.category}</p>
                                            <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">{editingProduct.name}</h2>
                                        </div>
                                        <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={18} /></button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 border-y border-slate-50 py-6">
                                        <div>
                                            <label className="text-[8px] font-bold uppercase text-slate-400 tracking-widest block mb-1">Price</label>
                                            <p className="text-xl font-black text-slate-900 italic">₱{editingProduct.selling_price?.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <label className="text-[8px] font-bold uppercase text-slate-400 tracking-widest block mb-1">Stock</label>
                                            <p className="text-xl font-black text-slate-900 italic">{editingProduct.quantity ?? 0}</p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500 leading-relaxed italic border-l-2 border-slate-900 pl-4">
                                        {editingProduct.description || "No description available."}
                                    </p>
                                </div>
                                <button onClick={() => setIsEditModalOpen(false)} className="mt-8 w-full py-4 bg-black text-white rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-zinc-800 transition-all">
                                    Close Preview
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}