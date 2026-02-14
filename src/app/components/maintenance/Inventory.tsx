"use client"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils";
import { 
    Package, Plus, X, Search, Building2, Calendar, 
    Trash2, Save, Tag, Loader2, Edit3, ShoppingCart, 
    ChevronRight, AlertCircle, Image as ImageIcon, Clock 
} from "lucide-react"
import { Toaster, toast } from "sonner"

// --- INTERFACES (Updated for Firebase) ---
interface Product {
    id: string; // Firebase uses 'id' instead of '_id'
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

export default function InventoryPage() {
    // --- STATES ---
    const [products, setProducts] = useState<Product[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Modals
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Assignment Form
    const [selectedSupplier, setSelectedSupplier] = useState("");
    const [deliveryDate, setDeliveryDate] = useState("");
    const [selectedItems, setSelectedItems] = useState<DeliveryItem[]>([]);

    // Quick Update Form
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    // --- DATE VALIDATION ---
    const today = new Date().toISOString().split('T')[0];
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const minDate = twoWeeksAgo.toISOString().split('T')[0];

    // --- DATA FETCHING ---
    const fetchData = async () => {
        try {
            setLoading(true);
            const [resProd, resSupp] = await Promise.all([
                fetch("/api/products"),
                fetch("/api/suppliers")
            ]);
            const dataProd = await resProd.json();
            const dataSupp = await resSupp.json();
            
            // Firebase returns array with 'id'
            if (Array.isArray(dataProd)) setProducts(dataProd);
            if (Array.isArray(dataSupp)) setSuppliers(dataSupp);
        } catch (err) {
            toast.error("Error loading data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // --- LOGIC FUNCTIONS ---
    const addItemToDelivery = (productId: string) => {
        const prod = products.find(p => p.id === productId);
        if (!prod) return;
        if (selectedItems.find(i => i.productId === productId)) return toast.warning("Already in list");
        
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
    };

    const handleAssignSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSupplier || !deliveryDate || selectedItems.length === 0) {
            return toast.error("Please fill up all fields");
        }

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
                setIsAssignModalOpen(false);
                setSelectedItems([]);
                setSelectedSupplier("");
                fetchData();
            }
        } catch (error) {
            toast.error("Failed to save assignment");
        }
    };

    const handleQuickUpdateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProduct) return;

        toast.promise(async () => {
            // STEP 1: Basic Info update (Products Collection)
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

            // STEP 2: Stock & Price update (Inventory Logic)
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

            setIsEditModalOpen(false);
            fetchData(); 
        }, {
            loading: 'Syncing updates...',
            success: 'Inventory updated successfully!',
            error: (err) => `Sync failed: ${err.message}`,
        });
    };

    // Filters
    const freshProducts = products.filter(p => !p.quantity || p.quantity === 0);
    const filteredTable = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="min-h-screen p-6 md:p-10 font-sans text-slate-900">
            <Toaster position="top-right" richColors />

            <div className="max-w-7xl mx-auto space-y-6">
               {/* HEADER SECTION */}
<div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 md:p-8 rounded-3xl md:rounded-4xl shadow-sm border border-slate-100 gap-4">
    <div className="flex items-center gap-3 md:gap-4">
        <div className="p-3 md:p-4 bg-slate-900 rounded-xl md:rounded-2xl text-white shadow-xl">
            <Package className="w-6 h-6 md:w-8 md:h-8" />
        </div>
        <div>
            <h1 className="text-xl md:text-3xl font-black uppercase italic tracking-tighter">Inventory Control</h1>
            <p className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-widest">Assign Companies & Manage Stocks</p>
        </div>
    </div>
    
    <div className="flex flex-col sm:flex-row w-full md:w-auto gap-2">
        <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
                type="text" 
                placeholder="Search product..." 
                className="w-full pl-10 pr-4 py-2.5 md:py-3 bg-slate-50 rounded-xl text-sm font-bold outline-none focus:ring-2 ring-slate-900 transition-all"
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        <button 
            onClick={() => setIsAssignModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 md:py-3 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-emerald-100"
        >
            <Plus className="w-4 h-4" /> Assign New
        </button>
    </div>
</div>

{/* MAIN TABLE WITH RESPONSIVE OVERFLOW */}
<div className="bg-white rounded-3xl md:rounded-4xl shadow-sm border border-slate-100 overflow-hidden">
    {/* Eto yung wrapper para sa horizontal scroll sa mobile */}
   <div className="overflow-x-auto">
  <table className="w-full text-left min-w-[700px] border-separate border-spacing-0">
    <thead>
      <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
        <th className="px-6 md:px-8 py-4 md:py-6">Product & Last Supplier</th>
        <th className="px-6 md:px-8 py-4 md:py-6 text-center">Stock Level</th>
        <th className="px-6 md:px-8 py-4 md:py-6">Selling Price</th>
        <th className="px-6 md:px-8 py-4 md:py-6 text-right">Actions</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-slate-50">
      {loading ? (
        <tr>
          <td colSpan={4} className="py-20 text-center">
            <Loader2 className="animate-spin mx-auto text-slate-300" />
          </td>
        </tr>
      ) : (
        filteredTable.map((prod) => (
          <tr key={prod.id || prod.id} className="group hover:bg-slate-50/50 transition-colors">
            <td className="px-6 md:px-8 py-4 md:py-5">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-400 overflow-hidden border border-slate-200 flex-shrink-0">
                  {prod.image ? (
                    <img src={prod.image} className="w-full h-full object-cover" alt={prod.name} />
                  ) : (
                    <span className="uppercase">{prod.name.charAt(0)}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <span className="block font-black text-slate-800 uppercase italic leading-none mb-1 truncate text-sm md:text-base">
                    {prod.name}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block truncate">
                    {prod.supplier_name || "Unassigned"}
                  </span>
                </div>
              </div>
            </td>
            <td className="px-6 md:px-8 py-4 md:py-5 text-center">
              <div className={cn(
                "inline-block px-3 md:px-4 py-1 rounded-lg md:rounded-xl font-black text-sm md:text-lg italic transition-all duration-300 border",
                (prod.quantity || 0) <= 5 
                  ? "bg-red-100 text-red-600 border-red-200 animate-pulse" 
                  : (prod.quantity || 0) <= 20 
                    ? "bg-orange-100 text-orange-600 border-orange-200" 
                    : "bg-emerald-100 text-emerald-600 border-emerald-200"
              )}>
                {prod.quantity || 0}
              </div>
            </td>
            <td className="px-6 md:px-8 py-4 md:py-5">
              <span className="font-black text-slate-700 text-sm md:text-base">
                ₱{Number(prod.selling_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </td>
<td className="px-6 md:px-8 py-4 md:py-5 text-right">
  <button 
    // DISABLED kapag WALANG supplier (Unassigned). 
    // ENABLED kapag MAY supplier na.
    disabled={!prod.supplier_name} 
    onClick={() => { 
      setEditingProduct(prod);
      setIsEditModalOpen(true);
    }}
    className={cn(
      "p-2 md:p-3 rounded-lg md:rounded-xl transition-all active:scale-90",
      prod.supplier_name 
        ? "bg-slate-50 hover:bg-slate-900 hover:text-white text-slate-400 cursor-pointer" 
        : "bg-slate-100 text-slate-300 cursor-not-allowed opacity-50" // Style para sa Unassigned
    )}
    title={!prod.supplier_name ? "Assign a supplier first to edit" : "Edit product"}
  >
    <Edit3 className="w-4 h-4" />
  </button>
</td>
          </tr>
        ))
      )}
    </tbody>
  </table>
</div>
</div>

                {/* MODAL 1: ASSIGN COMPANY & STOCK */}
                {isAssignModalOpen && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-4xl rounded-4xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
                            <div className="p-10 space-y-6">
                                <div className="flex justify-between items-center border-b pb-6">
                                    <h2 className="text-2xl font-black uppercase italic tracking-tighter">New Delivery Assignment</h2>
                                    <button onClick={() => setIsAssignModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full"><X /></button>
                                </div>

                                <form onSubmit={handleAssignSubmit} className="space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Select Supplier</label>
                                            <select required value={selectedSupplier} onChange={(e)=>setSelectedSupplier(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none focus:ring-2 ring-emerald-500">
                                                <option value="">Choose...</option>
                                                {suppliers.map(s => <option key={s.id} value={s.company_name}>{s.company_name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Delivery Date</label>
                                            <input required type="date" min={minDate} max={today} value={deliveryDate} onChange={(e)=>setDeliveryDate(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none focus:ring-2 ring-emerald-500" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Add Product</label>
                                        <select className="w-full p-4 bg-slate-900 text-white rounded-2xl font-bold outline-none" onChange={(e)=>{ if(e.target.value) addItemToDelivery(e.target.value); e.target.value = ""; }}>
                                            <option value="">Search products...</option>
                                            {freshProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    </div>

                                    <div className="bg-slate-50 rounded-3xl p-4 max-h-52 overflow-y-auto border border-slate-100 space-y-2">
                                        {selectedItems.length === 0 ? (
                                            <p className="text-center py-6 text-slate-400 text-[10px] font-black uppercase">No products added</p>
                                        ) : selectedItems.map((item, idx) => (
                                            <div key={item.productId} className="flex items-center gap-4 bg-white p-3 rounded-2xl shadow-sm">
                                                <span className="flex-1 font-black uppercase italic text-xs">{item.productName}</span>
                                                <input type="number" placeholder="Qty" required className="w-20 p-2 border rounded-xl text-center font-bold" onChange={(e)=>updateItemRow(idx, 'quantity', parseInt(e.target.value))} />
                                                <input type="number" step="0.01" required placeholder="Price" className="w-28 p-2 border rounded-xl text-center font-bold text-emerald-600" onChange={(e)=>updateItemRow(idx, 'sellingPrice', parseFloat(e.target.value))} />
                                                <button type="button" onClick={()=>setSelectedItems(selectedItems.filter((_, i)=>i!==idx))} className="text-red-400 hover:text-red-600 p-2"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <button type="button" onClick={() => setIsAssignModalOpen(false)} className="flex-1 py-4 font-black uppercase text-xs text-slate-400">Cancel</button>
                                        <button type="submit" className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Assign Inventory</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL 2: QUICK UPDATE (QTY, PRICE, IMAGE, NAME & LAST UPDATE) */}
{isEditModalOpen && editingProduct && (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-lg rounded-4xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            
            {/* Product Preview Section */}
            <div className="h-48 bg-slate-100 relative group border-b">
                {editingProduct.image ? (
                    <img src={editingProduct.image} className="w-full h-full object-cover" alt="preview" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <ImageIcon className="w-16 h-16" />
                    </div>
                )}
                
                <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                    <div className="bg-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-xl scale-90 group-hover:scale-100 transition-transform">
                        <Edit3 className="w-4 h-4 text-slate-900" />
                        <span className="text-xs font-black uppercase text-slate-900">Change Image</span>
                    </div>
                    <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                    setEditingProduct({...editingProduct, image: reader.result as string});
                                };
                                reader.readAsDataURL(file);
                            }
                        }}
                    />
                </label>

                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-lg flex items-center gap-2 shadow-sm border border-slate-200">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span className="text-[9px] font-black uppercase text-slate-600 tracking-wider">
                        Quick Edit Mode
                    </span>
                </div>
            </div>

            <div className="p-10 space-y-6">
                <div className="flex justify-between items-start">
                    <div className="w-full mr-4">
                        <h2 className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest ml-1">Product Details</h2>
                        <input 
                            type="text"
                            value={editingProduct.name || ""}
                            onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                            placeholder="Enter product name..."
                            className="w-full text-2xl font-black uppercase italic tracking-tighter leading-none bg-transparent border-b-2 border-transparent focus:border-slate-900 outline-none transition-all"
                        />
                        
                    </div>
                    <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X /></button>
                </div>

                <form onSubmit={handleQuickUpdateSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Cost Price (Puhunan)</label>
                            <div className="w-full p-4 bg-slate-100 rounded-2xl font-bold text-slate-500 border border-slate-200">
                                ₱{editingProduct.cost_price?.toLocaleString()}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Selling Price (₱)</label>
                            <input 
                                type="number" step="0.01" 
                                value={editingProduct.selling_price || 0} 
                                onChange={(e)=>setEditingProduct({...editingProduct, selling_price: parseFloat(e.target.value)})} 
                                className={`w-full p-4 rounded-2xl outline-none font-bold focus:ring-2 transition-all ${
                                    (editingProduct.selling_price || 0) < (editingProduct.cost_price || 0) 
                                    ? "bg-red-50 ring-red-500 text-red-600 border-red-100" 
                                    : "bg-emerald-50 ring-emerald-500 text-emerald-600 border-emerald-100"
                                }`} 
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Override Quantity</label>
                        <input 
                            type="number" 
                            value={editingProduct.quantity || 0} 
                            onChange={(e)=>setEditingProduct({...editingProduct, quantity: parseInt(e.target.value)})} 
                            className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-black text-xl focus:ring-2 ring-slate-900 border border-slate-100" 
                        />
                    </div>

                    <div className={`p-4 rounded-2xl flex justify-between items-center shadow-lg transition-colors ${
                        (editingProduct.selling_price || 0) < (editingProduct.cost_price || 0) 
                        ? "bg-red-600" 
                        : "bg-slate-900"
                    }`}>
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black text-white/50 uppercase tracking-[0.2em]">
                                {(editingProduct.selling_price || 0) < (editingProduct.cost_price || 0) ? "Warning: Loss" : "Est. Profit"}
                            </span>
                            <span className="text-white font-black italic">
                                ₱{((editingProduct.selling_price || 0) - (editingProduct.cost_price || 0)).toLocaleString()}
                            </span>
                        </div>

                        <div className="h-8 w-[1px] bg-white/20"></div>

                        <button 
                            type="submit" 
                            disabled={(editingProduct.selling_price || 0) < (editingProduct.cost_price || 0)}
                            className={`font-black uppercase text-[10px] tracking-widest flex items-center gap-2 transition-all ${
                                (editingProduct.selling_price || 0) < (editingProduct.cost_price || 0)
                                ? "text-white/30 cursor-not-allowed"
                                : "text-emerald-400 hover:text-emerald-300 active:scale-95"
                            }`}
                        >
                            <Save className="w-4 h-4" /> 
                            {(editingProduct.selling_price || 0) < (editingProduct.cost_price || 0) ? "Invalid Price" : "Update Everything"}
                        </button>
                    </div>
                    
{(editingProduct.selling_price || 0) < (editingProduct.cost_price || 0) && (
    <p className="text-red-500 text-[9px] font-black uppercase text-center mt-2 tracking-tighter">
        ⚠️ Cannot save! Selling price must be higher than the cost price.
    </p>
)}
                </form>
            </div>
        </div>
    </div>
)}

            </div>
        </div>
    );
}