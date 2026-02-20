"use client";

import React, { useEffect, useState } from 'react';
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { 
  History, 
  User, 
  Activity, 
  Clock, 
  Terminal, 
  Filter,
  ArrowRightLeft,
  ShieldAlert,
  Search
} from "lucide-react";
import { format } from "date-fns";

interface AuditLog {
  id: string;
  adminName: string;
  action: string;
  details: string;
  timestamp: any;
  module: string;
}

export default function AuditTrail() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // Kinukuha natin ang last 100 activities
    const q = query(
      collection(db, "audit_logs"), 
      orderBy("timestamp", "desc"),
      limit(100)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AuditLog[];
      
      setLogs(logsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredLogs = logs.filter(log => 
    log.adminName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 transition-colors duration-300">
      {/* HEADER & SEARCH */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-2xl">
            <History className="text-primary h-6 w-6" />
          </div>
          <div>
            <h2 className="text-4xl font-[1000] uppercase italic tracking-tighter text-zinc-900 dark:text-white">
              System <span className="text-primary">Audits</span>
            </h2>
            <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Tracking personnel movements & modifications</p>
          </div>
        </div>

        <div className="relative w-full xl:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input 
            type="text"
            placeholder="Search by personnel or action..."
            className="w-full h-12 pl-12 pr-4 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-bold uppercase tracking-tight focus:ring-2 ring-primary/20 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* LOGS LIST */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-20 text-center">
            <Activity className="h-8 w-8 text-primary animate-spin mx-auto mb-4" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Decrypting Logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-zinc-100 dark:border-zinc-900 rounded-[3rem]">
            <ShieldAlert className="h-10 w-10 text-zinc-200 dark:text-zinc-800 mx-auto mb-4" />
            <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">No activity detected in the perimeter.</p>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div 
              key={log.id} 
              className="group flex flex-col md:flex-row items-start md:items-center justify-between p-5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-[2rem] hover:border-primary/40 transition-all shadow-sm dark:shadow-none"
            >
              <div className="flex items-center gap-4 w-full md:w-1/3">
                <div className="h-10 w-10 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <User size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase italic text-zinc-900 dark:text-white leading-none mb-1">
                    {log.adminName || "Unknown Admin"}
                  </h4>
                  <span className="text-[9px] font-bold text-primary uppercase tracking-widest">
                    {log.module || "SYSTEM"}
                  </span>
                </div>
              </div>

              <div className="flex-1 my-4 md:my-0 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900">
                  <Terminal size={14} className="text-zinc-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-tight">
                    {log.action}
                  </p>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                    {log.details}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-zinc-400">
                <Clock size={14} />
                <span className="text-[10px] font-black uppercase tracking-tighter">
                  {log.timestamp ? format(log.timestamp.toDate(), "MMM dd, yyyy • hh:mm a") : "---"}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}