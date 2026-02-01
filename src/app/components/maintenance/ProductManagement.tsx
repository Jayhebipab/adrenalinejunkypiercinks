"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { 
    Trash2, Edit3, Search, RotateCcw, Plus, X, 
    Loader2, Package, Tag, ImageIcon, UploadCloud, ChevronDown 
} from "lucide-react"
import { Toaster, toast } from "sonner"

// --- INTERFACES ---
interface Product {
    id: string;
    name: string;
    category: string;
    cost_price: number;
    image?: string;
    description: string;
}

interface Category {
    id: string;
    category_name: string;
}

export default function ProductManagement() {
    // --- STATES ---
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [fetching, setFetching] = useState(true);
    const [isUploading, setIsUploading] = useState(false);

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [currentProduct, setCurrentProduct] = useState<Product | null>(null);

    const [formData, setFormData] = useState({
        name: "", category: "", cost_price: "", image: "", description: ""
    });

    // --- DATA SYNC ---
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

    // --- IMAGE LOGIC ---
    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>, mode: 'add' | 'edit') => {
        const file = e.target.files?.[0];
        if (!file) return;
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
            toast.success("Visual Secured.");
        } catch (error) {
            toast.error("Cloud upload failed.");
        } finally {
            setIsUploading(false);
        }
    };

const handleAction = async (e: React.FormEvent, type: 'POST' | 'PUT') => {
    e.preventDefault();
    
    // Tukuyin kung ano ang gagamiting payload
    const payload = type === 'POST' ? formData : currentProduct;

    toast.promise(async () => {
        const res = await fetch("/api/products", {
            method: type,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        const result = await res.json();

        // KUNG HINDI OK ANG RESPONSE (Dito mahuhuli yung "Product Name already exists")
        if (!res.ok) {
            // Itatapon natin ang error message para lumabas sa toast.error
            throw new Error(result.error || "Action failed");
        }
        
        // Kung tagumpay, isara ang mga modals at i-reset
        setIsAddOpen(false);
        setIsEditOpen(false);
        setFormData({ name: "", category: "", cost_price: "", image: "", description: "" });
        
        // I-refresh ang listahan
        fetchData();
        
        return result;
    }, {
        loading: 'Syncing Matrix...',
        success: 'Registry Updated!',
        error: (err) => err.message, // Dito lalabas yung "Product Label already exists..."
    });
};

const handleDelete = async (id: string, name: string) => {
  // 1. Double check muna para hindi aksidente
  if (!confirm(`ARE YOU SURE YOU WANT TO PURGE ${name.toUpperCase()}?`)) return;

  // 2. Gamit ang toast.promise para sa better UX
  toast.promise(
    async () => {
      const res = await fetch("/api/products", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }), // Ipinapasa natin ang ID sa API
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to purge record.");
      }

      // 3. I-refresh ang data sa table matapos ang successful delete
      fetchData(); 
      return data;
    },
    {
      loading: `Purging ${name.toUpperCase()} from the matrix...`,
      success: (data) => `${name.toUpperCase()} has been successfully deleted.`,
      error: (err) => `Error: ${err.message}`,
    }
  );
};

    const filtered = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="h-screen bg-white flex flex-col overflow-hidden font-sans italic antialiased text-zinc-900">
            <Toaster position="bottom-right" richColors />

            <div className="max-w-6xl mx-auto w-full flex flex-col h-full p-4 md:p-8 space-y-6">
                
{/* PRODUCT HEADER - THE CREW STYLE WITH REFRESH */}
<header className="flex flex-col md:flex-row justify-between items-center bg-zinc-900 p-10 rounded-[2.5rem] text-white shadow-2xl gap-6 mb-8">
    <div className="flex items-center gap-5">
        {/* Shield Icon - Stylized */}
        <div className="p-4 bg-white rounded-3xl -rotate-6 shadow-xl shrink-0">
            <Package size={32} className="text-black" />
        </div>
        
        <div>
            <div className="flex items-center gap-3">
                <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none">
                    The Products
                </h1>
                {/* REFRESH BUTTON INTEGRATION */}
                <button 
                    onClick={fetchData} 
                    disabled={fetching}
                    className="mt-1 hover:text-white text-zinc-600 transition-colors disabled:opacity-30"
                >
                    <RotateCcw 
                        size={18} 
                        className={fetching ? "animate-spin" : "active:rotate-180 transition-all duration-500"} 
                    />
                </button>
            </div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.4em] mt-1">
                Inventory
            </p>
        </div>
    </div>

    {/* ADD ITEM BUTTON - MATCHING "ADD NEW ARTIST" STYLE */}
    <Button 
        onClick={() => setIsAddOpen(true)} 
        className="bg-white text-black hover:bg-zinc-200 rounded-2xl h-14 px-10 font-black uppercase text-xs tracking-widest shadow-xl transition-all active:scale-95 border-none"
    >
        <Plus size={20} className="mr-3"/> Add New Item
    </Button>
</header>
                {/* SEARCH & FILTER AREA */}
                <div className="flex flex-col md:flex-row gap-3 shrink-0">
                    <div className="flex-1 relative group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" size={20} />
                        <input 
                            type="text" 
                            placeholder="SCAN PRODUCT DATABASE..." 
                            className="w-full bg-zinc-50 border border-zinc-200 rounded-3xl py-5 pl-14 pr-8 text-sm outline-none focus:ring-4 ring-zinc-900/5 focus:bg-white transition-all font-bold uppercase tracking-widest shadow-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="relative md:w-64">
                        <select 
                            className="w-full bg-zinc-50 border border-zinc-200 rounded-3xl py-5 px-8 text-[10px] font-black uppercase tracking-widest outline-none appearance-none cursor-pointer shadow-sm"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                            <option value="All">All Categories</option>
                            {categories.map(cat => <option key={cat.id} value={cat.category_name}>{cat.category_name}</option>)}
                        </select>
                        <ChevronDown size={16} className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                    </div>
                </div>

              {/* DATA TABLE AREA */}
<div className="border border-zinc-100 rounded-[3rem] bg-white shadow-sm flex-1 overflow-hidden flex flex-col">
  <div className="overflow-y-auto flex-1 custom-scrollbar">
    <table className="w-full text-left border-collapse min-w-[800px]">
      <thead className="sticky top-0 bg-zinc-50 z-10 border-b border-zinc-100 text-zinc-400 uppercase text-[10px] font-black tracking-[0.3em]">
        <tr>
          <th className="px-10 py-6">Product Details</th>
          <th className="px-10 py-6">Category</th>
          <th className="px-10 py-6">Costing</th>
          <th className="px-10 py-6 text-right">Access</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-zinc-50 font-bold uppercase tracking-tight">
        {fetching ? (
          /* FIX: Added unique key for loading state */
          <tr key="table-loading">
            <td colSpan={4} className="py-24 text-center">
              <Loader2 className="animate-spin mx-auto w-10 h-10 text-zinc-200" />
            </td>
          </tr>
        ) : filtered.length === 0 ? (
          /* FIX: Added unique key for empty state */
          <tr key="table-empty">
            <td colSpan={4} className="py-24 text-center text-zinc-300 text-xs tracking-widest italic">
              Zero Nodes Found
            </td>
          </tr>
        ) : (
          filtered.map((prod, index) => (
            /* FIX: Ensure key is unique; fallback to index if prod.id is missing */
            <tr key={prod.id || `prod-${index}`} className="hover:bg-zinc-50/50 transition-colors group">
              <td className="px-10 py-5">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-zinc-100 overflow-hidden shadow-sm border border-zinc-200 shrink-0">
                    {prod.image ? (
                      <img src={prod.image} className="w-full h-full object-cover" alt={prod.name} />
                    ) : (
                      <ImageIcon size={20} className="m-auto h-full text-zinc-300" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-black tracking-tighter">{prod.name}</span>
                    <span className="text-[9px] text-zinc-400 italic lowercase truncate max-w-[200px]">
                      {prod.description || "no description"}
                    </span>
                  </div>
                </div>
              </td>
              <td className="px-10 py-5">
                <span className="px-3 py-1.5 rounded-xl bg-zinc-100 text-[9px] font-black tracking-widest border border-zinc-200">
                  <Tag size={10} className="inline mr-1 mb-0.5" /> {prod.category}
                </span>
              </td>
              <td className="px-10 py-5 text-sm font-black italic">
                ₱{Number(prod.cost_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </td>
              <td className="px-10 py-5 text-right">
                <div className="flex justify-end gap-3 opacity-40 group-hover:opacity-100 transition-opacity">
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={() => { setCurrentProduct(prod); setIsEditOpen(true); }} 
                    className="h-10 w-10 rounded-xl hover:bg-zinc-900 hover:text-white"
                  >
                    <Edit3 size={18} />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={() => handleDelete(prod.id, prod.name)} 
                    className="h-10 w-10 rounded-xl hover:bg-red-600 hover:text-white text-zinc-300"
                  >
                    <Trash2 size={18} />
                  </Button>
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

            {/* MODAL - SM COMPACT SCALE */}
            {(isAddOpen || isEditOpen) && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm p-10 space-y-6 animate-in fade-in zoom-in duration-300 border border-zinc-200 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xs font-black uppercase tracking-[0.3em]">{isAddOpen ? "Register Item" : "Modify Item"}</h2>
                            <button onClick={() => { setIsAddOpen(false); setIsEditOpen(false); }} className="text-zinc-300 hover:text-zinc-900 transition-colors"><X size={24}/></button>
                        </div>
                        
                        <form onSubmit={(e) => handleAction(e, isAddOpen ? 'POST' : 'PUT')} className="space-y-4">
                            {/* Image Upload */}
                            <label className={`relative cursor-pointer block border-2 border-dashed rounded-3xl p-4 transition-all text-center bg-zinc-50 ${isUploading ? 'opacity-50' : 'hover:border-zinc-900 border-zinc-100'}`}>
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, isAddOpen ? 'add' : 'edit')} disabled={isUploading} />
                                {isUploading ? (
                                    <div className="py-2"><Loader2 className="animate-spin mx-auto w-6 h-6 text-zinc-900" /></div>
                                ) : (isAddOpen ? formData.image : currentProduct?.image) ? (
                                    <img src={isAddOpen ? formData.image : currentProduct?.image} className="h-20 mx-auto rounded-xl object-cover" />
                                ) : (
                                    <div className="py-2">
                                        <UploadCloud size={24} className="mx-auto text-zinc-300 mb-1" />
                                        <p className="text-[8px] font-black uppercase text-zinc-400">Upload Visual</p>
                                    </div>
                                )}
                            </label>

                            <div className="space-y-1.5">
                                <label className="text-[8px] font-black uppercase text-zinc-400 tracking-widest ml-1">Product Title</label>
                                <input required className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-5 py-4 text-xs font-bold outline-none focus:ring-2 ring-zinc-900 transition-all uppercase" value={isAddOpen ? formData.name : currentProduct?.name} onChange={e => isAddOpen ? setFormData({...formData, name: e.target.value}) : setCurrentProduct({...currentProduct!, name: e.target.value})} />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[8px] font-black uppercase text-zinc-400 tracking-widest ml-1">Category</label>
                                <select required className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-5 py-4 text-[10px] font-bold outline-none uppercase cursor-pointer" value={isAddOpen ? formData.category : currentProduct?.category} onChange={e => isAddOpen ? setFormData({...formData, category: e.target.value}) : setCurrentProduct({...currentProduct!, category: e.target.value})}>
                                    <option value="">Select Category</option>
                                    {categories.map(c => <option key={c.id} value={c.category_name}>{c.category_name}</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[8px] font-black uppercase text-zinc-400 tracking-widest ml-1">Cost (₱)</label>
                                    <input required type="number" step="0.01" className="w-full bg-zinc-900 text-white rounded-2xl px-5 py-4 text-xs font-bold outline-none" value={isAddOpen ? formData.cost_price : currentProduct?.cost_price} onChange={e => isAddOpen ? setFormData({...formData, cost_price: e.target.value}) : setCurrentProduct({...currentProduct!, cost_price: Number(e.target.value)})} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[8px] font-black uppercase text-zinc-400 tracking-widest ml-1">Description</label>
                                    <input className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-5 py-4 text-xs font-bold outline-none uppercase" value={isAddOpen ? formData.description : currentProduct?.description} onChange={e => isAddOpen ? setFormData({...formData, description: e.target.value}) : setCurrentProduct({...currentProduct!, description: e.target.value})} />
                                </div>
                            </div>
                            
                            <Button type="submit" disabled={isUploading} className="w-full h-14 bg-zinc-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-all mt-4">
                                Commit Record
                            </Button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}