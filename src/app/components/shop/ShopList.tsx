"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { 
  Package, X, Search, 
  Loader2, Eye, ExternalLink, 
  RefreshCw, Phone, MapPin, 
  Calendar, ChevronDown, Trash2,
  CheckCircle2, Clock, Filter
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster, toast } from "sonner";
import { cn } from "@/lib/utils";

interface OrderItem {
  productId?: string;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  customer_name: string;
  contact_number: string;
  address: string;
  total_amount: number;
  status: string;
  payment_method: string;
  screenshot: string;
  items: OrderItem[];
  createdAt?: any; 
}

export default function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImg, setSelectedImg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      toast.error("Error loading orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      });
      if (res.ok) {
        toast.success(`Order marked as ${newStatus}`);
        fetchOrders();
      }
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const deleteOrder = async (id: string) => {
    if (!confirm("Delete this order record?")) return;
    try {
      const res = await fetch('/api/orders', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        toast.success("Order deleted");
        fetchOrders();
      }
    } catch (err) {
      toast.error("Failed to delete order");
    }
  };

  const getOrderDate = (order: Order): Date | null => {
    if (!order.createdAt) return null;
    if (order.createdAt.seconds) return new Date(order.createdAt.seconds * 1000);
    return new Date(order.createdAt);
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = 
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.contact_number?.includes(searchTerm);
    const matchesStatus = statusFilter === "All" || order.status === statusFilter;
    
    let matchesDate = true;
    if (dateFrom || dateTo) {
      const orderDate = getOrderDate(order);
      if (!orderDate) matchesDate = false;
      else {
        const from = dateFrom ? new Date(dateFrom) : null;
        const to = dateTo ? new Date(dateTo + 'T23:59:59') : null; 
        if (from && to) matchesDate = orderDate >= from && orderDate <= to;
        else if (from) matchesDate = orderDate >= from;
        else if (to) matchesDate = orderDate <= to;
      }
    }
    return matchesSearch && matchesStatus && matchesDate;
  });

  const formatOrderDate = (order: Order): string => {
    const date = getOrderDate(order);
    if (!date) return "N/A";
    return date.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-10 font-sans text-slate-900 dark:text-slate-100 selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
      <Toaster position="bottom-center" richColors />

      <div className="max-w-[1300px] mx-auto space-y-6">
        
        {/* HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="h-[1px] w-6 bg-black dark:bg-white"></span>
              <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
                Transactions
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter leading-none text-slate-900 dark:text-white">
              Order Management
            </h1>
          </div>

          <div className="flex gap-3 w-full lg:w-auto">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <input 
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 pl-10 pr-4 py-3 bg-white dark:bg-zinc-900 rounded-xl text-[11px] font-bold uppercase tracking-wider border border-slate-100 dark:border-zinc-800 focus:border-black dark:focus:border-white outline-none transition-all"
              />
            </div>
            
            <button 
              onClick={fetchOrders}
              className="p-3 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* FILTERS AREA */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="bg-black dark:bg-white text-white dark:text-black px-4 py-3 rounded-xl hover:bg-zinc-800 dark:hover:bg-slate-200 transition-all shadow-md flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest"
            >
              <Filter className="w-4 h-4" /> {statusFilter}
              <ChevronDown className={cn("w-3 h-3 transition-transform", isFilterOpen && "rotate-180")} />
            </button>
            {isFilterOpen && (
              <div className="absolute left-0 top-full mt-2 w-48 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-slate-100 dark:border-zinc-800 py-2 z-20">
                {["All", "Pending", "Paid"].map((status) => (
                  <button
                    key={status}
                    onClick={() => { setStatusFilter(status); setIsFilterOpen(false); }}
                    className={cn(
                      "w-full text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-colors",
                      statusFilter === status ? "bg-black text-white dark:bg-white dark:text-black" : "hover:bg-slate-50 dark:hover:bg-zinc-800"
                    )}
                  >
                    {status}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button 
            onClick={() => setIsDateFilterOpen(!isDateFilterOpen)}
            className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 px-4 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest flex items-center gap-2"
          >
            <Calendar className="w-4 h-4 text-orange-600" />
            {dateFrom || dateTo ? "Date Range Set" : "Date Filter"}
          </button>
        </div>

        {/* DATE MODAL (Subtle) */}
        {isDateFilterOpen && (
          <div className="p-6 bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800 rounded-[2rem] grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-slate-400">From</label>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full p-2 bg-transparent border-b border-slate-200 dark:border-zinc-700 outline-none text-xs font-bold" />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-slate-400">To</label>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full p-2 bg-transparent border-b border-slate-200 dark:border-zinc-700 outline-none text-xs font-bold" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setDateFrom(""); setDateTo(""); }} className="flex-1 py-2 text-[10px] font-bold uppercase border border-slate-200 dark:border-zinc-700 rounded-lg">Clear</button>
              <button onClick={() => setIsDateFilterOpen(false)} className="flex-1 py-2 text-[10px] font-bold uppercase bg-black dark:bg-white text-white dark:text-black rounded-lg">Apply</button>
            </div>
          </div>
        )}

        {/* TABLE SECTION */}
        <div className="bg-white dark:bg-zinc-900 rounded-[2rem] shadow-xl shadow-slate-200/40 dark:shadow-black/40 border border-slate-100 dark:border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-50 dark:border-zinc-800 text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  <th className="px-8 py-6">Customer</th>
                  <th className="px-8 py-6 text-center">Status</th>
                  <th className="px-8 py-6">Total</th>
                  <th className="px-8 py-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-zinc-800">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-20 text-center">
                      <Loader2 className="animate-spin w-6 h-6 text-slate-200 dark:text-slate-600 mx-auto" />
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-20 text-center">
                      <Package className="w-8 h-8 text-slate-200 dark:text-slate-600 mx-auto mb-2" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">No orders found</p>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="group hover:bg-slate-50/50 dark:hover:bg-zinc-800/50 transition-all">
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-4">
                          <div 
                            onClick={() => setSelectedImg(order.screenshot)}
                            className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center border border-slate-200 dark:border-zinc-700 overflow-hidden cursor-pointer"
                          >
                            <img src={order.screenshot} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                          </div>
                          <div>
                            <span className="block font-bold text-slate-900 dark:text-white uppercase italic tracking-tight">{order.customer_name}</span>
                            <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">{formatOrderDate(order)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-4 text-center">
                        <span className={cn(
                          "px-3 py-1 rounded-lg font-bold text-[9px] uppercase tracking-widest",
                          order.status === 'Paid' ? "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400" : "bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
                        )}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-8 py-4">
                        <span className="font-black text-slate-900 dark:text-white text-sm italic">₱{order.total_amount?.toLocaleString()}</span>
                      </td>
                      <td className="px-8 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {order.status !== 'Paid' && (
                            <button onClick={() => updateStatus(order.id, 'Paid')} className="p-2.5 rounded-lg border border-slate-100 dark:border-zinc-700 hover:bg-green-500 hover:text-white transition-all">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button onClick={() => setSelectedImg(order.screenshot)} className="p-2.5 rounded-lg border border-slate-100 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => deleteOrder(order.id)} className="p-2.5 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-red-600 dark:hover:bg-red-600 dark:hover:text-white transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* LIGHTBOX / ORDER PREVIEW */}
      <AnimatePresence>
        {selectedImg && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-white dark:bg-zinc-900 w-full max-w-4xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row"
            >
              <div className="md:w-1/2 bg-slate-100 dark:bg-zinc-800 relative h-96 md:h-auto">
                <img src={selectedImg} className="w-full h-full object-contain p-4" alt="Proof" />
              </div>
              <div className="md:w-1/2 p-8 flex flex-col">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-orange-600 text-[8px] font-bold uppercase tracking-[0.3em]">Payment Verification</p>
                    <h2 className="text-2xl font-black uppercase italic tracking-tight text-slate-900 dark:text-white">Order Proof</h2>
                  </div>
                  <button onClick={() => setSelectedImg(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors"><X /></button>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto pr-2 max-h-[40vh]">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Order Summary</p>
                  {/* Dito pwedeng magdagdag ng mapping ng items kung kailangan sa preview */}
                  <div className="bg-slate-50 dark:bg-zinc-800/50 rounded-2xl p-4 border border-slate-100 dark:border-zinc-800">
                     <p className="text-xs italic text-slate-500">Check the main table for detailed item breakdown and customer address.</p>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedImg(null)}
                  className="mt-8 w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-zinc-800 dark:hover:bg-slate-200 transition-all"
                >
                  Close Preview
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}