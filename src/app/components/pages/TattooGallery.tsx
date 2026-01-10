"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Loader2 } from "lucide-react"

export default function TattooGallery() {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Kuha ng images mula sa API
  const fetchImages = async () => {
    try {
      const res = await fetch("/api/gallery");
      const data = await res.json();
      if (Array.isArray(data)) setImages(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchImages(); }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      setUploading(true);
      try {
        await fetch("/api/gallery", {
          method: "POST",
          body: JSON.stringify({ image: reader.result }),
        });
        fetchImages();
      } catch (err) {
        alert("Upload failed");
      } finally {
        setUploading(false);
      }
    };
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black italic uppercase">Gallery</h2>
        <input type="file" id="up" className="hidden" onChange={handleUpload} accept="image/*" />
        <Button asChild disabled={uploading}>
          <label htmlFor="up" className="cursor-pointer">
            {uploading ? <Loader2 className="animate-spin mr-2" /> : <Plus className="mr-2" />}
            Upload
          </label>
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {images.map((img) => (
          <div key={img._id} className="aspect-square rounded-xl overflow-hidden border">
            <img src={img.image} className="w-full h-full object-cover" alt="work" />
          </div>
        ))}
      </div>
    </div>
  );
}