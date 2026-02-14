"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { 
  Calendar, Loader2, Plus, Trash2, Edit3, X, Save, UploadCloud, 
  Sparkles, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast, Toaster } from "sonner";
import { uploadToCloudinary } from "@/lib/cloudinary";

// --- TYPES ---
interface BlogPost {
  id: string;
  title: string;
  category: string;
  image: string;
  content: string;
  slug: string;
  createdAt?: { seconds: number; nanoseconds: number } | string | Date;
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

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/blogs");
      const data = await res.json();
      if (Array.isArray(data)) setBlogs(data);
    } catch (err) {
      toast.error("Failed to load journals, par.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

  // --- HANDLERS ---
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Cleanup previous preview memory
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  const onTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCurrentPost(prev => ({
      ...prev,
      title: val,
      // Auto-generate slug only if we're creating a NEW post
      slug: prev.id ? prev.slug : generateSlug(val)
    }));
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
    if (!confirm("Sigurado ka? Mabubura ito nang tuluyan.")) return;
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
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl("");
  };

  // Helper for date formatting
  const formatDate = (dateObj: any) => {
    if (!dateObj) return "Recent";
    if (dateObj.seconds) return new Date(dateObj.seconds * 1000).toLocaleDateString();
    return new Date(dateObj).toLocaleDateString();
  };

  return (
    <section className="min-h-screen text-zinc-900 py-10 md:py-16 px-6 font-sans bg-white">
      <Toaster position="bottom-right" richColors />
      
      <div className="container mx-auto max-w-6xl">
        {/* HEADER */}
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

        {/* GRID */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-orange-500" size={40} />
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Loading Journals...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((post) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={post.id} 
                className="group bg-white rounded-2xl border border-zinc-200/50 overflow-hidden transition-all hover:shadow-xl"
              >
                <div className="relative aspect-video overflow-hidden bg-zinc-100">
                  <Image 
                    src={post.image || "/placeholder.jpg"} 
                    alt={post.title} 
                    fill 
                    className="object-cover transition-transform duration-700 group-hover:scale-105" 
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-3">
                    <button 
                        onClick={() => { setCurrentPost(post); setPreviewUrl(post.image); setIsEditorOpen(true); }} 
                        className="p-3 bg-white rounded-lg hover:bg-orange-500 hover:text-white transition-colors shadow-lg"
                    >
                        <Edit3 size={16} />
                    </button>
                    <button 
                        onClick={() => deletePost(post.id)} 
                        className="p-3 bg-white rounded-lg hover:bg-red-600 hover:text-white transition-colors shadow-lg"
                    >
                        <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="p-5 space-y-2">
                  <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">{post.category}</span>
                  <h3 className="text-lg font-bold text-zinc-900 leading-tight line-clamp-1">{post.title}</h3>
                  <div className="flex items-center text-[10px] text-zinc-400 font-medium italic">
                    <Calendar size={12} className="mr-1" />
                    {formatDate(post.createdAt)}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL */}
      <AnimatePresence>
        {isEditorOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm" 
                onClick={() => setIsEditorOpen(false)} 
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
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
                {/* MEDIA */}
                <div className="space-y-4">
                   <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Cover Image</label>
                   <label className="relative aspect-[4/3] rounded-2xl border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center cursor-pointer overflow-hidden hover:bg-zinc-100 transition-all group bg-white">
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
                  <p className="text-[9px] text-zinc-400 italic text-center italic">Best size: 1200x800px (4:3 aspect ratio)</p>
                </div>

                {/* DETAILS */}
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-zinc-500 ml-1">Title</label>
                    <input 
                      type="text" placeholder="Entry headline..."
                      className="w-full bg-white border border-zinc-200 rounded-xl py-3 px-4 text-zinc-900 font-bold focus:ring-2 ring-orange-100 outline-none transition-all"
                      value={currentPost.title} 
                      onChange={onTitleChange}
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
                      <label className="text-[10px] font-bold uppercase text-zinc-500 ml-1">Slug (URL)</label>
                      <input 
                        type="text" placeholder="url-path"
                        className="w-full bg-zinc-100 border border-zinc-200 rounded-xl py-3 px-4 font-mono text-[10px] text-zinc-500 outline-none"
                        value={currentPost.slug} 
                        readOnly // Let it be auto-generated but visible
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-zinc-500 ml-1">Content</label>
                    <textarea 
                      rows={6} placeholder="Tell the story behind this entry..."
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