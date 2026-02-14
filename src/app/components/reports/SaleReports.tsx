"use client"

import { useState, useEffect } from "react"
import { 
  Search, FileDown, TrendingUp, ShoppingBag, 
  Package, Receipt, ArrowUpRight 
} from "lucide-react"
import { format, isValid } from "date-fns"
import * as XLSX from "xlsx"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function SalesReports() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      setLoading(true);
      
      // I-fetch ang tatlong source sabay-sabay
      const [resPromos, resBookings, resOrders] = await Promise.all([
        fetch("/api/promos"),
        fetch("/api/bookings"),
        fetch("/api/orders")
      ]);

      const promosData = await resPromos.json();
      const bookingsData = await resBookings.json();
      const ordersData = await resOrders.json();

      // 1. Normalize Promos Data
      const promosList = (Array.isArray(promosData) ? promosData : promosData.promos || []).map((p: any) => ({
        ...p,
        source: "Promo",
        displayName: p.name,
        displayPrice: Number(p.price || 0),
        displayDate: p.createdAt || p.timestamp,
        materials: p.productsUsed || []
      }));

      // 2. Normalize Finished Bookings
      const bookingsList = (Array.isArray(bookingsData) ? bookingsData : bookingsData.bookings || [])
        .filter((b: any) => b.status === "finished")
        .map((b: any) => ({
          ...b,
          source: "Regular",
          displayName: b.service,
          displayPrice: Number(b.finalPrice || 0),
          displayDate: b.finishedAt || b.timestamp,
          materials: b.inventoryUsed || [] 
        }));

      // 3. Normalize Paid Orders (E-commerce/Shop)
      const ordersList = (Array.isArray(ordersData) ? ordersData : [])
        .filter((o: any) => o.status === "Paid" || o.status === "Delivered")
        .map((o: any) => ({
          ...o,
          source: "Shop",
          displayName: `Order: ${o.customer_name}`,
          artist: "Store Sale", // Default artist name para sa orders
          displayPrice: Number(o.total_amount || 0),
          displayDate: o.createdAt || o.timestamp,
          // I-convert ang items format para mag-match sa materials list
          materials: o.items?.map((i: any) => ({ name: i.name, quantity: i.quantity })) || []
        }));

      // Combine and Sort by Date
      const combined = [...promosList, ...bookingsList, ...ordersList].sort((a, b) => {
        const dateA = a.displayDate?.seconds || new Date(a.displayDate).getTime();
        const dateB = b.displayDate?.seconds || new Date(b.displayDate).getTime();
        return dateB - dateA;
      });

      setSales(combined);
    } catch (error) {
      console.error("Failed to fetch consolidated sales:", error);
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

  const filteredSales = sales.filter(s => 
    (s.displayName?.toLowerCase() || "").includes(search.toLowerCase()) ||
    (s.artist?.toLowerCase() || "").includes(search.toLowerCase()) ||
    (s.source?.toLowerCase() || "").includes(search.toLowerCase())
  );

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
    <div className="p-4 md:p-10 bg-[#F8FAFC] min-h-screen text-slate-900 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* HEADER */}
        <header className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-orange-600/10 rounded-full blur-3xl"></div>
          <div className="lg:col-span-2 flex items-center gap-6 relative z-10">
            <div className="p-5 bg-orange-600 rounded-3xl text-white shadow-xl shadow-orange-900/40 animate-pulse">
              <TrendingUp size={32} />
            </div>
            <div>
              <h1 className="text-4xl font-black italic uppercase tracking-tighter">Grand Ledger</h1>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em]">Services + Shop Analytics</p>
            </div>
          </div>
          <div className="flex flex-col justify-center items-end relative z-10">
            <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest bg-orange-500/10 px-3 py-1 rounded-full mb-2">Total Combined Revenue</span>
            <h2 className="text-5xl font-black italic tracking-tighter text-white">₱{totalRevenue.toLocaleString()}</h2>
            <Button onClick={exportToExcel} className="mt-4 bg-white text-black hover:bg-slate-200 rounded-xl h-10 w-full uppercase text-[10px] font-black">
              <FileDown size={16} className="mr-2"/> Export Report
            </Button>
          </div>
        </header>

        {/* SEARCH */}
        <div className="relative group max-w-2xl">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-600 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search service, shop order, or artist..." 
            className="w-full bg-white border-2 border-slate-100 rounded-[2rem] px-8 py-6 pl-16 outline-none font-bold uppercase shadow-sm focus:border-orange-500 transition-all text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">
                  <th className="px-10 py-6">Timestamp</th>
                  <th className="px-10 py-6">Transaction Type</th>
                  <th className="px-10 py-6">Personnel</th>
                  <th className="px-10 py-6">Details / Items</th>
                  <th className="px-10 py-6 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan={5} className="py-32 text-center text-[10px] font-black uppercase text-slate-400">Syncing Master Database...</td></tr>
                ) : filteredSales.map((sale, idx) => (
                  <tr key={sale.id || idx} className="hover:bg-slate-50/80 transition-all group">
                    <td className="px-10 py-8">
                      <div className="flex flex-col">
                        <span className="font-black text-sm uppercase italic text-slate-700">{safeFormatDate(sale.displayDate, "MMM dd, yyyy")}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">{safeFormatDate(sale.displayDate, "hh:mm a")}</span>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex flex-col gap-1.5">
                        <div className={cn(
                          "w-fit px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border",
                          sale.source === 'Promo' ? "bg-orange-50 text-orange-600 border-orange-100" : 
                          sale.source === 'Regular' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                          "bg-blue-50 text-blue-600 border-blue-100"
                        )}>
                          {sale.source}
                        </div>
                        <p className="font-black text-sm uppercase tracking-tighter text-slate-800 flex items-center gap-1">
                          {sale.source === 'Shop' ? <ShoppingBag size={14} className="text-blue-500" /> : <Receipt size={14} className="text-slate-300" />}
                          {sale.displayName}
                        </p>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <span className="text-xs font-black uppercase tracking-tight text-slate-600">{sale.artist}</span>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex flex-wrap gap-1.5 max-w-[220px]">
                        {sale.materials?.map((item: any, i: number) => (
                          <div key={i} className="bg-white border border-slate-200 text-[9px] font-bold px-2 py-1 rounded-md text-slate-500 uppercase flex items-center gap-1">
                            {item.name} <span className="text-orange-600 font-black">×{item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-10 py-8 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-lg font-black italic tracking-tighter text-slate-900">₱{sale.displayPrice?.toLocaleString()}</span>
                        <div className="flex items-center text-[8px] font-black text-green-500 uppercase">Paid <ArrowUpRight size={10} /></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}