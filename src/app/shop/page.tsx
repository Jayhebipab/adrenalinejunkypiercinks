"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PackageOpen, Flame, Filter, ChevronRight,
  ShoppingCart, Search, ChevronDown, ArrowUpRight
} from 'lucide-react';
import { Navbar } from '../components/navigation/navbar';
import { Footer } from '../components/navigation/footer';
import { cn } from "@/lib/utils";
import FloatingChatWidget from '../components/chatbot';
import { useSession } from "next-auth/react";
import { toast } from "sonner";

// Noise overlay
const NoiseOverlay = () => (
  <div
    className="pointer-events-none fixed inset-0 z-[999] opacity-[0.03]"
    style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
      backgroundRepeat: "repeat",
      backgroundSize: "128px 128px",
      mixBlendMode: "overlay",
    }}
  />
);

interface Product {
  id: string;
  name: string;
  category: string;
  cost_price: number;
  image: string;
  description: string;
  selling_price: number;
  isVisible?: boolean; // ✅ Added — used to filter hidden products
}

export default function ShopPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const handleAddToCart = (product: Product) => {
    const savedCart = localStorage.getItem('adrenaline_cart');
    let currentCart = savedCart ? JSON.parse(savedCart) : [];
    const existingIndex = currentCart.findIndex((item: any) => item.id === product.id);
    if (existingIndex > -1) {
      currentCart[existingIndex].quantity += 1;
    } else {
      currentCart.push({
        id: product.id,
        name: product.name,
        cost_price: product.selling_price || product.cost_price,
        image: product.image,
        quantity: 1
      });
    }
    localStorage.setItem('adrenaline_cart', JSON.stringify(currentCart));
    window.dispatchEvent(new Event('cart-updated'));
    toast.success(`${product.name} added to cart!`);
  };

  const handleBuyNow = (product: Product) => {
    const checkoutItem = {
      id: product.id,
      name: product.name,
      cost_price: product.selling_price || product.cost_price,
      image: product.image,
      quantity: 1
    };
    localStorage.setItem('adrenaline_checkout_item', JSON.stringify(checkoutItem));
    router.push('/checkout');
  };

  useEffect(() => {
    fetch("/api/products")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          // ✅ FILTER: Only show products where isVisible is true
          // Products with isVisible === undefined (old data) are treated as visible by default
          setProducts(data.filter((p: Product) => p.isVisible !== false));
        }
      })
      .catch(err => console.error("Shop Error:", err))
      .finally(() => setLoading(false));
  }, []);

  const filterOptions = ["All", ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  const filteredProducts = products.filter(p => {
    const matchesCategory = activeFilter === "All" || p.category === activeFilter;
    const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="space-y-3 text-center">
          <div className="flex gap-1 justify-center">
            {[0,1,2,3].map(i => (
              <motion.div key={i} animate={{ scaleY: [1, 2, 1] }}
                transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
                className="w-1 h-6 bg-orange-500 rounded-full" />
            ))}
          </div>
          <p className="text-orange-500 font-black uppercase tracking-[0.4em] text-[10px]">Opening Shop...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-200 selection:bg-orange-600/30">
      <NoiseOverlay />
      <FloatingChatWidget />
      <Navbar />

      {/* HERO */}
      <section className="relative h-[38vh] md:h-[45vh] w-full flex items-center justify-center overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed grayscale opacity-25"
          style={{ backgroundImage: `url('https://res.cloudinary.com/diwrwmjgw/image/upload/v1770215345/Screenshot_2025-04-17_112705_wgdjo6.png')` }} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] h-[150px] bg-orange-600/8 blur-[80px] rounded-full" />

        <div className="relative z-10 text-center space-y-4 px-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-orange-500/20 bg-orange-500/5 backdrop-blur-md">
            <Flame className="w-3 h-3 text-orange-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-orange-500">Studio Essentials</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl md:text-7xl font-black uppercase tracking-[-0.04em] leading-none text-white italic"
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-400 to-yellow-300">
               Shop
            </span>
          </motion.h1>
          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.4 }}
            className="mx-auto w-16 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        </div>
      </section>

      {/* MOBILE FILTER + SEARCH BAR */}
      <div className="lg:hidden sticky top-0 z-40 bg-black/95 backdrop-blur-md border-b border-white/5 px-4 py-3 space-y-2">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
          <input
            type="text"
            placeholder="Search gear..."
            className="w-full bg-zinc-950 border border-zinc-900 rounded-2xl py-3 pl-10 pr-4 text-[10px] font-bold tracking-widest uppercase focus:outline-none focus:border-orange-500/40 transition-all text-white"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <button onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-zinc-950 rounded-2xl border border-zinc-900">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white">{activeFilter}</span>
          </div>
          <ChevronDown className={cn("w-4 h-4 text-zinc-600 transition-transform", isMobileFilterOpen && "rotate-180")} />
        </button>
        <AnimatePresence>
          {isMobileFilterOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden">
              <div className="flex flex-wrap gap-2 pb-1">
                {filterOptions.map(option => (
                  <button key={option} onClick={() => { setActiveFilter(option); setIsMobileFilterOpen(false); }}
                    className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                      activeFilter === option ? "bg-orange-600 text-white" : "bg-zinc-950 text-zinc-500 border border-zinc-900 hover:text-white")}>
                    {option}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* MAIN */}
      <main className="container mx-auto max-w-7xl px-4 md:px-6 py-10 md:py-20">
        <div className="flex flex-col lg:flex-row gap-10">

          {/* DESKTOP SIDEBAR */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-28 space-y-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
                <input
                  type="text"
                  placeholder="Search gear..."
                  className="w-full bg-zinc-950 border border-zinc-900 rounded-2xl py-4 pl-11 pr-4 text-[10px] font-bold tracking-widest uppercase focus:outline-none focus:border-orange-500/40 transition-all text-white"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 px-1">
                  <div className="h-px w-4 bg-orange-500" />
                  <h3 className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Category</h3>
                </div>
                <nav className="flex flex-col gap-1">
                  {filterOptions.map(option => (
                    <button key={option} onClick={() => setActiveFilter(option)}
                      className={cn(
                        "flex items-center justify-between px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-left",
                        activeFilter === option
                          ? "bg-orange-600 text-white shadow-lg shadow-orange-600/20"
                          : "text-zinc-600 hover:bg-zinc-950 hover:text-white"
                      )}>
                      {option}
                      <ChevronRight className={cn("w-4 h-4 transition-opacity", activeFilter === option ? "opacity-100" : "opacity-0")} />
                    </button>
                  ))}
                </nav>
              </div>

              <div className="px-1 pt-2 border-t border-white/5">
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-700">
                  {filteredProducts.length} {filteredProducts.length === 1 ? "item" : "items"} found
                </p>
              </div>
            </div>
          </aside>

          {/* PRODUCT GRID */}
          <div className="flex-1">
            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center py-40 border border-white/5 rounded-[3rem] bg-zinc-950/30">
                <PackageOpen className="w-10 h-10 text-zinc-800 mb-4" />
                <p className="text-zinc-700 text-[10px] font-black uppercase tracking-[0.3em]">No items match your hunt</p>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6"
              >
                {filteredProducts.map((product, idx) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.06, ease: [0.16, 1, 0.3, 1] }}
                    className="group relative flex flex-col rounded-[1.5rem] md:rounded-[2rem] bg-zinc-950 border border-white/5 overflow-hidden hover:border-orange-500/20 shadow-xl transition-all duration-500"
                  >
                    {/* Image */}
                    <div
                      className="relative aspect-[4/5] overflow-hidden cursor-pointer"
                      onClick={() => router.push(`/shop/${product.id}`)}
                    >
                      <img
                        src={product.image || "/placeholder-gear.jpg"}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute top-3 left-3 md:top-4 md:left-4">
                        <span className="bg-black/70 backdrop-blur-md text-orange-400 border border-orange-500/20 text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-tight">
                          {product.category}
                        </span>
                      </div>
                      <div className="absolute top-3 right-3 md:top-4 md:right-4">
                        <div className="bg-black/80 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-full">
                          <span className="text-orange-400 font-black text-[10px] md:text-xs tracking-tighter">
                            ₱{(Number(product.selling_price) || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-500 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="p-3 bg-black/60 backdrop-blur-sm rounded-full border border-white/10">
                          <ArrowUpRight size={16} className="text-white" />
                        </div>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4 md:p-5 space-y-3 flex-1 flex flex-col">
                      <div className="flex-1">
                        <h3 className="text-xs md:text-sm font-black uppercase tracking-tight text-white leading-tight line-clamp-2">
                          {product.name}
                        </h3>
                      </div>
                      <div className="flex flex-col gap-2 mt-auto">
                        {session && (
                          <button
                            onClick={e => { e.stopPropagation(); handleBuyNow(product); }}
                            className="w-full bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white py-2.5 md:py-3 rounded-xl font-black uppercase text-[8px] md:text-[9px] tracking-widest transition-all shadow-lg shadow-orange-600/20 active:scale-95"
                          >
                            Buy Now
                          </button>
                        )}
                        <button
                          onClick={e => { e.stopPropagation(); handleAddToCart(product); }}
                          className="w-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white py-2.5 md:py-3 rounded-xl font-black uppercase text-[8px] md:text-[9px] tracking-widest flex items-center justify-center gap-1.5 transition-all active:scale-95"
                        >
                          <ShoppingCart size={10} />
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}