"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

import { 
  X, ShoppingBag, PackageOpen, Flame, Filter, 
  ChevronRight, ShoppingCart, Search 
} from 'lucide-react';
import { Navbar } from '../components/navigation/navbar';
import { Footer } from '../components/navigation/footer';
import { cn } from "@/lib/utils";
import FloatingChatWidget from '../components/chatbot';

// --- AUTH & TOAST ---
import { useSession } from "next-auth/react";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  category: string;
  cost_price: number;
  image: string;
  description: string;
  selling_price: number;
}

export default function ShopPage() {
  const router = useRouter();
  const { data: session } = useSession(); 
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  // --- ADD TO CART LOGIC ---
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

  // --- FIXED BUY NOW LOGIC ---
  const handleBuyNow = (product: Product) => {
    // 1. Create the checkout item object
    const checkoutItem = {
      id: product.id,
      name: product.name,
      cost_price: product.selling_price || product.cost_price,
      image: product.image,
      quantity: 1
    };

    // 2. I-save sa localStorage para mabasa ng Checkout page
    localStorage.setItem('adrenaline_checkout_item', JSON.stringify(checkoutItem));
    
    // 3. Lipat na sa Checkout page
    router.push('/checkout');
  };

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
    const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase());
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

      {/* --- HERO SECTION --- */}
      <section className="relative h-[40vh] w-full flex items-center justify-center overflow-hidden border-b border-black/5">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed grayscale opacity-30"
          style={{ backgroundImage: `url('https://res.cloudinary.com/diwrwmjgw/image/upload/v1770215345/Screenshot_2025-04-17_112705_wgdjo6.png')` }} 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/0 to-transparent" />
        
        <div className="relative z-10 text-center space-y-4 px-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-orange-500/20 bg-orange-500/5 mb-2">
            <Flame className="w-3 h-3 text-orange-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500">Studio Essentials</span>
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-white">
            THE <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-orange-400 to-yellow-400">SHOP</span>
          </h1>
        </div>
      </section>

      <main className="container mx-auto max-w-7xl px-6 py-20">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* --- SIDEBAR --- */}
          <aside className="w-full lg:w-64 flex-shrink-0 text-left">
            <div className="sticky top-28 space-y-8">
              <div className="space-y-4">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-orange-500 transition-colors" />
                  <input 
                    type="text"
                    placeholder="Search gear..."
                    className="w-full bg-black/50 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-[10px] font-bold tracking-widest uppercase focus:outline-none focus:border-orange-500/50 transition-all backdrop-blur-md text-white"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="flex items-center gap-2 px-2 pt-4">
                  <Filter className="w-3 h-3 text-orange-600" />
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Category</h3>
                </div>
                <nav className="flex flex-col gap-1">
                  {filterOptions.map((option) => (
                    <button
                      key={`filter-${option}`}
                      onClick={() => setActiveFilter(option)}
                      className={cn(
                        "flex items-center justify-between px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all text-left",
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

{/* --- PRODUCT GRID --- */}
<div className="flex-1">
  {filteredProducts.length === 0 ? (
    <div className="flex flex-col items-center py-40 border border-white/5 rounded-[3rem] bg-zinc-900/10">
      <PackageOpen className="w-12 h-12 text-zinc-800 mb-4" />
      <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.3em]">No items match your hunt</p>
    </div>
  ) : (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-8">
      {filteredProducts.map((product) => (
        <div
          key={product.id}
          className="relative group flex flex-col rounded-[1.5rem] md:rounded-[2.5rem] bg-zinc-900/30 border border-white/5 overflow-hidden hover:border-orange-500/30 shadow-xl transition-colors duration-300"
        >
          {/* Image Area */}
          <div 
            className="relative aspect-[4/5] overflow-hidden cursor-pointer"
            onClick={() => router.push(`/shop/${product.id}`)}
          >
            <img
              src={product.image || "/placeholder-gear.jpg"}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute top-3 right-3 md:top-6 md:right-6 bg-black/80 backdrop-blur-md px-2 py-1 md:px-4 md:py-2 rounded-full border border-white/10">
              <span className="text-orange-500 font-black text-[10px] md:text-sm tracking-tighter">
                ₱{(Number(product.selling_price) || 0).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Info Area */}
          <div className="p-4 md:p-8 space-y-2 md:space-y-4 text-left">
            <div className="space-y-1">
              <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-orange-500/80">
                {product.category}
              </span>
              <h3 className="text-xs md:text-xl font-black uppercase tracking-tight text-white leading-tight truncate">
                {product.name}
              </h3>
            </div>

            <div className="flex flex-col gap-2 pt-1 md:pt-2">
              {session && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBuyNow(product);
                  }}
                  className="w-full bg-orange-600 text-white py-3 md:py-4 rounded-xl md:rounded-2xl font-black uppercase text-[8px] md:text-[10px] tracking-[0.1em] md:tracking-[0.2em] hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/20 active:scale-95"
                >
                  Buy Now
                </button>
              )}

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddToCart(product);
                }}
                className="w-full bg-zinc-900 border border-white/5 text-zinc-300 py-3 md:py-4 rounded-xl md:rounded-2xl font-black uppercase text-[8px] md:text-[10px] tracking-[0.1em] md:tracking-[0.2em] flex items-center justify-center gap-1 md:gap-2 hover:bg-zinc-800 hover:text-white transition-all active:scale-95"
              >
                <ShoppingCart size={10} className="md:w-3 md:h-3" /> 
                <span className="hidden xs:inline">Add to Cart</span>
                <span className="xs:hidden">Add</span>
              </button>
            </div>
          </div>
        </div>
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