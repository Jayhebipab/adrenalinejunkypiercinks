"use client"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function TattooGallery() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black italic uppercase tracking-tighter">Tattoo Gallery</h2>
        <Button size="sm" className="bg-black text-white rounded-full">
          <Plus className="size-4 mr-2" /> Upload Photo
        </Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="aspect-square bg-muted rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center">
             <span className="text-xs text-gray-400 font-bold uppercase tracking-widest italic">Slot {i}</span>
          </div>
        ))}
      </div>
    </div>
  )
}