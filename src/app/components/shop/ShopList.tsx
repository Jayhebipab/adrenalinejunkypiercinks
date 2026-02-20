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
  name: string; // <--- Dagdag mo ito
  quantity: number;
  price: number;
  cost_price: number;
}

interface Order {
  id: string;
  customer_name: string;
  contact_number: string;
  customer_email?: string;
  address: string;
  total_amount: number;
  status: string;
  courier?: string; //
  payment_method: string;
  screenshot: string;
  items: OrderItem[];
  createdAt?: any;
}

export default function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  // Dito natin binago: In-initialize natin as Order object o null
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
const [courierModalOpen, setCourierModalOpen] = useState(false);
const [orderToFinish, setOrderToFinish] = useState<Order | null>(null);

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

const updateStatus = async (id: string, newStatus: string, courierName?: string, orderItems?: any[]) => {
  setUpdating(true);
  try {
    // 1. I-update muna ang status ng order
    const res = await fetch('/api/orders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        status: newStatus,
        courier: courierName,
        finishedAt: new Date().toISOString()
      }),
    });

    if (!res.ok) throw new Error("Failed to update order status");

    // 2. KUNG "Finished", magbabawas tayo ng stock
    if (newStatus === "Finished" && orderItems && orderItems.length > 0) {
      console.log("Order items to process:", orderItems); // DEBUG: Tignan natin kung may productId

      for (const item of orderItems) {
        // CHECK: Kung walang productId, hindi talaga ito gagana
        if (!item.productId) {
          console.error("ERROR: Missing productId for item:", item.name);
          toast.error(`Error: Item ${item.name} has no Product ID!`);
          continue; // Lipat sa susunod na item
        }

        console.log(`Sending request to deduct ${item.quantity} from ${item.productId}`);

        const productRes = await fetch('/api/products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: item.productId,
            deductQuantity: Number(item.quantity)
          })
        });

        const data = await productRes.json();

        if (!productRes.ok) {
          console.error(`Deduction failed for ${item.productId}:`, data.error);
        } else {
          console.log(`Deduction success for ${item.productId}`);
        }
      }
    }

    toast.success(`Transaction Completed!`);
    setCourierModalOpen(false);
    setSelectedOrder(null);
    fetchOrders(); 
    
  } catch (error: any) {
    console.error(error);
    toast.error(error.message || "Process failed");
  } finally {
    setUpdating(false);
  }
};

// Sample integration sa Order Management frontend function
const finishOrder = async (order: Order) => { // <--- Dagdagan ng : Order
  const updateStocks = order.items.map(async (item: OrderItem) => { // <--- Dagdagan ng : OrderItem
    if (item.productId) {
      await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.productId,
          deductQuantity: item.quantity // Ito yung trigger para sa auto-deduct
        })
      });
    }
  });

  await Promise.all(updateStocks);
  toast.success("Stock updated!");
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

        {/* DATE MODAL */}
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
                    onClick={() => setSelectedOrder(order)}
                    className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center border border-slate-200 dark:border-zinc-700 overflow-hidden cursor-pointer"
                  >
                    <img src={order.screenshot} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt="Proof" />
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
                  order.status === 'Paid' ? "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400" : 
                  order.status === 'Finished' ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" : 
                  "bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
                )}>
                  {order.status}
                </span>
              </td>
              <td className="px-8 py-4">
                <span className="font-black text-slate-900 dark:text-white text-sm italic">₱{order.total_amount?.toLocaleString()}</span>
              </td>
              <td className="px-8 py-4 text-right">
                <div className="flex justify-end gap-2">
                  {/* BUTTON LOGIC: Mawawala ang 'Paid' button pag Paid or Finished na */}
                  {order.status !== 'Paid' && order.status !== 'Finished' && (
                    <button 
                      onClick={() => updateStatus(order.id, 'Paid')} 
                      className="p-2.5 rounded-lg border border-slate-100 dark:border-zinc-700 hover:bg-green-500 hover:text-white transition-all"
                      title="Mark as Paid"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* OPTIONAL: Finish shortcut kung Paid na */}
                  {order.status === 'Paid' && (
                    <button 
                      onClick={() => updateStatus(order.id, 'Finished')} 
                      className="p-2.5 rounded-lg border border-slate-100 dark:border-zinc-700 text-blue-500 hover:bg-blue-500 hover:text-white transition-all"
                      title="Finish Transaction"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button 
                    onClick={() => setSelectedOrder(order)} 
                    className="p-2.5 rounded-lg border border-slate-100 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  
                  <button 
                    onClick={() => deleteOrder(order.id)} 
                    className="p-2.5 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-red-600 dark:hover:bg-red-600 dark:hover:text-white transition-colors"
                  >
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
        {selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-10"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-white dark:bg-zinc-900 w-full max-w-5xl h-[90vh] md:h-auto md:max-h-[85vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row"
            >
              {/* LEFT: PROOF OF PAYMENT */}
              <div className="md:w-5/12 bg-slate-100 dark:bg-zinc-800 relative group overflow-hidden border-r border-slate-100 dark:border-zinc-800 min-h-[300px]">
                <img
                  src={selectedOrder.screenshot}
                  className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                  alt="Proof of Payment"
                />
                <div className="absolute bottom-4 left-4 right-4 bg-black/50 backdrop-blur-md p-3 rounded-xl">
                  <p className="text-[10px] text-white font-bold uppercase tracking-widest text-center">Payment Screenshot</p>
                </div>
              </div>

              {/* RIGHT: COMPLETE DETAILS */}
              <div className="md:w-7/12 p-6 md:p-10 flex flex-col overflow-hidden">
                <div className="flex justify-between items-start mb-8">
                  <div className="space-y-1">
                    <span className="bg-orange-500 text-white px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">
                      {selectedOrder.status}
                    </span>
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-white">
                      Transaction <span className="text-orange-600">Details</span>
                    </h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Order ID: {selectedOrder.id}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="p-3 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-all text-slate-400 hover:text-red-500"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="flex-1 space-y-8 overflow-y-auto pr-4 custom-scrollbar">
                  {/* CUSTOMER INFO */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <Eye size={10} /> Customer Name
                      </p>
                      <p className="text-sm font-bold uppercase italic text-slate-900 dark:text-white">
                        {selectedOrder.customer_name}
                      </p>
                    </div>

                    {/* DINAGDAG NA EMAIL SECTION */}
                    <div className="space-y-1">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        Email Address
                      </p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {/* @ts-ignore */}
                        {selectedOrder.customer_email || "N/A"}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <Phone size={10} /> Contact Number
                      </p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {selectedOrder.contact_number}
                      </p>
                    </div>

                    <div className="md:col-span-2 space-y-1">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <MapPin size={10} /> Delivery Address
                      </p>
                      <p className="text-sm font-bold leading-relaxed text-slate-700 dark:text-slate-300">
                        {selectedOrder.address}
                      </p>
                    </div>
                  </div>

                  <hr className="border-slate-100 dark:border-zinc-800" />

                  {/* ITEM BREAKDOWN */}
                  <div className="space-y-4">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Order Items</p>
                    <div className="space-y-2">
                      {selectedOrder.items?.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-xl border border-slate-100 dark:border-zinc-800">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-black dark:bg-white rounded flex items-center justify-center text-white dark:text-black text-[10px] font-black">
                              {item.quantity}x
                            </div>
                            <p className="text-xs font-black uppercase italic tracking-tight text-slate-900 dark:text-white">
                              {item.name}
                            </p>
                          </div>
                          <p className="text-xs font-black text-slate-900 dark:text-white">
                            {/* Gagamit na tayo ng cost_price para mag-match sa db */}
                            ₱{((Number(item.cost_price) || 0) * (Number(item.quantity) || 0)).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* TOTAL */}
                  <div className="bg-black dark:bg-white p-6 rounded-2xl flex justify-between items-center">
                    <p className="text-white dark:text-black text-[10px] font-black uppercase tracking-[0.2em]">Total Paid</p>
                    <p className="text-2xl font-black italic text-white dark:text-black tracking-tighter">
                      {/* FIX SA NaN: Gumamit ng Number() para siguradong digit ang kinukuha */}
                      ₱{(Number(selectedOrder.total_amount) || 0).toLocaleString()}
                    </p>
                  </div>
                </div>

<div className="mt-8 flex flex-wrap gap-3">
  {/* PENDING STATUS: Button to Mark as Paid */}
  {selectedOrder.status !== 'Paid' && selectedOrder.status !== 'Finished' && (
    <button
      onClick={() => { updateStatus(selectedOrder.id, 'Paid'); setSelectedOrder(null); }}
      className="flex-1 py-4 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all"
    >
      Mark as Paid
    </button>
  )}

  {/* PAID STATUS: Options to go back or select courier to finish */}
  {selectedOrder.status === 'Paid' && (
    <>
      <button
        onClick={() => { updateStatus(selectedOrder.id, 'Pending'); setSelectedOrder(null); }}
        className="flex-1 py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all"
      >
        Back to Pending
      </button>
      <button
        onClick={() => { 
          // 1. I-set kung anong order ang itatapos
          setOrderToFinish(selectedOrder); 
          // 2. Buksan yung Courier Selection Dialog
          setCourierModalOpen(true); 
          // 3. Huwag muna i-null yung selectedOrder para hindi biglang mawala yung main modal
        }}
        className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all shadow-lg shadow-blue-500/20"
      >
        Finish Transaction
      </button>
    </>
  )}

  {/* CLOSE BUTTON: Always visible */}
  <button
    onClick={() => setSelectedOrder(null)}
    className="flex-1 py-4 bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all"
  >
    Close Details
  </button>
</div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* COURIER SELECTION MODAL */}
<AnimatePresence>
  {courierModalOpen && (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
        className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-[2rem] p-8 shadow-2xl border border-slate-100 dark:border-zinc-800"
      >
        <h3 className="text-xl font-black uppercase italic tracking-tighter mb-6 text-center">
          Select <span className="text-blue-600">Courier</span>
        </h3>
        
        <div className="grid grid-cols-1 gap-3">
{["Lalamove", "Grab", "J&T Express", "Self Pickup"].map((courier) => (
  <button
    key={courier}
    onClick={() => {
      if (orderToFinish) {
        // Gaya ng Tattoo Gallery: status + artist + inventory
        updateStatus(
          orderToFinish.id, 
          'Finished', 
          courier, 
          orderToFinish.items // <--- Ito yung "Materials" or products na babawasan
        );
      }
    }}
    className="py-4 rounded-xl border border-slate-100 dark:border-zinc-800 font-bold uppercase text-[10px] tracking-widest hover:bg-blue-600 hover:text-white transition-all"
  >
    {courier}
  </button>
))}
        </div>

        <button 
          onClick={() => setCourierModalOpen(false)}
          className="w-full mt-6 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-red-500 transition-colors"
        >
          Cancel
        </button>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
    </div>
  );
}