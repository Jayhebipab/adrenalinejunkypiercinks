"use client";

import React, { useEffect, useState } from 'react';
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where, Timestamp } from "firebase/firestore";
import { Eye, Home, Info, ShoppingBag, Palette, Syringe, BarChart3, Calendar } from "lucide-react";

interface PageCount {
  name: string;
  count: number;
}

export default function Activitylogs() {
  const [counts, setCounts] = useState<PageCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('all'); // 'all', 'today', 'week'

  useEffect(() => {
    let q = query(collection(db, "activity_logs"));

    // Date Filter Logic
    if (dateRange !== 'all') {
      const now = new Date();
      if (dateRange === 'today') {
        now.setHours(0, 0, 0, 0);
      } else if (dateRange === 'week') {
        now.setDate(now.getDate() - 7);
      }
      q = query(collection(db, "activity_logs"), where("timestamp", ">=", Timestamp.fromDate(now)));
    }
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tally: { [key: string]: number } = {};
      
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const pageName = data.page || "Unknown";
        tally[pageName] = (tally[pageName] || 0) + 1;
      });

      const formattedCounts = Object.entries(tally).map(([name, count]) => ({
        name,
        count
      })).sort((a, b) => b.count - a.count);

      setCounts(formattedCounts);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [dateRange]);

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
    <div className="space-y-6 transition-colors duration-300">
      {/* HEADER & FILTER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-black uppercase italic tracking-tighter text-zinc-900 dark:text-white">
            <span className="text-primary">Activity Logs</span>
          </h2>
        </div>

        <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-2xl border border-zinc-200 dark:border-zinc-800">
          {[
            { label: 'All Time', value: 'all' },
            { label: 'Today', value: 'today' },
            { label: '7 Days', value: 'week' }
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setLoading(true); setDateRange(opt.value); }}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                dateRange === opt.value 
                ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 py-20 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 animate-pulse">
                Crunching Data...
              </p>
            </div>
          </div>
        ) : counts.length === 0 ? (
          <div className="col-span-2 py-16 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[2.5rem]">
            <Calendar className="mx-auto h-10 w-10 text-zinc-300 dark:text-zinc-700 mb-4" />
            <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Walang trapik sa napiling petsa par.</p>
          </div>
        ) : (
          counts.map((page) => (
            <div 
              key={page.name} 
              className="relative overflow-hidden group p-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-[2rem] hover:border-primary/50 transition-all duration-500 shadow-sm dark:shadow-none"
            >
              {/* Background Glow Effect */}
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all" />

              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 group-hover:text-primary group-hover:border-primary/30 transition-all">
                    {getPageIcon(page.name)}
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-1">Navigation Path</p>
                    <h3 className="text-xl font-[1000] uppercase italic tracking-tighter text-zinc-900 dark:text-white group-hover:text-primary transition-colors">
                      {page.name}
                    </h3>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-1">Total Hits</p>
                  <div className="text-4xl font-[1000] italic text-primary tracking-tighter leading-none">
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