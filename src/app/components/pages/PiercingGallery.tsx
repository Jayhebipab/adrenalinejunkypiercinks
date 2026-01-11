"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, Loader2, UploadCloud, ImageIcon, X, Maximize2 } from "lucide-react"
import { Toaster, toast } from "sonner" 

interface GalleryRow {
  id: number;
  placement: string;
  images: string[];
}

export default function PiercingGallery() {
  // State for Fetching
  const [galleryItems, setGalleryItems] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);

  // State for Upload Form
  const [rows, setRows] = useState<GalleryRow[]>([{ id: Date.now(), placement: "", images: [] }]);
  const [uploading, setUploading] = useState(false);
  
  // State para sa Maximize/Lightbox
  const [selectedImg, setSelectedImg] = useState<string | null>(null);

  // --- 1. FETCH LOGIC ---
  const fetchGallery = async () => {
    setFetching(true);
    try {
      const res = await fetch("/api/gallery"); 
      const data = await res.json();
      if (Array.isArray(data)) setGalleryItems(data);
    } catch (err) {
      toast.error("Mali ang pag-fetch ng data.");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => { fetchGallery(); }, []);

  // --- 2. FORM ACTIONS ---
  const addRow = () => setRows([...rows, { id: Date.now(), placement: "", images: [] }]);
  const removeRow = (id: number) => setRows(rows.filter(row => row.id !== id));

  const handleTextChange = (id: number, val: string) => {
    setRows(rows.map(row => row.id === id ? { ...row, placement: val } : row));
  };

  const handleImageUpload = (id: number, files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        setRows(prev => prev.map(row => 
          row.id === id ? { ...row, images: [...row.images, reader.result as string] } : row
        ));
      };
    });
  };

  // --- 3. SAVE LOGIC (WITH SONNER) ---
  const saveAll = async () => {
    if (rows.some(r => r.placement === "" || r.images.length === 0)) {
      toast.warning("Paki-fill up lahat ng fields!");
      return;
    }

    setUploading(true);
    
    const uploadPromise = async () => {
      for (const row of rows) {
        for (const img of row.images) {
          const res = await fetch("/api/gallery", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              image: img,
              placement: row.placement,
              category: "Piercing"
            }),
          });
          if (!res.ok) throw new Error("Upload failed");
        }
      }
      setRows([{ id: Date.now(), placement: "", images: [] }]);
      await fetchGallery();
    };

    toast.promise(uploadPromise(), {
      loading: 'Sinesave ang iyong mga piercing works...',
      success: 'Solid! Naidagdag na sa gallery.',
      error: 'Nagka-problema sa pag-save.',
    });

    setUploading(false);
  };

  // --- 4. DELETE LOGIC ---
  const deleteItem = async (id: string) => {
    const deletePromise = async () => {
      const res = await fetch("/api/gallery", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Delete failed");
      await fetchGallery();
    };

    toast.promise(deletePromise(), {
      loading: 'Binubura ang image...',
      success: 'Deleted na, par.',
      error: 'Hindi mabura ang image.',
    });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-12">
      <Toaster position="top-center" richColors theme="dark" />
      
      {/* SECTION: ADMIN UPLOAD FORM */}
      <section className="bg-zinc-900 text-white p-6 rounded-3xl shadow-2xl space-y-6">
        <div className="flex items-center gap-2">
          <ImageIcon className="text-primary w-6 h-6" />
          <h2 className="text-2xl font-black italic uppercase">Piercing Portfolio</h2>
        </div>

        <div className="space-y-4">
          {rows.map((row, index) => (
            <div key={row.id} className="p-4 bg-zinc-800 rounded-2xl border border-zinc-700 space-y-4 relative">
              <div className="flex justify-between items-center text-zinc-500 font-bold text-xs uppercase">
                <span>Set #{index + 1}</span>
                {rows.length > 1 && (
                  <Button variant="ghost" size="sm" className="text-red-400 hover:bg-red-400/10" onClick={() => removeRow(row.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Body Part (e.g. Septum, Bridge)"
                  className="w-full p-3 bg-zinc-700 rounded-xl outline-none focus:ring-2 ring-primary transition text-white"
                  value={row.placement}
                  onChange={(e) => handleTextChange(row.id, e.target.value)}
                />
                <label className="flex items-center justify-center p-3 bg-zinc-700 hover:bg-zinc-600 rounded-xl cursor-pointer transition border-2 border-dashed border-zinc-500">
                  <UploadCloud className="mr-2 w-5 h-5" />
                  <span className="text-sm">Upload Images</span>
                  <input type="file" multiple className="hidden" onChange={(e) => handleImageUpload(row.id, e.target.files)} accept="image/*" />
                </label>
              </div>

              <div className="flex flex-wrap gap-2">
                {row.images.map((img, i) => (
                  <img key={i} src={img} className="w-16 h-16 rounded-lg object-cover border border-zinc-600" alt="preview" />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <Button variant="outline" className="flex-1 bg-transparent border-zinc-600 text-white hover:bg-zinc-800" onClick={addRow}>
            <Plus className="mr-2 w-4 h-4" /> Add Row
          </Button>
          <Button className="flex-1 bg-white text-black hover:bg-zinc-200 font-bold" onClick={saveAll} disabled={uploading}>
            {uploading ? <Loader2 className="animate-spin mr-2" /> : "Save All to Gallery"}
          </Button>
        </div>
      </section>

      <hr className="border-zinc-800" />

      {/* SECTION: LIVE GALLERY FETCH */}
      <section className="space-y-6">
        <h2 className="text-3xl font-black italic uppercase underline decoration-primary underline-offset-8">Piercing Works</h2>
        
        {fetching ? (
          <div className="flex justify-center p-20"><Loader2 className="animate-spin w-10 h-10 text-zinc-500" /></div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {galleryItems.map((item) => (
              <div key={item._id} className="group relative aspect-square bg-zinc-100 rounded-2xl overflow-hidden border shadow-sm">
                <img src={item.image} className="w-full h-full object-cover transition duration-500 group-hover:scale-110" alt={item.placement} />
                
                {/* Overlay Controls */}
                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-4">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => setSelectedImg(item.image)}
                      className="p-2 bg-white/20 rounded-full hover:bg-white/40 text-white transition"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => deleteItem(item._id)}
                      className="p-2 bg-red-500/20 rounded-full hover:bg-red-500 text-white transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-white font-bold uppercase tracking-tighter italic text-sm">{item.placement}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* MAXIMIZE MODAL */}
      {selectedImg && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setSelectedImg(null)}
        >
          <button className="absolute top-8 right-8 text-white hover:text-red-500 transition">
            <X className="w-10 h-10" />
          </button>
          <img 
            src={selectedImg} 
            className="max-w-full max-h-[90vh] rounded-xl shadow-2xl object-contain" 
            onClick={(e) => e.stopPropagation()} 
            alt="Maximized"
          />
        </div>
      )}
    </div>
  );
}