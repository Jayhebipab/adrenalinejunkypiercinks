"use client";

import React, { useEffect, useState, useCallback } from 'react';
import {
  Package, X, Search,
  Loader2, Eye,
  RefreshCw, Phone, MapPin,
  Calendar, ChevronDown, Trash2,
  CheckCircle2, Filter, Truck,
  ShoppingBag, TrendingUp, Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster, toast } from "sonner";
import { cn } from "@/lib/utils";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

interface OrderItem {
  productId?: string;
  name: string;
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
  courier?: string;
  payment_method: string;
  screenshot: string;
  items: OrderItem[];
  createdAt?: any;
}

// ─── AUDIT TRAIL HELPER ───────────────────────────────────────────────────────
async function logAudit({
  action,
  details,
  module = "Order Management",
}: {
  action: string;
  details: string;
  module?: string;
}) {
  try {
    const stored = localStorage.getItem("user");
    const parsed = stored ? JSON.parse(stored) : null;
    const adminName = parsed?.name ?? "Unknown Admin";
    const adminEmail = parsed?.email ?? "—";

    await addDoc(collection(db, "audit_logs"), {
      adminName,
      adminEmail,
      action,
      details,
      module,
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.warn("Audit log failed:", err);
  }
}
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; dot: string; badge: string }> = {
  Pending:  { label: "Pending",  dot: "bg-amber-400",   badge: "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/30" },
  Paid:     { label: "Paid",     dot: "bg-emerald-400", badge: "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/30" },
  Finished: { label: "Finished", dot: "bg-blue-400",    badge: "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/30" },
};

export default function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // ─── UPDATE STATUS ──────────────────────────────────────────────────────────
  const updateStatus = async (id: string, newStatus: string, courierName?: string, orderItems?: OrderItem[]) => {
    setUpdating(true);
    const targetOrder = orders.find(o => o.id === id);

    try {
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

      // Deduct stock kapag Finished
      if (newStatus === "Finished" && orderItems && orderItems.length > 0) {
        for (const item of orderItems) {
          if (!item.productId) continue;
          await fetch('/api/products', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: item.productId, deductQuantity: Number(item.quantity) })
          });
        }
      }

      toast.success(
        newStatus === "Finished" ? "Transaction completed!" :
        newStatus === "Paid" ? "Marked as paid!" :
        "Status updated!"
      );

      // ✅ AUDIT LOG
      const auditMessages: Record<string, string> = {
        Paid:     `Marked order of ${targetOrder?.customer_name ?? id} as PAID — ₱${(targetOrder?.total_amount ?? 0).toLocaleString()}`,
        Finished: `Completed order of ${targetOrder?.customer_name ?? id} via ${courierName ?? "N/A"} — ₱${(targetOrder?.total_amount ?? 0).toLocaleString()} — Items: ${(orderItems ?? []).map(i => `${i.name} x${i.quantity}`).join(', ')}`,
        Pending:  `Reverted order of ${targetOrder?.customer_name ?? id} back to PENDING`,
      };

      await logAudit({
        action: `ORDER ${newStatus.toUpperCase()}`,
        details: auditMessages[newStatus] ?? `Updated order ${id} to ${newStatus}`,
      });

      setCourierModalOpen(false);
      setSelectedOrder(null);
      setOrderToFinish(null);
      fetchOrders();

    } catch (error: any) {
      toast.error(error.message || "Process failed");
    } finally {
      setUpdating(false);
    }
  };

  // ─── DELETE ORDER ───────────────────────────────────────────────────────────
  const deleteOrder = async (id: string) => {
    if (!confirm("Delete this order record?")) return;
    const targetOrder = orders.find(o => o.id === id);
    try {
      const res = await fetch('/api/orders', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        toast.success("Order deleted");

        // ✅ AUDIT LOG
        await logAudit({
          action: 'DELETED ORDER',
          details: `Deleted order of ${targetOrder?.customer_name ?? id} — ₱${(targetOrder?.total_amount ?? 0).toLocaleString()}`,
        });

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
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Summary counts
  const counts = {
    all: orders.length,
    pending: orders.filter(o => o.status === 'Pending').length,
    paid: orders.filter(o => o.status === 'Paid').length,
    finished: orders.filter(o => o.status === 'Finished').length,
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-10 text-foreground">
      <Toaster position="bottom-center" richColors />

      <div className="max-w-[1300px] mx-auto space-y-8">

        {/* ── HEADER ── */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.35em] text-muted-foreground mb-2 flex items-center gap-2">
              <span className="h-px w-5 bg-current inline-block" /> Transactions
            </p>
            <h1 className="text-5xl md:text-6xl font-black uppercase italic tracking-tighter leading-none">
              Order<br />
              <span className="text-muted-foreground/30">Management</span>
            </h1>
          </div>

          <div className="flex gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:flex-none">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full lg:w-64 pl-10 pr-4 h-12 bg-card rounded-xl text-[11px] font-bold uppercase tracking-wider border border-border focus:border-foreground outline-none transition-all"
              />
            </div>
            <button
              onClick={fetchOrders}
              className="h-12 w-12 flex items-center justify-center bg-card border border-border rounded-xl hover:bg-muted transition-all"
            >
              <RefreshCw size={16} className={cn(loading && "animate-spin")} />
            </button>
          </div>
        </div>

        {/* ── STATS ROW ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Orders", value: counts.all, icon: ShoppingBag, color: "text-foreground" },
            { label: "Pending",      value: counts.pending, icon: Clock,       color: "text-amber-500" },
            { label: "Paid",         value: counts.paid,    icon: TrendingUp,  color: "text-emerald-500" },
            { label: "Finished",     value: counts.finished,icon: CheckCircle2,color: "text-blue-500" },
          ].map((stat) => (
            <div key={stat.label} className="bg-card border border-border rounded-[1.5rem] p-5 flex items-center gap-4">
              <div className={cn("p-2.5 rounded-xl bg-muted", stat.color)}>
                <stat.icon className="size-4" />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-black">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── FILTERS ── */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <div className="relative">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="h-11 bg-foreground text-background px-5 rounded-xl flex items-center gap-2 text-[11px] font-black uppercase tracking-widest hover:opacity-90 transition-all"
            >
              <Filter className="w-3.5 h-3.5" /> {statusFilter}
              <ChevronDown className={cn("w-3 h-3 transition-transform", isFilterOpen && "rotate-180")} />
            </button>
            <AnimatePresence>
              {isFilterOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  className="absolute left-0 top-full mt-2 w-44 bg-card rounded-2xl shadow-xl border border-border py-2 z-20"
                >
                  {["All", "Pending", "Paid", "Finished"].map((status) => (
                    <button
                      key={status}
                      onClick={() => { setStatusFilter(status); setIsFilterOpen(false); }}
                      className={cn(
                        "w-full text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-colors flex items-center gap-2",
                        statusFilter === status
                          ? "bg-foreground text-background"
                          : "hover:bg-muted text-foreground"
                      )}
                    >
                      {STATUS_CONFIG[status] && (
                        <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_CONFIG[status]?.dot)} />
                      )}
                      {status}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Date Filter */}
          <button
            onClick={() => setIsDateFilterOpen(!isDateFilterOpen)}
            className={cn(
              "h-11 px-5 rounded-xl border text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all",
              (dateFrom || dateTo)
                ? "bg-foreground text-background border-transparent"
                : "bg-card border-border hover:bg-muted"
            )}
          >
            <Calendar className="w-3.5 h-3.5" />
            {dateFrom || dateTo ? "Date Active" : "Date Filter"}
          </button>

          {/* Active filter chips */}
          {statusFilter !== "All" && (
            <button
              onClick={() => setStatusFilter("All")}
              className="h-11 px-4 rounded-xl bg-muted border border-border text-[10px] font-black uppercase flex items-center gap-2 hover:bg-destructive/10 hover:text-destructive transition-all"
            >
              {statusFilter} <X className="size-3" />
            </button>
          )}
        </div>

        {/* Date Range Panel */}
        <AnimatePresence>
          {isDateFilterOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-6 bg-card border border-border rounded-[2rem] grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                {[
                  { label: "From", value: dateFrom, setter: setDateFrom },
                  { label: "To",   value: dateTo,   setter: setDateTo },
                ].map(({ label, value, setter }) => (
                  <div key={label} className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{label}</label>
                    <input
                      type="date"
                      value={value}
                      onChange={(e) => setter(e.target.value)}
                      className="w-full p-2 bg-transparent border-b border-border outline-none text-xs font-bold"
                    />
                  </div>
                ))}
                <div className="flex gap-2">
                  <button
                    onClick={() => { setDateFrom(""); setDateTo(""); }}
                    className="flex-1 h-10 text-[10px] font-bold uppercase border border-border rounded-xl hover:bg-muted transition-all"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => setIsDateFilterOpen(false)}
                    className="flex-1 h-10 text-[10px] font-bold uppercase bg-foreground text-background rounded-xl hover:opacity-90 transition-all"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── TABLE ── */}
        <div className="bg-card rounded-[2rem] border border-border overflow-hidden shadow-sm">
          <div className="px-8 py-5 border-b border-border flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              {filteredOrders.length} {statusFilter === "All" ? "Total" : statusFilter} Orders
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[9px] font-black uppercase tracking-widest text-muted-foreground border-b border-border/50">
                  <th className="px-8 py-4">Customer</th>
                  <th className="px-8 py-4 text-center">Status</th>
                  <th className="px-8 py-4">Payment</th>
                  <th className="px-8 py-4">Total</th>
                  <th className="px-8 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
                      <Loader2 className="animate-spin w-6 h-6 text-muted-foreground mx-auto" />
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
                      <Package className="w-8 h-8 text-muted-foreground/20 mx-auto mb-3" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">No orders found</p>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order, i) => {
                    const statusCfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.Pending;
                    return (
                      <motion.tr
                        key={order.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="group hover:bg-muted/30 transition-all"
                      >
                        {/* Customer */}
                        <td className="px-8 py-4">
                          <div className="flex items-center gap-4">
                            <div
                              onClick={() => setSelectedOrder(order)}
                              className="w-11 h-11 rounded-xl bg-muted overflow-hidden border border-border cursor-pointer hover:ring-2 ring-foreground/20 transition-all flex-shrink-0"
                            >
                              <img src={order.screenshot} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt="Proof" />
                            </div>
                            <div>
                              <p className="font-black uppercase italic tracking-tight text-sm leading-none mb-1">{order.customer_name}</p>
                              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{formatOrderDate(order)}</p>
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-8 py-4 text-center">
                          <span className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest",
                            statusCfg.badge
                          )}>
                            <span className={cn("h-1.5 w-1.5 rounded-full", statusCfg.dot)} />
                            {order.status}
                          </span>
                        </td>

                        {/* Payment */}
                        <td className="px-8 py-4">
                          <p className="text-[10px] font-bold uppercase text-muted-foreground">{order.payment_method || "—"}</p>
                        </td>

                        {/* Total */}
                        <td className="px-8 py-4">
                          <p className="font-black italic text-sm">₱{(Number(order.total_amount) || 0).toLocaleString()}</p>
                        </td>

                        {/* Actions */}
                        <td className="px-8 py-4">
                          <div className="flex justify-end items-center gap-2">
                            {/* Mark Paid */}
                            {order.status !== 'Paid' && order.status !== 'Finished' && (
                              <button
                                onClick={() => updateStatus(order.id, 'Paid')}
                                title="Mark as Paid"
                                className="h-9 w-9 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:bg-emerald-500 hover:text-white hover:border-transparent transition-all"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Finish */}
                            {order.status === 'Paid' && (
                              <button
                                onClick={() => { setOrderToFinish(order); setCourierModalOpen(true); }}
                                title="Finish Transaction"
                                className="h-9 w-9 rounded-xl border border-border flex items-center justify-center text-blue-500 hover:bg-blue-500 hover:text-white hover:border-transparent transition-all"
                              >
                                <Truck className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* View Details */}
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="h-9 w-9 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:bg-muted transition-all"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => deleteOrder(order.id)}
                              className="h-9 w-9 rounded-xl bg-foreground text-background flex items-center justify-center hover:bg-destructive transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── ORDER DETAIL MODAL ── */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-10"
            onClick={(e) => e.target === e.currentTarget && setSelectedOrder(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-card w-full max-w-5xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-border"
            >
              {/* Left: Payment Proof */}
              <div className="md:w-5/12 bg-muted relative overflow-hidden border-r border-border min-h-[260px] group">
                <img
                  src={selectedOrder.screenshot}
                  className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                  alt="Proof of Payment"
                />
                <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md p-3 rounded-xl text-center">
                  <p className="text-[9px] text-white font-black uppercase tracking-widest">Payment Screenshot</p>
                </div>
              </div>

              {/* Right: Details */}
              <div className="md:w-7/12 p-6 md:p-10 flex flex-col overflow-hidden">
                <div className="flex justify-between items-start mb-8">
                  <div className="space-y-1">
                    {(() => {
                      const cfg = STATUS_CONFIG[selectedOrder.status] ?? STATUS_CONFIG.Pending;
                      return (
                        <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest", cfg.badge)}>
                          <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
                          {selectedOrder.status}
                        </span>
                      );
                    })()}
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter mt-2">
                      Transaction <span className="text-muted-foreground/40">Details</span>
                    </h2>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      ID: {selectedOrder.id.slice(-10).toUpperCase()}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="p-2.5 hover:bg-muted rounded-full transition-all text-muted-foreground hover:text-destructive"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="flex-1 space-y-6 overflow-y-auto pr-2">
                  {/* Customer Info */}
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: "Customer",  value: selectedOrder.customer_name },
                      { label: "Email",     value: selectedOrder.customer_email || "N/A" },
                      { label: "Contact",   value: selectedOrder.contact_number },
                      { label: "Payment",   value: selectedOrder.payment_method || "N/A" },
                    ].map(({ label, value }) => (
                      <div key={label} className="space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{label}</p>
                        <p className="text-sm font-bold truncate">{value}</p>
                      </div>
                    ))}
                    <div className="col-span-2 space-y-1">
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                        <MapPin className="size-3" /> Address
                      </p>
                      <p className="text-sm font-bold leading-relaxed text-muted-foreground">{selectedOrder.address}</p>
                    </div>
                  </div>

                  <hr className="border-border" />

                  {/* Items */}
                  <div className="space-y-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Order Items</p>
                    <div className="space-y-2">
                      {selectedOrder.items?.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 bg-muted rounded-xl border border-border">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-foreground text-background rounded-lg flex items-center justify-center text-[10px] font-black">
                              {item.quantity}x
                            </div>
                            <p className="text-xs font-black uppercase italic">{item.name}</p>
                          </div>
                          <p className="text-xs font-black">₱{((Number(item.cost_price) || 0) * (Number(item.quantity) || 0)).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Total */}
                  <div className="bg-foreground text-background p-5 rounded-2xl flex justify-between items-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">Total Paid</p>
                    <p className="text-2xl font-black italic">₱{(Number(selectedOrder.total_amount) || 0).toLocaleString()}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex flex-wrap gap-3 pt-4 border-t border-border">
                  {selectedOrder.status !== 'Paid' && selectedOrder.status !== 'Finished' && (
                    <button
                      onClick={() => { updateStatus(selectedOrder.id, 'Paid'); }}
                      disabled={updating}
                      className="flex-1 h-12 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest transition-all disabled:opacity-50"
                    >
                      {updating ? <Loader2 className="animate-spin mx-auto size-4" /> : "Mark as Paid"}
                    </button>
                  )}

                  {selectedOrder.status === 'Paid' && (
                    <>
                      <button
                        onClick={() => { updateStatus(selectedOrder.id, 'Pending'); }}
                        disabled={updating}
                        className="flex-1 h-12 bg-muted border border-border text-foreground hover:bg-amber-500 hover:text-white hover:border-transparent rounded-xl font-black uppercase text-[10px] tracking-widest transition-all disabled:opacity-50"
                      >
                        Revert Pending
                      </button>
                      <button
                        onClick={() => { setOrderToFinish(selectedOrder); setCourierModalOpen(true); }}
                        disabled={updating}
                        className="flex-1 h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
                      >
                        <span className="flex items-center justify-center gap-2">
                          <Truck className="size-3.5" /> Finish
                        </span>
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="h-12 px-6 bg-muted border border-border text-foreground rounded-xl font-black uppercase text-[10px] tracking-widest transition-all hover:bg-muted/80"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── COURIER MODAL ── */}
      <AnimatePresence>
        {courierModalOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-card w-full max-w-sm rounded-[2rem] p-8 shadow-2xl border border-border"
            >
              <div className="text-center mb-8">
                <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Truck className="size-7 text-blue-500" />
                </div>
                <h3 className="text-2xl font-black uppercase italic tracking-tighter">
                  Select Courier
                </h3>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                  {orderToFinish?.customer_name}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {["Lalamove", "Grab", "J&T Express", "Self Pickup"].map((courier) => (
                  <button
                    key={courier}
                    disabled={updating}
                    onClick={() => {
                      if (orderToFinish) {
                        updateStatus(orderToFinish.id, 'Finished', courier, orderToFinish.items);
                      }
                    }}
                    className="py-4 rounded-xl border border-border font-black uppercase text-[10px] tracking-widest hover:bg-blue-500 hover:text-white hover:border-transparent transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {updating ? <Loader2 className="animate-spin size-3" /> : courier}
                  </button>
                ))}
              </div>

              <button
                onClick={() => { setCourierModalOpen(false); setOrderToFinish(null); }}
                className="w-full mt-6 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-destructive transition-colors"
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