"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Loader2, ShieldAlert } from "lucide-react"
import { useSession } from "next-auth/react" // Client-side check lang

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
    const email = userData.email; // Heto na yung pablojhay321@gmail.com par

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
                email: email // Ipadala natin yung email na galing storage
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
        <div className="flex flex-col gap-6 p-8 max-w-2xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-2xl font-black uppercase italic flex items-center gap-2">
                    <ShieldAlert className="w-6 h-6 text-[#d11a2a]" /> Security Settings
                </h1>
                <p className="text-muted-foreground text-sm font-medium">Update your administrator password frequently.</p>
            </div>
            
            <form onSubmit={handleUpdate} className="space-y-4 border p-6 rounded-2xl bg-card shadow-sm border-zinc-800 bg-zinc-950/50">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">Current Password</label>
                    <Input 
                        required
                        type="password" 
                        value={form.currentPassword}
                        onChange={(e) => setForm({...form, currentPassword: e.target.value})}
                        placeholder="••••••••" 
                        className="bg-black border-zinc-800 text-white" 
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">New Password</label>
                    <Input 
                        required
                        type="password" 
                        value={form.newPassword}
                        onChange={(e) => setForm({...form, newPassword: e.target.value})}
                        placeholder="••••••••" 
                        className="bg-black border-zinc-800 text-white" 
                    />
                </div>
                <Button 
                    disabled={loading}
                    className="w-full font-black uppercase h-12 tracking-widest bg-white text-black hover:bg-zinc-200 transition-all active:scale-95"
                >
                    {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Authorize Update"}
                </Button>
            </form>
        </div>
    )
}