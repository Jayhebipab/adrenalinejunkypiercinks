"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'; // Import router par
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ShoppingBag, 
  PackageOpen, 
  Flame, 
  Filter, 
  ChevronRight, 
  ShoppingCart,
  Search
} from 'lucide-react';
import { Navbar } from '../components/navigation/navbar';
import { Footer } from '../components/navigation/footer';
import { cn } from "@/lib/utils";
import FloatingChatWidget from '../components/chatbot';

interface Product {
  _id: string;
  name: string;
  category: string;
  cost_price: number;
  image: string;
  description: string;
}

export default function ShopPage() {
  const router = useRouter(); // Initialize router
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch("/api/products")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setProducts(data);
      })
      .catch(err => console.error("Shop Error:", err))
      .finally(() => setLoading(false));
  }, []);

  const filterOptions = ["All", ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  const filteredProducts = products.filter(p => {
    const matchesCategory = activeFilter === "All" || p.category === activeFilter;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-orange-500 animate-pulse font-black uppercase tracking-[0.5em]">Opening Shop...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 selection:bg-orange-600/30">
      <FloatingChatWidget />
      <Navbar />

      <section className="relative h-[50vh] w-full flex items-center justify-center overflow-hidden border-b border-white/5">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed grayscale opacity-30"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1598136490941-30d885318abd?q=80&w=2000')` }} 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
        
        <div className="relative z-10 text-center space-y-4 px-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-orange-500/20 bg-orange-500/5 mb-2">
            <Flame className="w-3 h-3 text-orange-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500">Studio Essentials</span>
          </motion.div>
          <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter text-white">
            THE <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-orange-400 to-yellow-400">SHOP</span>
          </h1>
        </div>
      </section>

      <main className="container mx-auto max-w-7xl px-6 py-20">
        <div className="flex flex-col lg:flex-row gap-12">
          <aside className="w-full lg:w-64 flex-shrink-0">
            <div className="sticky top-28 space-y-8">
              <div className="space-y-4">
                <div className="max-w-md mx-auto mt-8 relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-orange-500 transition-colors" />
                  <input 
                    type="text"
                    placeholder="Search gear..."
                    className="w-full bg-black/50 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold tracking-widest uppercase focus:outline-none focus:border-orange-500/50 transition-all backdrop-blur-md text-white"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2 px-2">
                  <Filter className="w-3 h-3 text-orange-600" />
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Category</h3>
                </div>
                <nav className="flex flex-col gap-1">
                  {filterOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => setActiveFilter(option)}
                      className={cn(
                        "flex items-center justify-between px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all",
                        activeFilter === option ? "bg-orange-600 text-white shadow-lg shadow-orange-600/20" : "bg-zinc-900/50 text-zinc-500 hover:bg-zinc-900"
                      )}
                    >
                      {option}
                      <ChevronRight className={cn("w-4 h-4", activeFilter === option ? "opacity-100" : "opacity-0")} />
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </aside>

          <div className="flex-1">
            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center py-20 border border-zinc-900 rounded-4xl">
                <PackageOpen className="w-12 h-12 text-zinc-800 mb-4" />
                <p className="text-zinc-600 text-xs font-black uppercase tracking-widest">No products available</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {filteredProducts.map((product) => (
                  <motion.div
                    key={product._id}
                    layout
                    whileHover={{ y: -10 }}
                    className="relative group flex flex-col rounded-[2.5rem] bg-zinc-900/30 border border-white/5 overflow-hidden transition-all duration-500 hover:border-orange-500/30 shadow-2xl"
                  >
                    {/* Image Area - Nilagyan ng router push par */}
                    <div 
                      className="relative aspect-[4/5] overflow-hidden cursor-pointer"
                      onClick={() => router.push(`/shop/${product._id}`)}
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute top-6 right-6 bg-black/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                        <span className="text-orange-500 font-black text-sm tracking-tighter">₱{product.cost_price.toLocaleString()}</span>
                      </div>
                      
                      {/* View Details Hover Overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         <span className="bg-white/10 backdrop-blur-md text-white px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/20">
                           View Details
                         </span>
                      </div>
                    </div>

                    <div className="p-8 space-y-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500/80">
                          {product.category}
                        </span>
                        <h3 className="text-xl font-black uppercase tracking-tight text-white leading-tight">
                          {product.name}
                        </h3>
                        <p className="text-zinc-500 text-[10px] font-medium line-clamp-2 uppercase tracking-wide leading-relaxed">
                          {product.description}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2 pt-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/shop/${product._id}`); // Dito rin par para direkta checkout page
                          }}
                          className="w-full bg-orange-600 text-white py-3 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/20 active:scale-95"
                        >
                          Buy Now
                        </button>

                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log("Added to cart:", product.name);
                          }}
                          className="w-full bg-zinc-800/50 border border-white/5 text-zinc-300 py-3 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-zinc-800 hover:text-white transition-all active:scale-95"
                        >
                          <ShoppingCart size={12} /> Add to Cart
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}