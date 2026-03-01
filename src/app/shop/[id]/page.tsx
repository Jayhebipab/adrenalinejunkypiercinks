"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ShoppingCart, 
  ShieldCheck, 
  Truck, 
  ArrowLeft, 
  Flame,
  Info
} from 'lucide-react';

// --- AUTH & NOTIFICATIONS ---
import { useSession } from "next-auth/react";
import { toast } from "sonner"; 

import { Navbar } from '@/app/components/navigation/navbar';
import { Footer } from '@/app/components/navigation/footer';

const DEFAULT_IMAGE = "/images/logo/ajp.jpg";

export default function ProductDetails() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession(); 
  
  const [product, setProduct] = useState<any>(null);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetch(`/api/products`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAllProducts(data);
          const found = data.find((p: any) => (p.id === id || p._id === id));
          setProduct(found);
        }
      })
      .catch(err => console.error("Error fetching product details:", err))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    const savedCart = localStorage.getItem('adrenaline_cart');
    let currentCart = savedCart ? JSON.parse(savedCart) : [];
    const productId = product.id || product._id;
    const existingIndex = currentCart.findIndex((item: any) => item.id === productId);

    if (existingIndex > -1) {
      currentCart[existingIndex].quantity += 1;
    } else {
      currentCart.push({
        id: productId,
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

  const handleDirectBuy = () => {
    if (!product) return;
    
    const checkoutItem = {
      id: product.id || product._id,
      name: product.name,
      cost_price: product.selling_price || product.cost_price,
      image: product.image,
      quantity: 1
    };

    localStorage.setItem('adrenaline_checkout_item', JSON.stringify(checkoutItem));
    router.push('/checkout');
  };

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="text-orange-500 animate-pulse font-black uppercase tracking-[0.5em]">LOADING GEAR...</div>
    </div>
  );

  if (!product) return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white space-y-4">
      <h2 className="font-black uppercase tracking-widest text-zinc-500">Product Not Found</h2>
      <button onClick={() => router.push('/shop')} className="text-orange-500 font-bold uppercase text-xs">Return to Shop</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200">
      <Navbar />
      
      <main className="container mx-auto max-w-6xl px-6 py-32">
        <button 
          onClick={() => router.push('/shop')}
          className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-8 group text-[10px] font-black uppercase tracking-widest"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back to Shop
        </button>

        <div className="flex flex-col lg:flex-row gap-12 lg:items-start justify-center text-left">
          {/* IMAGE SECTION */}
          <div className="w-full lg:max-w-md">
            <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden border border-white/5 bg-zinc-900 shadow-2xl">
              <img 
                src={product.image || DEFAULT_IMAGE} 
                className="w-full h-full object-cover" 
                alt={product.name} 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/20 to-transparent" />
            </div>
          </div>

          {/* DETAILS SECTION */}
          <div className="flex-1 space-y-8 py-4">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-orange-500/20 bg-orange-500/5">
                <Flame size={10} className="text-orange-500" />
                <span className="text-orange-500 text-[9px] font-black uppercase tracking-[0.3em]">{product.category || "General Gear"}</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white leading-none">{product.name}</h1>
              <p className="text-3xl font-black text-orange-500 tracking-tighter">
                ₱{(Number(product.selling_price || product.cost_price) || 0).toLocaleString()}
              </p>
            </div>

            <div className="h-[1px] w-full bg-white/5" />

            {/* DESCRIPTION SECTION */}
            <div className="space-y-4 bg-white/5 p-6 rounded-2xl border border-white/5 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-orange-500">
                <Info size={14} />
                <h3 className="text-[10px] font-black uppercase tracking-widest">Description</h3>
              </div>
              <p className="text-zinc-400 leading-relaxed uppercase text-[11px] tracking-widest font-medium">
                {product.description || "No description available for this premium gear."}
              </p>
            </div>

            {/* TRUST BADGES */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-zinc-300 bg-zinc-900 px-4 py-3 rounded-xl border border-white/5">
                <ShieldCheck className="text-orange-600" size={14} /> High Grade Quality
              </div>
              <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-zinc-300 bg-zinc-900 px-4 py-3 rounded-xl border border-white/5">
                <Truck className="text-orange-600" size={14} /> Shop Pick-up Ready
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              {session && (
                <button 
                  onClick={handleDirectBuy}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] transition-all shadow-lg shadow-orange-600/20 active:scale-95"
                >
                  Direct Buy
                </button>
              )}
              
              <button 
                onClick={handleAddToCart}
                className="flex-1 bg-zinc-900 border border-white/5 hover:bg-zinc-800 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] transition-all flex items-center justify-center gap-3 active:scale-95"
              >
                <ShoppingCart size={14} /> Add to Cart
              </button>
            </div>
          </div>
        </div>

        {/* RELATED GEAR */}
        <div className="mt-32 pt-20 border-t border-white/5">
          <div className="mb-12 text-left">
            <h2 className="text-2xl font-black uppercase tracking-tighter text-white italic">Related <span className="text-orange-500">Gear</span></h2>
            <div className="h-1 w-12 bg-orange-600 mt-2" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {allProducts
              .filter(p => (p.id !== id && p._id !== id))
              .slice(0, 6)
              .map((item: any) => (
                <div
                  key={item.id || item._id}
                  onClick={() => router.push(`/shop/${item.id || item._id}`)}
                  className="group cursor-pointer text-left"
                >
                  <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-zinc-900 border border-white/5 mb-3 transition-all duration-300 group-hover:border-orange-500/30">
                    <img 
                      src={item.image || DEFAULT_IMAGE} 
                      className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-500 group-hover:scale-105" 
                      alt={item.name} 
                    />
                  </div>
                  <h4 className="text-white font-black uppercase text-[9px] tracking-tight truncate px-1">{item.name}</h4>
                  <p className="text-orange-500 font-black text-[9px] px-1">₱{(Number(item.selling_price || item.cost_price) || 0).toLocaleString()}</p>
                </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}