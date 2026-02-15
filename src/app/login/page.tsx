"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Lock, Mail, KeyRound, ShieldAlert, Loader2, Zap, Skull } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast, Toaster } from "sonner"

// 1. I-apply ang JetBrains Mono para sa consistent branding
import { JetBrains_Mono } from "next/font/google"
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"] })

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [vaultMode, setVaultMode] = useState(false);
    const [isBanned, setIsBanned] = useState(false);
    const [formData, setFormData] = useState({ email: "", password: "", pin: "" });

    // Check kung may existing lockdown sa browser
    useEffect(() => {
        const lockdown = localStorage.getItem("SYSTEM_LOCKDOWN");
        if (lockdown === "TRUE") {
            setIsBanned(true);
        }
    }, []);

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
                toast.success(vaultMode ? "ROOT ACCESS GRANTED" : "WELCOME BACK", {
                    className: jetbrainsMono.className
                });
                
                localStorage.setItem("user", JSON.stringify(data.user));

                setTimeout(() => {
                    router.push("/admin-panel");
                }, 1500); 

            } else {
                if (res.status === 403) {
                    setIsBanned(true);
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

    if (isBanned) {
        return (
            <div className={`${jetbrainsMono.className} min-h-screen bg-black flex flex-col items-center justify-center p-6 text-red-600`}>
                <Skull size={100} className="animate-pulse mb-6" />
                <h1 className="text-6xl font-black uppercase italic tracking-tighter mb-2">Access Revoked</h1>
                <p className="text-xl font-bold uppercase tracking-[0.5em] text-zinc-500">Security Protocol 100-YRS Active</p>
                <div className="mt-12 p-6 border-2 border-red-600 rounded-3xl bg-red-600/10 text-center max-w-md">
                    <p className="font-mono text-xs leading-relaxed opacity-80">
                        This hardware has been permanently flagged. 
                        Unauthorized access to Adrenaline Junky Piercinks systems is a violation of protocol.
                        Try again in the year <span className="underline font-black">2126</span>.
                    </p>
                </div>
            </div>
        )
    }

    return (
    <div className={`${jetbrainsMono.className} min-h-screen bg-black flex items-center justify-center p-4 md:p-6 relative overflow-hidden`}>
        <Toaster position="top-center" richColors />
        
        {/* AMBIENT LIGHTING */}
        <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] transition-colors duration-1000 rounded-full blur-[150px] ${vaultMode ? 'bg-red-900/30' : 'bg-zinc-800/10'}`} />

        <div className="w-full max-w-md space-y-6 md:space-y-8 relative z-10 animate-in fade-in zoom-in duration-700">
            


            {/* FORM CONTAINER */}
            <form 
                onSubmit={handleLogin} 
                className={`p-6 md:p-10 rounded-[2.5rem] border transition-all duration-700 ${
                    vaultMode ? 'bg-black border-red-900/50' : 'bg-zinc-900/40 border-zinc-800'
                }`}
            >
                {!vaultMode ? (
                    <div className="space-y-4 md:space-y-5 animate-in fade-in slide-in-from-right-4">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-zinc-500 uppercase ml-2 tracking-widest italic">Encrypted Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-white transition-colors w-4 h-4" />
                                <input 
                                    type="email" 
                                    required
                                    className="w-full bg-black/50 border border-zinc-800 rounded-2xl py-3 md:py-4 pl-12 pr-4 text-sm text-white font-bold outline-none focus:border-zinc-500 transition-all" 
                                    placeholder="admin@studio.com"
                                    value={formData.email}
                                    onChange={e => setFormData({...formData, email: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-zinc-500 uppercase ml-2 tracking-widest italic">Access Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-white transition-colors w-4 h-4" />
                                <input 
                                    type="password" 
                                    required
                                    className="w-full bg-black/50 border border-zinc-800 rounded-2xl py-3 md:py-4 pl-12 pr-4 text-sm text-white font-bold outline-none focus:border-zinc-500 transition-all" 
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={e => setFormData({...formData, password: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 md:space-y-6 animate-in zoom-in-95 duration-500">
                        <div className="space-y-3 text-center">
                            <span className="text-[9px] font-black text-red-600 uppercase tracking-widest">Master Key Sequence</span>
                            <input 
                                type="password" 
                                required
                                autoFocus
                                maxLength={6}
                                className="w-full bg-red-600/5 border-2 border-red-950 rounded-[2rem] py-6 text-white text-center font-black text-3xl tracking-[0.5em] outline-none focus:border-red-600 transition-all" 
                                placeholder="000000"
                                value={formData.pin}
                                onChange={e => setFormData({...formData, pin: e.target.value})}
                            />
                            <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest">
                                Critical security zone <br/>
                                <span className="text-red-900">Hardware ID logging enabled.</span>
                            </p>
                        </div>
                    </div>
                )}

                <Button 
                    disabled={loading}
                    className={`w-full h-16 md:h-18 mt-6 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] transition-all active:scale-95 border-b-4 ${
                        vaultMode 
                        ? "bg-red-600 hover:bg-red-500 text-white border-red-800" 
                        : "bg-white text-black hover:bg-zinc-200 border-zinc-300 shadow-xl"
                    }`}
                >
                    {loading ? <Loader2 className="animate-spin w-5 h-5" /> : (
                        <span className="flex items-center gap-2">
                            {vaultMode ? "Initiate Bypass" : "Confirm Access"}
                        </span>
                    )}
                </Button>
            </form>

            <footer className="text-center">
                <button 
                    type="button"
                    onClick={() => setVaultMode(!vaultMode)}
                    className="text-[8px] font-black uppercase tracking-widest text-zinc-700 hover:text-white transition-all"
                >
                    {vaultMode ? "[!] Standard Login" : "Secure System Access"}
                </button>
            </footer>
        </div>
    </div>
);
}