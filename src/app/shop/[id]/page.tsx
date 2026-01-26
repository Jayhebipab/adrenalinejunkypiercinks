"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ShoppingCart, 
  ShieldCheck, 
  Truck, 
  ArrowLeft, 
  ArrowRight,
  Flame 
} from 'lucide-react';
import { Navbar } from '@/app/components/navigation/navbar';
import { Footer } from '@/app/components/navigation/footer';

export default function ProductDetails() {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/products`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAllProducts(data);
          const found = data.find((p: any) => p._id === id);
          setProduct(found);
        }
      })
      .catch(err => console.error("Error:", err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="text-orange-500 animate-pulse font-black uppercase tracking-[0.5em]">LOADING...</div>
    </div>
  );

  if (!product) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">Product Not Found</div>;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200">

      
      <main className="container mx-auto max-w-6xl px-6 py-32">
        {/* Back Button */}
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-8 group text-[10px] font-black uppercase tracking-widest"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back to Shop
        </button>

        <div className="flex flex-col lg:flex-row gap-12 lg:items-start justify-center">
          
          {/* LEFT: Smaller Image Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full lg:max-w-md" // Dito natin nilimit yung laki par
          >
            <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden border border-white/5 bg-zinc-900 shadow-2xl">
              <img src={product.image} className="w-full h-full object-cover" alt={product.name} />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/20 to-transparent" />
            </div>
          </motion.div>

          {/* RIGHT: Details Section */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1 space-y-8 py-4"
          >
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-orange-500/20 bg-orange-500/5">
                <Flame size={10} className="text-orange-500" />
                <span className="text-orange-500 text-[9px] font-black uppercase tracking-[0.3em]">
                  {product.category}
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white leading-none">
                {product.name}
              </h1>
              <p className="text-3xl font-black text-orange-500 tracking-tighter">
                ₱{product.cost_price.toLocaleString()}
              </p>
            </div>

            <div className="h-[1px] w-full bg-white/5" />

            <div className="space-y-3">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Description</h3>
              <p className="text-zinc-500 leading-relaxed uppercase text-[11px] tracking-wide font-medium max-w-sm">
                {product.description || "Premium gear designed for the modern studio."}
              </p>
            </div>

            {/* Compact Features */}
            <div className="flex flex-wrap gap-3 py-2">
              <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-zinc-300 bg-white/5 px-4 py-3 rounded-xl border border-white/5">
                <ShieldCheck className="text-orange-600" size={14} /> High Quality
              </div>
              <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-zinc-300 bg-white/5 px-4 py-3 rounded-xl border border-white/5">
                <Truck className="text-orange-600" size={14} /> Fast Shipping
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] transition-all active:scale-95 shadow-lg shadow-orange-600/20">
                Buy Now
              </button>
              <button className="flex-1 bg-zinc-900 border border-white/5 hover:bg-zinc-800 text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] transition-all flex items-center justify-center gap-3">
                <ShoppingCart size={14} /> Add to Cart
              </button>
            </div>
          </motion.div>
        </div>

        {/* --- MINI SLIDER (Recommended) --- */}
        <div className="mt-32 pt-20 border-t border-white/5">
          <div className="mb-8">
            <h2 className="text-2xl font-black uppercase tracking-tighter text-white">Related Gear</h2>
            <div className="h-1 w-12 bg-orange-600 mt-2" />
          </div>

          <div className="relative overflow-x-auto pb-8 no-scrollbar">
            <div className="flex gap-4">
              {allProducts.slice(0, 6).map((item: any) => (
                <motion.div
                  key={item._id}
                  whileHover={{ y: -5 }}
                  onClick={() => router.push(`/shop/${item._id}`)}
                  className="min-w-[200px] group cursor-pointer"
                >
                  <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-zinc-900 border border-white/5 mb-3">
                    <img src={item.image} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-all duration-500" />
                  </div>
                  <h4 className="text-white font-black uppercase text-[10px] tracking-tight truncate">{item.name}</h4>
                  <p className="text-orange-500 font-black text-[10px]">₱{item.cost_price.toLocaleString()}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}