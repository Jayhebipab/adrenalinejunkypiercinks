"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from "next-auth/react";
import {
  ArrowLeft, CreditCard, Truck,
  Package, Loader2, CheckCircle2, QrCode,
  Image as ImageIcon, Building2, X
} from 'lucide-react';
import { Navbar } from '@/app/components/navigation/navbar';
import { Footer } from '@/app/components/navigation/footer';

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // --- STATES ---
  const [items, setItems] = useState<any[]>([]);
  const [isDirectBuy, setIsDirectBuy] = useState(false);

  // Pricing States
  const [subtotal, setSubtotal] = useState(0);
  const [vatPercentage, setVatPercentage] = useState(0); 
  const [vatAmount, setVatAmount] = useState(0);      
  const [total, setTotal] = useState(0);

  // Form States
  const [shippingData, setShippingData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  const [paymentSettings, setPaymentSettings] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'BPI' | 'GCASH'>('BPI');

  // UI States
  const [loading, setLoading] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // --- 1. AUTH & AUTO-FILL LOGIC ---
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      setShippingData(prev => ({
        ...prev,
        name: session.user?.name ?? '',
        email: session.user?.email ?? ''
      }));
    }
    if (status === "unauthenticated") {
      router.push('/api/auth/signin');
    }
  }, [session, status, router]);

  // --- 2. INITIAL LOAD (Items & Settings) ---
  useEffect(() => {
    fetch('/api/payment-settings')
      .then(res => res.json())
      .then(data => setPaymentSettings(data))
      .catch(err => console.error("Payment Settings Error:", err));

    const directItemRaw = localStorage.getItem('adrenaline_checkout_item');
    const cartItemsRaw = localStorage.getItem('adrenaline_cart');

    let currentItems = [];
    if (directItemRaw) {
      currentItems = [JSON.parse(directItemRaw)];
      setIsDirectBuy(true);
    } else if (cartItemsRaw) {
      const cart = JSON.parse(cartItemsRaw);
      if (cart.length > 0) currentItems = cart;
    }

    if (currentItems.length > 0) {
      setItems(currentItems);
      const calcSubtotal = currentItems.reduce((acc: number, item: any) => {
        const price = Number(item.cost_price || item.selling_price || 0);
        return acc + (price * item.quantity);
      }, 0);
      setSubtotal(calcSubtotal);
    } else {
      router.push('/shop');
    }
  }, [router]);

  // --- 3. FETCH VAT & CALCULATION ---
  useEffect(() => {
    const loadVAT = async () => {
      try {
        const res = await fetch('/api/VAT');
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setVatPercentage(Number(data[0].percentage));
        }
      } catch (err) {
        console.error("VAT fetch error:", err);
      }
    };
    loadVAT();
  }, []);

  useEffect(() => {
    if (vatPercentage > 0) {
      const vatExclusive = subtotal / (1 + (vatPercentage / 100));
      setVatAmount(subtotal - vatExclusive);
      setTotal(vatExclusive); 
    } else {
      setVatAmount(0);
      setTotal(subtotal);
    }
  }, [subtotal, vatPercentage]);

  // --- HANDLERS ---
  const handlePlaceOrder = () => {
    if (!shippingData.phone || !shippingData.address) {
      alert("Please fill up Phone and Address details.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setShowQRModal(true);
    }, 800);
  };

// --- HANAPIN MO ITO SA CheckoutPage.tsx ---
const handleVerifyAndSubmit = async () => {
  if (!screenshot) return;
  setIsUploading(true);

  // DITO ANG FIX: Siguraduhin na ang ID ay mapupunta sa field na "productId"
  const mappedItems = items.map(item => ({
    productId: item.id || item._id || item.productId, // Kunin ang kahit anong version ng ID na meron
    name: item.name,
    quantity: Number(item.quantity),
    cost_price: Number(item.cost_price || item.selling_price || 0),
    image: item.image || ""
  }));

  const orderPayload = {
    customer_name: shippingData.name || session?.user?.name || "Guest",
    customer_email: shippingData.email || session?.user?.email || "No Email",
    contact_number: shippingData.phone,
    address: shippingData.address,
    items: mappedItems, // <--- Gamitin ang mappedItems na may siguradong productId
    subtotal: subtotal,
    vat_percentage: vatPercentage,
    vat_deduction: vatAmount,
    total_amount: subtotal,
    payment_method: paymentMethod,
    screenshot: screenshot,
    status: 'Pending'
  };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });

      const result = await res.json();

      if (res.ok) {
        setIsUploading(false);
        setShowQRModal(false);
        setIsSuccess(true);
        if (isDirectBuy) localStorage.removeItem('adrenaline_checkout_item');
        else {
          localStorage.removeItem('adrenaline_cart');
          window.dispatchEvent(new Event('cart-updated'));
        }
      } else {
        setIsUploading(false);
        alert(`Order failed: ${result.error || "Please check your details."}`);
      }
    } catch (err) {
      setIsUploading(false);
      alert("Network error. Please try again.");
    }
  };

  if (status === "loading") return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-orange-500" /></div>;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200">
      <Navbar />
      <main className="container mx-auto max-w-5xl px-6 py-32">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-zinc-500 hover:text-white mb-8 text-[10px] font-black uppercase tracking-widest transition-all">
          <ArrowLeft size={14} /> Back to Gear
        </button>

        <h1 className="text-4xl font-black uppercase tracking-tighter text-white mb-12 italic">
          Complete <span className="text-orange-500">Transaction</span>
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* LEFT: FORM */}
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-zinc-900/50 border border-white/5 p-8 rounded-4xl">
              <h2 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2 text-white">
                <Truck size={16} className="text-orange-500" /> Delivery Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="FULL NAME"
                  value={shippingData.name}
                  readOnly
                  className="bg-zinc-800/30 border border-white/5 rounded-xl p-4 text-[10px] font-bold tracking-widest uppercase text-zinc-500 cursor-not-allowed"
                />
                <input
                  type="email"
                  placeholder="EMAIL"
                  value={shippingData.email}
                  readOnly
                  className="bg-zinc-800/30 border border-white/5 rounded-xl p-4 text-[10px] font-bold tracking-widest uppercase text-zinc-500 cursor-not-allowed"
                />
                <input
                  type="text"
                  placeholder="CONTACT NUMBER"
                  value={shippingData.phone}
                  onChange={(e) => setShippingData({ ...shippingData, phone: e.target.value })}
                  className="bg-black/50 border border-white/10 rounded-xl p-4 text-[10px] font-bold tracking-widest uppercase focus:border-orange-500 outline-none"
                />
                <div className="md:col-span-2">
                  <textarea
                    placeholder="COMPLETE ADDRESS"
                    rows={3}
                    value={shippingData.address}
                    onChange={(e) => setShippingData({ ...shippingData, address: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-[10px] font-bold tracking-widest uppercase focus:border-orange-500 outline-none"
                  />
                </div>
              </div>
            </section>

            <section className="bg-zinc-900/50 border border-white/5 p-8 rounded-4xl">
              <h2 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2 text-white">
                <CreditCard size={16} className="text-orange-500" /> Payment Method
              </h2>
              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={() => setPaymentMethod('BPI')} className={`flex-1 p-6 rounded-2xl border-2 ${paymentMethod === 'BPI' ? 'border-orange-500 bg-orange-500/10' : 'border-white/5 bg-zinc-800/50 opacity-50'}`}>
                  <Building2 size={24} className="mx-auto mb-2" />
                  <span className="text-[10px] font-black tracking-widest uppercase">BPI Transfer</span>
                </button>
                <button onClick={() => setPaymentMethod('GCASH')} className={`flex-1 p-6 rounded-2xl border-2 ${paymentMethod === 'GCASH' ? 'border-orange-500 bg-orange-500/10' : 'border-white/5 bg-zinc-800/50 opacity-50'}`}>
                  <QrCode size={24} className="mx-auto mb-2" />
                  <span className="text-[10px] font-black tracking-widest uppercase">GCash / QR</span>
                </button>
              </div>
            </section>
          </div>

          {/* RIGHT: SUMMARY */}
          <div className="space-y-6">
            <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-4xl sticky top-28">
              <h2 className="text-sm font-black uppercase tracking-widest mb-6 text-white flex items-center gap-2">
                <Package size={16} className="text-orange-500" /> Order Summary
              </h2>
              
              <div className="space-y-4 mb-8">
                {items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                      <img src={item.image || "/placeholder.jpg"} className="w-10 h-10 rounded bg-zinc-800 object-cover" />
                      <div>
                        <p className="text-[10px] font-black uppercase text-white line-clamp-1">{item.name}</p>
                        <p className="text-[9px] text-zinc-500 font-bold uppercase">QTY: {item.quantity}</p>
                      </div>
                    </div>
                    <p className="text-[10px] font-black text-white italic">₱{(Number(item.cost_price || 0) * item.quantity).toLocaleString()}</p>
                  </div>
                ))}
              </div>

              <div className="border-t border-zinc-800 pt-6 space-y-5">
                <div className="flex justify-between items-center bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">% Less: VAT ({vatPercentage}%)</span>
                  <span className="text-sm font-black text-white">- ₱{vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex justify-between items-end pt-6 border-t border-zinc-800">
                  <div className="flex flex-col gap-1">
                    <span className="text-3xl font-black tracking-tighter text-white uppercase leading-none">Total</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">VAT Exclusive Amount</span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-3xl font-black tracking-tighter text-white leading-none italic">
                      ₱{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-sm font-bold text-zinc-500 italic">
                      ₱{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              <button onClick={handlePlaceOrder} className="w-full bg-orange-600 hover:bg-orange-500 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] mt-8 transition-all flex justify-center items-center gap-2">
                {loading ? <Loader2 className="animate-spin" size={16} /> : "Finalize Order"}
              </button>
            </div>
          </div>
        </div>
      </main>

{/* MODALS */}
<AnimatePresence>
  {showQRModal && (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-6 overflow-y-auto">
      <div className="bg-zinc-900 border border-white/10 p-8 rounded-[40px] max-w-sm w-full text-center shadow-2xl">
        <h3 className="text-white font-black uppercase text-2xl mb-1 italic">
          {paymentMethod} Payment
        </h3>
        <p className="text-[8px] text-zinc-500 font-bold uppercase mb-6 italic tracking-widest">
          Send exactly <span className="text-orange-500">₱{subtotal.toLocaleString()}</span>
        </p>

        {/* QR CODE CONTAINER */}
        <div className="bg-white p-4 rounded-3xl mb-6 mx-auto w-56 shadow-lg">
          <img 
            src={paymentMethod === 'BPI' ? paymentSettings?.bpi_qr : paymentSettings?.gcash_qr} 
            className="w-full aspect-square object-contain" 
            alt="Payment QR"
          />
        </div>

        {/* ACCOUNT DETAILS BOX - Dito natin tinawag yung Name at Number */}
        <div className="bg-white/5 border border-white/5 rounded-2xl p-4 mb-6 text-left">
          <div className="mb-3">
            <p className="text-[7px] text-zinc-500 font-black uppercase tracking-tighter">Account Name</p>
            <p className="text-[11px] text-white font-bold uppercase">
              {paymentMethod === 'BPI' ? paymentSettings?.bpi_name : paymentSettings?.gcash_name || "JUNKY PIERCINKS"}
            </p>
          </div>
          <div>
            <p className="text-[7px] text-zinc-500 font-black uppercase tracking-tighter">Account Number</p>
            <p className="text-sm text-orange-500 font-mono font-black tracking-wider">
              {paymentMethod === 'BPI' ? paymentSettings?.bpi_number : paymentSettings?.gcash_number}
            </p>
          </div>
        </div>

        <div className="border-t border-white/5 pt-6">
          {!screenshot ? (
            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:bg-white/5 transition-colors">
              <ImageIcon className="text-zinc-600 mb-1" size={20} />
              <span className="text-[8px] font-black text-zinc-500 uppercase">Upload Receipt</span>
              <input 
                type="file" 
                className="hidden" 
                accept="image/*" 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => setScreenshot(reader.result as string);
                    reader.readAsDataURL(file);
                  }
                }} 
              />
            </label>
          ) : (
            <div className="relative h-32 w-full mb-4 group">
              <img src={screenshot} className="w-full h-full object-cover rounded-2xl border border-white/10" alt="Receipt Preview" />
              <button 
                onClick={() => setScreenshot(null)} 
                className="absolute -top-2 -right-2 bg-red-600 rounded-full p-1.5 text-white shadow-lg hover:scale-110 transition-transform"
              >
                <X size={12} />
              </button>
            </div>
          )}

          <button 
            onClick={handleVerifyAndSubmit} 
            disabled={!screenshot || isUploading} 
            className={`w-full py-4 rounded-2xl font-black uppercase text-[10px] mt-4 transition-all ${
              !screenshot || isUploading 
              ? "bg-zinc-800 text-zinc-500 cursor-not-allowed" 
              : "bg-orange-600 text-white hover:bg-orange-500 active:scale-95 shadow-lg shadow-orange-600/20"
            }`}
          >
            {isUploading ? "UPLOADING RECEIPT..." : "CONFIRM & SUBMIT"}
          </button>
          
          <button 
            onClick={() => setShowQRModal(false)} 
            className="w-full text-zinc-600 py-3 text-[8px] font-bold uppercase hover:text-white transition-colors"
          >
            Cancel Transaction
          </button>
        </div>
      </div>
    </div>
  )}
</AnimatePresence>

      {isSuccess && (
        <div className="fixed inset-0 z-110 flex items-center justify-center bg-zinc-950 p-6 text-center">
          <div className="space-y-6">
            <CheckCircle2 className="text-orange-500 mx-auto" size={64} />
            <h2 className="text-4xl font-black uppercase text-white italic">Order <span className="text-orange-500">Submitted!</span></h2>
            <button onClick={() => router.push('/shop')} className="px-12 py-4 bg-white text-black rounded-full font-black uppercase text-[10px]">Back to Shop</button>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}