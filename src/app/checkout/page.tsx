"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, CreditCard, Truck, ShieldCheck, Package } from 'lucide-react';
import { Navbar } from '@/app/components/navigation/navbar';
import { Footer } from '@/app/components/navigation/footer';

export default function CheckoutPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [isDirectBuy, setIsDirectBuy] = useState(false);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    // 1. Check kung may "Direct Buy" item
    const directItem = localStorage.getItem('adrenaline_checkout_item');
    const cartItems = localStorage.getItem('adrenaline_cart');

    if (directItem) {
      // Kung merong direct buy, yun lang ang ipakita natin
      const item = JSON.parse(directItem);
      setItems([item]);
      setIsDirectBuy(true);
      setTotal(item.cost_price * item.quantity);
    } else if (cartItems) {
      // Kung wala, kunin yung buong cart
      const cart = JSON.parse(cartItems);
      setItems(cart);
      const cartTotal = cart.reduce((acc: number, item: any) => acc + (item.cost_price * item.quantity), 0);
      setTotal(cartTotal);
    } else {
      // Kung parehong wala, balik sa shop
      router.push('/shop');
    }

    // Importante: Linisin ang Direct Buy pagka-close o pagka-load para hindi mag-stuck
    return () => {
      localStorage.removeItem('adrenaline_checkout_item');
    };
  }, []);

  const handlePlaceOrder = () => {
    // Dito mo ilalagay yung API call para i-save yung order sa Database
    console.log("Placing order for:", items);
    alert("ORDER PLACED! (Simulation Only)");
    
    // Clear cart kung successful ang order
    if (!isDirectBuy) {
      localStorage.removeItem('adrenaline_cart');
      window.dispatchEvent(new Event('cart-updated'));
    }
    router.push('/profile'); // Redirect sa orders history
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200">
      <Navbar />

      <main className="container mx-auto max-w-5xl px-6 py-32">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-zinc-500 hover:text-white mb-8 text-[10px] font-black uppercase tracking-widest"
        >
          <ArrowLeft size={14} /> Back
        </button>

        <h1 className="text-4xl font-black uppercase tracking-tighter text-white mb-12 italic">
          Confirm <span className="text-orange-500">Order</span>
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* LEFT: Shipping Details Form */}
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-zinc-900/50 border border-white/5 p-8 rounded-[2rem]">
              <h2 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                <Truck size={16} className="text-orange-500" /> Shipping Info
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder="FULL NAME" className="bg-black/50 border border-white/10 rounded-xl p-4 text-[10px] font-bold tracking-widest uppercase focus:border-orange-500 outline-none" />
                <input type="text" placeholder="PHONE NUMBER" className="bg-black/50 border border-white/10 rounded-xl p-4 text-[10px] font-bold tracking-widest uppercase focus:border-orange-500 outline-none" />
                <div className="md:col-span-2">
                  <textarea placeholder="COMPLETE ADDRESS" rows={3} className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-[10px] font-bold tracking-widest uppercase focus:border-orange-500 outline-none" />
                </div>
              </div>
            </section>

            <section className="bg-zinc-900/50 border border-white/5 p-8 rounded-[2rem]">
              <h2 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                <CreditCard size={16} className="text-orange-500" /> Payment Method
              </h2>
              <div className="flex gap-4">
                <button className="flex-1 border-2 border-orange-500 bg-orange-500/10 p-4 rounded-xl text-[10px] font-black tracking-widest">CASH ON DELIVERY</button>
                <button disabled className="flex-1 border border-white/5 bg-zinc-800/50 p-4 rounded-xl text-[10px] font-black tracking-widest opacity-50 cursor-not-allowed">GCASH (SOON)</button>
              </div>
            </section>
          </div>

          {/* RIGHT: Order Summary */}
          <div className="space-y-6">
            <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-[2rem] sticky top-28">
              <h2 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                <Package size={16} className="text-orange-500" /> Summary
              </h2>
              
              <div className="space-y-4 mb-8">
                {items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-zinc-800 rounded-lg overflow-hidden border border-white/5">
                        <img src={item.image} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-tight leading-none text-white">{item.name}</p>
                        <p className="text-[9px] text-zinc-500 font-bold tracking-widest uppercase">QTY: {item.quantity}</p>
                      </div>
                    </div>
                    <p className="text-[10px] font-black text-white">₱{(item.cost_price * item.quantity).toLocaleString()}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2 border-t border-white/5 pt-4">
                <div className="flex justify-between text-[10px] font-bold tracking-widest text-zinc-500">
                  <span>SUBTOTAL</span>
                  <span>₱{total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold tracking-widest text-zinc-500">
                  <span>SHIPPING</span>
                  <span>₱0</span>
                </div>
                <div className="flex justify-between text-lg font-black tracking-tighter text-orange-500 pt-2">
                  <span>TOTAL</span>
                  <span>₱{total.toLocaleString()}</span>
                </div>
              </div>

              <button 
                onClick={handlePlaceOrder}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] mt-8 transition-all active:scale-95 shadow-lg shadow-orange-600/20"
              >
                Place Order Now
              </button>

              <div className="mt-6 flex items-center justify-center gap-2 text-[8px] font-bold text-zinc-600 tracking-widest uppercase">
                <ShieldCheck size={12} /> Secure Checkout
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}