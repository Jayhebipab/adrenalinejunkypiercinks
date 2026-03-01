"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import {
    Search, FileDown, Truck, Box,
    Calendar, Loader2, PackagePlus,
    ArrowUpRight, BarChart3, RefreshCw,
    Boxes, TrendingUp, Hash
} from "lucide-react";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function DeliveryReports() {
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState<"All" | "Supplier" | "Equipment" | "Manual" | "Restock">("All");

    useEffect(() => {
        const q = query(collection(db, "delivery_reports"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setReports(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // ─── EXPORT ───────────────────────────────────────────────────────────────
    const exportToExcel = () => {
        const dataToExport = filteredReports.map(report => ({
            "Delivery No.": report.delivery_number || "—",
            Date: report.createdAt?.toDate ? format(report.createdAt.toDate(), "yyyy-MM-dd HH:mm") : "N/A",
            Type: report.action === "RESTOCK_DELIVERY" ? "RESTOCK" : report.items ? "SUPPLIER DELIVERY" : report.action === "MANUAL_STOCK_UPDATE" ? "MANUAL UPDATE" : "EQUIPMENT LOG",
            Subject: report.items ? `Batch from ${report.supplier}` : report.item_name,
            Supplier: report.supplier || "—",
            Action: report.action || "REGISTERED",
            Details: report.items
                ? report.items.map((i: any) => `${i.productName}(x${i.quantity}${i.costPerUnit ? ` @₱${i.costPerUnit}` : ""})`).join(", ")
                : `Qty: ${report.details?.quantity || 0} → Prev: ${report.details?.previousQuantity ?? "N/A"} — Price: ₱${report.details?.price || 0}`
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "DeliveryLogs");
        XLSX.writeFile(workbook, `Master_Logs_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    };

    // ─── FILTERS ──────────────────────────────────────────────────────────────
    const getReportType = (r: any) => {
        if (r.action === "RESTOCK_DELIVERY") return "Restock";
        if (r.action === "SUPPLIER_DELIVERY" || (r.items && r.action !== "RESTOCK_DELIVERY")) return "Supplier";
        if (r.action === "MANUAL_STOCK_UPDATE") return "Manual";
        return "Equipment";
    };

    const filteredReports = reports.filter(r => {
        const matchesSearch =
            (r.delivery_number?.toLowerCase() || "").includes(search.toLowerCase()) ||
            (r.item_name?.toLowerCase() || "").includes(search.toLowerCase()) ||
            (r.supplier?.toLowerCase() || "").includes(search.toLowerCase()) ||
            (r.action?.toLowerCase() || "").includes(search.toLowerCase());
        const matchesType = typeFilter === "All" || getReportType(r) === typeFilter;
        return matchesSearch && matchesType;
    });

    // Stats
    const supplierCount = reports.filter(r => r.action === "SUPPLIER_DELIVERY" || (r.items && r.action !== "RESTOCK_DELIVERY")).length;
    const restockCount = reports.filter(r => r.action === "RESTOCK_DELIVERY").length;
    const manualCount = reports.filter(r => r.action === "MANUAL_STOCK_UPDATE").length;
    const equipCount = reports.filter(r => !r.items && r.action !== "MANUAL_STOCK_UPDATE" && r.action !== "RESTOCK_DELIVERY" && r.action !== "SUPPLIER_DELIVERY").length;

    const TYPE_CONFIG: Record<string, { label: string; icon: any; badge: string; dot: string }> = {
        Supplier:  { label: "Supplier Delivery", icon: Truck,      badge: "bg-orange-500/10 text-orange-500 border-orange-500/20",  dot: "bg-orange-400" },
        Restock:   { label: "Restock",           icon: RefreshCw,  badge: "bg-blue-500/10 text-blue-500 border-blue-500/20",        dot: "bg-blue-400" },
        Equipment: { label: "Equipment Log",     icon: Box,        badge: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",        dot: "bg-zinc-400" },
        Manual:    { label: "Manual Update",     icon: RefreshCw,  badge: "bg-purple-500/10 text-purple-500 border-purple-500/20",  dot: "bg-purple-400" },
    };

    return (
        <div className="min-h-screen bg-background p-4 md:p-8 text-foreground">
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* ── HEADER ── */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
                    <div className="flex flex-col justify-end pb-2">
                        <h2 className="text-5xl font-[1000] uppercase italic tracking-tighter text-zinc-900 dark:text-white leading-none">
                            Delivery <span className="text-primary">Reports</span>
                        </h2>
                        <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.3em] mt-3">
                            Supplier Analytics
                        </p>
                    </div>
                    <Button
                        onClick={exportToExcel}
                        className="h-14 px-8 bg-foreground text-background hover:bg-primary rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] transition-all shadow-xl flex items-center gap-3"
                    >
                        <FileDown size={16} /> Export Excel
                    </Button>
                </div>

                {/* ── STATS ── */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[
                        { label: "Total Logs",       value: reports.length,  icon: BarChart3,  color: "text-foreground",   bg: "bg-muted" },
                        { label: "Supplier Inflows", value: supplierCount,   icon: Truck,      color: "text-orange-500",   bg: "bg-orange-500/10" },
                        { label: "Restocks",         value: restockCount,    icon: RefreshCw,  color: "text-blue-500",     bg: "bg-blue-500/10" },
                        { label: "Manual Updates",   value: manualCount,     icon: Boxes,      color: "text-purple-500",   bg: "bg-purple-500/10" },
                        { label: "Equipment Logs",   value: equipCount,      icon: Box,        color: "text-zinc-500",     bg: "bg-zinc-500/10" },
                    ].map(stat => (
                        <div key={stat.label} className="bg-card border border-border rounded-[1.5rem] p-5 flex items-center gap-4">
                            <div className={cn("p-2.5 rounded-xl", stat.bg, stat.color)}>
                                <stat.icon className="size-4" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                                <p className="text-2xl font-black">{stat.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── SEARCH & FILTER ── */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1 max-w-2xl">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <input
                            type="text"
                            placeholder="Search by delivery no., supplier, or action..."
                            className="w-full bg-card border border-border rounded-2xl pl-14 pr-6 py-4 outline-none font-bold text-xs focus:border-foreground transition-all uppercase"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {(["All", "Supplier", "Restock", "Equipment", "Manual"] as const).map(type => (
                            <button
                                key={type}
                                onClick={() => setTypeFilter(type)}
                                className={cn(
                                    "h-12 px-5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                                    typeFilter === type
                                        ? "bg-foreground text-background border-transparent"
                                        : "bg-card border-border hover:bg-muted text-muted-foreground"
                                )}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── TABLE ── */}
                <div className="bg-card rounded-[2rem] border border-border overflow-hidden shadow-sm">
                    <div className="px-8 py-5 border-b border-border flex items-center justify-between">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            {filteredReports.length} Records
                        </p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[900px]">
                            <thead>
                                <tr className="text-[9px] font-black uppercase tracking-widest text-muted-foreground border-b border-border/50">
                                    <th className="px-6 py-4">Delivery No.</th>
                                    <th className="px-6 py-4">Timestamp</th>
                                    <th className="px-6 py-4">Type</th>
                                    <th className="px-6 py-4">Subject</th>
                                    <th className="px-6 py-4">Activity</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="py-32 text-center">
                                            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-3" />
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Syncing Master Logs...</p>
                                        </td>
                                    </tr>
                                ) : filteredReports.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-32 text-center">
                                            <TrendingUp className="w-10 h-10 mx-auto text-muted-foreground/20 mb-3" />
                                            <p className="text-[10px] font-black uppercase text-muted-foreground italic tracking-widest">No records found.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredReports.map((report) => {
                                        const type = getReportType(report);
                                        const cfg = TYPE_CONFIG[type] ?? TYPE_CONFIG.Equipment;
                                        const Icon = cfg.icon;

                                        return (
                                            <tr key={report.id} className="group hover:bg-muted/30 transition-all">

                                                {/* ── Delivery Number ── */}
                                                <td className="px-6 py-5">
                                                    {report.delivery_number ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="p-1.5 rounded-lg bg-muted text-muted-foreground group-hover:bg-foreground group-hover:text-background transition-all">
                                                                <Hash size={11} />
                                                            </div>
                                                            <span className="font-black font-mono text-xs tracking-wider text-foreground">
                                                                {report.delivery_number}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">—</span>
                                                    )}
                                                </td>

                                                {/* ── Timestamp ── */}
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 rounded-xl bg-muted text-muted-foreground group-hover:text-primary transition-colors">
                                                            <Calendar size={14} />
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-sm uppercase italic leading-none">
                                                                {report.createdAt?.toDate ? format(report.createdAt.toDate(), "MMM dd, yyyy") : "Recent"}
                                                            </p>
                                                            <p className="text-[10px] text-muted-foreground font-bold uppercase mt-0.5">
                                                                {report.createdAt?.toDate ? format(report.createdAt.toDate(), "hh:mm a") : "---"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* ── Type Badge ── */}
                                                <td className="px-6 py-5">
                                                    <span className={cn(
                                                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                                                        cfg.badge
                                                    )}>
                                                        <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
                                                        <Icon size={10} />
                                                        {cfg.label}
                                                    </span>
                                                </td>

                                                {/* ── Subject ── */}
                                                <td className="px-6 py-5">
                                                    <p className="font-black text-base uppercase italic tracking-tighter leading-none">
                                                        {type === "Supplier" || type === "Restock" ? report.supplier : report.item_name}
                                                    </p>
                                                    <div className="flex items-center gap-1.5 mt-1.5">
                                                        <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.1em]">
                                                            {type === "Supplier" ? "Inflow Protocol"
                                                                : type === "Restock" ? "Restock Delivery"
                                                                : type === "Manual" ? "Stock Override"
                                                                : (report.action?.replace(/_/g, " ") || "Internal Log")}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* ── Activity Detail ── */}
                                                <td className="px-6 py-5">
                                                    <div className="max-w-xs">
                                                        {(type === "Supplier" || type === "Restock") ? (
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {report.items?.map((item: any, idx: number) => (
                                                                    <div key={idx} className="bg-muted border border-border text-[11px] font-black px-2.5 py-1 rounded-md text-muted-foreground uppercase flex items-center gap-1">
                                                                        <PackagePlus size={10} className="text-primary" />
                                                                        {item.productName}
                                                                        <span className="text-primary font-black">X{item.quantity}</span>
                                                                        {item.costPerUnit ? <span className="text-muted-foreground/60">,Cost Price ₱{item.costPerUnit}</span> : null}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : type === "Manual" ? (
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase italic">
                                                                    <span className="text-muted-foreground/50">{report.details?.previousQuantity ?? "?"}</span>
                                                                    <ArrowUpRight size={12} className="text-primary" />
                                                                    <span className="text-foreground font-black">{report.details?.quantity ?? 0}</span>
                                                                    <span className="text-[9px] text-muted-foreground">units</span>
                                                                </div>
                                                                <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">
                                                                    Price: ₱{(report.details?.price || 0).toLocaleString()}
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase italic">
                                                                {report.details?.category || "General"} • Qty: {report.details?.quantity || 0}
                                                                <ArrowUpRight size={12} className="text-muted-foreground/30 group-hover:text-primary transition-colors" />
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
        </div>
    );
}