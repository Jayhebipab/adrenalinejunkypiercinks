"use client";

import type React from "react";
import { useState, useEffect, useMemo } from "react";
import { db } from "@/lib/firebase"; 
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { toast } from "sonner";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  DollarSign,
  Truck,
  Package,
  AlertTriangle,
  Download,
  Activity,
  Sparkles,
  TrendingUp,
  History,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";
import {
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart,
} from "recharts";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function DashboardHome() {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<any[]>([]); 
  const [sales, setSales] = useState<any[]>([]);     
  const [products, setProducts] = useState<any[]>([]); 

  // 1. REAL-TIME LISTENER: Delivery Reports (Firestore)
  useEffect(() => {
    const q = query(collection(db, "delivery_reports"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        createdAt: doc.data().createdAt?.seconds ? new Date(doc.data().createdAt.seconds * 1000) : new Date()
      }));
      setReports(data);
    }, (error) => {
      toast.error("Real-time sync failed");
    });
    return () => unsubscribe();
  }, []);

  // 2. DATA FETCHING: Sales & Inventory (API)
  const fetchData = async () => {
    setLoading(true);
    try {
      const [resPromos, resBookings, resOrders, resProducts] = await Promise.all([
        fetch("/api/promos"),
        fetch("/api/bookings"),
        fetch("/api/orders"),
        fetch("/api/products")
      ]);

      const [promosData, bookingsData, ordersData, productsData] = await Promise.all([
        resPromos.json(), resBookings.json(), resOrders.json(), resProducts.json()
      ]);

      const promosList = (Array.isArray(promosData) ? promosData : promosData.promos || []).map((p: any) => ({
        ...p, source: "Promo", displayName: p.name, displayPrice: Number(p.price || 0),
        displayDate: p.createdAt || p.timestamp
      }));

      const bookingsList = (Array.isArray(bookingsData) ? bookingsData : bookingsData.bookings || [])
        .filter((b: any) => b.status === "finished")
        .map((b: any) => ({
          ...b, source: "Regular", displayName: b.service, displayPrice: Number(b.finalPrice || 0),
          displayDate: b.finishedAt || b.timestamp
        }));

      const ordersList = (Array.isArray(ordersData) ? ordersData : [])
        .filter((o: any) => ["Finished", "Delivered", "Paid"].includes(o.status))
        .map((o: any) => ({
          ...o, source: "Shop", displayName: `Order: ${o.customer_name}`,
          displayPrice: Number(o.total_amount || 0), 
          displayDate: o.updatedAt || o.createdAt || o.timestamp
        }));

      const combinedSales = [...promosList, ...bookingsList, ...ordersList].sort((a, b) => {
        const getTime = (date: any) => date?.seconds ? date.seconds * 1000 : new Date(date).getTime();
        return getTime(b.displayDate) - getTime(a.displayDate);
      });

      setSales(combinedSales);
      setProducts(productsData);
    } catch (error) {
      toast.error("Database sync failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ============================================================================
  // COMPUTED VALUES (Stock Intelligence & Sales)
  // ============================================================================
  const stats = useMemo(() => {
    const totalRevenue = sales.reduce((acc, curr) => acc + curr.displayPrice, 0);
    
    // Stock Intelligence Logic
    const lowStockThreshold = 5;
    const lowStockItems = products.filter(p => p.quantity > 0 && p.quantity <= lowStockThreshold);
    const outOfStockItems = products.filter(p => p.quantity === 0);
    const criticalItems = [...outOfStockItems, ...lowStockItems];

    const recentChartData = sales.slice(0, 10).reverse().map(s => ({
      name: new Date(s.displayDate?.seconds ? s.displayDate.seconds * 1000 : s.displayDate).toLocaleDateString('en-US', { weekday: 'short' }),
      value: s.displayPrice
    }));

    return { 
        totalRevenue, 
        lowStockCount: criticalItems.length, 
        recentChartData,
        criticalItems 
    };
  }, [sales, products]);

  return (
    <main className="relative min-h-screen bg-background text-foreground selection:bg-primary/30 pb-20">
      {/* BACKGROUND DECORATION */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-150 w-150 -translate-x-1/2 rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <div className="relative px-6 py-12 mx-auto max-w-7xl">
        {/* HEADER SECTION */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-[1000] tracking-tighter uppercase italic text-foreground md:text-5xl">
              Studio <span className="text-primary text-glow">Intelligence</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="rounded-xl border-border/40 bg-card/50 backdrop-blur-md">
              <RefreshCcw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
              Sync
            </Button>
          </div>
        </motion.div>

        {/* METRICS GRID */}
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <MetricCard label="Gross Revenue" value={`₱${stats.totalRevenue.toLocaleString()}`} change="Total" trend="up" icon={<DollarSign />} />
          <MetricCard label="Orders/Sales" value={sales.length.toString()} change="Live" trend="up" icon={<Sparkles />} />
          <MetricCard 
            label="Stock Alerts" 
            value={stats.lowStockCount.toString()} 
            change="Attention" 
            trend="down" 
            icon={<AlertTriangle className={cn(stats.lowStockCount > 0 ? "text-red-500 animate-pulse" : "text-primary")} />} 
          />
          <MetricCard label="Delivery Logs" value={reports.length.toString()} change="Synced" trend="up" icon={<Truck />} />
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* LEFT COLUMN: CRITICAL ATTENTION */}
          <motion.div variants={itemVariants} initial="hidden" animate="visible" className="space-y-6">
             <div className="p-6 rounded-[2.5rem] bg-[#d11a2a]/5 border border-[#d11a2a]/20 backdrop-blur-xl">
                <h4 className="text-sm font-black uppercase italic text-[#d11a2a] mb-6 flex items-center gap-2">
                  <ShieldCheck size={18} /> Critical Attention
                </h4>
                <div className="space-y-3">
                  {stats.criticalItems.length === 0 ? (
                    <p className="text-[10px] font-bold text-zinc-500 uppercase italic">All stocks are stable par.</p>
                  ) : (
                    stats.criticalItems.slice(0, 5).map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-4 rounded-2xl bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                        <div className="max-w-[150px]">
                          <p className="text-[10px] font-black uppercase text-zinc-900 dark:text-white truncate">{item.name}</p>
                          <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-tighter">{item.category}</p>
                        </div>
                        <DashboardBadge variant={item.quantity === 0 ? "destructive" : "warning"}>
                          {item.quantity === 0 ? "EMPTY" : `${item.quantity} LEFT`}
                        </DashboardBadge>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* RECENT SALES LOG (Quick View) */}
              <div className="p-6 rounded-[2.5rem] border border-border/40 bg-card/40 backdrop-blur-xl">
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                    <Activity size={14} /> Last Transaction
                 </h4>
                 {sales[0] && (
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-xs font-bold truncate w-32 uppercase tracking-tighter">{sales[0].displayName}</p>
                            <p className="text-[9px] text-muted-foreground">{new Date(sales[0].displayDate?.seconds ? sales[0].displayDate.seconds * 1000 : sales[0].displayDate).toLocaleDateString()}</p>
                        </div>
                        <p className="text-sm font-black text-primary italic">₱{sales[0].displayPrice.toLocaleString()}</p>
                    </div>
                 )}
              </div>
          </motion.div>

          {/* RIGHT COLUMN: CHART & LIVE FEED */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div variants={itemVariants} initial="hidden" animate="visible" className="rounded-3xl border border-border/40 bg-card/40 p-8 backdrop-blur-xl shadow-2xl shadow-black/20">
              <h3 className="text-xs font-black uppercase tracking-widest text-primary mb-6 flex items-center gap-2">
                <TrendingUp size={14} /> Revenue Momentum
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.recentChartData}>
                    <defs>
                      <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                    <Tooltip contentStyle={{ borderRadius: '12px', backgroundColor: '#000', border: '1px solid #333' }} />
                    <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fill="url(#colorVal)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} initial="hidden" animate="visible" className="rounded-3xl border border-border/40 bg-card/40 p-6 backdrop-blur-xl">
                <h3 className="text-xs font-black uppercase tracking-widest text-primary mb-6 flex items-center gap-2">
                    <History size={14} /> Real-time Supply Feed
                </h3>
                <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                    {reports.slice(0, 5).map((report) => (
                        <div key={report.id} className="p-4 rounded-2xl bg-muted/20 border border-border/50 flex justify-between items-center group hover:bg-muted/30 transition-all">
                            <div>
                                <p className="text-[10px] font-black uppercase group-hover:text-primary">{report.supplier || "Supplier"}</p>
                                <p className="text-[9px] text-muted-foreground italic line-clamp-1 truncate w-40">"{report.notes || "Recorded delivery"}"</p>
                            </div>
                            <span className="text-[9px] font-bold text-primary italic">{report.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    ))}
                </div>
            </motion.div>
          </div>
        </div>
      </div>
    </main>
  );
}

// --- Internal UI Components ---

function MetricCard({ label, value, change, trend, icon }: any) {
  return (
    <motion.div variants={itemVariants} className="p-6 rounded-[2rem] border border-border/40 bg-card/40 backdrop-blur-xl relative overflow-hidden group transition-all hover:border-primary/40">
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
            {icon}
          </div>
          <div className={cn("text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-tighter bg-primary/10 text-primary")}>
            {change}
          </div>
        </div>
        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{label}</p>
        <p className="text-2xl font-[1000] tracking-tighter italic">{value}</p>
      </div>
      <div className="absolute -right-4 -bottom-4 h-16 w-16 bg-primary/5 rounded-full blur-2xl group-hover:scale-150 transition-all duration-700" />
    </motion.div>
  );
}

function DashboardBadge({ children, variant }: { children: React.ReactNode, variant: "destructive" | "warning" }) {
  const styles = variant === "destructive" 
    ? "bg-red-500/10 text-red-500 border-red-500/20" 
    : "bg-amber-500/10 text-amber-500 border-amber-500/20";
  return (
    <span className={`px-2 py-0.5 rounded-lg border text-[8px] font-black uppercase tracking-tighter ${styles}`}>
      {children}
    </span>
  );
}