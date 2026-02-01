"use client"
import { useState, useEffect } from "react"
import { db } from "@/lib/firebase"
import { collection, query, orderBy, onSnapshot } from "firebase/firestore"
import { ClipboardList, Search, FileDown, Truck, Box, Calendar } from "lucide-react"
import { format } from "date-fns"
import * as XLSX from "xlsx"
import { Button } from "@/components/ui/button"

export default function DeliveryReports() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
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
    XLSX.writeFile(workbook, `Audit_Report_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
  };

  const filteredReports = reports.filter(r => 
    (r.item_name?.toLowerCase() || "").includes(search.toLowerCase()) ||
    (r.supplier?.toLowerCase() || "").includes(search.toLowerCase()) ||
    (r.action?.toLowerCase() || "").includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-10 bg-zinc-50 min-h-screen text-zinc-900 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-center bg-zinc-900 p-8 rounded-[2.5rem] text-white shadow-2xl gap-6">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-white rounded-2xl text-black shadow-lg"><ClipboardList size={28} /></div>
            <div>
              <h1 className="text-3xl font-black italic uppercase tracking-tighter">Master Logs</h1>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em]">Audit & Export System</p>
            </div>
          </div>
          
          <Button 
            onClick={exportToExcel}
            className="bg-green-600 hover:bg-green-700 text-white rounded-2xl h-14 px-8 font-black uppercase text-xs tracking-widest border-none shadow-xl transition-all"
          >
            <FileDown size={20} className="mr-3"/> Export to Excel
          </Button>
        </header>

        {/* SEARCH & FILTERS */}
        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Search logs by asset, supplier, or action..." 
            className="w-full bg-white border-2 border-zinc-100 rounded-[2rem] px-8 py-6 pl-16 outline-none font-bold uppercase shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* TABLE LOGS */}
        <div className="bg-white rounded-[3rem] shadow-xl border border-zinc-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-zinc-50 border-b border-zinc-100">
              <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                <th className="px-10 py-6">Timestamp</th>
                <th className="px-10 py-6">Log Type</th>
                <th className="px-10 py-6">Subject / Source</th>
                <th className="px-10 py-6">Activity Manifest</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {filteredReports.map((report) => {
                const isSupplierDelivery = !!report.items;
                return (
                  <tr key={report.id} className="hover:bg-zinc-50/50 transition-colors group">
                    <td className="px-10 py-6 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-black text-sm uppercase italic">
                          {report.createdAt?.toDate ? format(report.createdAt.toDate(), "MMM dd, yyyy") : "Recent"}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-bold tracking-widest">
                          {report.createdAt?.toDate ? format(report.createdAt.toDate(), "hh:mm a") : "---"}
                        </span>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${isSupplierDelivery ? 'bg-orange-100 text-orange-600' : 'bg-zinc-100 text-zinc-600'}`}>
                        {isSupplierDelivery ? <Truck size={12} /> : <Box size={12} />}
                        {isSupplierDelivery ? "Supplier" : "Equipment"}
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <p className="font-black text-lg uppercase tracking-tighter leading-none">
                        {isSupplierDelivery ? report.supplier : report.item_name}
                      </p>
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                        {isSupplierDelivery ? "Stock Inflow" : (report.action?.replace(/_/g, ' ') || "Sync Log")}
                      </span>
                    </td>
                    <td className="px-10 py-6">
                      <div className="max-w-xs">
                        {isSupplierDelivery ? (
                          <div className="flex flex-wrap gap-1">
                            {report.items.map((item: any, idx: number) => (
                              <span key={idx} className="bg-zinc-100 text-[9px] font-bold px-2 py-0.5 rounded text-zinc-600 uppercase">
                                {item.productName} (x{item.quantity})
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs font-bold text-zinc-500 uppercase italic">
                            {report.details?.category || 'General'} Entry • Qty: {report.details?.quantity || 0}
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filteredReports.length === 0 && (
            <div className="py-20 text-center text-zinc-300 font-black uppercase tracking-widest italic">
              No audit records found
            </div>
          )}
        </div>
      </div>
    </div>
  )
}