"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Loader2, ShieldAlert } from "lucide-react"
import { useSession } from "next-auth/react"

export default function ChangePasswordView() {
    const { data: session } = useSession()
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({
        currentPassword: "",
        newPassword: "",
    })

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();

        // 1. KUNIN ANG EMAIL MULA SA LOCALSTORAGE
        const userDataRaw = localStorage.getItem("user");
        
        if (!userDataRaw) {
            return toast.error("User data not found. Please log in again.");
        }

        const userData = JSON.parse(userDataRaw);
        const email = userData.email; 

        if (!email) {
            return toast.error("Email missing from local storage.");
        }

        setLoading(true);
        try {
            const res = await fetch("/api/auth/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    email: email 
                })
            });

            const data = await res.json();

            if (res.ok) {
                toast.success("SECURITY UPDATE: Password successfully encrypted.");
                setForm({ currentPassword: "", newPassword: "" });
            } else {
                toast.error(data.error || "Update failed.");
            }
        } catch (error) {
            toast.error("Network Error: Protocol disrupted.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 p-8 max-w-2xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 transition-colors">
            <div>
                <h1 className="text-2xl font-black uppercase italic flex items-center gap-2 text-zinc-900 dark:text-white">
                    <ShieldAlert className="w-6 h-6 text-[#d11a2a]" /> Security Settings
                </h1>
                <p className="text-zinc-500 dark:text-muted-foreground text-sm font-medium">Update your administrator password frequently.</p>
            </div>
            
            <form 
                onSubmit={handleUpdate} 
                className="space-y-4 border p-6 rounded-2xl shadow-sm border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/50 transition-all"
            >
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 italic">
                        Current Password
                    </label>
                    <Input 
                        required
                        type="password" 
                        value={form.currentPassword}
                        onChange={(e) => setForm({...form, currentPassword: e.target.value})}
                        placeholder="••••••••" 
                        className="bg-zinc-50 dark:bg-black border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:ring-primary/20" 
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 italic">
                        New Password
                    </label>
                    <Input 
                        required
                        type="password" 
                        value={form.newPassword}
                        onChange={(e) => setForm({...form, newPassword: e.target.value})}
                        placeholder="••••••••" 
                        className="bg-zinc-50 dark:bg-black border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:ring-primary/20" 
                    />
                </div>
                <Button 
                    disabled={loading}
                    className="w-full font-black uppercase h-12 tracking-widest bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all active:scale-95 mt-2"
                >
                    {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Authorize Update"}
                </Button>
            </form>

        </div>
    )
}