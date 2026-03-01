"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Loader2, ShieldAlert, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react"

export default function ChangePasswordView() {
    const [loading, setLoading] = useState(false)
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false,
    })
    const [form, setForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    })

    const getPasswordStrength = (password: string) => {
        if (password.length === 0) return null;
        if (password.length < 8) return { label: "Too Short", color: "text-red-500", bar: "w-1/4 bg-red-500" };
        if (password.length < 10) return { label: "Weak", color: "text-orange-500", bar: "w-2/4 bg-orange-500" };
        if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) return { label: "Moderate", color: "text-yellow-500", bar: "w-3/4 bg-yellow-500" };
        return { label: "Strong", color: "text-green-500", bar: "w-full bg-green-500" };
    }

    const strength = getPasswordStrength(form.newPassword);
    const passwordsMatch = form.confirmPassword.length > 0 && form.newPassword === form.confirmPassword;
    const passwordsMismatch = form.confirmPassword.length > 0 && form.newPassword !== form.confirmPassword;

    const toggleShow = (field: keyof typeof showPasswords) => {
        setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }))
    }

    

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();

        // ── Same approach as the rest of the app ──
        const stored = localStorage.getItem("user");
        const parsed = stored ? JSON.parse(stored) : null;

        const email = parsed?.email;
        const userId = parsed?.id;

        if (!email || !userId) {
            return toast.error("Session not found. Please log in again.");
        }

        if (form.newPassword.length < 8) {
            return toast.error("New password must be at least 8 characters.");
        }

        if (form.newPassword !== form.confirmPassword) {
            return toast.error("New passwords do not match.");
        }

        if (form.currentPassword === form.newPassword) {
            return toast.error("New password must be different from your current password.");
        }

        setLoading(true);
console.log("PAYLOAD:", {
    id: userId,
    email: email,
    isChangingPassword: true,
    currentPassword: form.currentPassword,
    newPassword: form.newPassword,
})
        try {
            const res = await fetch("/api/users", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: userId,
                    isChangingPassword: true,
                    currentPassword: form.currentPassword,
                    newPassword: form.newPassword,
                })
            });

            const data = await res.json();

            if (res.ok) {
                toast.success("Password successfully updated.");
                setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
            } else {
                toast.error(data.error || "Update failed.");
            }
        } catch (error) {
            toast.error("Network Error: Could not reach the server.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 p-8 max-w-2xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 transition-colors">

            {/* ── Header ── */}
            <div>
                <h1 className="text-2xl font-black uppercase italic flex items-center gap-2 text-zinc-900 dark:text-white">
                    <ShieldAlert className="w-6 h-6 text-[#d11a2a]" /> Security Settings
                </h1>
                <p className="text-zinc-500 dark:text-muted-foreground text-sm font-medium">
                    Update your administrator password frequently.
                </p>
            </div>

            {/* ── Form ── */}
            <form
                onSubmit={handleUpdate}
                className="space-y-5 border p-6 rounded-2xl shadow-sm border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/50 transition-all"
            >
                {/* Current Password */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 italic">
                        Current Password
                    </label>
                    <div className="relative">
                        <Input
                            required
                            type={showPasswords.current ? "text" : "password"}
                            value={form.currentPassword}
                            onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                            placeholder="••••••••"
                            className="bg-zinc-50 dark:bg-black border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => toggleShow("current")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                        >
                            {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {/* New Password */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 italic">
                        New Password
                    </label>
                    <div className="relative">
                        <Input
                            required
                            type={showPasswords.new ? "text" : "password"}
                            value={form.newPassword}
                            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                            placeholder="••••••••"
                            className="bg-zinc-50 dark:bg-black border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => toggleShow("new")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                        >
                            {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>

                    {/* Strength bar */}
                    {strength && (
                        <div className="space-y-1">
                            <div className="h-1 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-500 ${strength.bar}`} />
                            </div>
                            <p className={`text-[10px] font-bold uppercase tracking-widest ${strength.color}`}>
                                {strength.label}
                            </p>
                        </div>
                    )}
                </div>

                {/* Confirm New Password */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 italic">
                        Confirm New Password
                    </label>
                    <div className="relative">
                        <Input
                            required
                            type={showPasswords.confirm ? "text" : "password"}
                            value={form.confirmPassword}
                            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                            placeholder="••••••••"
                            className={`bg-zinc-50 dark:bg-black border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white pr-10 transition-colors
                                ${passwordsMatch ? "border-green-500 focus-visible:ring-green-500/20" : ""}
                                ${passwordsMismatch ? "border-red-500 focus-visible:ring-red-500/20" : ""}
                            `}
                        />
                        <button
                            type="button"
                            onClick={() => toggleShow("confirm")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                        >
                            {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>

                    {passwordsMatch && (
                        <p className="text-[10px] font-bold uppercase tracking-widest text-green-500 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Passwords match
                        </p>
                    )}
                    {passwordsMismatch && (
                        <p className="text-[10px] font-bold uppercase tracking-widest text-red-500 flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Passwords do not match
                        </p>
                    )}
                </div>

                {/* Submit */}
                <Button
                    type="submit"
                    disabled={loading || passwordsMismatch || form.newPassword.length < 8}
                    className="w-full font-black uppercase h-12 tracking-widest bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all active:scale-95 mt-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                >
                    {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Authorize Update"}
                </Button>
            </form>
        </div>
    )
}