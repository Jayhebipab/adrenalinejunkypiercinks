"use client";

import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, Search, FileDown, ShoppingBag, Receipt, 
  ArrowUpRight, Loader2, Calendar, User, Package, Filter, X
} from "lucide-react";
import { format, isValid, isWithinInterval, startOfDay, endOfDay, subDays, startOfMonth } from "date-fns";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function SalesReports() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // --- NEW STATES FOR FILTERING ---
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null
  });

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const [resPromos, resBookings, resOrders] = await Promise.all([
        fetch("/api/promos"),
        fetch("/api/bookings"),
        fetch("/api/orders")
      ]);

      const promosData = await resPromos.json();
      const bookingsData = await resBookings.json();
      const ordersData = await resOrders.json();

      const promosList = (Array.isArray(promosData) ? promosData : promosData.promos || []).map((p: any) => ({
        ...p, source: "Promo", displayName: p.name, displayPrice: Number(p.price || 0),
        displayDate: p.createdAt || p.timestamp, materials: p.productsUsed || []
      }));

      const bookingsList = (Array.isArray(bookingsData) ? bookingsData : bookingsData.bookings || [])
        .filter((b: any) => b.status === "finished")
        .map((b: any) => ({
          ...b, source: "Regular", displayName: b.service, displayPrice: Number(b.finalPrice || 0),
          displayDate: b.finishedAt || b.timestamp, materials: b.inventoryUsed || [] 
        }));

      const ordersList = (Array.isArray(ordersData) ? ordersData : [])
        .filter((o: any) => o.status === "Finished" || o.status === "Delivered" || o.status === "Paid")
        .map((o: any) => ({
          ...o, source: "Shop", displayName: `Order: ${o.customer_name}`, artist: "Store Sale", 
          displayPrice: Number(o.total_amount || 0), displayDate: o.updatedAt || o.createdAt || o.timestamp, 
          materials: o.items?.map((i: any) => ({ name: i.name, quantity: i.quantity })) || []
        }));

      const combined = [...promosList, ...bookingsList, ...ordersList].sort((a, b) => {
        const dateA = a.displayDate?.seconds ? a.displayDate.seconds * 1000 : new Date(a.displayDate).getTime();
        const dateB = b.displayDate?.seconds ? b.displayDate.seconds * 1000 : new Date(b.displayDate).getTime();
        return dateB - dateA;
      });

      setSales(combined);
    } catch (error) {
      toast.error("Database Sync Failed");
    } finally {
      setLoading(false);
    }
  };

  const safeFormatDate = (dateValue: any, formatStr: string) => {
    if (!dateValue) return "N/A";
    try {
      let d = (typeof dateValue.seconds === 'number') ? new Date(dateValue.seconds * 1000) : new Date(dateValue);
      return isValid(d) ? format(d, formatStr) : "Invalid Date";
    } catch (e) { return "N/A"; }
  };

  // --- FILTERING LOGIC ---
  const filteredSales = sales.filter(s => {
    // 1. Search Filter
    const matchesSearch = (s.displayName?.toLowerCase() || "").includes(search.toLowerCase()) ||
                          (s.artist?.toLowerCase() || "").includes(search.toLowerCase());
    
    // 2. Type Filter
    const matchesType = typeFilter === "ALL" || s.source.toUpperCase() === typeFilter;

    // 3. Date Filter
    let matchesDate = true;
    if (dateRange.start && dateRange.end) {
      const saleDate = s.displayDate?.seconds ? new Date(s.displayDate.seconds * 1000) : new Date(s.displayDate);
      matchesDate = isWithinInterval(saleDate, { 
        start: startOfDay(dateRange.start), 
        end: endOfDay(dateRange.end) 
      });
    }

    return matchesSearch && matchesType && matchesDate;
  });

  const totalRevenue = filteredSales.reduce((acc, curr) => acc + (curr.displayPrice || 0), 0);

  const exportToExcel = () => {
    const dataToExport = filteredSales.map(sale => ({
      Date: safeFormatDate(sale.displayDate, "yyyy-MM-dd HH:mm"),
      Source: sale.source,
      Service_Product: sale.displayName,
      Artist_Staff: sale.artist,
      Amount: sale.displayPrice,
      Items_Used: sale.materials?.map((m: any) => `${m.name}(x${m.quantity})`).join(", ") || "None"
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Grand_Sales");
    XLSX.writeFile(workbook, `Adrenaline_Grand_Sales_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
  };

  return (
    <div className="space-y-8 p-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* HEADER SECTION - SAME AS PREVIOUS */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-end gap-6 w-full">
        <div className="flex flex-col justify-end pb-2"> 
          <h2 className="text-5xl font-[1000] uppercase italic tracking-tighter text-zinc-900 dark:text-white leading-none">
            Sales <span className="text-primary">Reports</span>
          </h2>
          <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.3em] mt-3">
            Financial Analytics
          </p>
        </div>

        <div className="flex flex-col items-end gap-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 p-6 rounded-[2.5rem] min-w-[320px] shadow-sm">
          <div className="text-right w-full">
            <span className="text-[9px] font-black text-primary uppercase tracking-widest block mb-1">Total Revenue</span>
            <h2 className="text-5xl font-[1000] italic tracking-tighter text-zinc-900 dark:text-white leading-tight">
              ₱{totalRevenue.toLocaleString()}
            </h2>
          </div>
          <Button onClick={exportToExcel} className="mt-2 w-full bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-primary dark:hover:bg-primary dark:hover:text-white rounded-xl h-11 uppercase text-[10px] font-black tracking-widest transition-all shadow-md">
            <FileDown size={16} className="mr-2"/> Export Report
          </Button>
        </div>
      </div>

      {/* FILTER TOOLBAR */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* LOG TYPE SELECTOR */}
          <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
            {['ALL', 'REGULAR', 'PROMO', 'SHOP'].map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={cn(
                  "px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                  typeFilter === t 
                    ? "bg-white dark:bg-zinc-800 text-primary shadow-sm" 
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                )}
              >
                {t}
              </button>
            ))}
          </div>

          {/* QUICK DATE PRESETS */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setDateRange({ start: startOfDay(new Date()), end: new Date() })}
              className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-[9px] font-black uppercase text-zinc-500 hover:border-primary transition-all"
            >
              Today
            </button>
            <button 
              onClick={() => setDateRange({ start: subDays(new Date(), 7), end: new Date() })}
              className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-[9px] font-black uppercase text-zinc-500 hover:border-primary transition-all"
            >
              Last 7 Days
            </button>
            <button 
              onClick={() => setDateRange({ start: startOfMonth(new Date()), end: new Date() })}
              className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-[9px] font-black uppercase text-zinc-500 hover:border-primary transition-all"
            >
              This Month
            </button>
            {(dateRange.start) && (
              <button 
                onClick={() => setDateRange({ start: null, end: null })}
                className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="relative group max-w-xl">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search service, artist, or source..." 
            className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl px-6 py-4 pl-14 outline-none font-bold uppercase shadow-sm focus:border-primary transition-all text-[11px] text-zinc-900 dark:text-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* TRANSACTION TABLE (Same as your previous table but uses filteredSales) */}
      <div className="bg-white dark:bg-zinc-950 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-900 overflow-hidden shadow-sm">
        {/* ... table content same as yours ... */}
        {/* Gamitin lang ang `filteredSales` map function dito */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-900/50 text-[10px] font-black uppercase tracking-widest text-zinc-400 border-b border-zinc-100 dark:border-zinc-900">
                <th className="px-8 py-5">Timestamp</th>
                <th className="px-8 py-5">Type</th>
                <th className="px-8 py-5">Name</th>
                <th className="px-8 py-5">Products</th>
                <th className="px-8 py-5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
              {loading ? (
                <tr><td colSpan={5} className="py-32 text-center text-[10px] font-black uppercase text-zinc-500">Syncing Master Database...</td></tr>
              ) : filteredSales.length === 0 ? (
                <tr><td colSpan={5} className="py-32 text-center text-[10px] font-black uppercase text-zinc-500">No records found for this filter.</td></tr>
              ) : (
                filteredSales.map((sale, idx) => (
                   <tr key={sale.id || idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-all group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-zinc-400"><Calendar size={14} /></div>
                        <div className="flex flex-col">
                          <span className="font-black text-xs uppercase italic text-zinc-900 dark:text-white leading-none">{safeFormatDate(sale.displayDate, "MMM dd, yyyy")}</span>
                          <span className="text-[9px] text-zinc-500 font-bold uppercase mt-1">{safeFormatDate(sale.displayDate, "hh:mm a")}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1.5">
                        <span className={cn(
                          "w-fit px-2 py-0.5 rounded text-[8px] font-[1000] uppercase border",
                          sale.source === 'Promo' ? "bg-orange-500/10 text-orange-500 border-orange-500/20" : 
                          sale.source === 'Regular' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                          "bg-blue-500/10 text-blue-500 border-blue-500/20"
                        )}>{sale.source}</span>
                        <p className="font-black text-xs uppercase italic text-zinc-900 dark:text-white flex items-center gap-1.5">
                          {sale.source === 'Shop' ? <ShoppingBag size={12} className="text-blue-500" /> : <Receipt size={12} className="text-zinc-500" />}
                          {sale.displayName}
                        </p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-[11px] font-black uppercase tracking-tight text-zinc-600 dark:text-zinc-400">{sale.artist}</span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                        {sale.materials?.length > 0 ? sale.materials.map((m:any, i:number) => (
                          <div key={i} className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[8px] font-black px-2 py-0.5 rounded text-zinc-500 uppercase">
                            {m.name} <span className="text-primary">×{m.quantity}</span>
                          </div>
                        )) : <span className="text-[9px] font-bold text-zinc-500 italic uppercase">Labor Only</span>}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <span className="text-lg font-[1000] italic tracking-tighter text-zinc-900 dark:text-white">₱{(sale.displayPrice ?? 0).toLocaleString()}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}