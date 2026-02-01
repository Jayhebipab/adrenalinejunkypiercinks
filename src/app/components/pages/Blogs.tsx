"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { 
  Calendar, Loader2, Plus, Trash2, Edit3, X, Save, UploadCloud, 
  ChevronRight, Sparkles, Hash, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast, Toaster } from "sonner";
import { uploadToCloudinary } from "@/lib/cloudinary";

interface BlogPost {
  id: string;
  title: string;
  category: string;
  image: string;
  content: string;
  slug: string;
  createdAt?: any;
}

export default function BlogAdminPage() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [currentPost, setCurrentPost] = useState<BlogPost>({
    id: "", title: "", category: "Tattoo Culture", image: "", content: "", slug: ""
  });

  const fetchData = async () => {
    try {
      const res = await fetch("/api/blogs");
      const data = await res.json();
      if (Array.isArray(data)) setBlogs(data);
    } catch (err) {
      toast.error("Failed to load journals, par.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!currentPost.title || (!selectedFile && !currentPost.image)) {
      return toast.warning("Kulang ng Title o Image, par!");
    }
    setActionLoading(true);
    try {
      let finalImageUrl = currentPost.image;
      if (selectedFile) {
        const uploadedUrl = await uploadToCloudinary(selectedFile);
        if (uploadedUrl) finalImageUrl = uploadedUrl;
      }
      const method = currentPost.id ? "PUT" : "POST";
      const res = await fetch("/api/blogs", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...currentPost, image: finalImageUrl }),
      });
      if (res.ok) {
        toast.success(currentPost.id ? "Journal updated!" : "New story published!");
        setIsEditorOpen(false);
        resetForm();
        fetchData();
      }
    } catch (err) {
      toast.error("May error sa pag-save.");
    } finally {
      setActionLoading(false);
    }
  };

  const deletePost = async (id: string) => {
    if (!confirm("Sigurado ka?")) return;
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
    setCurrentPost({ id: "", title: "", category: "Tattoo Culture", image: "", content: "", slug: "" });
    setSelectedFile(null);
    setPreviewUrl("");
  };

  return (
    <section className="min-h-screen bg-[#F8F8F8] text-zinc-900 py-10 md:py-16 px-6 font-sans">
      <Toaster position="bottom-right" richColors />
      
      <div className="container mx-auto max-w-6xl">
        {/* COMPACT HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 border-b border-zinc-200/60 pb-8">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-orange-600 font-bold uppercase tracking-[0.2em] text-[9px] bg-orange-50 px-3 py-1 rounded-md">
              <Sparkles size={12} />
              <span>Cms Management</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-zinc-900">
              Studio <span className="text-zinc-400">Journal</span>
            </h1>
          </div>
          <Button 
            onClick={() => { resetForm(); setIsEditorOpen(true); }}
            className="bg-zinc-900 hover:bg-orange-600 text-white rounded-xl h-12 px-6 font-bold uppercase text-[11px] tracking-widest transition-all shadow-lg"
          >
            <Plus className="mr-2 w-4 h-4" /> New Entry
          </Button>
        </div>

        {/* COMPACT GRID */}
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-orange-500" size={30} /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((post) => (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                key={post.id} 
                className="group bg-white rounded-2xl border border-zinc-200/50 overflow-hidden transition-all hover:shadow-xl"
              >
                <div className="relative aspect-video overflow-hidden">
                  <Image src={post.image} alt={post.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-3">
                    <button onClick={() => { setCurrentPost(post); setPreviewUrl(post.image); setIsEditorOpen(true); }} className="p-3 bg-white rounded-lg hover:bg-orange-500 hover:text-white transition-colors"><Edit3 size={16} /></button>
                    <button onClick={() => deletePost(post.id)} className="p-3 bg-white rounded-lg hover:bg-red-600 hover:text-white transition-colors"><Trash2 size={16} /></button>
                  </div>
                </div>
                <div className="p-5 space-y-2">
                  <span className="text-[10px] font-bold text-orange-600 uppercase">{post.category}</span>
                  <h3 className="text-lg font-bold text-zinc-900 leading-tight line-clamp-1">{post.title}</h3>
                  <div className="flex items-center text-[10px] text-zinc-400 font-medium italic">
                    <Calendar size={12} className="mr-1" />
                    {post.createdAt ? new Date(post.createdAt.seconds * 1000).toLocaleDateString() : 'Recent'}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* REFINED EDITOR MODAL (Zinc-50 Background, Compact Padding) */}
      <AnimatePresence>
        {isEditorOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" onClick={() => setIsEditorOpen(false)} />
            <motion.div 
              initial={{ scale: 0.98, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              className="bg-zinc-50 w-full max-w-4xl rounded-3xl shadow-2xl p-6 md:p-10 relative z-10 max-h-[90vh] overflow-y-auto border border-zinc-200"
            >
              <div className="flex justify-between items-center mb-8 border-b border-zinc-200 pb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center text-white">
                    <FileText size={20} />
                  </div>
                  <h2 className="text-2xl font-black uppercase tracking-tight">Story <span className="text-zinc-400">Editor</span></h2>
                </div>
                <button onClick={() => setIsEditorOpen(false)} className="p-2 hover:bg-zinc-200 rounded-lg transition-colors"><X size={20}/></button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* LEFT: MEDIA */}
                <div className="space-y-4">
                   <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Cover Image</label>
                   <label className="relative aspect-[4/3] rounded-2xl border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center cursor-pointer overflow-hidden hover:bg-zinc-100 transition-all group">
                    {previewUrl || currentPost.image ? (
                      <Image src={previewUrl || currentPost.image} alt="Preview" fill className="object-cover" />
                    ) : (
                      <div className="text-center">
                        <UploadCloud className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                        <p className="text-[10px] font-bold uppercase text-zinc-400">Click to upload</p>
                      </div>
                    )}
                    <input type="file" className="hidden" onChange={handleImageChange} accept="image/*" />
                  </label>
                </div>

                {/* RIGHT: DETAILS */}
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-zinc-500 ml-1">Title</label>
                    <input 
                      type="text" placeholder="Entry headline..."
                      className="w-full bg-white border border-zinc-200 rounded-xl py-3 px-4 text-zinc-900 font-bold focus:ring-2 ring-orange-100 outline-none transition-all"
                      value={currentPost.title} onChange={(e) => setCurrentPost({...currentPost, title: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-zinc-500 ml-1">Category</label>
                      <select 
                        className="w-full bg-white border border-zinc-200 rounded-xl py-3 px-4 text-zinc-900 font-bold outline-none cursor-pointer"
                        value={currentPost.category} onChange={(e) => setCurrentPost({...currentPost, category: e.target.value})}
                      >
                        <option value="Tattoo Culture">Culture</option>
                        <option value="Studio News">Studio</option>
                        <option value="Aftercare Tips">Aftercare</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-zinc-500 ml-1">Slug</label>
                      <input 
                        type="text" placeholder="url-path"
                        className="w-full bg-white border border-zinc-200 rounded-xl py-3 px-4 font-bold outline-none"
                        value={currentPost.slug} onChange={(e) => setCurrentPost({...currentPost, slug: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-zinc-500 ml-1">Content</label>
                    <textarea 
                      rows={5} placeholder="Write here..."
                      className="w-full bg-white border border-zinc-200 rounded-xl py-4 px-4 text-zinc-700 font-medium outline-none resize-none leading-relaxed"
                      value={currentPost.content} onChange={(e) => setCurrentPost({...currentPost, content: e.target.value})}
                    />
                  </div>

                  <Button 
                    onClick={handleSave} disabled={actionLoading}
                    className="w-full h-14 bg-zinc-900 hover:bg-orange-600 text-white rounded-xl font-bold uppercase tracking-widest text-[11px] transition-all shadow-md mt-2"
                  >
                    {actionLoading ? <Loader2 className="animate-spin" /> : <><Save className="mr-2 w-4 h-4" /> Save Journal</>}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}