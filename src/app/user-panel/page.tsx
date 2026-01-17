"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { Star, Send, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UserPanel() {
  const { data: session } = useSession();
  const [rating, setRating] = useState(5);
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(false);

  const submitReview = async () => {
    if (!desc) return alert("Pakilagay ang iyong karanasan!");
    setLoading(true);
    
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: session?.user?.name,
          stars: rating,
          description: desc,
          userEmail: session?.user?.email,
          userImage: session?.user?.image
        }),
      });

      if (res.ok) {
        alert("Review submitted! Salamat sa suporta, par!");
        setDesc("");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-10 space-y-10">
      {/* Existing Header... */}

      <section className="bg-black text-white p-8 rounded-3xl shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <MessageSquare className="text-red-600" />
          <h2 className="text-xl font-black uppercase tracking-tighter italic">Leave a Review</h2>
        </div>

        <div className="space-y-6">
          {/* STAR RATING */}
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                size={24}
                className={`cursor-pointer transition-all ${s <= rating ? "fill-yellow-400 text-yellow-400" : "text-zinc-700"}`}
                onClick={() => setRating(s)}
              />
            ))}
          </div>

          {/* DESCRIPTION */}
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Tell us about your masterpiece..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-sm focus:border-red-600 outline-none min-h-[120px]"
          />

          <Button 
            onClick={submitReview}
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-[0.2em] py-6"
          >
            {loading ? "Submitting..." : "Post Review"} <Send size={16} className="ml-2" />
          </Button>
        </div>
      </section>
      
      {/* Displaying database-stored info diagram */}
      
    </div>
  );
}