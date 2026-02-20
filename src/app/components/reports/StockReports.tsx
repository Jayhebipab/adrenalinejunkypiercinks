"use client";

import React, { useEffect, useState } from 'react';
import { motion } from "framer-motion";
import { 
  Box, 
  AlertTriangle, 
  TrendingDown, 
  DollarSign, 
  PackageSearch, 
  RefreshCcw,
  ArrowUpRight,
  ShieldCheck
} from "lucide-react";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  selling_price: number;
  quantity: number;
  category: string;
}

export default function StockReports() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStock = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      toast.error("Stock sync failed. Database inaccessible.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  // Analytics Logic
  const lowStockThreshold = 5;
  const lowStockItems = products.filter(p => p.quantity > 0 && p.quantity <= lowStockThreshold);
  const outOfStockItems = products.filter(p => p.quantity=== 0);
  const totalValue = products.reduce((acc, p) => acc + (p.selling_price * p.quantity), 0);
  const totalItems = products.reduce((acc, p) => acc + p.quantity, 0);

  const stats = [
    {
      label: "Total Value",
      value: `₱${totalValue.toLocaleString()}`,
      icon: DollarSign,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10"
    },
    {
      label: "Items in Hand",
      value: totalItems,
      icon: Box,
      color: "text-blue-500",
      bg: "bg-blue-500/10"
    },
    {
      label: "Low Stock",
      value: lowStockItems.length,
      icon: TrendingDown,
      color: "text-amber-500",
      bg: "bg-amber-500/10"
    },
    {
      label: "Out of Stock",
      value: outOfStockItems.length,
      icon: AlertTriangle,
      color: "text-[#d11a2a]",
      bg: "bg-[#d11a2a]/10"
    }
  ];

  return (
    <div className="space-y-8 p-2">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-4xl font-[1000] uppercase italic tracking-tighter text-zinc-900 dark:text-white">
            Stock <span className="text-primary">Intelligence</span>
          </h2>
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">Real-time inventory valuation & alerts</p>
        </div>
        <button 
          onClick={fetchStock}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all group"
        >
          <RefreshCcw size={14} className={loading ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"} />
          Sync Inventory
        </button>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={i}
            className="p-6 rounded-[2.5rem] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 shadow-sm dark:shadow-none relative overflow-hidden group"
          >
            <div className={`absolute -right-2 -top-2 w-16 h-16 ${stat.bg} rounded-full blur-2xl group-hover:scale-150 transition-transform`} />
            <stat.icon className={`${stat.color} mb-4`} size={24} />
            <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">{stat.label}</p>
            <h3 className="text-3xl font-[1000] italic tracking-tighter text-zinc-900 dark:text-white mt-1">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* CRITICAL ALERTS & TABLE */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* ALERT LIST */}
        <div className="xl:col-span-1 space-y-4">
          <div className="p-6 rounded-[2.5rem] bg-[#d11a2a]/5 border border-[#d11a2a]/20">
            <h4 className="text-sm font-black uppercase italic text-[#d11a2a] mb-4 flex items-center gap-2">
              <ShieldCheck size={16} /> Critical Attention
            </h4>
            <div className="space-y-3">
              {[...outOfStockItems, ...lowStockItems].length === 0 ? (
                <p className="text-[10px] font-bold text-zinc-500 uppercase italic">All stocks are stable par.</p>
              ) : (
                [...outOfStockItems, ...lowStockItems].slice(0, 5).map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
                    <div>
                      <p className="text-[10px] font-black uppercase text-zinc-900 dark:text-white truncate w-32">{item.name}</p>
                      <p className="text-[8px] font-bold text-zinc-400 uppercase">{item.category}</p>
                    </div>
                    <Badge variant={item.quantity=== 0 ? "destructive" : "warning"} className="text-[8px]">
                      {item.quantity === 0 ? "EMPTY" : `${item.quantity} LEFT`}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* FULL STOCK LIST */}
        <div className="xl:col-span-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-[2.5rem] overflow-hidden shadow-sm dark:shadow-none">
          <div className="p-6 border-b border-zinc-100 dark:border-zinc-900 flex justify-between items-center">
            <h4 className="text-sm font-black uppercase italic tracking-widest text-zinc-900 dark:text-white">Inventory Breakdown</h4>
            <PackageSearch size={18} className="text-zinc-400" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-900/50 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  <th className="px-6 py-4">Item Name</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Stock</th>
                  <th className="px-6 py-4 text-right">Unit Price</th>
                </tr>
              </thead>
<tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
  {products.map((product) => (
    <tr key={product.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
      <td className="px-6 py-4">
        <p className="text-xs font-black uppercase italic text-zinc-900 dark:text-white">{product.name}</p>
      </td>
      <td className="px-6 py-4">
        <span className="text-[9px] font-bold uppercase px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-md text-zinc-500 dark:text-zinc-400">
          {product.category}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <div className={`h-1.5 w-1.5 rounded-full ${product.quantity > 5 ? 'bg-emerald-500' : product.quantity === 0 ? 'bg-red-500' : 'bg-amber-500'}`} />
          <span className={`text-xs font-[1000] ${product.quantity === 0 ? 'text-red-500' : 'text-zinc-900 dark:text-white'}`}>
            {product.quantity}
          </span>
        </div>
      </td>
      <td className="px-6 py-4 text-right">
        <span className="text-xs font-black text-zinc-500 dark:text-zinc-400">
          ₱{(product.selling_price ?? 0).toLocaleString()}
        </span>
      </td>
    </tr>
  ))}
</tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hanapin mo 'to sa pinaka-baba ng StockReports.tsx mo par at palitan mo nito:

function Badge({ 
  children, 
  variant, 
  className // Idagdag natin 'to
}: { 
  children: React.ReactNode, 
  variant: "destructive" | "warning",
  className?: string // Optional className support
}) {
  const styles = variant === "destructive" 
    ? "bg-red-500/10 text-red-500 border-red-500/20" 
    : "bg-amber-500/10 text-amber-500 border-amber-500/20";
    
  return (
    <span className={`px-2 py-1 rounded-lg border font-black uppercase tracking-tighter ${styles} ${className || ""}`}>
      {children}
    </span>
  );
}