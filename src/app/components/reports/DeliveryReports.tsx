"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { 
  ClipboardList, 
  Search, 
  FileDown, 
  Truck, 
  Box, 
  Calendar,
  Loader2,
  ChevronRight,
  PackagePlus,
  ArrowUpRight
} from "lucide-react";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function DeliveryReports() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    // Real-time listener sa Firestore
    const q = query(collection(db, "delivery_reports"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReports(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- EXCEL EXPORT LOGIC ---
  const exportToExcel = () => {
    const dataToExport = filteredReports.map(report => ({
      Date: report.createdAt?.toDate ? format(report.createdAt.toDate(), "yyyy-MM-dd HH:mm") : "N/A",
      Type: report.items ? "SUPPLIER DELIVERY" : "EQUIPMENT LOG",
      Subject: report.items ? `Batch from ${report.supplier}` : report.item_name,
      Action: report.action || "REGISTERED",
      Details: report.items 
        ? report.items.map((i: any) => `${i.productName}(x${i.quantity})`).join(", ")
        : `Qty: ${report.details?.quantity || 0} - Price: ${report.details?.price || 0}`
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "DeliveryLogs");
    XLSX.writeFile(workbook, `Adrenaline_Master_Logs_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
  };

  const filteredReports = reports.filter(r => 
    (r.item_name?.toLowerCase() || "").includes(search.toLowerCase()) ||
    (r.supplier?.toLowerCase() || "").includes(search.toLowerCase()) ||
    (r.action?.toLowerCase() || "").includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 p-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div className="flex items-center gap-5">

          <div>
            <h2 className="text-4xl font-[1000] uppercase italic tracking-tighter text-zinc-900 dark:text-white leading-none">
              Master <span className="text-primary">Logs</span>
            </h2>
            <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.3em] mt-2">Audit, Supply & Asset Intelligence</p>
          </div>
        </div>

        <Button 
          onClick={exportToExcel}
          className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black hover:bg-primary dark:hover:bg-primary dark:hover:text-white rounded-2xl h-14 px-8 font-[1000] uppercase text-[10px] tracking-[0.2em] transition-all group shadow-2xl"
        >
          <FileDown size={18} className="mr-3 group-hover:bounce" />
          Export Master Ledger
        </Button>
      </div>

      {/* SEARCH TOOLBAR */}
      <div className="relative group max-w-2xl">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors" size={20} />
        <input 
          type="text" 
          placeholder="Filter by asset, supplier, or action manifest..." 
          className="w-full bg-white dark:bg-zinc-950 border-2 border-zinc-100 dark:border-zinc-900 rounded-[2rem] px-8 py-6 pl-16 outline-none font-bold uppercase shadow-sm focus:border-primary transition-all text-xs text-zinc-900 dark:text-white"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* DATA TABLE */}
      <div className="bg-white dark:bg-zinc-950 rounded-[3rem] border border-zinc-100 dark:border-zinc-900 overflow-hidden shadow-2xl shadow-zinc-200/50 dark:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 dark:bg-zinc-900/50 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 border-b border-zinc-100 dark:border-zinc-900">
                <th className="px-10 py-6">Timestamp</th>
                <th className="px-10 py-6">Log Category</th>
                <th className="px-10 py-6">Subject / Source</th>
                <th className="px-10 py-6">Activity Manifest</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-900">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-32 text-center">
                    <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Syncing Master Logs...</p>
                  </td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-32 text-center text-[10px] font-black uppercase text-zinc-500 italic tracking-widest">
                    No encrypted records found in perimeter.
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => {
                  const isSupplierDelivery = !!report.items;
                  return (
                    <tr key={report.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-all group">
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-4">
                          <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-zinc-400 group-hover:text-primary transition-colors">
                            <Calendar size={16} />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-black text-sm uppercase italic text-zinc-900 dark:text-white leading-none">
                              {report.createdAt?.toDate ? format(report.createdAt.toDate(), "MMM dd, yyyy") : "Recent"}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-bold uppercase mt-1 tracking-tighter">
                              {report.createdAt?.toDate ? format(report.createdAt.toDate(), "hh:mm a") : "---"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <div className={cn(
                          "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                          isSupplierDelivery 
                            ? "bg-orange-500/10 text-orange-500 border-orange-500/20" 
                            : "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"
                        )}>
                          {isSupplierDelivery ? <Truck size={12} /> : <Box size={12} />}
                          {isSupplierDelivery ? "Supplier" : "Equipment"}
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <div>
                          <p className="font-[1000] text-lg uppercase tracking-tighter italic text-zinc-900 dark:text-white leading-none">
                            {isSupplierDelivery ? report.supplier : report.item_name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-2">
                             <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                             <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.1em]">
                              {isSupplierDelivery ? "Inflow Protocol" : (report.action?.replace(/_/g, ' ') || "Internal Log")}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <div className="max-w-xs">
                          {isSupplierDelivery ? (
                            <div className="flex flex-wrap gap-1.5">
                              {report.items.map((item: any, idx: number) => (
                                <div key={idx} className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[9px] font-black px-2.5 py-1 rounded-md text-zinc-600 dark:text-zinc-400 uppercase flex items-center gap-1">
                                  <PackagePlus size={10} className="text-primary" />
                                  {item.productName} <span className="text-primary font-[1000]">×{item.quantity}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 group/action">
                              <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase italic">
                                {report.details?.category || 'General'} Entry • Qty: {report.details?.quantity || 0}
                              </p>
                              <ArrowUpRight size={14} className="text-zinc-300 group-hover/action:text-primary transition-colors" />
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}