"use client";

import { useState, useEffect, useMemo } from "react";
import { 
    Trash2, Eye, EyeOff, Star, User, 
    Search, MessageSquare, Loader2, Image as ImageIcon 
} from "lucide-react";
import { Toaster, toast } from "sonner";
import { cn } from "@/lib/utils";

interface Review {
    id: string;
    name: string;
    stars: number;
    description: string;
    userImage?: string;
    reviewImage?: string;
    isVisible: boolean;
    createdAt?: any;
}

export default function ReviewsPanel() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [fetching, setFetching] = useState(true);
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState<"all" | "visible" | "hidden">("all");

    useEffect(() => { fetchReviews(); }, []);

    const fetchReviews = async () => {
        setFetching(true);
        try {
            const res = await fetch("/api/reviews");
            const data = await res.json();
            if (Array.isArray(data)) setReviews(data);
        } catch (err) {
            toast.error("Failed to load reviews from database.");
        } finally { setFetching(false); }
    };

    const toggleVisibility = async (e: React.MouseEvent, id: string, currentStatus: boolean) => {
        e.stopPropagation();
        try {
            const res = await fetch("/api/reviews", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, isVisible: !currentStatus }),
            });
            if (res.ok) {
                toast.info(currentStatus ? "Review Hidden" : "Review Published");
                fetchReviews();
            }
        } catch (err) {
            toast.error("Visibility sync failed.");
        }
    };

    const deleteReview = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm("Permanently delete this review?")) return;
        try {
            const res = await fetch("/api/reviews", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });
            if (res.ok) {
                toast.error("Review deleted permanently");
                fetchReviews();
            }
        } catch (err) {
            toast.error("Delete operation failed.");
        }
    };

    const filteredReviews = useMemo(() => {
        return reviews.filter(rev => {
            const matchesSearch = rev.name.toLowerCase().includes(search.toLowerCase()) || 
                                 rev.description.toLowerCase().includes(search.toLowerCase());
            const matchesTab = activeTab === "all" ? true : 
                              activeTab === "visible" ? rev.isVisible : !rev.isVisible;
            return matchesSearch && matchesTab;
        });
    }, [reviews, search, activeTab]);

    return (
        <div className="min-h-screen p-4 md:p-8 text-slate-900 dark:text-white">
            <Toaster position="top-right" richColors />
            
            <div className="max-w-5xl mx-auto">
                {/* HEADER */}
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-4xl font-black uppercase italic tracking-tighter">Client Feed</h1>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">
                            Testimonials & Media Moderation
                        </p>
                    </div>
                </div>

                {/* FILTERS SECTION */}
                <div className="space-y-4 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="text"
                                placeholder="SEARCH REVIEWS OR CUSTOMERS..."
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-12 pr-5 py-4 bg-slate-50 dark:bg-zinc-900 border border-transparent dark:border-zinc-800 rounded-2xl text-[11px] font-bold uppercase tracking-widest outline-none focus:bg-white dark:focus:bg-zinc-800 focus:border-black dark:focus:border-white transition-all"
                            />
                        </div>
                        <div className="flex bg-slate-50 dark:bg-zinc-900 p-1.5 rounded-2xl gap-1 border border-transparent dark:border-zinc-800">
                            {(["all", "visible", "hidden"] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={cn(
                                        "flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                                        activeTab === tab 
                                            ? "bg-black text-white dark:bg-white dark:text-black shadow-lg" 
                                            : "text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300"
                                    )}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* LIST SECTION */}
                <div className="space-y-4">
                    {fetching ? (
                        <div className="text-center py-20"><Loader2 className="animate-spin mx-auto text-slate-200" size={32} /></div>
                    ) : filteredReviews.length === 0 ? (
                        <div className="text-center py-20 bg-slate-50 dark:bg-zinc-900 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-zinc-800">
                            <p className="text-[11px] font-black uppercase text-slate-400 tracking-widest">No reviews found in logs</p>
                        </div>
                    ) : filteredReviews.map((rev) => (
                        <div 
                            key={rev.id}
                            className={cn(
                                "bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-zinc-800 flex flex-col md:flex-row gap-8 hover:shadow-2xl hover:shadow-slate-200/50 dark:hover:shadow-black/60 transition-all group relative overflow-hidden",
                                !rev.isVisible && "opacity-60 grayscale-[0.8]"
                            )}
                        >
                            {/* USER INFO & CONTENT */}
                            <div className="flex-1 space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center border bg-slate-50 border-slate-200 dark:bg-zinc-800 dark:border-zinc-700 overflow-hidden shrink-0 shadow-inner">
                                        {rev.userImage ? (
                                            <img src={rev.userImage} className="w-full h-full object-cover" alt="" />
                                        ) : (
                                            <User size={20} className="text-slate-400" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black uppercase tracking-tight flex items-center gap-2 text-black dark:text-white">
                                            {rev.name}
                                            {rev.isVisible && <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />}
                                        </h3>
                                        <div className="flex text-yellow-500 gap-0.5">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} size={10} fill={i < rev.stars ? "currentColor" : "none"} className={i < rev.stars ? "" : "text-slate-200 dark:text-zinc-800"} />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <p className="text-[13px] text-slate-500 dark:text-zinc-400 font-medium leading-relaxed italic pr-4">
                                    "{rev.description}"
                                </p>

                                {/* ACTIONS (MOVED TO BOTTOM FOR CLEANER MOBILE LOOK) */}
                                <div className="flex items-center gap-2 pt-2">
                                    <button 
                                        onClick={(e) => toggleVisibility(e, rev.id, rev.isVisible)}
                                        className="bg-slate-50 dark:bg-zinc-800 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all border border-slate-200 dark:border-zinc-700"
                                    >
                                        {rev.isVisible ? <><EyeOff size={12}/> Hide</> : <><Eye size={12}/> Publish</>}
                                    </button>
                                    <button 
                                        onClick={(e) => deleteReview(e, rev.id)}
                                        className="p-2.5 text-slate-300 hover:text-red-500 transition-all ml-auto group-hover:opacity-100 opacity-0"
                                    >
                                        <Trash2 size={18}/>
                                    </button>
                                </div>
                            </div>

                            {/* ATTACHED MEDIA - The Right Column for the Image */}
                            {rev.reviewImage && (
                                <div className="w-full md:w-64 h-48 md:h-auto rounded-3xl overflow-hidden bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 relative group/media shrink-0 shadow-lg">
                                    <img 
                                        src={rev.reviewImage} 
                                        alt="Tattoo Work" 
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover/media:opacity-100 transition-opacity flex items-end p-4">
                                        <span className="text-[8px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                                            <ImageIcon size={12} className="text-[#d11a2a]" /> Artist Work
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}