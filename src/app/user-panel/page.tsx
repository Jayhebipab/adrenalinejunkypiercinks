"use client";

import Link from 'next/link'; // Siguraduhin na may import ka nito sa taas
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
    LayoutDashboard, Home, ChevronRight, Clock, Menu, X,
    User, Star, Send, MessageSquare, Package, Calendar, UploadCloud, ShoppingBag, Printer, Download, Eye, ShieldCheck
} from "lucide-react";
import { uploadToCloudinary } from "@/lib/cloudinary";
import FloatingChatWidget from "../components/chatbot";

export default function PortalPage() {
    const { data: session } = useSession();
    const router = useRouter();
    // --- UI STATES ---
    const [activeTab, setActiveTab] = useState("overview");
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    const receiptRef = useRef<HTMLDivElement>(null);

    const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
    const [showReceiptModal, setShowReceiptModal] = useState(false);

    // --- REVIEW FORM STATES ---
    const [rating, setRating] = useState(5);
    const [desc, setDesc] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState("");
    const [loading, setLoading] = useState(false);

    const [myBookings, setMyBookings] = useState<any[]>([]);
    const [myOrders, setMyOrders] = useState<any[]>([]);
    const [dataLoading, setDataLoading] = useState(false);

    useEffect(() => {
        if (session?.user?.email) {
            fetchUserData();
        }
    }, [session]);

    const fetchUserData = async () => {
        if (!session?.user?.email) return;

        setDataLoading(true);
        try {
            const [resBookings, resOrders] = await Promise.all([
                fetch(`/api/bookings?email=${encodeURIComponent(session.user.email)}`),
                fetch(`/api/orders?email=${encodeURIComponent(session.user.email)}`)
            ]);

            const bData = await resBookings.json();
            const oData = await resOrders.json();

            // --- DATA MAPPING LOGIC ---
            // Dito natin sisiguraduhin na kahit "preferredDate" ang nasa DB, "date" ang mababasa ng UI
            const formattedBookings = (Array.isArray(bData) ? bData : bData.bookings || []).map((b: any) => ({
                ...b,
                // Fallback mechanism para sa date at time
                date: b.date || b.preferredDate || "No Date",
                time: b.time || b.preferredTime || "No Time",
                displayStatus: b.status?.toUpperCase() || "PENDING"
            }));

            setMyBookings(formattedBookings);
            setMyOrders(Array.isArray(oData) ? oData : (oData.orders || []));
        } catch (err) {
            console.error("Portal Data Error:", err);
        } finally {
            setDataLoading(false);
        }
    };


    // --- SYSTEM CLOCK ---
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formattedTime = currentTime.toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
    });

    // --- FILE HANDLER ---
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    // --- SUBMIT REVIEW LOGIC ---
    const submitReview = async () => {
        if (!desc.trim()) return alert("Please share your experience, par!");

        setLoading(true);
        try {
            let finalImageUrl = "";
            if (selectedFile) {
                finalImageUrl = await uploadToCloudinary(selectedFile);
            }

            const res = await fetch("/api/reviews", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: session?.user?.name || "Anonymous User",
                    stars: rating,
                    description: desc,
                    userEmail: session?.user?.email,
                    userImage: session?.user?.image,
                    reviewImage: finalImageUrl
                }),
            });

            if (res.ok) {
                alert("SUCCESS: Your review is live!");
                setDesc("");
                setRating(5);
                setSelectedFile(null);
                setPreviewUrl("");
                setActiveTab("overview");
            }
        } catch (error: any) {
            alert(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white flex font-sans overflow-hidden relative">
            <FloatingChatWidget />

            {/* MOBILE OVERLAY */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setSidebarOpen(false)}
                        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[65] lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* SIDEBAR */}
            <aside className={`
                fixed lg:relative z-[70] h-screen transition-all duration-500 ease-in-out border-r border-white/5 bg-[#0a0a0a] flex flex-col
                ${isSidebarOpen ? "translate-x-0 w-72 shadow-2xl" : "-translate-x-full lg:translate-x-0 w-72"}
            `}>
                <div className="p-8 flex items-center justify-between">
                    <h2 className="font-black italic text-xl uppercase tracking-tighter">
                        JUNKY <span className="text-[#d11a2a]">PIERCINKS</span>
                    </h2>
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 text-gray-500 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4">
                    <NavItem icon={LayoutDashboard} label="Overview" active={activeTab === "overview"} onClick={() => { setActiveTab("overview"); setSidebarOpen(false); }} />
                    <NavItem icon={Calendar} label="Bookings" active={activeTab === "bookings"} onClick={() => { setActiveTab("bookings"); setSidebarOpen(false); }} />
                    <NavItem icon={Package} label="Orders" active={activeTab === "orders"} onClick={() => { setActiveTab("orders"); setSidebarOpen(false); }} />
                    <NavItem icon={MessageSquare} label="Write Review" active={activeTab === "review"} onClick={() => { setActiveTab("review"); setSidebarOpen(false); }} />
                </nav>

                <div className="p-6 border-t border-white/5">
                    <button
                        onClick={() => router.push('/')}
                        className="flex items-center gap-4 text-gray-500 hover:text-white w-full p-4 transition-all duration-300 hover:bg-white/5 rounded-2xl group"
                    >
                        <Home size={20} className="group-hover:-translate-y-0.5 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-left">Return Home</span>
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden w-full relative">
                <header className="h-20 border-b border-white/5 flex items-center justify-between px-6 lg:px-8 bg-[#0a0a0a]/40 backdrop-blur-xl shrink-0">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2.5 bg-[#d11a2a]/10 border border-[#d11a2a]/20 rounded-xl text-[#d11a2a]">
                            <Menu size={24} />
                        </button>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
                            <span>Portal</span> <ChevronRight size={14} /> <span className="text-white">{activeTab}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                        <div className="flex items-center gap-3">
                            <div className="text-right hidden md:block">
                                <p className="text-[10px] font-black uppercase tracking-tighter">{session?.user?.name || "Access Denied"}</p>
                                <p className="text-[8px] text-zinc-500 font-mono leading-none">{session?.user?.email}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-[#d11a2a]/10 border border-[#d11a2a]/20 overflow-hidden">
                                {session?.user?.image ? (
                                    <img src={session.user.image} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-zinc-900"><User size={18} className="text-[#d11a2a]" /></div>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 lg:p-10 custom-scrollbar">
                    <AnimatePresence mode="wait">

{/* OVERVIEW */}
{activeTab === "overview" && (
    <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="space-y-10"
    >
        {/* HERO SECTION */}
        <div className="relative">
            <h1 className="text-4xl lg:text-5xl font-[1000] uppercase italic tracking-[-0.05em] leading-none">
                WELCOME back, <br />
                <span className="text-[#d11a2a] drop-shadow-[0_0_15px_rgba(209,26,42,0.3)]">
                    {session?.user?.name?.split(' ')[0] || "Master"}
                </span>
            </h1>
        </div>

        {/* STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Account Status Card */}
            <div className="group relative overflow-hidden bg-zinc-900/50 backdrop-blur-md border border-white/5 p-6 rounded-[2.5rem] transition-all hover:border-[#d11a2a]/50">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 group-hover:text-[#d11a2a] transition-all">
                    <ShieldCheck size={40} />
                </div>
                <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-1">Security</p>
                <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">Verified</h3>
                <div className="mt-4 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-[9px] font-bold text-zinc-400 uppercase">Authorized Access</span>
                </div>
            </div>

            {/* Active Bookings Card */}
            <div className="group relative overflow-hidden bg-zinc-900/50 backdrop-blur-md border border-white/5 p-6 rounded-[2.5rem] transition-all hover:border-[#d11a2a]/50">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 group-hover:text-[#d11a2a] transition-all">
                    <Calendar size={40} />
                </div>
                <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-1">Active Sessions</p>
                <h3 className="text-4xl font-black italic tracking-tighter text-white">
                    {dataLoading ? "..." : myBookings.length.toString().padStart(2, '0')}
                </h3>
                <p className="mt-4 text-[9px] font-bold text-[#d11a2a] uppercase tracking-tighter">
                    {myBookings.length > 0 ? "⚡ Sessions in progress" : "No scheduled sessions"}
                </p>
            </div>

            {/* Shop Orders Card */}
            <div className="group relative overflow-hidden bg-black border border-white/5 p-6 rounded-[2.5rem] transition-all hover:border-[#d11a2a]/50">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 group-hover:text-[#d11a2a] transition-all">
                    <ShoppingBag size={40} />
                </div>
                <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-1">Total Orders</p>
                <h3 className="text-4xl font-black italic tracking-tighter text-white">
                    {dataLoading ? "..." : myOrders.length.toString().padStart(2, '0')}
                </h3>
                <p className="mt-4 text-[9px] font-bold text-zinc-400 uppercase tracking-tighter underline underline-offset-4 decoration-[#d11a2a]">
                    View purchase history
                </p>
            </div>
        </div>

{/* QUICK ACTION / TIP SECTION */}
<div className="bg-gradient-to-r from-zinc-900 to-black border border-white/5 p-8 rounded-[3rem] flex flex-col lg:flex-row items-center justify-between gap-6 overflow-hidden relative group">
    {/* Subtle Glow Effect on Hover */}
    <div className="absolute -inset-full bg-gradient-to-r from-transparent via-[#d11a2a]/5 to-transparent -skew-x-12 group-hover:animate-[shimmer_2s_infinite] pointer-events-none" />

    <div className="space-y-1 relative z-10">
        <h4 className="text-xl font-black italic uppercase text-white tracking-tighter">
            Need a new <span className="text-[#d11a2a]">piercing?</span>
        </h4>
    </div>

    <Link href="/book" className="w-full lg:w-auto relative z-10">
        <button className="w-full lg:w-auto bg-white text-black px-10 py-4 rounded-2xl text-[11px] font-[1000] uppercase tracking-widest hover:bg-[#d11a2a] hover:text-white transition-all active:scale-95 shadow-[0_20px_40px_rgba(0,0,0,0.4)] group-hover:shadow-[#d11a2a]/20 cursor-pointer">
            Book Session Now
        </button>
    </Link>
</div>
    </motion.div>
)}

                        {/* BOOKINGS TAB */}
                        {activeTab === "bookings" && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <h2 className="text-2xl font-black uppercase italic text-[#d11a2a]">My Appointments</h2>
                                       
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[20px] font-black italic">{myBookings.length}</p>
                                        <p className="text-[8px] text-zinc-500 uppercase font-bold">Total Sessions</p>
                                    </div>
                                </div>

                                <div className="grid gap-8">
                                    {dataLoading ? (
                                        <div className="animate-pulse space-y-4">
                                            {[1, 2].map(i => (
                                                <div key={i} className="h-64 bg-white/5 rounded-[40px] border border-white/10" />
                                            ))}
                                        </div>
                                    ) : myBookings.length > 0 ? myBookings.map((b) => (
                                        <div
                                            key={b.id}
                                            id={`receipt-booking-${b.id}`}
                                            className="bg-[#0a0a0a] border border-white/10 rounded-[40px] overflow-hidden p-8 relative shadow-2xl"
                                        >
                                            {/* RECEIPT HEADER */}
                                            <div className="flex justify-between items-start mb-8 border-b border-white/5 pb-8">
                                                <div>
                                                    <h1 className="text-2xl font-black uppercase italic text-white leading-none">JUNKY PIERCINKS</h1>
                                                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-2">Appointment Receipt</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className={`text-[10px] font-black px-4 py-1.5 rounded-full border ${b.status === 'finished' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-orange-500/10 text-orange-500 border-orange-500/20'
                                                        } uppercase`}>
                                                        {b.displayStatus || b.status}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* CUSTOMER & APPOINTMENT INFO */}
                                            <div className="grid grid-cols-2 gap-8 mb-10">
                                                <div>
                                                    <p className="text-[8px] text-zinc-500 font-black uppercase mb-1 tracking-tighter">Billed To</p>
                                                    <p className="text-xs font-bold text-white uppercase">{b.customer_name || 'Valued Client'}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[8px] text-zinc-500 font-black uppercase mb-1 tracking-tighter">Booking Ref</p>
                                                    <p className="text-xs font-mono font-bold text-white">#{b.id.toUpperCase().slice(-8)}</p>
                                                </div>
                                            </div>

                                            {/* SERVICE BREAKDOWN */}
                                            <div className="space-y-4 mb-10">
                                                <p className="text-[8px] text-zinc-500 font-black uppercase border-b border-white/5 pb-2">Session Details</p>
                                                <div className="flex justify-between items-center group">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-zinc-900 rounded-2xl border border-white/5 overflow-hidden">
                                                            {b.serviceImage || b.imageUrl ? (
                                                                <img src={b.serviceImage || b.imageUrl} className="w-full h-full object-cover" alt="Service" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-zinc-700"><Package size={20} /></div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black uppercase text-white leading-none">{b.service}</p>
                                                            <p className="text-[10px] text-zinc-500 font-bold mt-1 uppercase italic">Artist: {b.artist || "Assigning..."}</p>
                                                        </div>
                                                    </div>
<div className="flex flex-col gap-0.5">
    {/* Format: Month Day, Year */}
    <p className="text-[11px] font-bold text-white tracking-tight">
        {new Date(b.date).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        })}
    </p>
    {/* Format: Time (e.g., 2:30 PM) */}
    <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest">
        {b.time}
    </p>
</div>
                                                </div>
                                            </div>

                                            {/* TOTAL SECTION (No VAT) */}
                                            <div className="flex justify-between items-end pt-8 border-t border-white/5">
                                                <div>
                                                    <p className="text-[8px] text-zinc-500 font-black uppercase mb-1">Total Investment</p>
                                                    <p className="text-4xl font-black italic text-[#d11a2a]">₱{(Number(b.finalPrice || b.price || 0)).toLocaleString()}</p>
                                                </div>

                                                {/* CONDITIONAL BUTTON: View lang if finished */}
                                                <div className="flex items-center gap-3">
                                                    {b.status === 'finished' ? (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedReceipt(b);
                                                                setShowReceiptModal(true);
                                                            }}
                                                            className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-2xl text-[10px] font-black uppercase hover:bg-[#d11a2a] hover:text-white transition-all shadow-xl active:scale-95"
                                                        >
                                                            <Eye size={14} /> View Receipt
                                                        </button>
                                                    ) : (
                                                        <div className="flex items-center gap-2 bg-zinc-900/50 text-zinc-600 px-6 py-3 rounded-2xl text-[10px] font-black uppercase border border-white/5 cursor-not-allowed">
                                                            <Clock size={14} /> Ongoing Session
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <p className="text-[7px] text-zinc-700 font-bold uppercase mt-8 text-center tracking-[0.3em]">
                                                Respect the process. Wear it with pride.
                                            </p>
                                        </div>
                                    )) : (
                                        <div className="bg-white/5 border border-dashed border-white/10 p-20 rounded-[40px] text-center">
                                            <p className="text-zinc-500 uppercase text-[10px] font-black tracking-widest mb-4">You have no appointments yet.</p>
                                            <button onClick={() => router.push('/services')} className="text-[#d11a2a] text-[10px] font-black uppercase hover:underline">
                                                Book your first session now
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                        {/* ORDERS TAB */}
                        {activeTab === "orders" && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-2xl font-black uppercase italic text-[#d11a2a]">Shop History</h2>
                                </div>

<div className="grid gap-8">
    {dataLoading ? (
        <div className="animate-pulse space-y-4">
            {[1, 2].map(i => (
                <div key={i} className="h-64 bg-white/5 rounded-[40px] border border-white/10" />
            ))}
        </div>
    ) : myOrders.length > 0 ? myOrders.map((o) => (
                                        <div
                                            key={o.id}
                                            id={`receipt-${o.id}`}
                                            className="bg-[#0a0a0a] border border-white/10 rounded-[40px] overflow-hidden p-8 relative shadow-2xl"
                                        >
                                            {/* RECEIPT HEADER */}
                                            <div className="flex justify-between items-start mb-8 border-b border-white/5 pb-8">
                                                <div>
                                                    <h1 className="text-2xl font-black uppercase italic text-white leading-none">JUNKY PIERCINKS</h1>
                                                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-2">Official Digital Receipt</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className={`text-[10px] font-black px-4 py-1.5 rounded-full border ${o.status === 'Finished' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-orange-500/10 text-orange-500 border-orange-500/20'
                                                        } uppercase`}>
                                                        {o.status}
                                                    </span>
                                                </div>
                                            </div>

                                          {/* CUSTOMER & ORDER INFO */}
<div className="grid grid-cols-2 gap-8 mb-6">
    <div>
        <p className="text-[8px] text-zinc-500 font-black uppercase mb-1 tracking-tighter">Billed To</p>
        <p className="text-xs font-bold text-white uppercase leading-none">{o.customer_name || 'Valued Client'}</p>
        
        {/* DATE & TIME ADDED HERE PARA MALINIS */}
<div className="mt-3 flex flex-col gap-0.5">
    <p className="text-[10px] font-bold text-white tracking-tight">
        {o.createdAt?.seconds 
            ? new Date(o.createdAt.seconds * 1000).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
            }) 
            : (o.date ? new Date(o.date).toLocaleDateString() : 'NO DATE')}
    </p>
    <p className="text-zinc-500 text-[8px] font-bold uppercase tracking-widest">
        {o.createdAt?.seconds 
            ? new Date(o.createdAt.seconds * 1000).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })
            : (o.time || '00:00')}
    </p>
</div>
    </div>
    
    <div className="text-right flex flex-col justify-between">
        <div>
            <p className="text-[8px] text-zinc-500 font-black uppercase mb-1 tracking-tighter">Order Ref</p>
            <p className="text-xs font-mono font-bold text-white">#{o.id.toUpperCase().slice(-8)}</p>
        </div>
        
        {/* Badge para sa Status */}
        <div className="mt-auto">
            <span className="text-[7px] bg-white/5 border border-white/10 px-2 py-1 rounded-md text-zinc-400 font-black uppercase tracking-tighter">
                {o.payment_method || 'Online'}
            </span>
        </div>
    </div>
</div>

{/* ITEM BREAKDOWN */}
<div className="space-y-4 mb-6">
    <p className="text-[8px] text-zinc-500 font-black uppercase border-b border-white/5 pb-2">Purchased Items</p>
    {o.items?.map((item: any, i: number) => {
        const itemPrice = Number(item.cost_price || 0);
        const itemQty = Number(item.quantity || 0);

        return (
            <div key={i} className="flex justify-between items-center group">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-zinc-900 rounded-xl border border-white/5 flex items-center justify-center text-[10px] font-black">
                        {itemQty}x
                    </div>
                    <div>
                        <p className="text-sm font-black uppercase text-white leading-none">{item.name}</p>
                        <p className="text-[10px] text-zinc-500 font-bold mt-1">₱{itemPrice.toLocaleString()} each</p>
                    </div>
                </div>
                <p className="text-sm font-black italic text-white">₱{(itemQty * itemPrice).toLocaleString()}</p>
            </div>
        )
    })}
</div>

                                            {/* TAX & TOTAL SECTION */}
                                            <div className="pt-6 border-t border-white/5 space-y-2 mb-8">
                                                <div className="flex justify-between text-[10px] font-bold uppercase text-zinc-500">

                                                </div>
                                                <div className="flex justify-between items-end pt-2">
                                                    <p className="text-[8px] text-zinc-500 font-black uppercase">Total Amount</p>
                                                    <p className="text-3xl font-black italic text-[#d11a2a]">₱{(o.total_amount || 0).toLocaleString()}</p>
                                                </div>
                                            </div>

                                            <div className="flex justify-center pt-4">
                                                {o.status === 'Finished' ? (
                                                    /* Lilitaw lang itong button kung Finished na ang status */
                                                    <button
                                                        onClick={() => {
                                                            setSelectedReceipt(o);
                                                            setShowReceiptModal(true);
                                                        }}
                                                        className="flex items-center gap-2 bg-white text-black px-8 py-3 rounded-2xl text-[10px] font-black uppercase hover:bg-[#d11a2a] hover:text-white transition-all shadow-xl active:scale-95"
                                                    >
                                                        <Eye size={14} /> View Receipt
                                                    </button>
                                                ) : (
                                                    /* Optional: Placeholder button para alam ng user na kailangan muna matapos */
                                                    <div className="flex items-center gap-2 bg-zinc-900/50 text-zinc-600 px-8 py-3 rounded-2xl text-[10px] font-black uppercase border border-white/5 cursor-not-allowed">
                                                        <Clock size={14} /> Receipt Available after Finish
                                                    </div>
                                                )}
                                            </div>

                                            <p className="text-[7px] text-zinc-700 font-bold uppercase mt-8 text-center tracking-[0.3em]">
                                                Thank you for being part of the culture.
                                            </p>
                                        </div>
                                    )) : (
                                        <div className="text-center py-20 bg-white/5 rounded-[40px] border border-dashed border-white/10">
                                            <p className="text-zinc-500 uppercase text-[10px] font-black tracking-widest">You have no orders yet.</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* REVIEW SECTION */}
                        {activeTab === "review" && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto lg:mx-0">
                                <h2 className="text-2xl font-black uppercase italic text-[#d11a2a] mb-6">Post a Review</h2>
                                <div className="bg-white/5 border border-white/10 p-8 lg:p-10 rounded-[40px] space-y-8 shadow-2xl shadow-black">
                                    <div className="flex gap-3">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <Star key={s} size={32} onClick={() => setRating(s)} className={`cursor-pointer transition-all ${s <= rating ? "fill-yellow-400 text-yellow-400 scale-110" : "text-zinc-800"}`} />
                                        ))}
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase text-zinc-500 ml-1">Upload Your Ink / Piercing</label>
                                        <div
                                            onClick={() => document.getElementById('file-upload')?.click()}
                                            className="relative aspect-video rounded-3xl border-2 border-dashed border-white/10 flex items-center justify-center cursor-pointer hover:bg-white/5 overflow-hidden transition-colors bg-black/20"
                                        >
                                            {previewUrl ? (
                                                <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
                                            ) : (
                                                <div className="text-center">
                                                    <UploadCloud className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                                                    <p className="text-[10px] font-bold uppercase text-zinc-500">Select Image</p>
                                                </div>
                                            )}
                                        </div>
                                        <input id="file-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                    </div>

                                    <textarea
                                        value={desc} onChange={(e) => setDesc(e.target.value)}
                                        placeholder="TELL THE WORLD ABOUT YOUR EXPERIENCE..."
                                        className="w-full bg-black/40 border border-white/10 rounded-[30px] p-6 text-sm font-bold uppercase text-white min-h-[150px] outline-none focus:border-[#d11a2a] transition-all"
                                    />

                                    <button
                                        onClick={submitReview} disabled={loading}
                                        className={`w-full py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 
                                        ${loading ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-[#d11a2a] text-white hover:bg-white hover:text-black hover:scale-[1.01] active:scale-[0.99]'}`}
                                    >
                                        {loading ? "UPLOADING..." : "POST REVIEW"} <Send size={14} />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    {/* RECEIPT PREVIEW MODAL */}
                    <AnimatePresence>
                        {showReceiptModal && selectedReceipt && (
                            <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 overflow-y-auto">
                                <div className="w-full max-w-[380px] my-auto">
                                    <motion.div
                                        /* DITO KUKUHA NG PICTURE YUNG DOWNLOAD FUNCTION */
                                        ref={receiptRef}
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.9, opacity: 0 }}
                                        className="bg-white text-black rounded-[2rem] overflow-hidden shadow-2xl relative"
                                    >
                                        {/* Paper Effect Top */}
                                        <div className="bg-zinc-100 p-8 text-center border-b border-dashed border-zinc-300 relative">
                                            <div className="absolute -bottom-3 left-0 right-0 flex justify-around px-2">
                                                {[...Array(15)].map((_, i) => (
                                                    <div key={i} className="w-3 h-3 bg-white rounded-full" />
                                                ))}
                                            </div>
                                            <h1 className="text-2xl font-black italic tracking-tighter mb-1">JUNKY PIERCINKS</h1>
                                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">
                                                {selectedReceipt.items ? 'Official Shop Receipt' : 'Appointment Receipt'}
                                            </p>
                                        </div>

                                        <div className="p-8 space-y-6">
                                            {/* Header Details */}
{/* Header Details */}
<div className="flex justify-between text-[10px] font-bold uppercase text-zinc-400">
    <div className="flex flex-col">
        <span className="text-[8px] text-zinc-300">Reference No.</span>
        <span className="text-black font-black">#{selectedReceipt.id.toUpperCase().slice(-8)}</span>
    </div>
<div className="flex flex-col text-right">
    <span className="text-[8px] text-zinc-300">Issued On</span>
    <span className="text-black font-black">
        {(() => {
            // 1. Check kung Firestore Timestamp
            if (selectedReceipt.createdAt?.seconds) {
                return new Date(selectedReceipt.createdAt.seconds * 1000).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric'
                });
            }
            // 2. Check kung ISO String o regular date string (ito yung fix sa screenshot mo)
            if (selectedReceipt.date) {
                const dateObj = new Date(selectedReceipt.date);
                // I-check kung valid date yung na-parse
                return isNaN(dateObj.getTime()) 
                    ? selectedReceipt.date 
                    : dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            }
            return 'RECENT';
        })()}
    </span>
</div>
</div>

                                            {/* DYNAMIC CONTENT SECTION */}
                                            <div className="space-y-4">
                                                {selectedReceipt.items ? (
                                                    selectedReceipt.items.map((item: any, i: number) => {
                                                        const price = Number(item.cost_price || 0);
                                                        const qty = Number(item.quantity || 1);
                                                        return (
                                                            <div key={i} className="flex justify-between items-start">
                                                                <div className="flex-1">
                                                                    <p className="text-xs font-black uppercase text-black">{item.name}</p>
                                                                    <p className="text-[10px] text-zinc-500 font-bold italic">Qty: {qty} x ₱{price.toLocaleString()}</p>
                                                                </div>
                                                                <p className="text-xs font-black text-black">₱{(price * qty).toLocaleString()}</p>
                                                            </div>
                                                        );
                                                    })
                                                ) : (
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-1">
                                                            <p className="text-xs font-black uppercase text-black">{selectedReceipt.service}</p>
                                                            <p className="text-[10px] text-zinc-500 font-bold uppercase italic">Artist: {selectedReceipt.artist || 'TBA'}</p>
                                                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">
    {selectedReceipt.time ? selectedReceipt.time : 'No Time Set'}
</p>
                                                        </div>
                                                        <p className="text-xs font-black text-black">
                                                            ₱{(Number(selectedReceipt.finalPrice || selectedReceipt.price || 0)).toLocaleString()}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* TOTALS SECTION */}
                                            <div className="pt-6 border-t border-dashed border-zinc-200 space-y-2">
                                                {selectedReceipt.items && selectedReceipt.vat_deduction > 0 && (
                                                    <div className="flex justify-between text-[10px] font-bold uppercase text-zinc-400">
                                                        <span>VAT ({selectedReceipt.vat_percentage || 0}%)</span>
                                                        <span className="text-black">
  ₱{(Math.floor(Number(selectedReceipt.vat_deduction) * 100) / 100).toLocaleString('en-US', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}
</span>
                                                    </div>
                                                )}

                                                <div className="flex justify-between items-end pt-2">
                                                    <span className="text-xs font-black uppercase text-black">Total Amount</span>
                                                    <span className="text-2xl font-black italic text-[#d11a2a]">
                                                        ₱{(Number(selectedReceipt.total_amount || selectedReceipt.finalPrice || selectedReceipt.price || 0)).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Status Badge */}
                                            <div className="pt-4 flex justify-center">
                                                <div className="bg-black text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest">
                                                    {selectedReceipt.items ? `Paid via ${selectedReceipt.payment_method || 'Online'}` : `Status: ${selectedReceipt.paymentStatus || 'Finished'}`}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>

                                    {/* ACTION BUTTONS - NASA LABAS NG REF PARA HINDI KASAMA SA DOWNLOAD IMAGE */}
                                    <div className="mt-4 flex gap-2">
                                        <button
                                            onClick={() => setShowReceiptModal(false)}
                                            className="flex-1 bg-white/10 text-white py-4 rounded-2xl text-[10px] font-black uppercase backdrop-blur-md active:scale-95 transition-all"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}

// --- SHARED COMPONENTS ---
function NavItem({ icon: Icon, label, active, onClick }: any) {
    return (
        <button onClick={onClick} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all group relative ${active ? "bg-[#d11a2a] text-white shadow-lg shadow-[#d11a2a]/20" : "text-gray-500 hover:bg-white/5 hover:text-white"}`}>
            <Icon size={20} className="shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
            {active && <motion.div layoutId="navIndicator" className="absolute left-0 w-1 h-6 bg-white rounded-r-full" />}
        </button>
    );
}

function StatCard({ label, value, trend }: any) {
    return (
        <div className="bg-white/5 border border-white/10 p-8 rounded-[40px] hover:border-white/20 transition-all group">
            <p className="text-[9px] font-black uppercase text-gray-500 tracking-widest mb-4">{label}</p>
            <div className="text-2xl font-black italic uppercase tracking-tighter group-hover:text-[#d11a2a] transition-colors">{value}</div>
            <div className="mt-2 text-[9px] font-bold text-[#d11a2a] uppercase flex items-center gap-2"><Clock size={10} /> {trend}</div>
        </div>
    );
}


function DetailItem({ icon: Icon, label, value }: any) {
    return (
        <div>
            <p className="text-[7px] text-zinc-600 uppercase font-black mb-1 flex items-center gap-1">
                <Icon size={8} /> {label}
            </p>
            <p className="text-[10px] font-bold uppercase truncate">{value}</p>
        </div>
    );
}
