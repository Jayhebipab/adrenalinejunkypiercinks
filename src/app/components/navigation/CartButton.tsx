"use client";

import React, { useState, useEffect, } from 'react';
import { motion, AnimatePresence,  } from 'framer-motion';
import { useSession } from "next-auth/react"; // <--- IDAGDAG ITONG IMPORT
import { ShoppingCart, X, Trash2, Plus, Minus, ShoppingBag, Link } from 'lucide-react';
import { useRouter } from 'next/navigation';

export const CartButton = () => {
    const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [cart, setCart] = useState<any[]>([]);
const { data: session } = useSession(); // <--- IDAGDAG ITONG LINE
  const loadCart = () => {
    const saved = localStorage.getItem('adrenaline_cart');
    if (saved) {
      try { setCart(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
  };

  useEffect(() => {
    loadCart();
    window.addEventListener('cart-updated', loadCart);
    
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      window.removeEventListener('cart-updated', loadCart);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const updateQuantity = (id: string, delta: number) => {
    const newCart = cart.map(item => {
      if (item.id === id) return { ...item, quantity: Math.max(1, (item.quantity || 1) + delta) };
      return item;
    });
    setCart(newCart);
    localStorage.setItem('adrenaline_cart', JSON.stringify(newCart));
  };

  const removeItem = (id: string) => {
    const newCart = cart.filter(item => item.id !== id);
    setCart(newCart);
    localStorage.setItem('adrenaline_cart', JSON.stringify(newCart));
    window.dispatchEvent(new Event('cart-updated'));
  };

  const totalPrice = cart.reduce((acc, item) => acc + (Number(item.cost_price) * (item.quantity || 1)), 0);
  const cartCount = cart.reduce((acc, item) => acc + (item.quantity || 0), 0);

  return (
    <>
      <motion.button 
        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)} 
        className="relative p-2 group focus:outline-none z-30"
      >
        <ShoppingCart className="h-5 w-5 text-zinc-400 group-hover:text-orange-500 transition-colors relative z-10" />
        <AnimatePresence>
          {cartCount > 0 && (
            <motion.span
              initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
              className="absolute -top-0.5 -right-0.5 bg-orange-600 text-white text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-full border border-zinc-950 z-20"
            >
              {cartCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* BACKDROP - Ito yung magpapadilim sa likod para solid yung look */}
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              onClick={() => setIsOpen(false)} 
              className="fixed inset-0 bg-black/90 backdrop-blur-md z-[99998]" 
            />

            {/* SIDE PANEL - Forced background at high z-index */}
            <motion.div 
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} 
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-full max-w-[380px] z-[99999] flex flex-col shadow-2xl shadow-black min-h-screen overflow-y-auto"
              style={{ 
                backgroundColor: '#09090b', // Solid Zinc 950
                boxShadow: '-10px 0 30px rgba(0,0,0,1)' // Solid Shadow para hiwalay sa bg
              }}
            >
              {/* Header */}
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <div className="text-left">
                  <h2 className="font-black uppercase text-sm tracking-widest italic text-white leading-none">Your Gear</h2>
                  <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Ready for checkout</p>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-2 text-zinc-500 hover:text-white transition-colors">
                  <X size={20}/>
                </button>
              </div>

              {/* Scrollable Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center opacity-30 text-zinc-500">
                    <ShoppingBag size={48} />
                    <p className="text-[10px] font-black mt-4 uppercase tracking-[0.3em]">No Gear Selected</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <motion.div layout key={item.id} className="flex gap-4 bg-zinc-900/60 p-3 rounded-2xl border border-white/5">
                      <img src={item.image || "/placeholder.svg"} className="w-16 h-16 object-cover rounded-xl bg-zinc-800" alt="" />
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 text-left">
                        <div>
                          <h4 className="font-black uppercase text-[10px] text-white truncate">{item.name}</h4>
                          <p className="text-orange-500 font-black text-xs mt-1">₱{Number(item.cost_price).toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center bg-black rounded-lg border border-white/10 overflow-hidden">
                            <button onClick={() => updateQuantity(item.id, -1)} className="p-1.5 hover:bg-white/5"><Minus size={10}/></button>
                            <span className="text-[10px] font-black w-6 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="p-1.5 hover:bg-white/5"><Plus size={10}/></button>
                          </div>
                          <button onClick={() => removeItem(item.id)} className="text-zinc-600 hover:text-red-500"><Trash2 size={12}/></button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

{/* Bottom Area */}
{cart.length > 0 && (
  <div className="p-6 border-t border-white/10 bg-zinc-900">
    <div className="flex justify-between items-center mb-6">
      <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Total</span>
      <span className="text-2xl font-black text-orange-500 italic">₱{totalPrice.toLocaleString()}</span>
    </div>
    
    {(() => {
      // Dito natin iche-check kung may active session base sa code mo
      // Kung gumagamit ka ng NextAuth, i-import ang `useSession`
      // const { data: session } = useSession(); 
      
      const isPriorityActive = !!session; // Kung true, "Priority member active"

      return (
        <div className="space-y-3">
          <button 
            disabled={!isPriorityActive} 
            onClick={() => {
              localStorage.removeItem('adrenaline_checkout_item');
              router.push('/checkout');
            }}
            className={`w-full py-4 rounded-xl font-black uppercase text-[11px] tracking-[0.2em] transition-all flex items-center justify-center gap-2
              ${isPriorityActive 
                ? "bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-600/20 active:scale-95" 
                : "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5 opacity-50"}
            `}
          >
            {isPriorityActive ? (
              <>Secure Checkout</>
            ) : (
              <>Access Denied</>
            )}
          </button>

          {!isPriorityActive && (
            <div className="space-y-2 text-center">
              <p className="text-[9px] font-bold text-orange-500 uppercase tracking-widest animate-pulse">
                Priority Access Required
              </p>
              <p className="text-[8px] text-zinc-500 uppercase font-medium">
                Please join the cult or sign in below to unlock gear
              </p>
            </div>
          )}
        </div>
      );
    })()}
  </div>
)}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
