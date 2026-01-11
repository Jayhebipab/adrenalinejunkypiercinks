"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Trash2, Edit3, Search, RotateCcw, Plus, X,
    Loader2, Package, Tag, ImageIcon, UploadCloud
} from "lucide-react"
import { Toaster, toast } from "sonner"

// --- INTERFACES ---
interface Product {
    _id: string;
    name: string;
    category: string;
    cost_price: number;
    image?: string;
}

interface Category {
    _id: string;
    category_name: string; // Dapat saktong ganito ang spelling
    createdAt?: string;
}



export default function ProductManagement() {
    // --- STATES ---
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [search, setSearch] = useState("");
    const [fetching, setFetching] = useState(true);

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [currentProduct, setCurrentProduct] = useState<Product | null>(null);

    const [formData, setFormData] = useState({
        name: "",
        category: "",
        cost_price: "",
        image: ""
    });

    // --- 1. FETCH DATA (Products & Categories) ---
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

    useEffect(() => {
        fetchData();
    }, []);

    // --- 2. IMAGE HANDLER (Base64) ---
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

    // --- 3. ACTIONS (Add, Update, Delete) ---
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
            setFormData({ name: "", category: "", cost_price: "", image: "" });
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
                    image: currentProduct.image
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
        if (!confirm(`Delete ${name}? This cannot be undone.`)) return;

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

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-4 md:p-8 bg-gray-50 min-h-screen text-slate-900 font-sans">
            <Toaster position="top-right" richColors />

            <div className="max-w-6xl mx-auto space-y-6">
                {/* HEADER SECTION */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200">
                            <Package className="text-white w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight">Products</h1>
                            <p className="text-slate-500 text-sm">Inventory & Stock Control</p>
                        </div>
                    </div>
                    <Button onClick={() => setIsAddOpen(true)} className="bg-slate-900 hover:bg-black text-white rounded-2xl h-14 px-8 shadow-xl transition-all">
                        <Plus className="w-5 h-5 mr-2" /> Add Product
                    </Button>
                </div>

                {/* SEARCH BAR */}
                <div className="bg-white p-2 rounded-3xl shadow-sm border border-gray-100 flex items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search items or categories..."
                            className="w-full bg-transparent border-none rounded-2xl px-6 py-5 pl-14 outline-none text-lg"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Button onClick={() => setSearch("")} variant="ghost" className="rounded-2xl h-14 px-6 mr-2">
                        <RotateCcw className="w-4 h-4" />
                    </Button>
                </div>

                {/* MAIN TABLE */}
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-gray-100 text-slate-400 uppercase text-[10px] font-black tracking-[0.2em]">
                                <th className="px-8 py-6">Product Details</th>
                                <th className="px-8 py-6">Category</th>
                                <th className="px-8 py-6">Cost Price</th>
                                <th className="px-8 py-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {fetching ? (
                                <tr><td colSpan={4} className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-500 w-10 h-10" /></td></tr>
                            ) : filteredProducts.map((prod) => (
                                <tr key={prod._id} className="group hover:bg-slate-50/50 transition-all">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 rounded-2xl bg-gray-100 border border-gray-200 overflow-hidden shrink-0 shadow-inner">
                                                {prod.image ? (
                                                    <img src={prod.image} className="w-full h-full object-cover" alt={prod.name} />
                                                ) : (
                                                    <ImageIcon className="w-full h-full p-4 text-gray-300" />
                                                )}
                                            </div>
                                            <div>
                                                <span className="font-black text-slate-800 text-lg block leading-none mb-1 uppercase tracking-tight">{prod.name}</span>
                                                <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded">Verified Stock</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold uppercase">
                                            <Tag className="w-3 h-3" /> {prod.category}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-lg font-black text-slate-900">
                                        ₱{Number(prod.cost_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex justify-end gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                            <Button onClick={() => { setCurrentProduct(prod); setIsEditOpen(true); }} size="sm" variant="ghost" className="rounded-xl hover:bg-amber-50 text-amber-600"><Edit3 className="w-5 h-5" /></Button>
                                            <Button onClick={() => handleDelete(prod._id, prod.name)} size="sm" variant="ghost" className="rounded-xl hover:bg-red-50 text-red-600"><Trash2 className="w-5 h-5" /></Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- ADD MODAL --- */}
            {isAddOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl p-10 animate-in zoom-in duration-300 relative max-h-[90vh] overflow-y-auto">
                        <h2 className="text-3xl font-black mb-8 tracking-tighter">New Item</h2>
                        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-full">
                                <label className="relative group cursor-pointer block border-4 border-dashed border-gray-100 hover:border-blue-400 rounded-4xl p-4 transition-all text-center">
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'add')} />
                                    {formData.image ? (
                                        <img src={formData.image} className="h-40 mx-auto rounded-2xl object-cover" alt="Preview" />
                                    ) : (
                                        <div className="py-8">
                                            <UploadCloud className="w-12 h-12 mx-auto text-gray-300 group-hover:text-blue-500 mb-2" />
                                            <p className="text-sm font-bold text-gray-400">Upload Product Photo</p>
                                        </div>
                                    )}
                                </label>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase text-slate-400 ml-2 tracking-widest">Product Name</label>
                                <input type="text" className="w-full bg-gray-50 rounded-2xl px-6 py-4 outline-none focus:ring-2 ring-blue-500" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase text-slate-400 ml-2 tracking-widest">Category</label>
                                <select
                                    className="w-full bg-gray-50 rounded-2xl px-6 py-4 outline-none focus:ring-2 ring-blue-500 appearance-none cursor-pointer text-slate-900"
                                    value={isAddOpen ? formData.category : currentProduct?.category || ""}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (isAddOpen) {
                                            setFormData({ ...formData, category: val });
                                        } else if (currentProduct) {
                                            setCurrentProduct({ ...currentProduct, category: val });
                                        }
                                    }}
                                >
                                    <option value="" className="text-slate-400">-- Pili ng Category --</option>

                                    {/* Siguraduhin na may laman ang categories bago i-map */}
                                    {categories && categories.length > 0 ? (
                                        categories.map((cat) => (
                                            <option key={cat._id} value={cat.category_name} className="text-slate-900">
                                                {cat.category_name}
                                            </option>
                                        ))
                                    ) : (
                                        <option disabled>Loading categories...</option>
                                    )}
                                </select>
                            </div>
                            <div className="col-span-full space-y-2">
                                <label className="text-xs font-black uppercase text-slate-400 ml-2 tracking-widest">Cost Price (₱)</label>
                                <input type="number" step="0.01" className="w-full bg-gray-50 rounded-2xl px-6 py-4 outline-none text-2xl font-black" value={formData.cost_price} onChange={e => setFormData({ ...formData, cost_price: e.target.value })} />
                            </div>
                            <div className="col-span-full flex gap-3 pt-4">
                                <Button type="button" variant="ghost" className="flex-1 h-16 rounded-2xl font-black uppercase tracking-widest" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                                <Button type="submit" className="flex-1 h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-200">Save Product</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- EDIT MODAL --- */}
            {isEditOpen && currentProduct && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl p-10 animate-in zoom-in duration-300 relative max-h-[90vh] overflow-y-auto">
                        <h2 className="text-3xl font-black mb-8 tracking-tighter text-amber-600">Update Item</h2>
                        <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-full">
                                <label className="relative group cursor-pointer block border-4 border-dashed border-gray-100 hover:border-amber-400 rounded-4xl p-4 transition-all text-center">
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'edit')} />
                                    {currentProduct.image ? (
                                        <img src={currentProduct.image} className="h-40 mx-auto rounded-2xl object-cover" alt="Preview" />
                                    ) : (
                                        <div className="py-8">
                                            <UploadCloud className="w-12 h-12 mx-auto text-gray-300 group-hover:text-amber-500 mb-2" />
                                            <p className="text-sm font-bold text-gray-400">Change Product Photo</p>
                                        </div>
                                    )}
                                </label>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase text-slate-400 ml-2 tracking-widest">Product Name</label>
                                <input type="text" className="w-full bg-gray-50 rounded-2xl px-6 py-4 outline-none focus:ring-2 ring-amber-500" value={currentProduct.name} onChange={e => setCurrentProduct({ ...currentProduct, name: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase text-slate-400 ml-2 tracking-widest">Category</label>
                                <select 
  className="w-full bg-gray-50 rounded-2xl px-6 py-4 outline-none focus:ring-2 ring-amber-500 appearance-none cursor-pointer" 
  value={currentProduct.category} 
  onChange={e => setCurrentProduct({ ...currentProduct, category: e.target.value })}
>
  <option value="">Select Category</option>
  {/* Check if categories exists before mapping */}
  {categories && categories.length > 0 ? (
    categories.map((c) => (
      <option key={c._id} value={c.category_name}>
        {c.category_name}
      </option>
    ))
  ) : (
    <option disabled>No categories found</option>
  )}
</select>
                            </div>
                            <div className="col-span-full space-y-2">
                                <label className="text-xs font-black uppercase text-slate-400 ml-2 tracking-widest">Cost Price (₱)</label>
                                <input type="number" step="0.01" className="w-full bg-gray-50 rounded-2xl px-6 py-4 outline-none text-2xl font-black" value={currentProduct.cost_price} onChange={e => setCurrentProduct({ ...currentProduct, cost_price: Number(e.target.value) })} />
                            </div>
                            <div className="col-span-full flex gap-3 pt-4">
                                <Button type="button" variant="ghost" className="flex-1 h-16 rounded-2xl font-black uppercase tracking-widest" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                                <Button type="submit" className="flex-1 h-16 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-amber-200">Update Changes</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}