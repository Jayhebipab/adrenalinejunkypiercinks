"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { 
  Trash2, Edit3, Search, RotateCcw, Plus, X, 
  Loader2, Tag, Layers 
} from "lucide-react"
import { Toaster, toast } from "sonner"

interface Category {
  _id: string;
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
      toast.error("Hindi ma-load ang mga categories.");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const filteredCategories = categories.filter(c => 
    c.category_name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName) return toast.warning("Pangalan ay kailangan!");

    toast.promise(async () => {
      const res = await fetch("/api/categories", {
        method: "POST",
        body: JSON.stringify({ category_name: newCategoryName }),
      });
      if (!res.ok) throw new Error();
      setNewCategoryName("");
      setIsAddOpen(false);
      fetchCategories();
    }, {
      loading: 'Sinisave...',
      success: 'Category added!',
      error: 'Failed to save',
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCategory) return;

    toast.promise(async () => {
      const res = await fetch(`/api/categories`, {
        method: "PUT",
        body: JSON.stringify({ id: currentCategory._id, category_name: currentCategory.category_name }),
      });
      if (!res.ok) throw new Error();
      setIsEditOpen(false);
      fetchCategories();
    }, {
      loading: 'Inaupdate...',
      success: 'Updated na!',
      error: 'Update failed',
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Sigurado ka ba? Hindi na ito mababalik!")) return;

    toast.promise(async () => {
      const res = await fetch("/api/categories", {
        method: "DELETE",
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error();
      fetchCategories();
    }, {
      loading: 'Binubura...',
      success: 'Deleted successfully!',
      error: 'Delete failed',
    });
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen text-slate-900">
      <Toaster position="top-right" richColors />

      <div className="max-w-5xl mx-auto space-y-6">
        {/* HEADER - Sinunod sa Equipment UI */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-100">
              <Layers className="text-white w-7 h-7" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase italic">Categories</h1>
              <p className="text-slate-500 text-sm">Manage studio services and tags.</p>
            </div>
          </div>
          <Button 
            onClick={() => setIsAddOpen(true)} 
            className="bg-slate-900 hover:bg-black text-white rounded-2xl h-14 px-8 shadow-xl transition-transform active:scale-95 font-bold"
          >
            <Plus className="w-5 h-5 mr-2" /> Add Category
          </Button>
        </div>

        {/* SEARCH - Sinunod sa Equipment UI */}
        <div className="bg-white p-2 rounded-3xl shadow-sm border border-gray-100 flex items-center">
          <div className="relative flex-1">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search category name..."
              className="w-full bg-transparent border-none rounded-2xl px-6 py-5 pl-14 outline-none text-lg font-medium"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button 
            onClick={() => setSearch("")} 
            variant="ghost" 
            className="rounded-2xl h-14 px-6 mr-2 text-slate-400 hover:text-red-500"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        {/* TABLE - Sinunod sa Equipment UI layout */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-100 text-slate-400 uppercase text-[10px] font-black tracking-widest">
                <th className="px-8 py-6">Category Details</th>
                <th className="px-8 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {fetching ? (
                <tr>
                  <td colSpan={2} className="py-20 text-center">
                    <Loader2 className="animate-spin mx-auto w-10 h-10 text-blue-600 opacity-20" />
                  </td>
                </tr>
              ) : filteredCategories.length > 0 ? (
                filteredCategories.map((cat) => (
                  <tr key={cat._id} className="group hover:bg-blue-50/30 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-slate-100 rounded-xl group-hover:bg-blue-100 transition-colors">
                          <Tag className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />
                        </div>
                        <span className="font-black text-slate-800 text-lg uppercase tracking-tight">
                          {cat.category_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          onClick={() => { setCurrentCategory(cat); setIsEditOpen(true); }} 
                          size="sm" 
                          variant="ghost" 
                          className="rounded-xl text-amber-600 hover:bg-amber-50 transition-all"
                        >
                          <Edit3 className="w-5 h-5" />
                        </Button>
                        <Button 
                          onClick={() => handleDelete(cat._id)} 
                          size="sm" 
                          variant="ghost" 
                          className="rounded-xl text-red-600 hover:bg-red-50 transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2} className="py-20 text-center text-slate-400 italic">
                    Walang nahanap na record.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="bg-slate-50/50 px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            Total Results: {filteredCategories.length} Categories
          </div>
        </div>
      </div>

      {/* MODAL - Sinunod sa Equipment UI (Simplified for Category) */}
      {(isAddOpen || isEditOpen) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg p-10 animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-black tracking-tighter uppercase italic">
                {isAddOpen ? "New Category" : "Update Info"}
              </h2>
              <button 
                onClick={() => { setIsAddOpen(false); setIsEditOpen(false); }} 
                className="p-2 hover:bg-slate-100 rounded-full transition"
              >
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>
            
            <form onSubmit={isAddOpen ? handleAdd : handleUpdate} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-widest ml-2">
                  Category Name
                </label>
                <input 
                  required 
                  type="text" 
                  autoFocus
                  placeholder="e.g. Traditional Tattoo"
                  className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600 rounded-2xl px-6 py-5 outline-none transition-all text-lg font-bold" 
                  value={isAddOpen ? newCategoryName : currentCategory?.category_name} 
                  onChange={(e) => isAddOpen ? setNewCategoryName(e.target.value) : setCurrentCategory({...currentCategory!, category_name: e.target.value})} 
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="flex-1 h-16 rounded-2xl font-black uppercase tracking-widest transition-all" 
                  onClick={() => { setIsAddOpen(false); setIsEditOpen(false); }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className={`flex-1 h-16 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 ${isAddOpen ? 'bg-blue-600 shadow-blue-100' : 'bg-slate-900 shadow-slate-200'}`}
                >
                  {isAddOpen ? "Save Record" : "Update Category"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}