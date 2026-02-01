"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { 
    Trash2, Edit3, Search, RotateCcw, Plus, X, 
    Loader2, Truck, Phone, MapPin, Building2 
} from "lucide-react"
import { Toaster, toast } from "sonner"

interface Supplier {
    id: string;
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
    const [formData, setFormData] = useState({ name: "", company_name: "", address: "", contact: "" });

    // --- FUNCTION 1: FETCH DATA ---
    const fetchSuppliers = async () => {
        setFetching(true);
        try {
            const res = await fetch("/api/suppliers");
            const data = await res.json();
            if (Array.isArray(data)) {
                setSuppliers(data);
            }
        } catch (err) {
            toast.error("Link to database failed.");
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => { fetchSuppliers(); }, []);

    // --- FUNCTION 2: HANDLE ADD / EDIT (POST/PUT) ---
    const handleAction = async (e: React.FormEvent, type: 'POST' | 'PUT') => {
        e.preventDefault();
        const payload = type === 'POST' ? formData : currentSupplier;
        
        toast.promise(async () => {
            const res = await fetch("/api/suppliers", {
                method: type,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error || "Action failed");
            
            setIsAddOpen(false);
            setIsEditOpen(false);
            setFormData({ name: "", company_name: "", address: "", contact: "" });
            fetchSuppliers();
        }, {
            loading: 'Syncing Matrix...',
            success: 'Registry Updated!',
            error: (err) => err.message,
        });
    };

    // --- FUNCTION 3: HANDLE DELETE ---
    const handleDelete = async (id: string) => {
        if (!confirm("TERMINATE THIS RECORD?")) return;

        toast.promise(async () => {
            const res = await fetch("/api/suppliers", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });
            if (!res.ok) throw new Error();
            fetchSuppliers();
        }, {
            loading: 'Purging node...',
            success: 'Record Deleted',
            error: 'Delete failed',
        });
    };

    // --- FUNCTION 4: SEARCH FILTER ---
    const filtered = suppliers.filter(s => 
        s.name.toLowerCase().includes(search.toLowerCase()) || 
        s.company_name.toLowerCase().includes(search.toLowerCase()) ||
        s.contact.includes(search)
    );

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 bg-white min-h-screen font-sans italic antialiased text-zinc-900">
            <Toaster position="bottom-right" richColors />

            {/* SUPPLIERS HEADER - THE CREW STYLE WITH REFRESH */}
<header className="flex flex-col md:flex-row justify-between items-center bg-zinc-900 p-10 rounded-[2.5rem] text-white shadow-2xl gap-6 mb-8 relative overflow-hidden">
    <div className="flex items-center gap-5">
        {/* White Rotated Icon Box */}
        <div className="p-4 bg-white rounded-3xl -rotate-6 shadow-xl shrink-0 transition-transform hover:rotate-0 duration-300">
            <Truck size={32} className="text-black" />
        </div>
        
        <div>
            <div className="flex items-center gap-4">
                <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none">
                    The Partners
                </h1>
                {/* REFRESH BUTTON */}
                <button 
                    onClick={fetchSuppliers} 
                    disabled={fetching}
                    className="hover:text-white text-zinc-600 transition-colors disabled:opacity-30 mt-1"
                >
                    <RotateCcw 
                        size={20} 
                        className={fetching ? "animate-spin" : "active:rotate-180 transition-all duration-500"} 
                    />
                </button>
            </div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.4em] mt-1">
                Supplier Registry Node
            </p>
        </div>
    </div>

    {/* ADD BUTTON */}
    <Button 
        onClick={() => setIsAddOpen(true)} 
        className="bg-white text-black hover:bg-zinc-200 rounded-2xl h-14 px-10 font-black uppercase text-xs tracking-widest shadow-xl transition-all active:scale-95 border-none w-full md:w-auto"
    >
        <Plus size={20} className="mr-3"/> Add New Partner
    </Button>

    {/* Subtle Background Glow */}
    <div className="absolute -right-10 -top-10 w-40 h-40 bg-zinc-400/5 rounded-full blur-3xl" />
</header>

            {/* SEARCH AREA */}
            <div className="relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" size={20} />
                <input 
                    type="text" 
                    placeholder="SCAN SUPPLIER DATABASE..." 
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-3xl py-5 pl-14 pr-8 text-sm outline-none focus:ring-4 ring-zinc-900/5 focus:bg-white transition-all font-bold uppercase tracking-widest shadow-sm"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* DATA TABLE AREA */}
            <div className="border border-zinc-100 rounded-[3rem] bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead className="bg-zinc-50/50 border-b border-zinc-100 text-zinc-400 uppercase text-[10px] font-black tracking-[0.3em]">
                            <tr>
                                <th className="px-10 py-6">Identity</th>
                                <th className="px-10 py-6">Organization</th>
                                <th className="px-10 py-6">Node Info</th>
                                <th className="px-10 py-6 text-right">Access</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50 font-bold uppercase tracking-tight">
                            {fetching ? (
                                <tr><td colSpan={4} className="py-24 text-center"><Loader2 className="animate-spin mx-auto w-10 h-10 text-zinc-200" /></td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={4} className="py-24 text-center text-zinc-300 text-xs tracking-widest italic">No Data Nodes Found</td></tr>
                            ) : filtered.map((sup) => (
                                <tr key={sup.id} className="hover:bg-zinc-50/50 transition-colors group">
                                    <td className="px-10 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-11 h-11 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-400 group-hover:bg-zinc-900 group-hover:text-white transition-all shadow-sm">
                                                <Building2 size={20} />
                                            </div>
                                            <span className="text-sm">{sup.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6 text-xs text-zinc-500">{sup.company_name}</td>
                                    <td className="px-10 py-6">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs flex items-center gap-2"><Phone size={12} className="text-zinc-300" /> {sup.contact}</span>
                                            <span className="text-[9px] text-zinc-400 truncate max-w-[150px] italic"><MapPin size={10} /> {sup.address}</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6 text-right">
                                        <div className="flex justify-end gap-3 opacity-40 group-hover:opacity-100 transition-opacity">
                                            <Button size="icon" variant="ghost" onClick={() => { setCurrentSupplier(sup); setIsEditOpen(true); }} className="h-10 w-10 rounded-xl hover:bg-zinc-900 hover:text-white"><Edit3 size={18} /></Button>
                                            <Button size="icon" variant="ghost" onClick={() => handleDelete(sup.id)} className="h-10 w-10 rounded-xl hover:bg-red-600 hover:text-white text-zinc-300"><Trash2 size={18} /></Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL - SM COMPACT SCALE */}
            {(isAddOpen || isEditOpen) && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm p-10 space-y-8 animate-in fade-in zoom-in duration-300 border border-zinc-200">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xs font-black uppercase tracking-[0.3em]">{isAddOpen ? "Create Node" : "Modify Node"}</h2>
                            <button onClick={() => { setIsAddOpen(false); setIsEditOpen(false); }} className="text-zinc-300 hover:text-zinc-900 transition-colors"><X size={24}/></button>
                        </div>
                        
                        <form onSubmit={(e) => handleAction(e, isAddOpen ? 'POST' : 'PUT')} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-[8px] font-black uppercase text-zinc-400 tracking-widest ml-1">Contact Person</label>
                                <input required className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-5 py-4 text-xs font-bold outline-none focus:ring-2 ring-zinc-900 transition-all uppercase" value={isAddOpen ? formData.name : currentSupplier?.name} onChange={e => isAddOpen ? setFormData({...formData, name: e.target.value}) : setCurrentSupplier({...currentSupplier!, name: e.target.value})} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[8px] font-black uppercase text-zinc-400 tracking-widest ml-1">Company Name</label>
                                <input required className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-5 py-4 text-xs font-bold outline-none uppercase" value={isAddOpen ? formData.company_name : currentSupplier?.company_name} onChange={e => isAddOpen ? setFormData({...formData, company_name: e.target.value}) : setCurrentSupplier({...currentSupplier!, company_name: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[8px] font-black uppercase text-zinc-400 tracking-widest ml-1">Contact</label>
                                    <input required maxLength={11} className="w-full bg-zinc-900 text-white rounded-2xl px-5 py-4 text-xs font-bold outline-none" value={isAddOpen ? formData.contact : currentSupplier?.contact} onChange={e => {
                                        const val = e.target.value.replace(/\D/g, '').slice(0,11);
                                        isAddOpen ? setFormData({...formData, contact: val}) : setCurrentSupplier({...currentSupplier!, contact: val})
                                    }} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[8px] font-black uppercase text-zinc-400 tracking-widest ml-1">Location</label>
                                    <input required className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-5 py-4 text-xs font-bold outline-none uppercase" value={isAddOpen ? formData.address : currentSupplier?.address} onChange={e => isAddOpen ? setFormData({...formData, address: e.target.value}) : setCurrentSupplier({...currentSupplier!, address: e.target.value})} />
                                </div>
                            </div>
                            <Button type="submit" className="w-full h-14 bg-zinc-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-all mt-6">Commit Record</Button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}