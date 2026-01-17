"use client";

import { useState, useEffect } from "react";
import { Trash2, Eye, EyeOff, Star, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Review {
  _id: string;
  name: string;
  stars: number;
  description: string;
  userImage?: string;
  isVisible: boolean;
}

export default function ReviewsPanel() {
  const [reviews, setReviews] = useState<Review[]>([]);

  // 1. Fetch Reviews
  const fetchReviews = async () => {
    const res = await fetch("/api/reviews");
    const data = await res.json();
    setReviews(data);
  };

  useEffect(() => { fetchReviews(); }, []);

  // 2. Toggle Hide/Show
  const toggleVisibility = async (id: string, currentStatus: boolean) => {
    await fetch("/api/reviews", {
      method: "PUT",
      body: JSON.stringify({ id, isVisible: !currentStatus }),
    });
    fetchReviews(); // Refresh list
  };

  // 3. Delete Review
  const deleteReview = async (id: string) => {
    if (!confirm("Sigurado ka bang buburahin ito?")) return;
    await fetch("/api/reviews", {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });
    fetchReviews(); // Refresh list
  };

  return (
    <div className="p-6 bg-white rounded-3xl border border-zinc-100 shadow-sm">
      <h2 className="text-sm font-black uppercase tracking-[0.3em] mb-6">Customer Reviews Management</h2>
      
      <div className="space-y-4">
        {reviews.map((rev) => (
          <div key={rev._id} className={`p-4 rounded-2xl border transition-all ${rev.isVisible ? "bg-white border-zinc-100" : "bg-zinc-50 border-dashed border-zinc-200 opacity-60"}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {rev.userImage ? (
                  <img src={rev.userImage} className="w-10 h-10 rounded-full grayscale" />
                ) : (
                  <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center"><User size={16}/></div>
                )}
                <div>
                  <p className="text-xs font-black uppercase tracking-tight">{rev.name}</p>
                  <div className="flex text-yellow-500">
                    {[...Array(rev.stars)].map((_, i) => <Star key={i} size={10} fill="currentColor" />)}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => toggleVisibility(rev._id, rev.isVisible)}
                  className="h-8 w-8 rounded-full"
                >
                  {rev.isVisible ? <Eye size={14} /> : <EyeOff size={14} className="text-red-500" />}
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => deleteReview(rev._id)}
                  className="h-8 w-8 rounded-full hover:bg-red-50 hover:text-red-600 border-none"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-zinc-500 leading-relaxed uppercase tracking-wide">
              {rev.description}
            </p>
          </div>
        ))}

        {reviews.length === 0 && <p className="text-center text-[10px] text-zinc-400 py-10 font-bold uppercase tracking-widest">No reviews found in database.</p>}
      </div>
    </div>
  );
}