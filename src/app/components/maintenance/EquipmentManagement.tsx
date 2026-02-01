"use client"
import { useState, useEffect } from "react"
import { db } from "@/lib/firebase"
import { collection, doc, writeBatch, serverTimestamp } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Trash2, Edit3, Search, Plus, X, Loader2, Wrench, ChevronDown, Calendar } from "lucide-react"
import { Toaster, toast } from "sonner"

interface Equipment {
  id: string;
  name: string;
  category: string;
  cost_price: number;
  quantity: number;
  supplier: string;
  delivery_date?: string;
}

export default function EquipmentMaintenance() {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [fetching, setFetching] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  // FIX: Initialize currentEquip with empty strings instead of null 
  // to avoid "uncontrolled to controlled" error
  const emptyEquip: Equipment = {
    id: "",
    name: "",
    category: "",
    cost_price: 0,
    quantity: 0,
    supplier: "",
    delivery_date: new Date().toISOString().split('T')[0]
  };

  const [currentEquip, setCurrentEquip] = useState<Equipment>(emptyEquip);
  const [formData, setFormData] = useState(emptyEquip);

  const loadRegistryData = async () => {
    setFetching(true);
    try {
      const [equipRes, catRes, supRes] = await Promise.all([
        fetch("/api/equipments"),
        fetch("/api/categories"),
        fetch("/api/suppliers")
      ]);
      const [eData, cData, sData] = await Promise.all([equipRes.json(), catRes.json(), supRes.json()]);
      
      if (Array.isArray(eData)) setEquipments(eData);
      if (Array.isArray(cData)) setCategories(cData);
      if (Array.isArray(sData)) setSuppliers(sData);
    } catch (err) {
      toast.error("Registry sync failed.");
    } finally { setFetching(false); }
  };

  useEffect(() => { loadRegistryData(); }, []);

  const handleAction = async (e: React.FormEvent, method: 'POST' | 'PUT') => {
    e.preventDefault();
    const payload = method === 'POST' ? formData : currentEquip;

    toast.promise(async () => {
      // 1. Update API call for Equipment
      const res = await fetch("/api/equipments", {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Action failed");

      // 2. FIRESTORE LOGIC: Add to delivery_reports
      // Ginagamit ang batch para siguradong "atomically" updated ang records
      const batch = writeBatch(db);
      const reportRef = doc(collection(db, "delivery_reports"));
      
      batch.set(reportRef, {
        item_id: payload.id || result.id, // Kung bago, gamitin yung ID galing API
        item_name: payload.name,
        type: "EQUIPMENT",
        action: method === 'POST' ? "REGISTERED" : "MAINTENANCE_UPDATE",
        quantity: payload.quantity,
        supplier: payload.supplier || "N/A",
        delivery_date: payload.delivery_date,
        createdAt: serverTimestamp(),
        updatedBy: "Admin", // Pwede mong palitan ng actual user session name
        status: "COMPLETED"
      });

      await batch.commit();

      setIsAddOpen(false);
      setIsEditOpen(false);
      loadRegistryData();
    }, {
      loading: 'Updating Registry & Logs...',
      success: 'Matrix & Reports Updated Successfully!',
      error: (err) => err.message,
    });
  };

  const filtered = equipments.filter(e => 
    e.name?.toLowerCase().includes(search.toLowerCase()) || 
    e.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-10 bg-zinc-50 min-h-screen text-zinc-900">
      <Toaster position="top-right" richColors />
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-center bg-zinc-900 p-10 rounded-[2.5rem] text-white shadow-2xl gap-6">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-white rounded-3xl -rotate-6 shadow-xl"><Wrench size={32} className="text-black" /></div>
            <div>
              <h1 className="text-4xl font-black italic uppercase tracking-tighter">The Gear</h1>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.4em]">Maintenance Node</p>
            </div>
          </div>
          <Button onClick={() => { setFormData(emptyEquip); setIsAddOpen(true); }} className="bg-white text-black hover:bg-zinc-200 rounded-2xl h-14 px-10 font-black uppercase text-xs border-none">
            <Plus size={20} className="mr-3"/> Register Gear
          </Button>
        </header>

        {/* SEARCH */}
        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input type="text" placeholder="Search equipment..." className="w-full bg-white border-2 border-zinc-100 rounded-[2rem] px-8 py-6 pl-16 outline-none font-bold uppercase" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {/* TABLE CONTENT */}
        <div className="bg-white rounded-[3rem] shadow-xl border border-zinc-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-zinc-50 text-zinc-400 uppercase text-[10px] font-black tracking-widest">
              <tr>
                <th className="px-10 py-8">Asset</th>
                <th className="px-10 py-8">Supplier & Date</th>
                <th className="px-10 py-8 text-center">Resources</th>
                <th className="px-10 py-8 text-right">Control</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {fetching ? (
                <tr><td colSpan={4} className="py-20 text-center"><Loader2 className="animate-spin mx-auto opacity-20" size={40} /></td></tr>
              ) : filtered.map((item) => (
                <tr key={item.id} className="group hover:bg-zinc-50/50">
                  <td className="px-10 py-6">
                    <p className="font-black text-xl italic uppercase tracking-tighter">{item.name}</p>
                    <span className="bg-zinc-100 text-zinc-500 px-3 py-1 rounded-lg text-[9px] font-black uppercase">{item.category}</span>
                  </td>
                  <td className="px-10 py-6">
                    <p className="font-bold text-sm uppercase">{item.supplier}</p>
                    <p className="text-[10px] text-zinc-400 font-bold">{item.delivery_date || 'No Date'}</p>
                  </td>
                  <td className="px-10 py-6 text-center">
                    <span className="block font-black text-lg">₱{item.cost_price.toLocaleString()}</span>
                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">Qty: {item.quantity}</span>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <div className="flex justify-end gap-2">
                      <Button onClick={() => { setCurrentEquip(item); setIsEditOpen(true); }} className="bg-zinc-100 text-zinc-900 hover:bg-zinc-900 hover:text-white rounded-xl h-10 w-10 p-0"><Edit3 size={16} /></Button>
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
        <div className="fixed inset-0 bg-zinc-900/80 backdrop-blur-xl flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-[3rem] w-full max-w-lg p-10 relative animate-in zoom-in duration-200">
            <button onClick={() => { setIsAddOpen(false); setIsEditOpen(false); }} className="absolute top-8 right-8 text-zinc-300 hover:text-black"><X size={32} /></button>
            <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-8">{isAddOpen ? "Add Gear" : "Edit Asset"}</h2>
            
            <form onSubmit={(e) => handleAction(e, isAddOpen ? 'POST' : 'PUT')} className="space-y-4">
              {/* FIX: added fallback `|| ""` to prevent uncontrolled input error */}
              <input required placeholder="EQUIPMENT NAME" className="w-full bg-zinc-50 border-2 rounded-2xl px-6 py-4 font-bold uppercase outline-none" 
                value={isAddOpen ? formData.name : (currentEquip.name || "")} 
                onChange={e => isAddOpen ? setFormData({...formData, name: e.target.value}) : setCurrentEquip({...currentEquip, name: e.target.value})} 
              />
              
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <select required className="w-full bg-zinc-50 border-2 rounded-2xl px-6 py-4 font-bold uppercase appearance-none outline-none" 
                    value={isAddOpen ? formData.category : (currentEquip.category || "")} 
                    onChange={e => isAddOpen ? setFormData({...formData, category: e.target.value}) : setCurrentEquip({...currentEquip, category: e.target.value})}
                  >
                    <option value="">Category</option>
                    {categories.map(c => <option key={c.id} value={c.category_name}>{c.category_name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={16} />
                </div>

                <div className="relative">
                  <select required className="w-full bg-zinc-50 border-2 rounded-2xl px-6 py-4 font-bold uppercase appearance-none outline-none" 
                    value={isAddOpen ? formData.supplier : (currentEquip.supplier || "")} 
                    onChange={e => isAddOpen ? setFormData({...formData, supplier: e.target.value}) : setCurrentEquip({...currentEquip, supplier: e.target.value})}
                  >
                    <option value="">Supplier</option>
                    {suppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={16} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input required type="number" placeholder="QTY" className="w-full bg-zinc-50 border-2 rounded-2xl px-6 py-4 font-bold" 
                  value={isAddOpen ? formData.quantity : (currentEquip.quantity ?? 0)} 
                  onChange={e => isAddOpen ? setFormData({...formData, quantity: Number(e.target.value)}) : setCurrentEquip({...currentEquip, quantity: Number(e.target.value)})} 
                />
                <input required type="number" placeholder="COST PRICE" className="w-full bg-zinc-900 text-white rounded-2xl px-6 py-4 font-bold" 
                  value={isAddOpen ? formData.cost_price : (currentEquip.cost_price ?? 0)} 
                  onChange={e => isAddOpen ? setFormData({...formData, cost_price: Number(e.target.value)}) : setCurrentEquip({...currentEquip, cost_price: Number(e.target.value)})} 
                />
              </div>

              <div className="relative">
                <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <input required type="date" className="w-full bg-zinc-50 border-2 rounded-2xl px-14 py-4 font-bold outline-none uppercase" 
                  value={isAddOpen ? formData.delivery_date : (currentEquip.delivery_date?.split('T')[0] || "")} 
                  onChange={e => isAddOpen ? setFormData({...formData, delivery_date: e.target.value}) : setCurrentEquip({...currentEquip, delivery_date: e.target.value})} 
                />
              </div>

              <Button type="submit" className="w-full h-16 bg-zinc-900 text-white rounded-2xl font-black uppercase tracking-widest border-none mt-4">Commit to Registry</Button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}