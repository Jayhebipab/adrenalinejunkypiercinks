"use client";

import React, { useEffect, useState } from 'react';
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query } from "firebase/firestore";
import { Eye, Home, Info, ShoppingBag, Palette, Syringe, BarChart3 } from "lucide-react";

interface PageCount {
  name: string;
  count: number;
}

export default function Activitylogs() {
  const [counts, setCounts] = useState<PageCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "activity_logs"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tally: { [key: string]: number } = {};
      
      // Bilangin kung ilang beses lumabas ang bawat page
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const pageName = data.page || "Unknown";
        tally[pageName] = (tally[pageName] || 0) + 1;
      });

      // I-convert ang object sa array para madaling i-map
      const formattedCounts = Object.entries(tally).map(([name, count]) => ({
        name,
        count
      })).sort((a, b) => b.count - a.count); // Pinakamaraming hits ang nasa taas

      setCounts(formattedCounts);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Custom Icons base sa Page Name
  const getPageIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('home')) return <Home className="h-5 w-5" />;
    if (n.includes('about')) return <Info className="h-5 w-5" />;
    if (n.includes('shop')) return <ShoppingBag className="h-5 w-5" />;
    if (n.includes('artist')) return <Palette className="h-5 w-5" />;
    if (n.includes('piercing')) return <Syringe className="h-5 w-5" />;
    return <Eye className="h-5 w-5" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <BarChart3 className="text-primary h-6 w-6" />
          <h2 className="text-3xl font-black uppercase italic tracking-tighter">
            Live <span className="text-primary">Traffic</span>
          </h2>
        </div>
        <div className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
          <p className="text-[10px] font-black uppercase text-primary animate-pulse">Live Counting</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 py-10 text-center text-[10px] font-black uppercase tracking-widest text-zinc-700 animate-pulse">
            Calculating Analytics...
          </div>
        ) : counts.length === 0 ? (
          <div className="col-span-2 py-10 text-center border-2 border-dashed border-zinc-900 rounded-3xl">
            <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest">No Traffic Data Detected</p>
          </div>
        ) : (
          counts.map((page) => (
            <div 
              key={page.name} 
              className="relative overflow-hidden group p-5 bg-zinc-950 border border-zinc-900 rounded-3xl hover:border-primary/50 transition-all duration-500"
            >
              {/* Background Glow Effect */}
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-primary group-hover:border-primary/30 transition-all">
                    {getPageIcon(page.name)}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-1">Page Title</p>
                    <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">
                      {page.name}
                    </h3>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-1">Total Hits</p>
                  <div className="text-3xl font-black italic text-primary tracking-tighter">
                    {page.count.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}