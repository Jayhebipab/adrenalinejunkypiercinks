"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Trash2, Edit3, Search, RotateCcw, Plus, X,
    Loader2, Package, Tag, ImageIcon, UploadCloud, Filter, ChevronDown, AlignLeft
} from "lucide-react"
import { Toaster, toast } from "sonner"

// --- INTERFACES ---
interface Product {
    _id: string;
    name: string;
    category: string;
    cost_price: number;
    image?: string;
    description: string; // Siguradong nandito
}

interface Category {
    _id: string;
    category_name: string;
    createdAt?: string;
}

export default function ProductManagement() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [fetching, setFetching] = useState(true);

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [currentProduct, setCurrentProduct] = useState<Product | null>(null);

    const [formData, setFormData] = useState({
        name: "",
        category: "",
        cost_price: "",
        image: "",
        description: "" // Initial state for Add
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
            toast.error("Failed to load data from server");
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, mode: 'add' | 'edit') => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                if (mode === 'add') setFormData({ ...formData, image: base64String });
                else if (currentProduct) setCurrentProduct({ ...currentProduct, image: base64String });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.category || !formData.cost_price) {
            return toast.warning("Complete all required fields!");
        }

        toast.promise(async () => {
            const res = await fetch("/api/products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            if (!res.ok) throw new Error();
            setFormData({ name: "", category: "", cost_price: "", image: "", description:"" });
            setIsAddOpen(false);
            fetchData();
        }, {
            loading: 'Saving product...',
            success: 'Product added successfully!',
            error: 'Failed to save product',
        });
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentProduct) return;

        toast.promise(async () => {
            const res = await fetch(`/api/products`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: currentProduct._id,
                    name: currentProduct.name,
                    category: currentProduct.category,
                    cost_price: currentProduct.cost_price,
                    image: currentProduct.image,
                    description: currentProduct.description // DAGDAG ITO PARA GUMANA SA UPDATE
                }),
            });
            if (!res.ok) throw new Error();
            setIsEditOpen(false);
            fetchData();
        }, {
            loading: 'Updating product...',
            success: 'Product updated!',
            error: 'Update failed',
        });
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Delete ${name}?`)) return;
        toast.promise(async () => {
            const res = await fetch("/api/products", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });
            if (!res.ok) throw new Error();
            fetchData();
        }, {
            loading: 'Deleting...',
            success: 'Deleted!',
            error: 'Delete failed',
        });
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="p-4 md:p-8 bg-zinc-50 min-h-screen text-black font-sans">
            <Toaster position="top-right" richColors />

            <div className="max-w-6xl mx-auto space-y-6">
                
                {/* HEADER SECTION */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-4xl shadow-sm border border-zinc-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-black rounded-2xl shadow-xl">
                            <Package className="text-white w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black tracking-tighter uppercase italic text-black leading-none">Tattoo Works</h1>
                            <p className="text-zinc-400 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Inventory Management</p>
                        </div>
                    </div>
                    <Button onClick={() => setIsAddOpen(true)} className="bg-black hover:bg-zinc-800 text-white rounded-2xl h-14 px-8 font-black uppercase text-xs tracking-widest transition-all active:scale-95 shadow-2xl">
                        <Plus className="w-5 h-5 mr-2" /> Add Product
                    </Button>
                </div>

                {/* SEARCH & FILTER BAR */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-3 bg-white p-2 rounded-3xl shadow-sm border border-zinc-100 flex items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                            <input
                                type="text"
                                placeholder="Search by product name..."
                                className="w-full bg-transparent border-none px-6 py-4 pl-14 outline-none text-lg font-bold placeholder:text-zinc-300"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="relative bg-white p-2 rounded-3xl shadow-sm border border-zinc-100 flex items-center px-4 group">
                        <Filter className="w-5 h-5 text-zinc-400 mr-3" />
                        <select 
                            className="w-full bg-transparent outline-none font-black uppercase text-[10px] tracking-widest cursor-pointer appearance-none pr-8"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                            <option value="All">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat._id} value={cat.category_name}>{cat.category_name}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-6 w-4 h-4 text-zinc-400 pointer-events-none group-hover:text-black transition-colors" />
                    </div>
                </div>

                {/* MAIN TABLE */}
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-zinc-100 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-zinc-50 border-b border-zinc-100 text-zinc-400 uppercase text-[10px] font-black tracking-[0.2em]">
                                <th className="px-8 py-6">Item Details</th>
                                <th className="px-8 py-6">Category</th>
                                <th className="px-8 py-6">Cost Price</th>
                                <th className="px-8 py-6 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50">
                            {fetching ? (
                                <tr><td colSpan={4} className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-black w-10 h-10" /></td></tr>
                            ) : filteredProducts.length > 0 ? (
                                filteredProducts.map((prod) => (
                                    <tr key={prod._id} className="group hover:bg-zinc-50/50 transition-all">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 rounded-2xl bg-zinc-100 border border-zinc-200 overflow-hidden shrink-0 shadow-inner">
                                                    {prod.image ? (
                                                        <img src={prod.image} className="w-full h-full object-cover" alt={prod.name} />
                                                    ) : (
                                                        <ImageIcon className="w-full h-full p-4 text-zinc-300" />
                                                    )}
                                                </div>
                                                <div>
                                                    <span className="font-black text-black text-lg block leading-none mb-1 uppercase tracking-tighter italic">{prod.name}</span>
                                                    <p className="text-[9px] text-zinc-400 font-bold uppercase line-clamp-1 max-w-[200px]">{prod.description || "No description"}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-zinc-100 text-black text-[10px] font-black uppercase tracking-widest border border-zinc-200">
                                                <Tag className="w-3 h-3 text-zinc-400" /> {prod.category}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-xl font-black text-black italic">
                                            ₱{Number(prod.cost_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button onClick={() => { setCurrentProduct(prod); setIsEditOpen(true); }} size="sm" variant="ghost" className="rounded-xl hover:bg-zinc-100 text-black border border-transparent hover:border-zinc-200 transition-all"><Edit3 className="w-5 h-5" /></Button>
                                                <Button onClick={() => handleDelete(prod._id, prod.name)} size="sm" variant="ghost" className="rounded-xl hover:bg-red-50 text-red-600 transition-all"><Trash2 className="w-5 h-5" /></Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="py-24 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <Package className="w-12 h-12 text-zinc-100" />
                                            <p className="font-black text-zinc-300 uppercase text-xs tracking-[0.2em]">No Items found</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- ADD MODAL --- */}
            {isAddOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl p-10 animate-in zoom-in duration-300 relative max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-3xl font-black tracking-tighter uppercase italic">Register Item</h2>
                            <button onClick={() => setIsAddOpen(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors"><X className="w-6 h-6" /></button>
                        </div>
                        <form onSubmit={handleAdd} className="space-y-6">
                            <label className="relative group cursor-pointer block border-4 border-dashed border-zinc-100 hover:border-black rounded-4xl p-6 transition-all text-center bg-zinc-50/50">
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'add')} />
                                {formData.image ? (
                                    <img src={formData.image} className="h-48 mx-auto rounded-2xl object-cover shadow-2xl" alt="Preview" />
                                ) : (
                                    <div className="py-6">
                                        <UploadCloud className="w-12 h-12 mx-auto text-zinc-300 group-hover:text-black mb-3 transition-colors" />
                                        <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Drop Product Visuals Here</p>
                                    </div>
                                )}
                            </label>

                            <div className="grid grid-cols-1 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-zinc-400 ml-2 tracking-widest">Product Title</label>
                                    <input type="text" placeholder="e.g. Dynamic Black Ink" className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 outline-none focus:ring-2 ring-black font-bold" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                </div>
                                {/* DESCRIPTION INPUT SA ADD */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-zinc-400 ml-2 tracking-widest">Description</label>
                                    <textarea rows={3} placeholder="Add product details..." className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 outline-none focus:ring-2 ring-black font-bold resize-none" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-zinc-400 ml-2 tracking-widest">Category</label>
                                    <div className="relative">
                                        <select className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 outline-none focus:ring-2 ring-black font-bold appearance-none cursor-pointer" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                            <option value="">Choose Category</option>
                                            {categories.map(c => <option key={c._id} value={c.category_name}>{c.category_name}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-zinc-400 ml-2 tracking-widest">Cost Price (₱)</label>
                                    <input type="number" step="0.01" placeholder="0.00" className="w-full bg-zinc-900 text-white rounded-2xl px-8 py-4 outline-none font-black italic shadow-inner" value={formData.cost_price} onChange={e => setFormData({ ...formData, cost_price: e.target.value })} />
                                </div>
                            </div>

                            <Button type="submit" className="w-full h-18 bg-black hover:bg-zinc-800 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl py-8 transition-all active:scale-95">Complete Registration</Button>
                        </form>
                    </div>
                </div>
            )}

            {/* --- EDIT MODAL --- */}
            {isEditOpen && currentProduct && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl p-10 animate-in zoom-in duration-300 relative max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-3xl font-black tracking-tighter uppercase italic text-black">Modify Item</h2>
                            <button onClick={() => setIsEditOpen(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors"><X className="w-6 h-6" /></button>
                        </div>
                        <form onSubmit={handleUpdate} className="space-y-6">
                            <label className="relative group cursor-pointer block border-4 border-dashed border-zinc-100 hover:border-black rounded-4xl p-6 transition-all text-center bg-zinc-50">
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'edit')} />
                                {currentProduct.image ? (
                                    <img src={currentProduct.image} className="h-48 mx-auto rounded-2xl object-cover shadow-xl" alt="Preview" />
                                ) : (
                                    <div className="py-6">
                                        <UploadCloud className="w-12 h-12 mx-auto text-zinc-300 group-hover:text-black mb-2" />
                                        <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Upload New Visual</p>
                                    </div>
                                )}
                            </label>

                            <div className="grid grid-cols-1 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-zinc-400 ml-2 tracking-widest">Product Title</label>
                                    <input type="text" className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 outline-none focus:ring-2 ring-black font-bold" value={currentProduct.name} onChange={e => setCurrentProduct({ ...currentProduct, name: e.target.value })} />
                                </div>
                                {/* DAGDAG NA DESCRIPTION FIELD SA EDIT */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-zinc-400 ml-2 tracking-widest">Description</label>
                                    <textarea rows={3} className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 outline-none focus:ring-2 ring-black font-bold resize-none" value={currentProduct.description} onChange={e => setCurrentProduct({ ...currentProduct, description: e.target.value })} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-zinc-400 ml-2 tracking-widest">Category</label>
                                    <div className="relative">
                                        <select className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 outline-none focus:ring-2 ring-black font-bold appearance-none cursor-pointer" value={currentProduct.category} onChange={e => setCurrentProduct({ ...currentProduct, category: e.target.value })}>
                                            {categories.map(c => <option key={c._id} value={c.category_name}>{c.category_name}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-zinc-400 ml-2 tracking-widest">Price Point (₱)</label>
                                    <input type="number" step="0.01" className="w-full bg-zinc-900 text-white rounded-2xl px-8 py-4 outline-none font-black italic" value={currentProduct.cost_price} onChange={e => setCurrentProduct({ ...currentProduct, cost_price: Number(e.target.value) })} />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <Button type="button" variant="ghost" className="flex-1 h-16 rounded-2xl font-black uppercase tracking-widest text-[10px] border border-zinc-100" onClick={() => setIsEditOpen(false)}>Discard</Button>
                                <Button type="submit" className="flex-2 h-16 bg-black hover:bg-zinc-800 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl px-12 transition-all active:scale-95">Update Database</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}