"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Lock, Mail, Loader2, Skull, Send, Undo2 } from "lucide-react" // Nag-add ako ng icons
import { useRouter } from "next/navigation"
import { toast, Toaster } from "sonner"
import { AnimatePresence, motion } from "framer-motion"

// FIREBASE AUTH
import { auth } from "@/lib/firebase"
import { sendPasswordResetEmail } from "firebase/auth"

import { JetBrains_Mono } from "next/font/google"
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"] })

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [vaultMode, setVaultMode] = useState(false);
    const [resetMode, setResetMode] = useState(false); // NEW: State para sa Reset Mode
    const [isBanned, setIsBanned] = useState(false);
    const [formData, setFormData] = useState({ email: "", password: "", pin: "" });

    useEffect(() => {
        const lockdown = localStorage.getItem("SYSTEM_LOCKDOWN");
        if (lockdown === "TRUE") setIsBanned(true);
    }, []);

const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) return toast.error("SPECIFY TARGET EMAIL FIRST.");
    
    setLoading(true);
    try {
        // Subukan i-send ang reset link
        await sendPasswordResetEmail(auth, formData.email);
        toast.success("RESET LINK SENT TO GMAIL");
        setResetMode(false);
    } catch (error: any) {
        // KUNG WALA PA SA AUTH TAB:
        if (error.code === "auth/user-not-found") {
            // Dito natin pwedeng tawagan ang isang "Sync" API 
            // O sabihan ang user: "LOGIN FIRST TO INITIALIZE ACCOUNT"
            toast.error("ACCOUNT NOT INITIALIZED. PLEASE LOGIN ONCE FIRST.");
        } else {
            toast.error(error.message.toUpperCase());
        }
    } finally {
        setLoading(false);
    }
};

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    pin: formData.pin,
                    isVaultMode: vaultMode
                })
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(vaultMode ? "ROOT ACCESS GRANTED" : "WELCOME BACK");
                localStorage.setItem("user", JSON.stringify(data.user));
                setTimeout(() => { router.push("/admin-panel"); }, 1500); 
            } else {
                if (res.status === 403) {
                    setIsBanned(true);
                    localStorage.setItem("SYSTEM_LOCKDOWN", "TRUE");
                    toast.error("ACCESS REVOKED");
                } else {
                    toast.error(data.error || "Authentication Failed");
                }
            }
        } catch (error) {
            toast.error("Server Connection Lost");
        } finally {
            setLoading(false);
        }
    };

    if (isBanned) {
        return (
            <div className={`${jetbrainsMono.className} min-h-screen bg-black flex flex-col items-center justify-center p-6 text-red-600`}>
                <Skull size={100} className="animate-pulse mb-6" />
                <h1 className="text-6xl font-black uppercase italic tracking-tighter mb-2">No Access</h1>
                <p className="text-xl font-bold uppercase tracking-[0.2em] text-zinc-500">Hardware ID Flagged</p>
            </div>
        )
    }

    return (
        <div className={`${jetbrainsMono.className} min-h-screen bg-black flex items-center justify-center p-4 md:p-6 relative overflow-hidden`}>
            <Toaster position="top-center" richColors theme="dark" />
            
            {/* AMBIENT LIGHTING - Dynamic color based on mode */}
            <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] transition-colors duration-1000 rounded-full blur-[150px] ${
                resetMode ? 'bg-orange-500/10' : (vaultMode ? 'bg-red-900/30' : 'bg-zinc-800/10')
            }`} />

            <div className="w-full max-w-md space-y-6 relative z-10">
                
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-black italic tracking-tighter uppercase text-white">
                        {resetMode ? "Terminal" : (vaultMode ? "Secure" : "Staff")}<br/>
                        <span className={resetMode ? "text-orange-500" : (vaultMode ? "text-red-600" : "text-zinc-600")}>
                            {resetMode ? "Recovery" : (vaultMode ? "Vault" : "Terminal")}
                        </span>
                    </h2>
                </div>

                <form 
                    onSubmit={resetMode ? handleResetPassword : handleLogin} 
                    className={`p-6 md:p-10 rounded-[2.5rem] border transition-all duration-700 ${
                        resetMode ? 'bg-zinc-900/60 border-orange-900/40' : (vaultMode ? 'bg-black border-red-900/50' : 'bg-zinc-900/40 border-zinc-800')
                    }`}
                >
                    <AnimatePresence mode="wait">
                        {resetMode ? (
                            // --- RECOVERY UI ---
                            <motion.div 
                                key="recovery"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="space-y-4"
                            >
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-orange-500 uppercase ml-2 tracking-widest italic">Registered Gmail</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-orange-500 transition-colors w-4 h-4" />
                                        <input 
                                            type="email" 
                                            required
                                            className="w-full bg-black/50 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-sm text-white font-bold outline-none focus:border-orange-500 transition-all" 
                                            placeholder="admin@gmail.com"
                                            value={formData.email}
                                            onChange={e => setFormData({...formData, email: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <p className="text-[8px] text-zinc-500 text-center font-bold uppercase tracking-widest px-4">
                                    System will transmit a reset link to your encrypted inbox.
                                </p>
                            </motion.div>
                        ) : (
                            // --- LOGIN UI (Standard & Vault) ---
                            <motion.div 
                                key="login"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                {!vaultMode ? (
                                    <>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-zinc-500 uppercase ml-2 tracking-widest italic">Email</label>
                                            <div className="relative group">
                                                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-white transition-colors w-4 h-4" />
                                                <input 
                                                    type="email" 
                                                    required
                                                    className="w-full bg-black/50 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-sm text-white font-bold outline-none focus:border-zinc-500 transition-all" 
                                                    placeholder="admin@studio.com"
                                                    value={formData.email}
                                                    onChange={e => setFormData({...formData, email: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-zinc-500 uppercase ml-2 tracking-widest italic">Password</label>
                                            <div className="relative group">
                                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-white transition-colors w-4 h-4" />
                                                <input 
                                                    type="password" 
                                                    required
                                                    className="w-full bg-black/50 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-sm text-white font-bold outline-none focus:border-zinc-500 transition-all" 
                                                    placeholder="••••••••"
                                                    value={formData.password}
                                                    onChange={e => setFormData({...formData, password: e.target.value})}
                                                />
                                            </div>
                                            <div className="flex justify-end px-2">
                                                <button 
                                                    type="button" 
                                                    onClick={() => setResetMode(true)}
                                                    className="text-[8px] font-black uppercase text-zinc-600 hover:text-white transition-colors tracking-widest"
                                                >
                                                    Lost Access?
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="space-y-4 text-center">
                                        <span className="text-[9px] font-black text-red-600 uppercase tracking-widest italic">Master Key</span>
                                        <input 
                                            type="password" 
                                            maxLength={6}
                                            className="w-full bg-red-600/5 border-2 border-red-950 rounded-[2rem] py-6 text-white text-center font-black text-3xl tracking-[0.5em] outline-none focus:border-red-600 transition-all" 
                                            placeholder="000000"
                                            value={formData.pin}
                                            onChange={e => setFormData({...formData, pin: e.target.value})}
                                        />
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <Button 
                        disabled={loading}
                        className={`w-full h-16 mt-6 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] transition-all active:scale-95 border-b-4 ${
                            resetMode 
                            ? "bg-orange-600 hover:bg-orange-500 text-white border-orange-800"
                            : (vaultMode ? "bg-red-600 hover:bg-red-500 text-white border-red-800" : "bg-white text-black hover:bg-zinc-200 border-zinc-300 shadow-xl")
                        }`}
                    >
                        {loading ? <Loader2 className="animate-spin w-5 h-5" /> : (
                            <span className="flex items-center gap-2">
                                {resetMode ? <Send size={14} /> : null}
                                {resetMode ? "Transmit Reset Link" : (vaultMode ? "Initiate Bypass" : "Confirm Access")}
                            </span>
                        )}
                    </Button>

                    {resetMode && (
                        <button 
                            type="button"
                            onClick={() => setResetMode(false)}
                            className="w-full mt-4 flex items-center justify-center gap-2 text-[9px] font-black uppercase text-zinc-500 hover:text-white transition-all"
                        >
                            <Undo2 size={12} /> Back to Terminal
                        </button>
                    )}
                </form>
            </div>
        </div>
    );
}