"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { 
    Trash2, Edit3, Search, RotateCcw, Plus, X, 
    Loader2, Tag, Layers 
} from "lucide-react"
import { Toaster, toast } from "sonner"

interface Category {
    id: string;
    category_name: string;
}

export default function CategoryMaintenance() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [search, setSearch] = useState("");
    const [fetching, setFetching] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
    const [newCategoryName, setNewCategoryName] = useState("");

    const fetchCategories = async () => {
        setFetching(true);
        try {
            const res = await fetch("/api/categories");
            const data = await res.json();
            if (Array.isArray(data)) setCategories(data);
        } catch (err) {
            toast.error("API Connection Lost");
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => { fetchCategories(); }, []);

    // --- UPDATED HANDLE ACTION ---
    const handleAction = async (e: React.FormEvent, method: string, payload: any) => {
        e.preventDefault();
        
        toast.promise(async () => {
            const res = await fetch("/api/categories", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const result = await res.json();

            // Dito natin mahuhuli kung existing na yung label
            if (!res.ok) {
                throw new Error(result.error || "Operation Failed");
            }
            
            setIsAddOpen(false);
            setIsEditOpen(false);
            setNewCategoryName("");
            fetchCategories();
            return result;
        }, { 
            loading: 'Checking Node Label...', 
            success: 'Registry Updated!', 
            error: (err) => err.message // Ipapakita nito yung specific error galing sa API
        });
    };

    const handleDelete = async (id: string) => {
        if (!confirm("TERMINATE THIS RECORD?")) return;
        toast.promise(async () => {
            const res = await fetch("/api/categories", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });
            if (!res.ok) throw new Error();
            fetchCategories();
        }, { loading: 'Purging...', success: 'Record Deleted', error: 'Failed' });
    };

    const filtered = categories.filter(c => c.category_name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 min-h-screen font-sans italic antialiased text-zinc-900">
            <Toaster position="bottom-right" richColors />
{/* CATEGORY HEADER - THE CREW STYLE WITH REFRESH */}
<header className="flex flex-col md:flex-row justify-between items-center bg-zinc-900 p-10 rounded-[2.5rem] text-white shadow-2xl gap-6 mb-8">
    <div className="flex items-center gap-5">
        {/* White Rotated Icon Box */}
        <div className="p-4 bg-white rounded-3xl -rotate-6 shadow-xl shrink-0">
            <Layers size={32} className="text-black" />
        </div>
        
        <div>
            <div className="flex items-center gap-4">
                <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none">
                    The Class
                </h1>
                {/* REFRESH BUTTON INTEGRATION */}
                <button 
                    onClick={fetchCategories} 
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
                Classification API Node
            </p>
        </div>
    </div>

    {/* ADD BUTTON - MATCHING "ADD NEW ARTIST" STYLE */}
    <Button 
        onClick={() => setIsAddOpen(true)} 
        className="bg-white text-black hover:bg-zinc-200 rounded-2xl h-14 px-10 font-black uppercase text-xs tracking-widest shadow-xl transition-all active:scale-95 border-none"
    >
        <Plus size={20} className="mr-3"/> Add New Class
    </Button>
</header>
            <div className="relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-900" size={20} />
                <input 
                    type="text" placeholder="SCAN DATABASE..." 
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-3xl py-5 pl-14 pr-8 text-sm outline-none focus:bg-white transition-all font-bold uppercase tracking-widest shadow-sm shadow-zinc-100"
                    value={search} onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="border border-zinc-100 rounded-[3rem] bg-white shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-zinc-50/50 border-b border-zinc-100 text-zinc-400 uppercase text-[10px] font-black tracking-[0.3em]">
                        <tr>
                            <th className="px-10 py-6">Label</th>
                            <th className="px-10 py-6 text-right">Access</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50 font-bold uppercase tracking-tight italic">
                        {fetching ? (
                            <tr><td colSpan={2} className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-zinc-200" /></td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={2} className="py-20 text-center text-zinc-300 text-xs tracking-[0.3em]">Empty Node Label</td></tr>
                        ) : (
                            filtered.map((cat) => (
                                <tr key={cat.id} className="hover:bg-zinc-50/50 transition-colors group">
                                    <td className="px-10 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400 group-hover:bg-zinc-900 group-hover:text-white transition-all">
                                                <Tag size={18} />
                                            </div>
                                            <span className="text-sm font-black tracking-tight">{cat.category_name}</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button size="icon" variant="ghost" onClick={() => { setCurrentCategory(cat); setIsEditOpen(true); }} className="h-9 w-9 rounded-xl hover:bg-zinc-900 hover:text-white border border-transparent hover:border-black"><Edit3 size={16} /></Button>
                                            <Button size="icon" variant="ghost" onClick={() => handleDelete(cat.id)} className="h-9 w-9 rounded-xl hover:bg-red-600 hover:text-white text-zinc-300"><Trash2 size={16} /></Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {(isAddOpen || isEditOpen) && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm p-10 border-4 border-black relative animate-in fade-in zoom-in duration-200">
                        <button onClick={() => { setIsAddOpen(false); setIsEditOpen(false); }} className="absolute top-8 right-8 text-zinc-300 hover:text-black transition-colors"><X size={20}/></button>
                        <h2 className="text-xs font-black uppercase tracking-[0.3em] mb-8">{isAddOpen ? "Register Class" : "Modify Node"}</h2>
                        <form onSubmit={(e) => handleAction(e, isAddOpen ? 'POST' : 'PUT', isAddOpen ? { category_name: newCategoryName } : { id: currentCategory?.id, category_name: currentCategory?.category_name })} className="space-y-6">
                            <input 
                                required className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-5 py-4 text-xs font-bold outline-none focus:ring-2 ring-zinc-900 uppercase italic shadow-inner"
                                value={isAddOpen ? newCategoryName : currentCategory?.category_name}
                                onChange={e => isAddOpen ? setNewCategoryName(e.target.value) : setCurrentCategory({...currentCategory!, category_name: e.target.value})}
                                placeholder="ENTER NODE LABEL..."
                            />
                            <Button type="submit" className="w-full h-14 bg-zinc-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest border-b-4 border-zinc-700 transition-transform active:scale-95">Commit Record</Button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}