"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Lock, Mail, KeyRound, ShieldAlert, Loader2, Zap, Skull, AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast, Toaster } from "sonner"

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [vaultMode, setVaultMode] = useState(false);
    const [isBanned, setIsBanned] = useState(false); // Para sa 100-year ban UI
    
    const [formData, setFormData] = useState({ email: "", password: "", pin: "" });

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

// Sa loob ng handleLogin function
if (res.ok) {
    toast.success(vaultMode ? "ROOT ACCESS GRANTED" : "WELCOME BACK");
    
    // I-save ang user data sa state/localStorage kung kailangan
    localStorage.setItem("user", JSON.stringify(data.user));

    // ETO ANG KULANG: I-redirect ang user sa admin panel
    setTimeout(() => {
        router.push("/admin-panel"); // Siguraduhin na tama ang URL path mo
    }, 1500); 

} else {
                // CHECK KUNG 100 YEAR BAN ANG RESPONSE
if (res.status === 403) {
    setIsBanned(true);
    // ITATAK SA BROWSER NIYA NA BANNED SIYA FOREVER
    localStorage.setItem("SYSTEM_LOCKDOWN", "TRUE");
    
    toast.error("HARDWARE ID BANNED", {
        duration: 10000,
        style: { background: 'red', color: 'white' }
    });
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

    // Glitch effect variant kapag banned
    if (isBanned) {
        return (
            <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-red-600">
                <Skull size={100} className="animate-bounce mb-6" />
                <h1 className="text-6xl font-black uppercase italic tracking-tighter mb-2">Access Revoked</h1>
                <p className="text-xl font-bold uppercase tracking-[0.5em] text-zinc-500">Security Protocol 100-YRS Active</p>
                <div className="mt-12 p-6 border-2 border-red-600 rounded-3xl bg-red-600/10 text-center max-w-md">
                    <p className="font-mono text-sm leading-relaxed">
                        This system has been permanently locked due to multiple unauthorized attempts. 
                        Your hardware ID has been logged. Try again in the year <span className="underline">2126</span>.
                    </p>
                </div>
                <button 
                    onClick={() => window.location.reload()} 
                    className="mt-10 text-zinc-700 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors"
                >
                    System Reboot
                </button>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden font-sans">
            <Toaster position="top-center" richColors />
            
            {/* AMBIENT LIGHTING */}
            <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] transition-colors duration-1000 rounded-full blur-[150px] ${vaultMode ? 'bg-red-900/30' : 'bg-zinc-800/20'}`} />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-zinc-900/10 blur-[150px] rounded-full" />

            <div className="w-full max-w-md space-y-8 relative z-10 animate-in fade-in zoom-in duration-700">
                {/* LOGO / TRIGGER AREA */}
                <div className="text-center space-y-3 group cursor-pointer select-none" onClick={() => setVaultMode(!vaultMode)}>
                    <div className={`inline-flex p-6 rounded-[2.5rem] border-2 transition-all duration-700 shadow-2xl ${
                        vaultMode ? 'bg-red-600/10 border-red-600 shadow-red-600/20' : 'bg-zinc-900 border-zinc-800 group-hover:border-zinc-500'
                    }`}>
                        {vaultMode ? (
                            <ShieldAlert className="text-red-600 w-12 h-12 animate-pulse" />
                        ) : (
                            <Zap className="text-white w-12 h-12 group-hover:scale-110 transition-transform" />
                        )}
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-5xl font-black italic uppercase tracking-tighter text-white">
                            {vaultMode ? "ROOT VAULT" : "ADRENALINE"}
                        </h1>
                        <p className={`text-[10px] font-black uppercase tracking-[0.5em] transition-colors duration-500 ${vaultMode ? 'text-red-500' : 'text-zinc-600'}`}>
                            {vaultMode ? "Authorization Override" : "Junky Piercinks Studio"}
                        </p>
                    </div>
                </div>

                {/* FORM CONTAINER */}
                <form 
                    onSubmit={handleLogin} 
                    className={`p-10 rounded-[3.5rem] border transition-all duration-700 shadow-3xl space-y-6 ${
                        vaultMode ? 'bg-zinc-950/80 border-red-900/50' : 'bg-zinc-900/40 border-zinc-800'
                    }`}
                >
                    {!vaultMode ? (
                        /* STAFF LOGIN VIEW */
                        <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-500 uppercase ml-2 tracking-widest italic">Encrypted Email</label>
                                <div className="relative group">
                                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-white transition-colors w-4 h-4" />
                                    <input 
                                        type="email" 
                                        required
                                        className="w-full bg-black/50 border border-zinc-800 rounded-2xl py-5 pl-14 pr-6 text-white font-bold outline-none focus:border-zinc-500 focus:ring-4 ring-white/5 transition-all" 
                                        placeholder="admin@studio.com"
                                        value={formData.email}
                                        onChange={e => setFormData({...formData, email: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-500 uppercase ml-2 tracking-widest italic">Access Password</label>
                                <div className="relative group">
                                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-white transition-colors w-4 h-4" />
                                    <input 
                                        type="password" 
                                        required
                                        className="w-full bg-black/50 border border-zinc-800 rounded-2xl py-5 pl-14 pr-6 text-white font-bold outline-none focus:border-zinc-500 focus:ring-4 ring-white/5 transition-all" 
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={e => setFormData({...formData, password: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* ROOT PIN VIEW */
                        <div className="space-y-6 animate-in zoom-in-95 duration-500">
                            <div className="space-y-3 text-center">
                                <div className="flex justify-center gap-2 mb-2">
                                    <AlertTriangle className="text-red-600 w-4 h-4 animate-bounce" />
                                    <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">Master Key Sequence</span>
                                    <AlertTriangle className="text-red-600 w-4 h-4 animate-bounce" />
                                </div>
                                <div className="relative">
                                    <input 
                                        type="password" 
                                        required
                                        autoFocus
                                        maxLength={6}
                                        className="w-full bg-red-600/5 border-2 border-red-950 rounded-[2rem] py-8 text-white text-center font-black text-4xl tracking-[0.5em] outline-none focus:border-red-600 focus:ring-8 ring-red-600/10 transition-all placeholder:text-zinc-800 shadow-inner" 
                                        placeholder="000000"
                                        value={formData.pin}
                                        onChange={e => setFormData({...formData, pin: e.target.value})}
                                    />
                                </div>
                                <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest leading-relaxed">
                                    Inputting an incorrect sequence 5 times will result in a <br/>
                                    <span className="text-red-900 italic">100-year hardware lockdown.</span>
                                </p>
                            </div>
                        </div>
                    )}

                    <Button 
                        disabled={loading}
                        className={`w-full h-20 rounded-[2rem] font-black uppercase tracking-[0.3em] text-[11px] transition-all active:scale-95 shadow-2xl border-b-4 ${
                            vaultMode 
                            ? "bg-red-600 hover:bg-red-500 text-white border-red-800 shadow-red-900/40" 
                            : "bg-white text-black hover:bg-zinc-200 border-zinc-300 shadow-black/50"
                        }`}
                    >
                        {loading ? (
                            <Loader2 className="animate-spin w-5 h-5" />
                        ) : (
                            <span className="flex items-center gap-2">
                                {vaultMode ? <KeyRound size={16} /> : null}
                                {vaultMode ? "Initiate Root Bypass" : "Confirm Authentication"}
                            </span>
                        )}
                    </Button>
                </form>

                {/* FOOTER */}
                <footer className="text-center pt-4">
                    <button 
                        type="button"
                        onClick={() => setVaultMode(!vaultMode)}
                        className={`text-[9px] font-black uppercase tracking-widest transition-all duration-500 ${
                            vaultMode ? 'text-red-900 hover:text-red-500' : 'text-zinc-700 hover:text-white'
                        }`}
                    >
                        {vaultMode ? "[!] Return to Standard Terminal" : "Secure Studio Management System"}
                    </button>
                </footer>
            </div>
        </div>
    );
}