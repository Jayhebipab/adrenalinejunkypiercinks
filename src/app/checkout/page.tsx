"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from "next-auth/react";
import {
  ArrowLeft, CreditCard, Truck,
  Package, Loader2, CheckCircle2, QrCode,
  Image as ImageIcon, Building2, X, AlertCircle
} from 'lucide-react';
import { Navbar } from '@/app/components/navigation/navbar';
import { Footer } from '@/app/components/navigation/footer';
import { cn } from '@/lib/utils';

// ─── VALIDATION ───────────────────────────────────────────────────────────────
const PH_PHONE_REGEX = /^(09|\+639)\d{9}$/;
const SPECIAL_CHAR_REGEX = /[^a-zA-Z0-9\s,.\-#&'()]/; // allowed: letters, numbers, space, comma, period, dash, hash, ampersand, apostrophe, parens
const ALLOWED_RECEIPT_TYPES = ["image/jpeg", "image/jpg", "image/png"];

interface FormErrors {
  phone?: string;
  address?: string;
}

function validateForm(data: { phone: string; address: string }): FormErrors {
  const errors: FormErrors = {};

  const cleanPhone = data.phone.replace(/\s/g, "");
  if (!cleanPhone) {
    errors.phone = "Contact number is required.";
  } else if (!PH_PHONE_REGEX.test(cleanPhone)) {
    errors.phone = "Must be a valid PH number (09XXXXXXXXX or +639XXXXXXXXX).";
  }

  if (!data.address.trim()) {
    errors.address = "Complete address is required.";
  } else if (SPECIAL_CHAR_REGEX.test(data.address)) {
    errors.address = "Address contains invalid special characters.";
  }

  return errors;
}

// ─── FORM ERROR LABEL ────────────────────────────────────────────────────────
function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <div className="flex items-center gap-1.5 text-red-400 text-[9px] font-bold uppercase tracking-widest mt-1.5 ml-1">
      <AlertCircle size={10} className="shrink-0" /> {msg}
    </div>
  );
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [items, setItems] = useState<any[]>([]);
  const [isDirectBuy, setIsDirectBuy] = useState(false);

  const [subtotal, setSubtotal] = useState(0);
  const [vatPercentage, setVatPercentage] = useState(0);
  const [vatAmount, setVatAmount] = useState(0);
  const [total, setTotal] = useState(0);

  const [shippingData, setShippingData] = useState({ name: '', email: '', phone: '', address: '' });
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const [paymentSettings, setPaymentSettings] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'BPI' | 'GCASH'>('BPI');

  const [loading, setLoading] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // ─── AUTH & AUTO-FILL ─────────────────────────────────────────────────────
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      setShippingData(prev => ({
        ...prev,
        name: session.user?.name ?? '',
        email: session.user?.email ?? '',
      }));
    }
    if (status === "unauthenticated") router.push('/api/auth/signin');
  }, [session, status, router]);

  // ─── LOAD ITEMS & PAYMENT SETTINGS ───────────────────────────────────────
  useEffect(() => {
    fetch('/api/payment-settings')
      .then(res => res.json())
      .then(data => setPaymentSettings(data))
      .catch(err => console.error("Payment Settings Error:", err));

    const directItemRaw = localStorage.getItem('adrenaline_checkout_item');
    const cartItemsRaw = localStorage.getItem('adrenaline_cart');
    let currentItems: any[] = [];

    if (directItemRaw) {
      currentItems = [JSON.parse(directItemRaw)];
      setIsDirectBuy(true);
    } else if (cartItemsRaw) {
      const cart = JSON.parse(cartItemsRaw);
      if (cart.length > 0) currentItems = cart;
    }

    if (currentItems.length > 0) {
      setItems(currentItems);
      const calc = currentItems.reduce((acc: number, item: any) => {
        return acc + (Number(item.cost_price || item.selling_price || 0) * item.quantity);
      }, 0);
      setSubtotal(calc);
    } else {
      router.push('/shop');
    }
  }, [router]);

  // ─── VAT ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/VAT')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) setVatPercentage(Number(data[0].percentage));
      })
      .catch(err => console.error("VAT fetch error:", err));
  }, []);

  useEffect(() => {
    if (vatPercentage > 0) {
      const vatExclusive = subtotal / (1 + vatPercentage / 100);
      setVatAmount(subtotal - vatExclusive);
      setTotal(vatExclusive);
    } else {
      setVatAmount(0);
      setTotal(subtotal);
    }
  }, [subtotal, vatPercentage]);

  // ─── PLACE ORDER ─────────────────────────────────────────────────────────
  const handlePlaceOrder = () => {
    const errors = validateForm({ phone: shippingData.phone, address: shippingData.address });
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setShowQRModal(true);
    }, 800);
  };

  // ─── RECEIPT UPLOAD ───────────────────────────────────────────────────────
  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_RECEIPT_TYPES.includes(file.type)) {
      setReceiptError("Invalid file type. Only JPG, JPEG, and PNG are allowed.");
      setScreenshot(null);
      return;
    }

    setReceiptError(null);
    const reader = new FileReader();
    reader.onloadend = () => setScreenshot(reader.result as string);
    reader.readAsDataURL(file);
  };

  // ─── SUBMIT ORDER ─────────────────────────────────────────────────────────
  const handleVerifyAndSubmit = async () => {
    if (!screenshot) return;
    setIsUploading(true);

    const mappedItems = items.map(item => ({
      productId: item.id || item._id || item.productId,
      name: item.name,
      quantity: Number(item.quantity),
      cost_price: Number(item.cost_price || item.selling_price || 0),
      image: item.image || "",
    }));

    const orderPayload = {
      customer_name: shippingData.name || session?.user?.name || "Guest",
      customer_email: shippingData.email || session?.user?.email || "No Email",
      contact_number: shippingData.phone,
      address: shippingData.address,
      items: mappedItems,
      subtotal,
      vat_percentage: vatPercentage,
      vat_deduction: vatAmount,
      total_amount: subtotal,
      payment_method: paymentMethod,
      screenshot,
      status: 'Pending',
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
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

  if (status === "loading") return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Loader2 className="animate-spin text-orange-500" />
    </div>
  );

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

          {/* ── LEFT: FORM ── */}
          <div className="lg:col-span-2 space-y-8">

            {/* Delivery Details */}
            <section className="bg-zinc-900/50 border border-white/5 p-8 rounded-[2.5rem]">
              <h2 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2 text-white">
                <Truck size={16} className="text-orange-500" /> Delivery Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Readonly: Name */}
                <input
                  type="text" placeholder="FULL NAME" value={shippingData.name} readOnly
                  className="bg-zinc-800/30 border border-white/5 rounded-xl p-4 text-[10px] font-bold tracking-widest uppercase text-zinc-500 cursor-not-allowed"
                />
                {/* Readonly: Email */}
                <input
                  type="email" placeholder="EMAIL" value={shippingData.email} readOnly
                  className="bg-zinc-800/30 border border-white/5 rounded-xl p-4 text-[10px] font-bold tracking-widest uppercase text-zinc-500 cursor-not-allowed"
                />

                {/* Phone — with validation */}
                <div className="space-y-0">
                  <input
                    type="text"
                    placeholder="09XXXXXXXXX"
                    value={shippingData.phone}
                    onChange={e => {
                      // Only allow digits and leading +
                      const val = e.target.value.replace(/[^\d+]/g, '').slice(0, 13);
                      setShippingData({ ...shippingData, phone: val });
                      if (formErrors.phone) setFormErrors(prev => ({ ...prev, phone: undefined }));
                    }}
                    className={cn(
                      "w-full bg-black/50 border rounded-xl p-4 text-[10px] font-bold tracking-widest uppercase outline-none transition-all",
                      formErrors.phone
                        ? "border-red-500/60 bg-red-500/5 focus:border-red-500"
                        : "border-white/10 focus:border-orange-500"
                    )}
                  />
                  <FieldError msg={formErrors.phone} />
                </div>

                {/* Address — with validation */}
                <div className="md:col-span-2 space-y-0">
                  <textarea
                    placeholder="COMPLETE ADDRESS (House No., Street, Barangay, City, Province)"
                    rows={3}
                    value={shippingData.address}
                    onChange={e => {
                      setShippingData({ ...shippingData, address: e.target.value });
                      if (formErrors.address) setFormErrors(prev => ({ ...prev, address: undefined }));
                    }}
                    className={cn(
                      "w-full bg-black/50 border rounded-xl p-4 text-[10px] font-bold tracking-widest uppercase outline-none transition-all resize-none",
                      formErrors.address
                        ? "border-red-500/60 bg-red-500/5 focus:border-red-500"
                        : "border-white/10 focus:border-orange-500"
                    )}
                  />
                  <FieldError msg={formErrors.address} />
                </div>
              </div>
            </section>

            {/* Payment Method */}
            <section className="bg-zinc-900/50 border border-white/5 p-8 rounded-[2.5rem]">
              <h2 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2 text-white">
                <CreditCard size={16} className="text-orange-500" /> Payment Method
              </h2>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => setPaymentMethod('BPI')}
                  className={cn(
                    "flex-1 p-6 rounded-2xl border-2 transition-all",
                    paymentMethod === 'BPI' ? "border-orange-500 bg-orange-500/10" : "border-white/5 bg-zinc-800/50 opacity-50 hover:opacity-80"
                  )}
                >
                  <Building2 size={24} className="mx-auto mb-2" />
                  <span className="text-[10px] font-black tracking-widest uppercase">BPI Transfer</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('GCASH')}
                  className={cn(
                    "flex-1 p-6 rounded-2xl border-2 transition-all",
                    paymentMethod === 'GCASH' ? "border-orange-500 bg-orange-500/10" : "border-white/5 bg-zinc-800/50 opacity-50 hover:opacity-80"
                  )}
                >
                  <QrCode size={24} className="mx-auto mb-2" />
                  <span className="text-[10px] font-black tracking-widest uppercase">GCash / QR</span>
                </button>
              </div>
            </section>
          </div>

          {/* ── RIGHT: ORDER SUMMARY ── */}
          <div className="space-y-6">
            <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-[2.5rem] sticky top-28">
              <h2 className="text-sm font-black uppercase tracking-widest mb-6 text-white flex items-center gap-2">
                <Package size={16} className="text-orange-500" /> Order Summary
              </h2>

              <div className="space-y-4 mb-8">
                {items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                      <img src={item.image || "/placeholder.jpg"} className="w-10 h-10 rounded bg-zinc-800 object-cover shrink-0" />
                      <div>
                        <p className="text-[10px] font-black uppercase text-white line-clamp-1">{item.name}</p>
                        <p className="text-[9px] text-zinc-500 font-bold uppercase">QTY: {item.quantity}</p>
                      </div>
                    </div>
                    <p className="text-[10px] font-black text-white italic shrink-0">
                      ₱{(Number(item.cost_price || 0) * item.quantity).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-zinc-800 pt-6 space-y-5">
                {vatPercentage > 0 && (
                  <div className="flex justify-between items-center bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                      VAT ({vatPercentage}%) deducted
                    </span>
                    <span className="text-sm font-black text-white">
                      - ₱{vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-end pt-4 border-t border-zinc-800">
                  <div>
                    <span className="text-3xl font-black tracking-tighter text-white uppercase leading-none block">Total</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">VAT Exclusive</span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-3xl font-black tracking-tighter text-white italic">
                      ₱{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-sm font-bold text-zinc-500 italic">
                      ₱{total.toLocaleString(undefined, { minimumFractionDigits: 2 })} excl.
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={loading}
                className="w-full bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] mt-8 transition-all flex justify-center items-center gap-2 active:scale-[0.98]"
              >
                {loading ? <Loader2 className="animate-spin" size={16} /> : "Finalize Order"}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* ── QR PAYMENT MODAL ── */}
      <AnimatePresence>
        {showQRModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              className="bg-zinc-900 border border-white/10 p-8 rounded-[2.5rem] w-full max-w-sm text-center shadow-2xl my-auto"
            >
              <h3 className="text-white font-black uppercase text-2xl mb-1 italic">
                {paymentMethod} Payment
              </h3>
              <p className="text-[8px] text-zinc-500 font-bold uppercase mb-6 italic tracking-widest">
                Send exactly <span className="text-orange-500">₱{subtotal.toLocaleString()}</span>
              </p>

              {/* ── QR CODE — BIG on mobile, scannable ── */}
              <div className="bg-white p-4 rounded-3xl mb-6 mx-auto shadow-lg
                w-full max-w-[280px]
                sm:max-w-[240px]
                md:max-w-[220px]
              ">
                {(paymentMethod === 'BPI' ? paymentSettings?.bpi_qr : paymentSettings?.gcash_qr) ? (
                  <img
                    src={paymentMethod === 'BPI' ? paymentSettings?.bpi_qr : paymentSettings?.gcash_qr}
                    className="w-full aspect-square object-contain"
                    alt={`${paymentMethod} QR Code`}
                  />
                ) : (
                  <div className="w-full aspect-square flex items-center justify-center text-zinc-400">
                    <QrCode size={60} />
                  </div>
                )}
              </div>

              {/* Account Details */}
              <div className="bg-white/5 border border-white/5 rounded-2xl p-4 mb-6 text-left space-y-3">
                <div>
                  <p className="text-[7px] text-zinc-500 font-black uppercase tracking-tighter mb-0.5">Account Name</p>
                  <p className="text-[11px] text-white font-black uppercase">
                    {paymentMethod === 'BPI' ? paymentSettings?.bpi_name : paymentSettings?.gcash_name}
                  </p>
                </div>
                <div>
                  <p className="text-[7px] text-zinc-500 font-black uppercase tracking-tighter mb-0.5">Account Number</p>
                  <p className="text-sm text-orange-500 font-mono font-black tracking-wider">
                    {paymentMethod === 'BPI' ? paymentSettings?.bpi_number : paymentSettings?.gcash_number}
                  </p>
                </div>
              </div>

              {/* Receipt Upload */}
              <div className="border-t border-white/5 pt-6">
                {!screenshot ? (
                  <label className={cn(
                    "flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-2xl cursor-pointer transition-all",
                    receiptError
                      ? "border-red-500/40 bg-red-500/5 hover:bg-red-500/10"
                      : "border-white/10 hover:bg-white/5"
                  )}>
                    <ImageIcon className={cn("mb-1.5", receiptError ? "text-red-400" : "text-zinc-600")} size={22} />
                    <span className={cn("text-[8px] font-black uppercase tracking-widest", receiptError ? "text-red-400" : "text-zinc-500")}>
                      Upload Receipt
                    </span>
                    <span className="text-[7px] text-zinc-600 mt-1">JPG, JPEG, PNG only</span>
                    <input
                      type="file"
                      className="hidden"
                      accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                      onChange={handleReceiptChange}
                    />
                  </label>
                ) : (
                  <div className="relative w-full mb-4 group">
                    <img src={screenshot} className="w-full h-36 object-cover rounded-2xl border border-white/10" alt="Receipt Preview" />
                    <button
                      onClick={() => { setScreenshot(null); setReceiptError(null); }}
                      className="absolute -top-2 -right-2 bg-red-600 rounded-full p-1.5 text-white shadow-lg hover:scale-110 transition-transform"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}

                {/* Receipt error */}
                {receiptError && (
                  <div className="flex items-center gap-1.5 text-red-400 text-[9px] font-bold uppercase tracking-widest mt-2 justify-center">
                    <AlertCircle size={10} /> {receiptError}
                  </div>
                )}

                <button
                  onClick={handleVerifyAndSubmit}
                  disabled={!screenshot || isUploading}
                  className={cn(
                    "w-full py-4 rounded-2xl font-black uppercase text-[10px] mt-4 transition-all",
                    !screenshot || isUploading
                      ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                      : "bg-orange-600 text-white hover:bg-orange-500 active:scale-[0.98] shadow-lg shadow-orange-600/20"
                  )}
                >
                  {isUploading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={14} className="animate-spin" /> Uploading Receipt...
                    </span>
                  ) : "Confirm & Submit"}
                </button>

                <button
                  onClick={() => { setShowQRModal(false); setScreenshot(null); setReceiptError(null); }}
                  className="w-full text-zinc-600 py-3 text-[8px] font-bold uppercase hover:text-white transition-colors mt-1"
                >
                  Cancel Transaction
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SUCCESS SCREEN ── */}
      {isSuccess && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-zinc-950 p-6 text-center">
          <div className="space-y-6">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12 }}>
              <CheckCircle2 className="text-orange-500 mx-auto" size={64} />
            </motion.div>
            <h2 className="text-4xl font-black uppercase text-white italic">
              Order <span className="text-orange-500">Submitted!</span>
            </h2>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
              We'll verify your payment and process your order shortly.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => router.push('/shop')}
                className="px-10 py-4 bg-white text-black rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-zinc-200 transition-all"
              >
                Back to Shop
              </button>
              <button
                onClick={() => router.push('/portal')}
                className="px-10 py-4 bg-orange-600 text-white rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-orange-500 transition-all shadow-lg shadow-orange-600/20"
              >
                Go to My Portal
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}