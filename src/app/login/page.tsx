"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { 
    Lock, Mail, Loader2, Skull, Send, Undo2, 
    UserPlus, Eye, EyeOff, ShieldAlert 
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast, Toaster } from "sonner"
import { AnimatePresence, motion } from "framer-motion"
import Link from "next/link"

// FIREBASE
import { auth, db } from "@/lib/firebase"
import { sendPasswordResetEmail } from "firebase/auth"
import { collection, query, where, getDocs, limit } from "firebase/firestore"

import { JetBrains_Mono } from "next/font/google"
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"] })

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [vaultMode, setVaultMode] = useState(false);
    const [resetMode, setResetMode] = useState(false);
    const [isBanned, setIsBanned] = useState(false);
    const [showRegister, setShowRegister] = useState(false); // ✅ Control registration button
    const [showPassword, setShowPassword] = useState(false); // ✅ Password visibility toggle
    
    const [formData, setFormData] = useState({ 
        email: "", 
        password: "", 
        pin: "" 
    });

    useEffect(() => {
        const lockdown = localStorage.getItem("SYSTEM_LOCKDOWN");
        if (lockdown === "TRUE") {
            setIsBanned(true);
            return;
        }

        const user = localStorage.getItem("user");
        if (user) {
            router.replace("/admin-panel");
        }

        // ✅ CHECK IF SUPER ADMIN EXISTS IN FIREBASE
        const checkSuperAdmin = async () => {
            try {
                const usersRef = collection(db, "users");
                const q = query(usersRef, where("role", "==", "Super Admin"), limit(1));
                const querySnapshot = await getDocs(q);

                // Show registration ONLY if collection is empty or no Super Admin
                if (querySnapshot.empty) {
                    setShowRegister(true);
                } else {
                    setShowRegister(false);
                }
            } catch (error) {
                console.error("Auth Protocol Error:", error);
                setShowRegister(false); 
            }
        };

        checkSuperAdmin();
    }, [router]);

    // RESET PASSWORD HANDLER
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.email) return toast.error("SPECIFY TARGET EMAIL FIRST.");
        
        setLoading(true);
        try {
            await sendPasswordResetEmail(auth, formData.email);
            toast.success("RESET LINK SENT TO GMAIL");
            setResetMode(false);
        } catch (error: any) {
            if (error.code === "auth/user-not-found") {
                toast.error("ACCOUNT NOT INITIALIZED.");
            } else {
                toast.error(error.message.toUpperCase());
            }
        } finally {
            setLoading(false);
        }
    };

    // LOGIN HANDLER
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
                <h1 className="text-6xl font-black uppercase italic tracking-tighter mb-2 text-center">No Access</h1>
                <p className="text-xl font-bold uppercase tracking-[0.2em] text-zinc-500">Hardware ID Flagged</p>
            </div>
        )
    }

    return (
        <div className={`${jetbrainsMono.className} min-h-screen bg-black flex items-center justify-center p-4 md:p-6 relative overflow-hidden`}>
            <Toaster position="top-center" richColors theme="dark" />
            
            {/* AMBIENT LIGHTING */}
            <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] transition-colors duration-1000 rounded-full blur-[150px] ${
                resetMode ? 'bg-blue-900/10' : (vaultMode ? 'bg-red-900/30' : 'bg-zinc-800/10')
            }`} />

            <div className="w-full max-w-md space-y-6 relative z-10">
                <form 
                    onSubmit={resetMode ? handleResetPassword : handleLogin} 
                    className={`p-6 md:p-10 rounded-[2.5rem] border transition-all duration-700 backdrop-blur-md ${
                        resetMode ? 'bg-zinc-900/60 border-zinc-800' : (vaultMode ? 'bg-black border-red-900/50' : 'bg-zinc-900/40 border-zinc-800')
                    }`}
                >
                    <AnimatePresence mode="wait">
                        {resetMode ? (
                            <motion.div 
                                key="recovery"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="space-y-4"
                            >
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-zinc-500 uppercase ml-2 tracking-widest italic">Registered Email</label>
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
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="login"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
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
                                                    type={showPassword ? "text" : "password"} 
                                                    required
                                                    className="w-full bg-black/50 border border-zinc-800 rounded-2xl py-4 pl-12 pr-12 text-sm text-white font-bold outline-none focus:border-zinc-500 transition-all" 
                                                    placeholder="••••••••"
                                                    value={formData.password}
                                                    onChange={e => setFormData({...formData, password: e.target.value})}
                                                />
                                                <button 
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-700 hover:text-white transition-colors"
                                                >
                                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                            <div className="flex justify-between items-center px-2">
                                                <button 
                                                    type="button" 
                                                    onClick={() => setVaultMode(true)}
                                                    className="text-[8px] font-black uppercase text-zinc-700 hover:text-red-500 transition-colors tracking-widest"
                                                >
                                                    
                                                </button>
                                                <button 
                                                    type="button" 
                                                    onClick={() => setResetMode(true)}
                                                    className="text-[8px] font-black uppercase text-zinc-700 hover:text-white transition-colors tracking-widest"
                                                >
                                                    Forgot?
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="space-y-4 text-center py-4">
                                        <div className="flex justify-center mb-2">
                                            <ShieldAlert className="text-red-600 size-8 animate-pulse" />
                                        </div>
                                        <span className="text-[9px] font-black text-red-600 uppercase tracking-widest italic">Enter Master Pin</span>
                                        <input 
                                            type="password" 
                                            maxLength={6}
                                            autoFocus
                                            className="w-full bg-red-600/5 border-2 border-red-950 rounded-[2rem] py-6 text-white text-center font-black text-3xl tracking-[0.5em] outline-none focus:border-red-600 transition-all" 
                                            placeholder="000000"
                                            value={formData.pin}
                                            onChange={e => setFormData({...formData, pin: e.target.value})}
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => setVaultMode(false)}
                                            className="text-[8px] font-black uppercase text-zinc-500 hover:text-white tracking-widest"
                                        >
                                            Return to Standard Login
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <Button 
                        disabled={loading}
                        className={`w-full h-16 mt-6 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] transition-all active:scale-95 border-b-4 ${
                            resetMode 
                            ? "bg-white text-black border-zinc-300"
                            : (vaultMode ? "bg-red-600 hover:bg-red-500 text-white border-red-800" : "bg-white text-black hover:bg-zinc-200 border-zinc-300 shadow-xl")
                        }`}
                    >
                        {loading ? <Loader2 className="animate-spin w-5 h-5" /> : (
                            <span className="flex items-center gap-2">
                                {resetMode ? <Send size={14} /> : null}
                                {resetMode ? "Send" : (vaultMode ? "Initiate Bypass" : "Sign IN")}
                            </span>
                        )}
                    </Button>

                    {/* ✅ REGISTRATION BUTTON - ONLY SHOWS IF NO SUPER ADMIN EXISTS */}
                    {showRegister && !resetMode && !vaultMode && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-6"
                        >
                            <div className="relative flex items-center justify-center mb-4">
                                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-zinc-800" /></div>
                                <span className="relative bg-black px-2 text-[8px] font-black text-zinc-600 uppercase tracking-widest italic">Create Account</span>
                            </div>
                            <Link href="/registration" className="block w-full">
                                <Button 
                                    type="button"
                                    variant="outline"
                                    className="w-full h-12 rounded-2xl border-dashed border-zinc-700 bg-transparent text-zinc-500 hover:text-white hover:border-white transition-all font-black uppercase tracking-[0.2em] text-[9px]"
                                >
                                    <UserPlus size={14} className="mr-2" />
                                    Create Super Admin
                                </Button>
                            </Link>
                        </motion.div>
                    )}

                    {resetMode && (
                        <button 
                            type="button"
                            onClick={() => setResetMode(false)}
                            className="w-full mt-4 flex items-center justify-center gap-2 text-[9px] font-black uppercase text-zinc-500 hover:text-white transition-all"
                        >
                            <Undo2 size={12} /> Back to Sign in
                        </button>
                    )}
                </form>
            </div>
        </div>
    );
}