"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { 
  Trash2, Edit3, Search, RotateCcw, Plus, X, 
  Loader2, Wrench, Boxes, Tag, Banknote 
} from "lucide-react"
import { Toaster, toast } from "sonner"

interface Equipment {
  _id: string;
  name: string;
  category: string;
  cost_price: number;
  quantity: number;
}

export default function EquipmentMaintenance() {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [search, setSearch] = useState("");
  const [fetching, setFetching] = useState(true);
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [currentEquip, setCurrentEquip] = useState<Equipment | null>(null);
  
  const [formData, setFormData] = useState({ 
    name: "", 
    category: "", 
    cost_price: 0, 
    quantity: 0 
  });

  const fetchEquipments = async () => {
    setFetching(true);
    try {
      const res = await fetch("/api/equipments");
      const data = await res.json();
      if (Array.isArray(data)) setEquipments(data);
    } catch (err) {
      toast.error("Failed to load records.");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => { fetchEquipments(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    toast.promise(async () => {
      const res = await fetch("/api/equipments", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error();
      setFormData({ name: "", category: "", cost_price: 0, quantity: 0 });
      setIsAddOpen(false);
      fetchEquipments();
    }, {
      loading: 'Saving equipment...',
      success: 'Equipment added!',
      error: 'Failed to save',
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEquip) return;
    toast.promise(async () => {
      const res = await fetch(`/api/equipments`, {
        method: "PUT",
        body: JSON.stringify({ 
          id: currentEquip._id, 
          name: currentEquip.name,
          category: currentEquip.category,
          cost_price: Number(currentEquip.cost_price),
          quantity: Number(currentEquip.quantity)
        }),
      });
      if (!res.ok) throw new Error();
      setIsEditOpen(false);
      fetchEquipments();
    }, {
      loading: 'Updating...',
      success: 'Updated successfully!',
      error: 'Update failed',
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Burahin na ba ito?")) return;
    toast.promise(async () => {
      const res = await fetch("/api/equipments", {
        method: "DELETE",
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error();
      fetchEquipments();
    }, {
      loading: 'Deleting...',
      success: 'Equipment removed!',
      error: 'Delete failed',
    });
  };

  const filtered = equipments.filter(e => 
    e.name.toLowerCase().includes(search.toLowerCase()) || 
    e.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen text-slate-900">
      <Toaster position="top-right" richColors />

      <div className="max-w-6xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-100">
              <Wrench className="text-white w-7 h-7" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight">Equipment</h1>
              <p className="text-slate-500 text-sm">Maintain studio tools and assets.</p>
            </div>
          </div>
          <Button onClick={() => setIsAddOpen(true)} className="bg-slate-900 hover:bg-black text-white rounded-2xl h-14 px-8 shadow-xl">
            <Plus className="w-5 h-5 mr-2" /> Add Equipment
          </Button>
        </div>

        {/* SEARCH */}
        <div className="bg-white p-2 rounded-3xl shadow-sm border border-gray-100 flex items-center">
          <div className="relative flex-1">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search equipment or category..."
              className="w-full bg-transparent border-none rounded-2xl px-6 py-5 pl-14 outline-none text-lg"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button onClick={() => setSearch("")} variant="ghost" className="rounded-2xl h-14 px-6 mr-2"><RotateCcw className="w-4 h-4" /></Button>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-100 text-slate-400 uppercase text-[10px] font-black tracking-widest">
                <th className="px-8 py-6">Item Name</th>
                <th className="px-8 py-6">Category</th>
                <th className="px-8 py-6">Stock & Price</th>
                <th className="px-8 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {fetching ? (
                <tr><td colSpan={4} className="py-20 text-center"><Loader2 className="animate-spin mx-auto w-10 h-10 text-blue-600 opacity-20" /></td></tr>
              ) : filtered.map((item) => (
                <tr key={item._id} className="group hover:bg-blue-50/30 transition-colors">
                  <td className="px-8 py-5">
                    <span className="font-black text-slate-800 text-lg uppercase tracking-tight">{item.name}</span>
                  </td>
                  <td className="px-8 py-5">
                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold uppercase">{item.category}</span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="text-slate-900 font-bold flex items-center gap-1">₱{Number(item.cost_price).toLocaleString()}</span>
                      <span className="text-slate-400 text-xs font-medium flex items-center gap-1"><Boxes className="w-3 h-3" /> Qty: {item.quantity}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2">
                      <Button onClick={() => { setCurrentEquip(item); setIsEditOpen(true); }} size="sm" variant="ghost" className="rounded-xl text-amber-600 hover:bg-amber-50"><Edit3 className="w-5 h-5" /></Button>
                      <Button onClick={() => handleDelete(item._id)} size="sm" variant="ghost" className="rounded-xl text-red-600 hover:bg-red-50"><Trash2 className="w-5 h-5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      {(isAddOpen || isEditOpen) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl p-10 animate-in zoom-in duration-300">
            <h2 className="text-3xl font-black mb-8 tracking-tighter">{isAddOpen ? "New Equipment" : "Update Equipment"}</h2>
            <form onSubmit={isAddOpen ? handleAdd : handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-full space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-widest ml-2">Equipment Name</label>
                <input required type="text" className="w-full bg-gray-50 rounded-2xl px-6 py-4 outline-none ring-blue-500 focus:ring-2" value={isAddOpen ? formData.name : currentEquip?.name} onChange={e => isAddOpen ? setFormData({...formData, name: e.target.value}) : setCurrentEquip({...currentEquip!, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-widest ml-2">Category</label>
                <input required type="text" className="w-full bg-gray-50 rounded-2xl px-6 py-4 outline-none" value={isAddOpen ? formData.category : currentEquip?.category} onChange={e => isAddOpen ? setFormData({...formData, category: e.target.value}) : setCurrentEquip({...currentEquip!, category: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-widest ml-2">Cost Price</label>
                <input required type="number" step="0.01" className="w-full bg-gray-50 rounded-2xl px-6 py-4 outline-none" value={isAddOpen ? formData.cost_price : currentEquip?.cost_price} onChange={e => isAddOpen ? setFormData({...formData, cost_price: Number(e.target.value)}) : setCurrentEquip({...currentEquip!, cost_price: Number(e.target.value)})} />
              </div>
              <div className="col-span-full space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-widest ml-2">Quantity</label>
                <input required type="number" className="w-full bg-gray-50 rounded-2xl px-6 py-4 outline-none" value={isAddOpen ? formData.quantity : currentEquip?.quantity} onChange={e => isAddOpen ? setFormData({...formData, quantity: Number(e.target.value)}) : setCurrentEquip({...currentEquip!, quantity: Number(e.target.value)})} />
              </div>
              <div className="col-span-full flex gap-3 pt-4">
                <Button type="button" variant="ghost" className="flex-1 h-16 rounded-2xl font-black uppercase tracking-widest" onClick={() => { setIsAddOpen(false); setIsEditOpen(false); }}>Cancel</Button>
                <Button type="submit" className="flex-1 h-16 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-100">Save Changes</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}