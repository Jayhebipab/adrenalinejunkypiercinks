"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { 
  Trash2, Edit3, Search, RotateCcw, Plus, X, 
  Loader2, Truck, Phone, MapPin, Building2 
} from "lucide-react"
import { Toaster, toast } from "sonner"

interface Supplier {
  _id: string;
  name: string;
  company_name: string;
  address: string;
  contact: string;
}

export default function SupplierMaintenance() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState("");
  const [fetching, setFetching] = useState(true);
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState<Supplier | null>(null);
  
  const [formData, setFormData] = useState({ 
    name: "", 
    company_name: "", 
    address: "", 
    contact: "" 
  });

  // --- 1. FETCH DATA ---
  const fetchSuppliers = async () => {
    setFetching(true);
    try {
      const res = await fetch("/api/suppliers");
      const data = await res.json();
      if (Array.isArray(data)) setSuppliers(data);
    } catch (err) {
      toast.error("Failed to load suppliers.");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => { fetchSuppliers(); }, []);

  // --- 2. VALIDATION & HANDLERS ---
  const validateContact = (val: string) => val.replace(/\D/g, '').slice(0, 11);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.contact) return toast.warning("Complete required fields!");
    if (formData.contact.length !== 11) return toast.error("Contact must be 11 digits!");

    toast.promise(async () => {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error();
      setFormData({ name: "", company_name: "", address: "", contact: "" });
      setIsAddOpen(false);
      fetchSuppliers();
    }, {
      loading: 'Saving supplier...',
      success: 'Supplier added successfully!',
      error: 'Failed to save',
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSupplier) return;

    toast.promise(async () => {
      const res = await fetch(`/api/suppliers`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            id: currentSupplier._id, 
            name: currentSupplier.name,
            company_name: currentSupplier.company_name,
            address: currentSupplier.address,
            contact: currentSupplier.contact
        }),
      });
      if (!res.ok) throw new Error();
      setIsEditOpen(false);
      fetchSuppliers();
    }, {
      loading: 'Updating...',
      success: 'Supplier updated!',
      error: 'Update failed',
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This action cannot be undone.")) return;

    toast.promise(async () => {
      const res = await fetch("/api/suppliers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error();
      fetchSuppliers();
    }, {
      loading: 'Deleting...',
      success: 'Supplier deleted!',
      error: 'Delete failed',
    });
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.company_name.toLowerCase().includes(search.toLowerCase()) ||
    s.contact.includes(search)
  );

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen text-slate-900 font-sans">
      <Toaster position="top-right" richColors />

      <div className="max-w-6xl mx-auto space-y-6">
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 ml-2">
            <div className="p-3 bg-green-600 rounded-2xl shadow-lg shadow-green-100">
                <Truck className="text-white w-7 h-7" />
            </div>
            <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-900">Suppliers</h1>
                <p className="text-slate-500 text-sm">Manage your business partners and vendors.</p>
            </div>
          </div>
          <Button 
            onClick={() => setIsAddOpen(true)}
            className="bg-slate-900 hover:bg-black text-white rounded-2xl h-14 px-8 shadow-xl transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="w-5 h-5 mr-2" /> Add Supplier
          </Button>
        </div>

        {/* SEARCH BOX */}
        <div className="bg-white p-2 rounded-3xl shadow-sm border border-gray-100 flex items-center">
            <div className="relative flex-1">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                type="text" 
                placeholder="Search by name, company, or contact..."
                className="w-full bg-transparent border-none rounded-2xl px-6 py-5 pl-14 outline-none text-lg"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <Button onClick={() => setSearch("")} variant="ghost" className="rounded-2xl h-14 px-6 mr-2">
                <RotateCcw className="w-4 h-4" />
            </Button>
        </div>

        {/* DATA TABLE */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-100 text-slate-400 uppercase text-[10px] font-black tracking-[0.2em]">
                <th className="px-8 py-6">Supplier Details</th>
                <th className="px-8 py-6">Company</th>
                <th className="px-8 py-6">Contact Info</th>
                <th className="px-8 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {fetching ? (
                <tr>
                  <td colSpan={4} className="py-20 text-center">
                    <Loader2 className="animate-spin mx-auto w-10 h-10 text-green-600 opacity-20" />
                  </td>
                </tr>
              ) : filteredSuppliers.map((sup) => (
                <tr key={sup._id} className="group hover:bg-green-50/30 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-slate-500" />
                        </div>
                        <span className="font-black text-slate-800 text-lg uppercase tracking-tight">{sup.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-slate-600 font-medium">{sup.company_name}</td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                        <span className="text-slate-900 font-bold flex items-center gap-1"><Phone className="w-3 h-3 text-green-600" /> {sup.contact}</span>
                        <span className="text-slate-400 text-xs flex items-center gap-1"><MapPin className="w-3 h-3" /> {sup.address}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex justify-end gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                      <Button onClick={() => { setCurrentSupplier(sup); setIsEditOpen(true); }} size="sm" variant="ghost" className="rounded-xl hover:bg-amber-50 text-amber-600"><Edit3 className="w-5 h-5" /></Button>
                      <Button onClick={() => handleDelete(sup._id)} size="sm" variant="ghost" className="rounded-xl hover:bg-red-50 text-red-600"><Trash2 className="w-5 h-5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="bg-slate-50 px-8 py-4 text-[10px] text-slate-400 font-black uppercase tracking-widest">
            Total Records: {filteredSuppliers.length} suppliers
          </div>
        </div>
      </div>

      {/* --- MODALS --- */}
      {(isAddOpen || isEditOpen) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl p-10 animate-in zoom-in duration-300">
            <h2 className={`text-3xl font-black mb-8 tracking-tighter ${isAddOpen ? 'text-green-600' : 'text-amber-600'}`}>
                {isAddOpen ? "New Supplier" : "Update Supplier"}
            </h2>
            
            <form onSubmit={isAddOpen ? handleAdd : handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-full space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 ml-2 tracking-widest">Full Name</label>
                <input required type="text" className="w-full bg-gray-50 rounded-2xl px-6 py-4 outline-none focus:ring-2 ring-blue-500" value={isAddOpen ? formData.name : currentSupplier?.name} onChange={e => isAddOpen ? setFormData({...formData, name: e.target.value}) : setCurrentSupplier({...currentSupplier!, name: e.target.value})} />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 ml-2 tracking-widest">Company Name</label>
                <input required type="text" className="w-full bg-gray-50 rounded-2xl px-6 py-4 outline-none" value={isAddOpen ? formData.company_name : currentSupplier?.company_name} onChange={e => isAddOpen ? setFormData({...formData, company_name: e.target.value}) : setCurrentSupplier({...currentSupplier!, company_name: e.target.value})} />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 ml-2 tracking-widest">Contact No.</label>
                <input required type="text" maxLength={11} className="w-full bg-gray-50 rounded-2xl px-6 py-4 outline-none" value={isAddOpen ? formData.contact : currentSupplier?.contact} onChange={e => {
                    const val = validateContact(e.target.value);
                    isAddOpen ? setFormData({...formData, contact: val}) : setCurrentSupplier({...currentSupplier!, contact: val})
                }} />
              </div>

              <div className="col-span-full space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 ml-2 tracking-widest">Office Address</label>
                <input required type="text" className="w-full bg-gray-50 rounded-2xl px-6 py-4 outline-none" value={isAddOpen ? formData.address : currentSupplier?.address} onChange={e => isAddOpen ? setFormData({...formData, address: e.target.value}) : setCurrentSupplier({...currentSupplier!, address: e.target.value})} />
              </div>

              <div className="col-span-full flex gap-3 pt-4">
                <Button type="button" variant="ghost" className="flex-1 h-16 rounded-2xl font-black uppercase tracking-widest" onClick={() => { setIsAddOpen(false); setIsEditOpen(false); }}>Cancel</Button>
                <Button type="submit" className={`flex-1 h-16 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl ${isAddOpen ? 'bg-green-600 shadow-green-100' : 'bg-amber-600 shadow-amber-100'}`}>
                    {isAddOpen ? "Save Supplier" : "Update Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}