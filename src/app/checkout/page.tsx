"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, CreditCard, Truck, ShieldCheck, 
  Package, Loader2, CheckCircle2, QrCode,
  Image as ImageIcon, Building2
} from 'lucide-react';
import { Navbar } from '@/app/components/navigation/navbar';
import { Footer } from '@/app/components/navigation/footer';

export default function CheckoutPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [isDirectBuy, setIsDirectBuy] = useState(false);
  const [total, setTotal] = useState(0);
  
  // Shipping State
  const [shippingData, setShippingData] = useState({
    name: '',
    phone: '',
    address: ''
  });

  // Payment API State (GCash & BPI from Database)
  const [paymentSettings, setPaymentSettings] = useState<any>(null);

  // UI States
  const [paymentMethod, setPaymentMethod] = useState<'BPI' | 'GCASH'>('BPI');
  const [loading, setLoading] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // 1. Fetch Cart and Payment Settings on Load
  useEffect(() => {
    // Fetch Payment Settings (QR and Account Details)
    const fetchPaymentInfo = async () => {
      try {
        const res = await fetch('/api/payment-settings');
        const data = await res.json();
        setPaymentSettings(data);
      } catch (err) {
        console.error("Failed to load payment info");
      }
    };

    fetchPaymentInfo();

    // Load Cart Items
    const directItem = localStorage.getItem('adrenaline_checkout_item');
    const cartItems = localStorage.getItem('adrenaline_cart');

    if (directItem) {
      const item = JSON.parse(directItem);
      setItems([item]);
      setIsDirectBuy(true);
      setTotal(item.cost_price * item.quantity);
    } else if (cartItems) {
      const cart = JSON.parse(cartItems);
      setItems(cart);
      const cartTotal = cart.reduce((acc: number, item: any) => acc + (item.cost_price * item.quantity), 0);
      setTotal(cartTotal);
    } else {
      router.push('/shop');
    }

    return () => {
      localStorage.removeItem('adrenaline_checkout_item');
    };
  }, [router]);

  // 2. Initial Proceed (Validation)
  const handlePlaceOrder = () => {
    if (!shippingData.name || !shippingData.phone || !shippingData.address) {
      alert("Please fill up all delivery details.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setShowQRModal(true);
    }, 800);
  };

  // 3. Final Submission to Firestore
  const handleVerifyAndSubmit = async () => {
    if (!screenshot) return;
    
    setIsUploading(true);

    const orderPayload = {
      customer_name: shippingData.name,
      contact_number: shippingData.phone,
      address: shippingData.address,
      items: items,
      total_amount: total,
      payment_method: paymentMethod,
      screenshot: screenshot // Base64 string
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });

      if (res.ok) {
        setIsUploading(false);
        setShowQRModal(false);
        setIsSuccess(true);
        
        // Clear cart if not direct buy
        if (!isDirectBuy) {
          localStorage.removeItem('adrenaline_cart');
          window.dispatchEvent(new Event('cart-updated'));
        }
      } else {
        const err = await res.json();
        alert(err.error || "Failed to submit order.");
        setIsUploading(false);
      }
    } catch (err) {
      alert("Network error. Please try again.");
      setIsUploading(false);
    }
  };

  const handleFinalizeOrder = () => {
    router.push('/shop');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 font-sans">
      <Navbar />

      <main className="container mx-auto max-w-5xl px-6 py-32">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-zinc-500 hover:text-white mb-8 text-[10px] font-black uppercase tracking-widest transition-all">
          <ArrowLeft size={14} /> Back
        </button>

        <h1 className="text-4xl font-black uppercase tracking-tighter text-white mb-12 italic">
          Complete <span className="text-orange-500">Transaction</span>
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* LEFT: Shipping & Payment Selection */}
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-zinc-900/50 border border-white/5 p-8 rounded-[2rem]">
              <h2 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2 text-white">
                <Truck size={16} className="text-orange-500" /> Delivery Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input 
                  type="text" 
                  placeholder="FULL NAME" 
                  value={shippingData.name}
                  onChange={(e) => setShippingData({...shippingData, name: e.target.value})}
                  className="bg-black/50 border border-white/10 rounded-xl p-4 text-[10px] font-bold tracking-widest uppercase focus:border-orange-500 outline-none" 
                />
                <input 
                  type="text" 
                  placeholder="CONTACT NUMBER" 
                  value={shippingData.phone}
                  onChange={(e) => setShippingData({...shippingData, phone: e.target.value})}
                  className="bg-black/50 border border-white/10 rounded-xl p-4 text-[10px] font-bold tracking-widest uppercase focus:border-orange-500 outline-none" 
                />
                <div className="md:col-span-2">
                  <textarea 
                    placeholder="COMPLETE ADDRESS" 
                    rows={3} 
                    value={shippingData.address}
                    onChange={(e) => setShippingData({...shippingData, address: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-[10px] font-bold tracking-widest uppercase focus:border-orange-500 outline-none" 
                  />
                </div>
              </div>
            </section>

            <section className="bg-zinc-900/50 border border-white/5 p-8 rounded-[2rem]">
              <h2 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2 text-white">
                <CreditCard size={16} className="text-orange-500" /> Choose Payment
              </h2>
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => setPaymentMethod('BPI')}
                  className={`flex-1 p-6 rounded-2xl transition-all flex flex-col items-center gap-3 border-2 ${paymentMethod === 'BPI' ? 'border-orange-500 bg-orange-500/10' : 'border-white/5 bg-zinc-800/50 opacity-50'}`}
                >
                  <Building2 size={24} className={paymentMethod === 'BPI' ? 'text-orange-500' : 'text-zinc-500'} />
                  <span className="text-[10px] font-black tracking-widest uppercase">BPI Transfer</span>
                </button>
                <button 
                  onClick={() => setPaymentMethod('GCASH')}
                  className={`flex-1 p-6 rounded-2xl transition-all flex flex-col items-center gap-3 border-2 ${paymentMethod === 'GCASH' ? 'border-orange-500 bg-orange-500/10' : 'border-white/5 bg-zinc-800/50 opacity-50'}`}
                >
                  <QrCode size={24} className={paymentMethod === 'GCASH' ? 'text-orange-500' : 'text-zinc-500'} />
                  <span className="text-[10px] font-black tracking-widest uppercase">GCash / QR</span>
                </button>
              </div>
            </section>
          </div>

          {/* RIGHT: Order Summary */}
          <div className="space-y-6">
            <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-[2rem] sticky top-28">
              <h2 className="text-sm font-black uppercase tracking-widest mb-6 text-white flex items-center gap-2">
                <Package size={16} className="text-orange-500" /> Summary
              </h2>
              <div className="space-y-4 mb-8">
                {items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                      <img src={item.image} alt="" className="w-10 h-10 rounded bg-zinc-800 object-cover" />
                      <div>
                        <p className="text-[10px] font-black uppercase text-white line-clamp-1">{item.name}</p>
                        <p className="text-[9px] text-zinc-500 font-bold tracking-widest">QTY: {item.quantity}</p>
                      </div>
                    </div>
                    <p className="text-[10px] font-black text-white italic">₱{(item.cost_price * item.quantity).toLocaleString()}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/5 pt-4">
                <div className="flex justify-between text-xl font-black italic tracking-tighter text-orange-500">
                  <span>TOTAL</span>
                  <span>₱{total.toLocaleString()}</span>
                </div>
              </div>
              <button 
                onClick={handlePlaceOrder}
                disabled={loading}
                className="w-full bg-orange-600 hover:bg-orange-500 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] mt-8 transition-all active:scale-95 flex justify-center items-center gap-2 shadow-lg shadow-orange-600/20"
              >
                {loading ? <Loader2 className="animate-spin" size={16} /> : "Proceed to Payment"}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* --- PAYMENT MODAL --- */}
      <AnimatePresence>
        {showQRModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-6 overflow-y-auto">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-zinc-900 border border-white/10 p-8 rounded-[2.5rem] max-w-sm w-full text-center">
              <h3 className="text-white font-black uppercase tracking-tighter text-2xl mb-1 italic">
                {paymentMethod === 'BPI' ? 'BPI Transfer' : 'GCash Payment'}
              </h3>
              <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-[0.3em] mb-6">
                Pay Exactly <span className="text-white">₱{total.toLocaleString()}</span>
              </p>

              {/* DYNAMIC QR FROM API */}
              <div className="bg-white p-4 rounded-3xl mb-4 mx-auto w-56 shadow-xl shadow-orange-500/10">
                <img 
                  src={paymentMethod === 'BPI' ? (paymentSettings?.bpi_qr || "/images/bpi-qr.png") : (paymentSettings?.gcash_qr || "/images/gcash-qr.png")} 
                  alt="QR Code" 
                  className="w-full aspect-square object-contain"
                  onError={(e) => { e.currentTarget.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${paymentMethod}-PAYMENT-${total}`; }}
                />
              </div>

              {/* DYNAMIC ACCOUNT DETAILS FROM API */}
              <div className="bg-black/40 rounded-xl p-3 mb-6 text-left border border-white/5">
                <p className="text-[8px] font-black text-zinc-500 tracking-widest uppercase mb-1">Account Name</p>
                <p className="text-[10px] font-bold text-white mb-2 uppercase">
                  {paymentMethod === 'BPI' ? (paymentSettings?.bpi_name || "") : (paymentSettings?.gcash_name || "")}
                </p>
                <p className="text-[8px] font-black text-zinc-500 tracking-widest uppercase mb-1">Account Number</p>
                <p className="text-[10px] font-bold text-orange-500 tracking-widest">
                  {paymentMethod === 'BPI' ? (paymentSettings?.bpi_number || "") : (paymentSettings?.gcash_number || "")}
                </p>
              </div>

              {/* UPLOAD SECTION */}
              <div className="border-t border-white/5 pt-6">
                <p className="text-[8px] text-zinc-500 font-black uppercase tracking-[0.2em] mb-4">Upload Receipt Screenshot</p>
                {!screenshot ? (
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:bg-white/5 transition-all">
                    <ImageIcon className="text-zinc-600 mb-1" size={20} />
                    <span className="text-[8px] font-black text-zinc-500 uppercase">Select Image</span>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setScreenshot(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }} />
                  </label>
                ) : (
                  <div className="relative h-32 w-full rounded-xl overflow-hidden mb-4 border border-white/10">
                    <img src={screenshot} alt="Preview" className="w-full h-full object-cover" />
                    <button onClick={() => setScreenshot(null)} className="absolute top-2 right-2 bg-black/80 p-1.5 rounded-full text-white"><ArrowLeft size={10} className="rotate-90" /></button>
                  </div>
                )}

                <button 
                  disabled={!screenshot || isUploading}
                  onClick={handleVerifyAndSubmit}
                  className="w-full bg-orange-600 hover:bg-orange-500 disabled:opacity-30 text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all mt-4 flex justify-center items-center gap-2"
                >
                  {isUploading ? <Loader2 className="animate-spin" size={14} /> : "Verify Payment"}
                </button>
                <button onClick={() => { setShowQRModal(false); setScreenshot(null); }} className="w-full text-zinc-600 py-3 font-bold uppercase text-[8px] tracking-[0.3em]">Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* SUCCESS SCREEN */}
        {isSuccess && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[110] flex items-center justify-center bg-zinc-950 p-6 text-center">
            <div className="space-y-6">
              <div className="bg-orange-500/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="text-orange-500" size={48} />
              </div>
              <h2 className="text-4xl font-black uppercase tracking-tighter italic text-white">Order <span className="text-orange-500">Submitted!</span></h2>
              <p className="text-zinc-500 font-bold uppercase tracking-[0.2em] text-[9px] max-w-xs mx-auto leading-loose">We will verify your payment screenshot and process your order shortly. Thank you!</p>
              <button onClick={handleFinalizeOrder} className="mt-8 px-12 py-4 bg-white text-black rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-orange-500 hover:text-white transition-all">Back to Home</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}