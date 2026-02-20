"use client";

import type React from "react";
import { useState, useEffect, useMemo, useRef } from "react";
import { db } from "@/lib/firebase";
import {
  collection, query, orderBy, onSnapshot, limit, where, Timestamp
} from "firebase/firestore";
import { toast } from "sonner";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  DollarSign, Truck, Package, AlertTriangle,
  Activity, Sparkles, TrendingUp, History,
  RefreshCcw, ShieldCheck, Users, Star,
  BookOpen, Zap, Eye, Clock, ArrowUpRight,
  CheckCircle2, XCircle, Radio,
} from "lucide-react";
import {
  CartesianGrid, ResponsiveContainer, Tooltip,
  XAxis, YAxis, Area, AreaChart, BarChart, Bar,
} from "recharts";
import { cn } from "@/lib/utils";

// ─── ANIMATION VARIANTS ──────────────────────────────────────────────────────
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
};

// ─── PULSE DOT — live indicator ───────────────────────────────────────────────
function LiveDot({ color = "bg-emerald-400" }: { color?: string }) {
  return (
    <span className="relative flex h-2 w-2">
      <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-60", color)} />
      <span className={cn("relative inline-flex rounded-full h-2 w-2", color)} />
    </span>
  );
}

// ─── TICKER — scrolling live events ──────────────────────────────────────────
function LiveTicker({ events }: { events: string[] }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (!events.length) return;
    const t = setInterval(() => setIdx(i => (i + 1) % events.length), 3500);
    return () => clearInterval(t);
  }, [events.length]);

  return (
    <div className="flex items-center gap-2 overflow-hidden h-5">
      <Radio size={10} className="text-primary shrink-0 animate-pulse" />
      <AnimatePresence mode="wait">
        <motion.p
          key={idx}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground truncate"
        >
          {events[idx] ?? "Listening for activity..."}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

// ─── METRIC CARD ─────────────────────────────────────────────────────────────
function MetricCard({
  label, value, sub, icon, pulse, accent = false, isNew = false
}: {
  label: string; value: string; sub?: string;
  icon: React.ReactNode; pulse?: boolean; accent?: boolean; isNew?: boolean;
}) {
  const prevVal = useRef(value);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (prevVal.current !== value && prevVal.current !== undefined) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 800);
      prevVal.current = value;
      return () => clearTimeout(t);
    }
    prevVal.current = value;
  }, [value]);

  return (
    <motion.div
      variants={itemVariants}
      className={cn(
        "relative p-6 rounded-[2rem] border backdrop-blur-xl overflow-hidden group transition-all hover:scale-[1.02]",
        accent
          ? "border-primary/30 bg-primary/5 hover:border-primary/60"
          : "border-border/40 bg-card/40 hover:border-border/80",
        flash && "border-emerald-500/60 bg-emerald-500/5"
      )}
    >
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className={cn(
            "h-10 w-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
            accent ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
          )}>
            {icon}
          </div>
          <div className="flex items-center gap-1.5">
            {pulse && <LiveDot />}
            {isNew && (
              <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 uppercase tracking-widest">
                New
              </span>
            )}
          </div>
        </div>
        <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-1">{label}</p>
        <motion.p
          key={value}
          initial={{ scale: flash ? 1.1 : 1 }}
          animate={{ scale: 1 }}
          className="text-2xl font-[1000] tracking-tighter italic"
        >
          {value}
        </motion.p>
        {sub && <p className="text-[9px] text-muted-foreground mt-0.5">{sub}</p>}
      </div>
      <div className="absolute -right-4 -bottom-4 h-20 w-20 bg-primary/5 rounded-full blur-2xl group-hover:scale-150 transition-all duration-700" />
    </motion.div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function DashboardHome() {
  const [loading, setLoading] = useState(true);

  // ── REAL-TIME STATES (all via onSnapshot) ──────────────────────────────────
  const [reports, setReports] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [artists, setArtists] = useState<any[]>([]);

  // Ticker events
  const [tickerEvents, setTickerEvents] = useState<string[]>(["Connecting to live data..."]);

  // ── HELPER: normalize Firestore timestamp ──────────────────────────────────
  const toDate = (val: any): Date => {
    if (!val) return new Date();
    if (val?.seconds) return new Date(val.seconds * 1000);
    return new Date(val);
  };

  // ── REAL-TIME LISTENERS ───────────────────────────────────────────────────
  useEffect(() => {
    const unsubs: (() => void)[] = [];

    // 1. Delivery Reports
    unsubs.push(onSnapshot(
      query(collection(db, "delivery_reports"), orderBy("createdAt", "desc"), limit(20)),
      snap => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() as any, createdAt: toDate(d.data().createdAt) }));
        setReports(data);
        if (!snap.metadata.hasPendingWrites && snap.docChanges().some(c => c.type === "added")) {
          setTickerEvents(prev => [`New delivery log: ${data[0]?.supplier ?? "Unknown supplier"}`, ...prev].slice(0, 10));
        }
      },
      () => toast.error("Delivery feed error")
    ));

    // 2. Reviews
    unsubs.push(onSnapshot(
      query(collection(db, "reviews"), orderBy("createdAt", "desc"), limit(10)),
      snap => {
        setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        if (!snap.metadata.hasPendingWrites && snap.docChanges().some(c => c.type === "added")) {
          const r = snap.docs[0]?.data();
          if (r) setTickerEvents(prev => [`New review from ${r.name} — ${r.stars}★`, ...prev].slice(0, 10));
        }
      }
    ));

    // 3. Bookings
    unsubs.push(onSnapshot(
      query(collection(db, "bookings"), orderBy("createdAt", "desc"), limit(30)),
      snap => setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    ));

    // 4. Orders
    unsubs.push(onSnapshot(
      query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(30)),
      snap => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setOrders(data);
        if (!snap.metadata.hasPendingWrites && snap.docChanges().some(c => c.type === "added")) {
          const o = snap.docs[0]?.data();
          if (o) setTickerEvents(prev => [`New shop order: ${o.customer_name}`, ...prev].slice(0, 10));
        }
      }
    ));

    // 5. Products/Inventory
    unsubs.push(onSnapshot(
      query(collection(db, "products"), orderBy("name")),
      snap => setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    ));

    // 6. Audit Logs (real-time admin actions)
    unsubs.push(onSnapshot(
      query(collection(db, "audit_logs"), orderBy("timestamp", "desc"), limit(15)),
      snap => {
        setAuditLogs(snap.docs.map(d => ({ id: d.id, ...d.data(), timestamp: toDate(d.data().timestamp) })));
        if (!snap.metadata.hasPendingWrites && snap.docChanges().some(c => c.type === "added")) {
          const a = snap.docs[0]?.data();
          if (a) setTickerEvents(prev => [`Admin action: ${a.action} by ${a.adminName}`, ...prev].slice(0, 10));
        }
      }
    ));

    // 7. Artists
    unsubs.push(onSnapshot(
      query(collection(db, "artists")),
      snap => setArtists(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    ));

    setLoading(false);
    return () => unsubs.forEach(u => u());
  }, []);

  // ── COMPUTED STATS ────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    // Revenue: finished bookings + delivered orders
    const finishedBookings = bookings.filter(b => b.status === "finished");
    const paidOrders = orders.filter(o => ["Finished", "Delivered", "Paid"].includes(o.status));

    const bookingRevenue = finishedBookings.reduce((s, b) => s + Number(b.finalPrice || 0), 0);
    const orderRevenue = paidOrders.reduce((s, o) => s + Number(o.total_amount || 0), 0);
    const totalRevenue = bookingRevenue + orderRevenue;

    // Bookings breakdown
    const pendingBookings = bookings.filter(b => b.status === "pending").length;
    const confirmedBookings = bookings.filter(b => b.status === "confirmed").length;
    const todayBookings = bookings.filter(b => {
      const d = toDate(b.createdAt);
      const now = new Date();
      return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    // Inventory
    const lowStock = products.filter(p => p.quantity > 0 && p.quantity <= 5);
    const outOfStock = products.filter(p => (p.quantity ?? 0) === 0);
    const criticalItems = [...outOfStock, ...lowStock];
    const visibleProducts = products.filter(p => p.isVisible !== false);

    // Reviews
    const avgRating = reviews.length
      ? (reviews.reduce((s, r) => s + Number(r.stars || 0), 0) / reviews.length).toFixed(1)
      : "—";
    const visibleReviews = reviews.filter(r => r.isVisible).length;

    // Revenue chart — last 7 days per day
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d;
    });

    const revenueChartData = last7.map(day => {
      const label = day.toLocaleDateString("en-US", { weekday: "short" });
      const dayBookings = finishedBookings
        .filter(b => {
          const bd = toDate(b.finishedAt || b.createdAt);
          return bd.toDateString() === day.toDateString();
        })
        .reduce((s, b) => s + Number(b.finalPrice || 0), 0);
      const dayOrders = paidOrders
        .filter(o => toDate(o.updatedAt || o.createdAt).toDateString() === day.toDateString())
        .reduce((s, o) => s + Number(o.total_amount || 0), 0);
      return { name: label, Bookings: dayBookings, Orders: dayOrders, Total: dayBookings + dayOrders };
    });

    // Booking category breakdown for bar chart
    const categoryMap: Record<string, number> = {};
    bookings.forEach(b => {
      const cat = b.service || b.category || "Other";
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    });
    const categoryChart = Object.entries(categoryMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // Active artists
    const activeArtists = artists.filter(a => a.status === "active").length;

    return {
      totalRevenue, pendingBookings, confirmedBookings, todayBookings,
      criticalItems, visibleProducts: visibleProducts.length,
      avgRating, visibleReviews,
      revenueChartData, categoryChart,
      activeArtists,
      totalBookings: bookings.length,
      totalOrders: orders.length,
    };
  }, [bookings, orders, products, reviews, artists]);

  const recentActivity = useMemo(() => {
    return auditLogs.slice(0, 8);
  }, [auditLogs]);

  return (
    <main className="relative min-h-screen bg-background text-foreground pb-20">
      {/* BG decoration */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-primary/5 blur-[140px]" />
        <div className="absolute right-0 bottom-1/3 h-[300px] w-[300px] rounded-full bg-primary/3 blur-[100px]" />
      </div>

      <div className="relative px-6 py-12 mx-auto max-w-7xl space-y-8">

        {/* ── HEADER ── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
        >
          <div>
            <h1 className="text-4xl font-[1000] tracking-tighter uppercase italic text-foreground md:text-5xl">
              Studio <span className="text-primary">Intelligence</span>
            </h1>
            <LiveTicker events={tickerEvents} />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
              <LiveDot />
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Live</span>
            </div>
          </div>
        </motion.div>

        {/* ── METRIC CARDS — TOP ROW ── */}
        <motion.div
          variants={containerVariants} initial="hidden" animate="visible"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <MetricCard
            label="Gross Revenue" icon={<DollarSign size={18} />}
            value={`₱${stats.totalRevenue.toLocaleString()}`}
            sub="Bookings + Shop"
            accent pulse
          />
          <MetricCard
            label="Total Bookings" icon={<BookOpen size={18} />}
            value={stats.totalBookings.toString()}
            sub={`${stats.pendingBookings} pending · ${stats.confirmedBookings} confirmed`}
            pulse
          />
          <MetricCard
            label="Stock Alerts" icon={<AlertTriangle size={18} className={stats.criticalItems.length > 0 ? "text-red-500 animate-pulse" : ""} />}
            value={stats.criticalItems.length.toString()}
            sub={`${stats.visibleProducts} products visible`}
          />
          <MetricCard
            label="Delivery Logs" icon={<Truck size={18} />}
            value={reports.length.toString()}
            sub="Real-time supply feed"
            pulse
          />
        </motion.div>

        {/* ── SECOND ROW METRICS ── */}
        <motion.div
          variants={containerVariants} initial="hidden" animate="visible"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <MetricCard label="Active Artists" icon={<Users size={18} />} value={stats.activeArtists.toString()} sub={`${artists.length} total`} />
          <MetricCard label="Avg Rating" icon={<Star size={18} />} value={`${stats.avgRating}★`} sub={`${stats.visibleReviews} published reviews`} />
          <MetricCard label="Today's Bookings" icon={<Clock size={18} />} value={stats.todayBookings.toString()} sub="Created today" pulse />
          <MetricCard label="Shop Orders" icon={<Sparkles size={18} />} value={stats.totalOrders.toString()} sub="All time" />
        </motion.div>

        {/* ── MAIN GRID ── */}
        <div className="grid gap-6 lg:grid-cols-3">

          {/* LEFT COL */}
          <div className="space-y-6">

            {/* Critical Stock */}
            <motion.div
              variants={itemVariants} initial="hidden" animate="visible"
              className="p-6 rounded-[2.5rem] bg-[#d11a2a]/5 border border-[#d11a2a]/20 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-[#d11a2a] flex items-center gap-2">
                  <ShieldCheck size={14} /> Critical Attention
                </h4>
                <LiveDot color="bg-red-400" />
              </div>
              <div className="space-y-2.5 max-h-[220px] overflow-y-auto">
                {stats.criticalItems.length === 0 ? (
                  <div className="flex items-center gap-2 py-4">
                    <CheckCircle2 size={14} className="text-emerald-500" />
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">All stocks stable</p>
                  </div>
                ) : stats.criticalItems.map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex justify-between items-center p-3.5 rounded-xl bg-card border border-border shadow-sm"
                  >
                    <div className="max-w-[140px]">
                      <p className="text-[10px] font-black uppercase truncate">{item.name}</p>
                      <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">{item.category}</p>
                    </div>
                    <span className={cn(
                      "px-2 py-1 rounded-lg border text-[8px] font-black uppercase tracking-tighter",
                      item.quantity === 0
                        ? "bg-red-500/10 text-red-500 border-red-500/20"
                        : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                    )}>
                      {item.quantity === 0 ? "EMPTY" : `${item.quantity} LEFT`}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Real-time Audit Feed */}
            <motion.div
              variants={itemVariants} initial="hidden" animate="visible"
              className="p-6 rounded-[2.5rem] border border-border/40 bg-card/40 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <Zap size={14} /> Admin Activity
                </h4>
                <LiveDot />
              </div>
              <div className="space-y-2 max-h-[240px] overflow-y-auto">
                <AnimatePresence initial={false}>
                  {recentActivity.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest py-4">No recent activity</p>
                  ) : recentActivity.map((log, idx) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="p-3 rounded-xl bg-muted/20 border border-border/50 group hover:bg-muted/40 transition-all"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <p className="text-[9px] font-black uppercase truncate group-hover:text-primary transition-colors">
                            {log.action}
                          </p>
                          <p className="text-[8px] text-muted-foreground truncate">{log.adminName} · {log.module}</p>
                        </div>
                        <span className="text-[8px] font-bold text-muted-foreground shrink-0">
                          {log.timestamp?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>

          {/* RIGHT COLS — CHARTS */}
          <div className="lg:col-span-2 space-y-6">

            {/* Revenue Chart */}
            <motion.div
              variants={itemVariants} initial="hidden" animate="visible"
              className="rounded-3xl border border-border/40 bg-card/40 p-8 backdrop-blur-xl shadow-2xl shadow-black/10"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <TrendingUp size={14} /> Revenue — Last 7 Days
                </h3>
                <LiveDot />
              </div>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.revenueChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gBookings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gOrders" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9 }} />
                    <Tooltip
                      contentStyle={{ borderRadius: "12px", backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 10 }}
                      formatter={(val: number | undefined) => [`₱${(val ?? 0).toLocaleString()}`, ""]}
                    />
                    <Area type="monotone" dataKey="Bookings" stroke="hsl(var(--primary))" fill="url(#gBookings)" strokeWidth={2.5} dot={false} />
                    <Area type="monotone" dataKey="Orders" stroke="#10b981" fill="url(#gOrders)" strokeWidth={2.5} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5"><span className="h-2 w-4 rounded-full bg-primary inline-block" /><span className="text-[9px] font-bold text-muted-foreground uppercase">Bookings</span></div>
                <div className="flex items-center gap-1.5"><span className="h-2 w-4 rounded-full bg-emerald-500 inline-block" /><span className="text-[9px] font-bold text-muted-foreground uppercase">Shop Orders</span></div>
              </div>
            </motion.div>

            {/* Booking Categories + Supply Feed — side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Booking by Service */}
              <motion.div
                variants={itemVariants} initial="hidden" animate="visible"
                className="rounded-3xl border border-border/40 bg-card/40 p-6 backdrop-blur-xl"
              >
                <h3 className="text-[10px] font-black uppercase tracking-widest text-primary mb-5 flex items-center gap-2">
                  <Activity size={14} /> Booking Breakdown
                </h3>
                {stats.categoryChart.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest py-4">No booking data</p>
                ) : (
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.categoryChart} layout="vertical" margin={{ left: 0, right: 8 }}>
                        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 9 }} />
                        <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 700 }} width={70} />
                        <Tooltip
                          contentStyle={{ borderRadius: "10px", backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 10 }}
                        />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </motion.div>

              {/* Real-time Supply Feed */}
              <motion.div
                variants={itemVariants} initial="hidden" animate="visible"
                className="rounded-3xl border border-border/40 bg-card/40 p-6 backdrop-blur-xl"
              >
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <History size={14} /> Supply Feed
                  </h3>
                  <LiveDot />
                </div>
                <div className="space-y-2 max-h-[160px] overflow-y-auto">
                  <AnimatePresence initial={false}>
                    {reports.slice(0, 6).map((report, idx) => (
                      <motion.div
                        key={report.id}
                        initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }} transition={{ delay: idx * 0.04 }}
                        className="flex justify-between items-center p-3 rounded-xl bg-muted/20 border border-border/50 group hover:bg-muted/30 transition-all"
                      >
                        <div className="min-w-0">
                          <p className="text-[9px] font-black uppercase truncate group-hover:text-primary transition-colors">{report.supplier ?? "Supplier"}</p>
                          <p className="text-[8px] text-muted-foreground italic truncate w-28">"{report.notes ?? "Delivery recorded"}"</p>
                        </div>
                        <span className="text-[8px] font-bold text-primary italic shrink-0">
                          {report.createdAt?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>

            {/* Latest Reviews */}
            <motion.div
              variants={itemVariants} initial="hidden" animate="visible"
              className="rounded-3xl border border-border/40 bg-card/40 p-6 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <Star size={14} /> Latest Client Reviews
                </h3>
                <LiveDot />
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2">
                <AnimatePresence initial={false}>
                  {reviews.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest py-3">No reviews yet</p>
                  ) : reviews.slice(0, 5).map((rev, idx) => (
                    <motion.div
                      key={rev.id}
                      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className={cn(
                        "shrink-0 w-44 p-4 rounded-2xl border border-border/50 bg-muted/20 space-y-2",
                        !rev.isVisible && "opacity-40 grayscale"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-[9px] font-black uppercase truncate max-w-[90px]">{rev.name}</p>
                        {rev.isVisible
                          ? <Eye size={10} className="text-emerald-500 shrink-0" />
                          : <XCircle size={10} className="text-muted-foreground shrink-0" />
                        }
                      </div>
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={8} fill={i < rev.stars ? "currentColor" : "none"}
                            className={i < rev.stars ? "text-amber-400" : "text-muted-foreground/20"} />
                        ))}
                      </div>
                      <p className="text-[8px] text-muted-foreground italic line-clamp-3 leading-relaxed">"{rev.description}"</p>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </main>
  );
}