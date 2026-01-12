"use client"
import { useState, useEffect } from "react"
import { 
    Package, Plus, X, Search, Building2, Calendar, 
    Trash2, Save, Tag, Loader2, Edit3, ShoppingCart, 
    ChevronRight, AlertCircle
} from "lucide-react"
import { Toaster, toast } from "sonner"

// --- INTERFACES ---
interface Product {
    _id: string;
    name: string;
    category: string;
    cost_price: number;
    selling_price?: number;
    quantity?: number;
    supplier_name?: string;
    image?: string;
}

interface Supplier {
    _id: string;
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

    // --- DATE VALIDATION (2 weeks past) ---
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
        const prod = products.find(p => p._id === productId);
        if (!prod) return;
        if (selectedItems.find(i => i.productId === productId)) return toast.warning("Already in list");
        
        setSelectedItems([...selectedItems, {
            productId: prod._id,
            productName: prod.name,
            quantity: 1,
            sellingPrice: 0
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

        try {
            const res = await fetch("/api/inventory", {
                method: "PUT", // O gamitin ang PATCH kung iyon ang setup mo
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: editingProduct._id,
                    quantity: editingProduct.quantity,
                    sellingPrice: editingProduct.selling_price
                })
            });

            if (res.ok) {
                toast.success("Stock updated successfully!");
                setIsEditModalOpen(false);
                fetchData();
            }
        } catch (error) {
            toast.error("Failed to update product");
        }
    };

    // Filters
    const freshProducts = products.filter(p => !p.quantity || p.quantity === 0);
    const filteredTable = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans text-slate-900">
            <Toaster position="top-right" richColors />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* HEADER SECTION */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-8 rounded-4xl shadow-sm border border-slate-100 gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-slate-900 rounded-2xl text-white shadow-xl">
                            <Package className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black uppercase italic tracking-tighter">Inventory Control</h1>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Assign Companies & Manage Stocks</p>
                        </div>
                    </div>
                    <div className="flex w-full md:w-auto gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="text" placeholder="Search product..." 
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl text-sm font-bold outline-none focus:ring-2 ring-slate-900 transition-all"
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button 
                            onClick={() => setIsAssignModalOpen(true)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 transition-transform active:scale-95 shadow-lg shadow-emerald-100"
                        >
                            <Plus className="w-4 h-4" /> Assign New
                        </button>
                    </div>
                </div>

                {/* MAIN TABLE */}
                <div className="bg-white rounded-4xl shadow-sm border border-slate-100 overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                <th className="px-8 py-6">Product & Last Supplier</th>
                                <th className="px-8 py-6 text-center">Stock Level</th>
                                <th className="px-8 py-6">Selling Price</th>
                                <th className="px-8 py-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr><td colSpan={4} className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-slate-300" /></td></tr>
                            ) : filteredTable.map((prod) => (
                                <tr key={prod._id} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-400 overflow-hidden border">
                                                {prod.image ? <img src={prod.image} className="w-full h-full object-cover" /> : prod.name.charAt(0)}
                                            </div>
                                            <div>
                                                <span className="block font-black text-slate-800 uppercase italic leading-none mb-1">{prod.name}</span>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                    {prod.supplier_name || "Unassigned"}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        <div className={`inline-block px-4 py-1.5 rounded-xl font-black text-lg italic ${ (prod.quantity || 0) > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500' }`}>
                                            {prod.quantity || 0}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="font-black text-slate-700">₱{prod.selling_price?.toLocaleString() || "0.00"}</span>
                                    </td>
                                    <td className="px-8 py-5 text-right">
<button 
    onClick={() => { 
        setEditingProduct(prod); // Dapat i-set muna yung data
        setIsEditModalOpen(true); // Saka bubuksan yung modal
    }}
    className="p-3 bg-slate-50 hover:bg-slate-900 hover:text-white rounded-xl text-slate-400 transition-all active:scale-90"
>
    <Edit3 className="w-4 h-4" />
</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* MODAL 1: ASSIGN COMPANY & STOCK */}
                {isAssignModalOpen && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-4xl rounded-4xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
                            <div className="p-10 space-y-6">
                                <div className="flex justify-between items-center border-b pb-6">
                                    <h2 className="text-2xl font-black uppercase italic tracking-tighter">Assign Company Assignment</h2>
                                    <button onClick={() => setIsAssignModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full"><X /></button>
                                </div>

                                <form onSubmit={handleAssignSubmit} className="space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Select Supplier</label>
                                            <select required value={selectedSupplier} onChange={(e)=>setSelectedSupplier(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none focus:ring-2 ring-emerald-500">
                                                <option value="">Choose...</option>
                                                {suppliers.map(s => <option key={s._id} value={s.company_name}>{s.company_name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Delivery Date (Within 2 Weeks)</label>
                                            <input required type="date" min={minDate} max={today} value={deliveryDate} onChange={(e)=>setDeliveryDate(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none focus:ring-2 ring-emerald-500" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Add Product (Unassigned Only)</label>
                                        <select className="w-full p-4 bg-slate-900 text-white rounded-2xl font-bold outline-none" onChange={(e)=>{ if(e.target.value) addItemToDelivery(e.target.value); e.target.value = ""; }}>
                                            <option value="">Search unassigned products...</option>
                                            {freshProducts.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                                        </select>
                                    </div>

                                    <div className="bg-slate-50 rounded-3xl p-4 max-h-52 overflow-y-auto border border-slate-100 space-y-2">
                                        {selectedItems.length === 0 ? (
                                            <p className="text-center py-6 text-slate-400 text-[10px] font-black uppercase">No products added</p>
                                        ) : selectedItems.map((item, idx) => (
                                            <div key={item.productId} className="flex items-center gap-4 bg-white p-3 rounded-2xl shadow-sm">
                                                <span className="flex-1 font-black uppercase italic text-xs">{item.productName}</span>
                                                <input type="number" placeholder="Qty" className="w-20 p-2 border rounded-xl text-center font-bold" onChange={(e)=>updateItemRow(idx, 'quantity', parseInt(e.target.value))} />
                                                <input type="number" step="0.01" placeholder="Price" className="w-28 p-2 border rounded-xl text-center font-bold text-emerald-600" onChange={(e)=>updateItemRow(idx, 'sellingPrice', parseFloat(e.target.value))} />
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

                {/* MODAL 2: QUICK UPDATE (QTY & PRICE) */}
                {isEditModalOpen && editingProduct && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-md rounded-4xl shadow-2xl p-10 space-y-6 animate-in zoom-in duration-200">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-black uppercase italic tracking-tighter">Edit Product Stock</h2>
                                <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full"><X /></button>
                            </div>

                            <form onSubmit={handleQuickUpdateSubmit} className="space-y-4">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] font-black uppercase text-slate-400">Selected Product</p>
                                    <p className="font-black text-slate-800 uppercase italic text-lg">{editingProduct.name}</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Override Quantity</label>
                                    <input type="number" value={editingProduct.quantity || 0} onChange={(e)=>setEditingProduct({...editingProduct, quantity: parseInt(e.target.value)})} className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold focus:ring-2 ring-slate-900" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Selling Price (₱)</label>
                                    <input type="number" step="0.01" value={editingProduct.selling_price || 0} onChange={(e)=>setEditingProduct({...editingProduct, selling_price: parseFloat(e.target.value)})} className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold focus:ring-2 ring-emerald-500 text-emerald-600" />
                                </div>
                                <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl">Update Inventory</button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}