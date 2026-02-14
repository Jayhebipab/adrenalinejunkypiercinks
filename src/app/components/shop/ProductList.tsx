"use client"
import { useState, useEffect } from "react"
import { 
    Package, X, Search, 
    Loader2, Eye, EyeOff, 
    Image as ImageIcon, Filter, ArrowUpRight, ChevronDown
} from "lucide-react"
import { Toaster, toast } from "sonner"
import { cn } from "@/lib/utils"

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

export default function InventoryPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("All");
    const [isFilterOpen, setIsFilterOpen] = useState(false);
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

        setProducts(prev =>
            prev.map(p =>
                p.id === prod.id ? { ...p, isVisible: newVisibility } : p
            )
        );

        try {
            const res = await fetch("/api/products", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: prod.id, isVisible: newVisibility })
            });

            if (!res.ok) throw new Error();
            toast.success(`${prod.name} updated`);
        } catch {
            toast.error("Failed to update visibility");
            fetchData();
        }
    };

    const categories = [
        "All",
        ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))
    ];

    const filteredTable = products.filter(p => {
        const matchesSearch =
            (p.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
            (p.category?.toLowerCase() || "").includes(searchTerm.toLowerCase());

        const matchesCategory =
            categoryFilter === "All" || p.category === categoryFilter;

        return matchesSearch && matchesCategory;
    });

    return (
        <div className="min-h-screen p-4 md:p-6 lg:p-10 font-sans
            text-slate-900 dark:text-slate-100
            selection:bg-black selection:text-white
            dark:selection:bg-white dark:selection:text-black">

            <Toaster position="bottom-center" richColors />

            <div className="max-w-[1300px] mx-auto space-y-6">

                {/* HEADER */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="h-[1px] w-6 bg-black dark:bg-white"></span>
                            <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
                                Inventory
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter leading-none text-slate-900 dark:text-white">
                            Stock Management
                        </h1>
                    </div>

                    <div className="flex gap-3 w-full lg:w-auto">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full sm:w-64 pl-10 pr-4 py-3
                                    bg-white dark:bg-zinc-900
                                    rounded-xl text-[11px] font-bold uppercase tracking-wider
                                    border border-slate-100 dark:border-zinc-800
                                    focus:border-black dark:focus:border-white
                                    outline-none transition-all"
                            />
                        </div>

                        {/* FILTER */}
                        <div className="relative">
                            <button
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className="bg-black dark:bg-white
                                    text-white dark:text-black
                                    px-4 py-3 rounded-xl
                                    hover:bg-zinc-800 dark:hover:bg-slate-200
                                    transition-all shadow-md flex items-center gap-2">
                                <Filter className="w-4 h-4" />
                                <ChevronDown className={cn("w-3 h-3 transition-transform", isFilterOpen && "rotate-180")} />
                            </button>

                            {isFilterOpen && (
                                <div className="absolute right-0 top-full mt-2 w-48
                                    bg-white dark:bg-zinc-900
                                    rounded-xl shadow-xl
                                    border border-slate-100 dark:border-zinc-800
                                    py-2 z-10">
                                    {categories.map((cat) => (
                                        <button
                                            key={cat}
                                            onClick={() => {
                                                setCategoryFilter(cat);
                                                setIsFilterOpen(false);
                                            }}
                                            className={cn(
                                                "w-full text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-colors",
                                                categoryFilter === cat
                                                    ? "bg-black text-white dark:bg-white dark:text-black"
                                                    : "hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-slate-300"
                                            )}>
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ACTIVE FILTER */}
                {categoryFilter !== "All" && (
                    <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                            Filtered by:
                        </span>
                        <div className="flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                            {categoryFilter}
                            <button onClick={() => setCategoryFilter("All")}>
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                )}

                {/* TABLE */}
                <div className="bg-white dark:bg-zinc-900
                    rounded-[2rem]
                    shadow-xl shadow-slate-200/40 dark:shadow-black/40
                    border border-slate-100 dark:border-zinc-800
                    overflow-hidden">

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-50 dark:border-zinc-800
                                    text-[9px] font-black uppercase tracking-widest
                                    text-slate-400 dark:text-slate-500">
                                    <th className="px-8 py-6">Product Details</th>
                                    <th className="px-8 py-6 text-center">Stock</th>
                                    <th className="px-8 py-6">Price</th>
                                    <th className="px-8 py-6 text-right">Actions</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-50 dark:divide-zinc-800">
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="py-20 text-center">
                                            <Loader2 className="animate-spin w-6 h-6 text-slate-200 dark:text-slate-600 mx-auto" />
                                        </td>
                                    </tr>
                                ) : filteredTable.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-20 text-center">
                                            <Package className="w-8 h-8 text-slate-200 dark:text-slate-600 mx-auto mb-2" />
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                                No products found
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTable.map((prod) => (
                                        <tr key={prod.id}
                                            className={cn(
                                                "group transition-all duration-300",
                                                !prod.isVisible
                                                    ? "bg-slate-50/40 dark:bg-zinc-800/40"
                                                    : "hover:bg-slate-50/50 dark:hover:bg-zinc-800/50"
                                            )}>
                                            <td className="px-8 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center border border-slate-200 dark:border-zinc-700 overflow-hidden">
                                                        {prod.image ? (
                                                            <img src={prod.image} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Package className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <span className="block font-bold text-slate-900 dark:text-white uppercase italic tracking-tight">
                                                            {prod.name}
                                                        </span>
                                                        <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                                                            {prod.category}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-8 py-4 text-center">
                                                <span className={cn(
                                                    "inline-flex items-center justify-center min-w-[45px] py-1 rounded-lg font-bold text-xs",
                                                    (prod.quantity ?? 0) <= 5
                                                        ? "bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-400"
                                                        : "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-slate-300"
                                                )}>
                                                    {prod.quantity ?? 0}
                                                </span>
                                            </td>

                                            <td className="px-8 py-4">
                                                <span className="font-bold text-slate-900 dark:text-white text-sm">
                                                    ₱{prod.selling_price?.toLocaleString()}
                                                </span>
                                            </td>

                                            <td className="px-8 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleToggleVisibility(prod)}
                                                        className="p-2.5 rounded-lg border border-slate-100 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800">
                                                        {prod.isVisible
                                                            ? <Eye className="w-3.5 h-3.5" />
                                                            : <EyeOff className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />}
                                                    </button>
                                                    <button
                                                        onClick={() => { setEditingProduct(prod); setIsEditModalOpen(true); }}
                                                        className="p-2.5 bg-black dark:bg-white text-white dark:text-black rounded-lg">
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

            {/* FULL MODAL */}
            {isEditModalOpen && editingProduct && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-3xl rounded-[2rem] shadow-2xl dark:shadow-black/40 overflow-hidden">
                        <div className="flex flex-col md:flex-row">

                            {/* IMAGE SIDE */}
                            <div className="md:w-1/3 bg-slate-50 dark:bg-zinc-800 relative">
                                {editingProduct.image ? (
                                    <img src={editingProduct.image} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-64 flex items-center justify-center text-slate-200 dark:text-slate-600">
                                        <ImageIcon size={40} />
                                    </div>
                                )}
                            </div>

                            {/* DETAILS SIDE */}
                            <div className="md:w-2/3 p-8 flex flex-col justify-between">
                                <div className="space-y-6">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-orange-600 text-[8px] font-bold uppercase tracking-widest">
                                                {editingProduct.category}
                                            </p>
                                            <h2 className="text-2xl font-black uppercase italic tracking-tight text-slate-900 dark:text-white">
                                                {editingProduct.name}
                                            </h2>
                                        </div>
                                        <button onClick={() => setIsEditModalOpen(false)}>
                                            <X />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 border-y border-slate-50 dark:border-zinc-800 py-6">
                                        <div>
                                            <label className="text-[8px] font-bold uppercase text-slate-400 dark:text-slate-500 tracking-widest block mb-1">
                                                Price
                                            </label>
                                            <p className="text-xl font-black text-slate-900 dark:text-white italic">
                                                ₱{editingProduct.selling_price?.toLocaleString()}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-[8px] font-bold uppercase text-slate-400 dark:text-slate-500 tracking-widest block mb-1">
                                                Stock
                                            </label>
                                            <p className="text-xl font-black text-slate-900 dark:text-white italic">
                                                {editingProduct.quantity ?? 0}
                                            </p>
                                        </div>
                                    </div>

                                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic border-l-2 border-slate-900 dark:border-white pl-4">
                                        {editingProduct.description || "No description available."}
                                    </p>
                                </div>

                                <button
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="mt-8 w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-zinc-800 dark:hover:bg-slate-200 transition-all">
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
