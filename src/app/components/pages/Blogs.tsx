"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { 
  ChevronRight, Calendar, ArrowUpRight, Loader2, 
  Plus, Trash2, Edit3, X, Save, UploadCloud, Type
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast, Toaster } from "sonner";

export const BlogSection = () => {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Form State
  const [currentPost, setCurrentPost] = useState({
    _id: "",
    title: "",
    category: "Tattoo Culture",
    image: "",
    content: "",
    slug: ""
  });

  const fetchData = async () => {
    try {
      const res = await fetch("/api/blogs");
      const data = await res.json();
      if (Array.isArray(data)) setBlogs(data);
    } catch (err) {
      toast.error("Failed to load journal.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setCurrentPost({ ...currentPost, image: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!currentPost.title || !currentPost.image) return toast.warning("Kulang ng Title o Image, par!");
    
    setActionLoading(true);
    const method = currentPost._id ? "PUT" : "POST"; // Automatic switch kung edit o add
    
    try {
      const res = await fetch("/api/blogs", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentPost),
      });

      if (res.ok) {
        toast.success(currentPost._id ? "Journal updated!" : "New story added!");
        setIsEditorOpen(false);
        resetForm();
        fetchData();
      }
    } catch (err) {
      toast.error("Opps, may error sa pag-save.");
    } finally {
      setActionLoading(false);
    }
  };

  const deletePost = async (id: string) => {
    if (!confirm("Sigurado ka? Buburahin na natin 'tong kwento na 'to?")) return;
    try {
      const res = await fetch("/api/blogs", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        toast.success("Post deleted.");
        fetchData();
      }
    } catch (err) {
      toast.error("Delete failed.");
    }
  };

  const resetForm = () => {
    setCurrentPost({ _id: "", title: "", category: "Tattoo Culture", image: "", content: "", slug: "" });
  };

  return (
    <section id="blogs" className="relative py-20 md:py-32 bg-black border-y border-white/5 overflow-hidden">
      <Toaster position="bottom-right" richColors />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-600/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full">
              <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              <span className="text-white uppercase text-[10px] tracking-[0.3em] font-black">Admin Panel: Journal</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black uppercase text-white tracking-tighter leading-none">
              Studio <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-orange-500 to-yellow-400">Journal</span>
            </h2>
          </div>
          
          <Button onClick={() => { resetForm(); setIsEditorOpen(true); }} className="bg-orange-600 hover:bg-orange-500 text-white rounded-2xl h-14 px-8 font-black uppercase text-xs tracking-widest transition-all">
            <Plus className="w-5 h-5 mr-2" /> Write New Post
          </Button>
        </div>

        {/* BLOG GRID */}
        {loading ? (
          <div className="flex justify-center py-40"><Loader2 className="w-10 h-10 text-orange-500 animate-spin" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogs.map((post, idx) => (
              <motion.div key={post._id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="group relative flex flex-col">
                <div className="relative aspect-[16/10] overflow-hidden rounded-3xl border border-white/5 bg-zinc-900">
                  <Image src={post.image} alt={post.title} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                  
                  {/* ADMIN ACTIONS OVERLAY */}
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => { setCurrentPost(post); setIsEditorOpen(true); }} className="p-3 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white rounded-2xl border border-white/10 transition-all"><Edit3 size={16} /></button>
                    <button onClick={() => deletePost(post._id)} className="p-3 bg-red-500/80 backdrop-blur-md hover:bg-red-500 text-white rounded-2xl border border-white/10 transition-all"><Trash2 size={16} /></button>
                  </div>

                  <div className="absolute top-4 left-4">
                    <span className="bg-black/60 backdrop-blur-md border border-white/10 text-orange-500 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">{post.category}</span>
                  </div>
                </div>

                <div className="pt-6 space-y-3">
                  <div className="flex items-center text-zinc-500 text-[10px] uppercase tracking-widest font-bold">
                    <Calendar className="mr-2 h-3 w-3 text-orange-600" />
                    {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                  <h3 className="text-xl font-bold text-white group-hover:text-orange-500 transition-colors line-clamp-2 uppercase tracking-tight">{post.title}</h3>
                  <p className="text-zinc-500 text-sm line-clamp-2 font-medium">{post.content}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL EDITOR */}
      <AnimatePresence>
        {isEditorOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setIsEditorOpen(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-zinc-900 w-full max-w-2xl rounded-[3rem] border border-white/10 p-8 md:p-12 relative z-10 max-h-[90vh] overflow-y-auto custom-scrollbar">
              <button onClick={() => setIsEditorOpen(false)} className="absolute top-8 right-8 text-zinc-500 hover:text-white"><X size={24} /></button>
              
              <div className="mb-8">
                <h2 className="text-3xl font-black italic uppercase text-white tracking-tighter">{currentPost._id ? 'Edit Story' : 'New Journal Entry'}</h2>
                <p className="text-orange-500 text-[10px] font-black uppercase tracking-widest">Ink & Thoughts Portfolio</p>
              </div>

              <div className="space-y-6">
                {/* Image Upload */}
                <label className="relative aspect-video rounded-3xl border-2 border-dashed border-white/10 hover:border-orange-500/50 flex flex-col items-center justify-center cursor-pointer overflow-hidden group transition-all">
                  {currentPost.image ? (
                    <Image src={currentPost.image} alt="Preview" fill className="object-cover" />
                  ) : (
                    <div className="text-center">
                      <UploadCloud className="w-10 h-10 text-zinc-700 mx-auto mb-2" />
                      <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Upload Cover Photo</span>
                    </div>
                  )}
                  <input type="file" className="hidden" onChange={handleImageChange} accept="image/*" />
                </label>

                <div className="space-y-4">
                  <div className="relative">
                    <Type className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                    <input 
                      type="text" 
                      placeholder="Article Title"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white font-bold outline-none focus:ring-2 ring-orange-500"
                      value={currentPost.title}
                      onChange={(e) => setCurrentPost({ ...currentPost, title: e.target.value })}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <select 
                      className="bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white font-bold outline-none focus:ring-2 ring-orange-500 appearance-none"
                      value={currentPost.category}
                      onChange={(e) => setCurrentPost({ ...currentPost, category: e.target.value })}
                    >
                      <option value="Tattoo Culture">Tattoo Culture</option>
                      <option value="Studio News">Studio News</option>
                      <option value="Aftercare Tips">Aftercare Tips</option>
                      <option value="Artist Spotlight">Artist Spotlight</option>
                    </select>
                    <input 
                      type="text" 
                      placeholder="Slug (e.g. my-first-tattoo)"
                      className="bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white font-bold outline-none focus:ring-2 ring-orange-500"
                      value={currentPost.slug}
                      onChange={(e) => setCurrentPost({ ...currentPost, slug: e.target.value })}
                    />
                  </div>

                  <textarea 
                    rows={5}
                    placeholder="Tell the story behind the ink..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 px-6 text-white font-medium outline-none focus:ring-2 ring-orange-500 resize-none"
                    value={currentPost.content}
                    onChange={(e) => setCurrentPost({ ...currentPost, content: e.target.value })}
                  />
                </div>

                <Button onClick={handleSave} disabled={actionLoading} className="w-full h-16 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-orange-900/20 transition-all">
                  {actionLoading ? <Loader2 className="animate-spin" /> : <><Save className="mr-2 w-4 h-4" /> Finalize & Publish Post</>}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};