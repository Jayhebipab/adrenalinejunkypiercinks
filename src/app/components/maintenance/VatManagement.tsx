"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { 
    Edit3, RotateCcw, X, Loader2, Percent, Calculator, Plus, Sparkles, ShieldCheck 
} from "lucide-react"
import { Toaster, toast } from "sonner"

interface VatRecord {
    id: string; // Firebase ID
    percentage: number;
    vat_name?: string;
}

export default function VatManagement() {
    const [vatRecord, setVatRecord] = useState<VatRecord | null>(null);
    const [fetching, setFetching] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newPercentage, setNewPercentage] = useState<number>(1);
    const [vatName, setVatName] = useState("Standard VAT");

    const fetchVat = async () => {
        setFetching(true);
        try {
            // Siguraduhing tama ang API path (lowercase or uppercase depende sa file mo)
            const res = await fetch("/api/VAT"); 
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                setVatRecord(data[0]);
                setNewPercentage(data[0].percentage);
                setVatName(data[0].vat_name || "Standard VAT");
            } else {
                setVatRecord(null);
            }
        } catch (err) {
            toast.error("Connection to Matrix Failed");
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => { fetchVat(); }, []);

    const handleAction = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (newPercentage < 1 || newPercentage > 99) {
            return toast.error("Invalid Range: 1% to 99% only");
        }

        const method = vatRecord ? "PUT" : "POST";
        const body = vatRecord 
            ? { id: vatRecord.id, percentage: newPercentage, vat_name: vatName }
            : { percentage: newPercentage, vat_name: vatName };

        toast.promise(async () => {
            const res = await fetch(`/api/VAT`, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            
            const result = await res.json();
            if (!res.ok) throw new Error(result.error || "Action failed");
            
            setIsModalOpen(false);
            fetchVat();
        }, {
            loading: 'Syncing Tax Protocols...',
            success: vatRecord ? 'Tax Matrix Updated!' : 'Initial VAT Established!',
            error: (err) => err.message,
        });
    };

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8 min-h-screen text-black italic font-sans">
            <Toaster position="top-center" richColors />

            {/* HEADER - SAME AS USER MANAGEMENT */}
            <header className="flex flex-col md:flex-row justify-between items-center bg-zinc-900 p-8 rounded-[2.5rem] text-white shadow-2xl gap-6">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-white rounded-3xl -rotate-6 shadow-xl text-black">
                        <Calculator size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black uppercase italic tracking-tighter leading-none">VAT Protocol</h1>
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic mt-1">Global Tax Configuration v3.0</p>
                    </div>
                </div>
                <Button 
                    onClick={() => fetchVat()} 
                    className="bg-zinc-800 text-zinc-400 hover:text-white rounded-2xl h-14 w-14 p-0 border border-white/5 shadow-xl transition-all active:scale-90"
                >
                    <RotateCcw className={fetching ? "animate-spin" : ""} />
                </Button>
            </header>

            {/* MAIN CARD */}
            <div className="relative overflow-hidden bg-white border border-zinc-100 rounded-[3rem] shadow-sm p-8 md:p-16 text-center">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none">
                    <Percent size={200} strokeWidth={8} />
                </div>

                {fetching ? (
                    <div className="py-20 flex flex-col items-center gap-4">
                        <Loader2 className="animate-spin w-12 h-12 text-zinc-900" />
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Scanning Database...</p>
                    </div>
                ) : vatRecord ? (
                    <div className="space-y-8 relative z-10">
                        <div className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100 animate-pulse">
                            <ShieldCheck size={12} /> Active System Tax
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">{vatRecord.vat_name || "Standard VAT"}</h2>
                            <div className="flex items-center justify-center gap-2">
                                <span className="text-8xl md:text-[7rem] font-black text-zinc-900 tracking-tighter leading-none">
                                    {vatRecord.percentage}
                                </span>
                                <div className="flex flex-col items-start">
                                    <Percent size={40} className="text-zinc-900" strokeWidth={4} />
                                    <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Rate</span>
                                </div>
                            </div>
                        </div>

                        <Button 
                            onClick={() => {
                                setNewPercentage(vatRecord.percentage);
                                setIsModalOpen(true);
                            }}
                            className="bg-black text-white hover:bg-zinc-800 rounded-3xl h-15 px-12 font-black uppercase text-xs tracking-[0.2em] shadow-2xl transition-all active:scale-95 group"
                        >
                            <Edit3 className="w-4 h-4 mr-3 group-hover:rotate-12 transition-transform" /> 
                            Modify Rate Matrix
                        </Button>
                    </div>
                ) : (
                    <div className="py-20 space-y-6">
                        <div className="w-24 h-24 bg-zinc-50 rounded-[2rem] flex items-center justify-center mx-auto border-2 border-dashed border-zinc-200">
                            <Plus className="text-zinc-300 w-10 h-10" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-black uppercase italic text-zinc-900 text-2xl tracking-tighter">No Protocol Found</h3>
                            <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Initialize global tax percentage</p>
                        </div>
                        <Button 
                            onClick={() => {
                                setNewPercentage(1);
                                setIsModalOpen(true);
                            }}
                            className="bg-black text-white hover:bg-zinc-800 rounded-2xl h-16 px-10 font-black uppercase text-xs tracking-widest shadow-xl"
                        >
                            Initialize System
                        </Button>
                    </div>
                )}
            </div>

            {/* MODAL - SAME AS USER MANAGEMENT AESTHETIC */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md p-10 space-y-8 animate-in zoom-in duration-300">
                        <div className="text-center space-y-2">
                            <div className="mx-auto w-16 h-16 bg-zinc-900 text-white rounded-2xl flex items-center justify-center -rotate-6 shadow-2xl mb-4">
                                <Sparkles />
                            </div>
                            <h2 className="text-3xl font-black tracking-tighter uppercase italic">
                                {vatRecord ? "Adjust Tax" : "Setup Tax"}
                            </h2>
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Global Matrix Override</p>
                        </div>
                        
                        <form onSubmit={handleAction} className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase text-zinc-400 ml-2 tracking-widest">Protocol Name</label>
                                    <input 
                                        type="text"
                                        className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 outline-none font-bold text-sm focus:ring-2 ring-black transition-all"
                                        value={vatName}
                                        onChange={(e) => setVatName(e.target.value)}
                                        placeholder="e.g. Standard VAT"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase text-zinc-400 ml-2 tracking-widest text-center block">Tax Percentage (%)</label>
                                    <div className="relative">
                                        <input 
                                            required 
                                            type="number" 
                                            min="1"
                                            max="99"
                                            autoFocus
                                            className="w-full bg-zinc-900 text-white rounded-[2rem] px-4 py-10 outline-none text-6xl font-black text-center tracking-tighter" 
                                            value={newPercentage} 
                                            onChange={(e) => setNewPercentage(parseInt(e.target.value) || 0)} 
                                        />
                                        <Percent className="absolute right-8 top-1/2 -translate-y-1/2 text-white/20" size={40} />
                                    </div>
                                    <p className="text-[8px] text-zinc-400 font-black uppercase mt-4 text-center tracking-[0.2em]">Safe Range: 01% - 99%</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Button 
                                    type="submit" 
                                    className="w-full h-20 bg-black text-white rounded-3xl font-black uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 text-xs"
                                >
                                    Confirm Protocol
                                </Button>
                                <button 
                                    type="button"
                                    onClick={() => setIsModalOpen(false)} 
                                    className="w-full text-[10px] font-black text-zinc-400 uppercase tracking-widest hover:text-black transition-colors"
                                >
                                    Abort Mission
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}