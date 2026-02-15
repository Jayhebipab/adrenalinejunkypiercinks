"use client"

import { useState, useEffect } from "react" // Added useEffect
import { Button } from "@/components/ui/button"
import { Lock, Mail, User, ShieldCheck, Loader2, Zap, ArrowLeft, ShieldAlert } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast, Toaster } from "sonner"
import { JetBrains_Mono } from "next/font/google"
import Link from "next/link"

const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"] })

export default function RegisterPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [isChecking, setIsChecking] = useState(true); // Para sa initial security check

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        systemPIN: "",
        role: "Super Admin"
    });

    // --- SECURITY PROTOCOL: CHECK IF REGISTRY IS LOCKED ---
    useEffect(() => {
        const verifyRegistryStatus = async () => {
            try {
                const res = await fetch("/api/auth/check-admin");
                const data = await res.json();

                if (data.exists) {
                    // Registry is locked, kick user to login
                    router.replace("/login");
                  
                } else {
                    // Safe to show the registration form
                    setIsChecking(false);
                }
            } catch (error) {
                console.error("Security Check Failed:", error);
                router.replace("/login");
            }
        };

        verifyRegistryStatus();
    }, [router]);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (formData.systemPIN.length !== 6) {
            return toast.error("System PIN must be exactly 6 digits");
        }

        setLoading(true);
        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (res.ok) {
                toast.success("ACCOUNT CREATED: PERMISSION GRANTED");
                setTimeout(() => {
                    router.push("/login");
                }, 2000);
            } else {
                toast.error(data.error || "Registration Failed");
            }
        } catch (error) {
            toast.error("Network Error: Protocol Interrupted");
        } finally {
            setLoading(false);
        }
    };

    // Habang nagve-verify, black screen lang muna with loader para iwas "flicker" ng form
    if (isChecking) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center space-y-4">
                    <Loader2 className="animate-spin text-white w-8 h-8 mx-auto" />
                    <p className={`${jetbrainsMono.className} text-[10px] text-zinc-500 uppercase tracking-[0.5em]`}>
                        Verifying Registry Status...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={`${jetbrainsMono.className} min-h-screen bg-black flex items-center justify-center p-4 md:p-6 relative overflow-hidden`}>
            <Toaster position="top-center" richColors />
            
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-zinc-800/20 rounded-full blur-[120px]" />

            <div className="w-full max-w-lg space-y-6 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                
                <div className="text-center space-y-2">
                    <div className="inline-flex p-4 rounded-3xl bg-zinc-900 border border-zinc-800 mb-2 shadow-2xl">
                        <ShieldAlert className="text-white w-8 h-8" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter text-white">
                        Registry
                    </h1>
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.4em]">
                        Adrenaline Junky Personnel Registry
                    </p>
                </div>

                <form 
                    onSubmit={handleRegister} 
                    className="p-8 md:p-10 rounded-[2.5rem] bg-zinc-900/40 border border-zinc-800 space-y-5 backdrop-blur-sm"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-zinc-500 uppercase ml-2 tracking-widest italic">Personnel Name</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-white transition-colors w-4 h-4" />
                                <input 
                                    type="text" 
                                    required
                                    className="w-full bg-black/50 border border-zinc-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white font-bold outline-none focus:border-zinc-500 transition-all" 
                                    placeholder="Juan Dela Cruz"
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-zinc-500 uppercase ml-2 tracking-widest italic">Access Level</label>
                            <div className="w-full bg-black/30 border border-zinc-800 rounded-xl py-3 px-4 text-xs text-zinc-400 font-black uppercase">
                                Super Admin (Locked)
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-zinc-500 uppercase ml-2 tracking-widest italic">Registry Email</label>
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-white transition-colors w-4 h-4" />
                            <input 
                                type="email" 
                                required
                                className="w-full bg-black/50 border border-zinc-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white font-bold outline-none focus:border-zinc-500 transition-all" 
                                placeholder="juan@adrenaline.com"
                                onChange={e => setFormData({...formData, email: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-zinc-500 uppercase ml-2 tracking-widest italic">Secret Passkey</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-white transition-colors w-4 h-4" />
                                <input 
                                    type="password" 
                                    required
                                    className="w-full bg-black/50 border border-zinc-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white font-bold outline-none focus:border-zinc-500 transition-all" 
                                    placeholder="••••••••"
                                    onChange={e => setFormData({...formData, password: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-zinc-500 uppercase ml-2 tracking-widest italic">6-Digit Vault PIN</label>
                            <div className="relative group">
                                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-white transition-colors w-4 h-4" />
                                <input 
                                    type="password" 
                                    required
                                    maxLength={6}
                                    className="w-full bg-black/50 border border-zinc-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white font-bold outline-none focus:border-zinc-500 transition-all" 
                                    placeholder="000000"
                                    onChange={e => setFormData({...formData, systemPIN: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>

                    <Button 
                        disabled={loading}
                        className="w-full h-16 mt-4 rounded-2xl bg-white text-black hover:bg-zinc-200 border-b-4 border-zinc-300 font-black uppercase tracking-[0.2em] text-[10px] transition-all active:scale-95 shadow-xl"
                    >
                        {loading ? <Loader2 className="animate-spin w-5 h-5" /> : (
                            <span className="flex items-center gap-2">
                                <Zap size={14} /> Authorize Registration
                            </span>
                        )}
                    </Button>
                </form>

                <footer className="text-center">
                    <Link href="/login" className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-zinc-700 hover:text-white transition-all">
                        <ArrowLeft size={10} /> Back to Authorization
                    </Link>
                </footer>
            </div>
        </div>
    );
}