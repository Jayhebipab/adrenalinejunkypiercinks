"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    LayoutDashboard, Home, ChevronRight, Clock, Menu, X, 
    User, Star, Send, MessageSquare, Package, Calendar, UploadCloud 
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
    
    // --- REVIEW FORM STATES ---
    const [rating, setRating] = useState(5);
    const [desc, setDesc] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState("");
    const [loading, setLoading] = useState(false);

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
                alert("SUCCESS: Your review is live! Redirecting to overview...");
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
            <FloatingChatWidget/>
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
                    <NavItem icon={LayoutDashboard} label="Overview" active={activeTab === "overview"} onClick={() => {setActiveTab("overview"); setSidebarOpen(false);}} />
                    <NavItem icon={Calendar} label="Bookings" active={activeTab === "bookings"} onClick={() => {setActiveTab("bookings"); setSidebarOpen(false);}} />
                    <NavItem icon={Package} label="Orders" active={activeTab === "orders"} onClick={() => {setActiveTab("orders"); setSidebarOpen(false);}} />
                    <NavItem icon={MessageSquare} label="Write Review" active={activeTab === "review"} onClick={() => {setActiveTab("review"); setSidebarOpen(false);}} />
                </nav>

                {/* RETURN HOME BUTTON */}
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
                            <Menu size={24}/>
                        </button>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
                            <span>Portal</span> <ChevronRight size={14} /> <span className="text-white">{activeTab}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                        <div className="hidden sm:block">
                            <p className="text-[8px] font-black text-gray-500 uppercase leading-none">System Time</p>
                            <p className="text-[10px] font-mono text-[#d11a2a]">{formattedTime}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-right hidden md:block">
                                <p className="text-[10px] font-black uppercase tracking-tighter">{session?.user?.name || "Access Denied"}</p>
                                <p className="text-[8px] text-zinc-500 font-mono leading-none">{session?.user?.email}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-[#d11a2a]/10 border border-[#d11a2a]/20 overflow-hidden shadow-lg shadow-[#d11a2a]/10">
                                {session?.user?.image ? (
                                    <img src={session.user.image} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <User size={18} className="text-[#d11a2a] m-auto h-full" />
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 lg:p-10 custom-scrollbar">
                    <AnimatePresence mode="wait">
                        
                        {/* OVERVIEW */}
                        {activeTab === "overview" && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                                <h1 className="text-3xl lg:text-4xl font-black uppercase italic tracking-tighter">
                                    Welcome, <span className="text-[#d11a2a]">{session?.user?.name?.split(' ')[0] || "Master"}</span>
                                </h1>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <StatCard label="Account" value="Verified" trend="Authorized" />
                                    <StatCard label="Bookings" value="0" trend="No Active" />
                                    <StatCard label="Orders" value="0" trend="Shop History" />
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
                                                <img src={previewUrl} className="w-full h-full object-cover" />
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
                                        ${loading ? 'bg-zinc-800 text-zinc-500' : 'bg-[#d11a2a] text-white hover:bg-white hover:text-black hover:scale-[1.01] active:scale-[0.99]'}`}
                                    >
                                        {loading ? "UPLOADING..." : "POST REVIEW"} <Send size={14} />
                                    </button>
                                </div>
                            </motion.div>
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