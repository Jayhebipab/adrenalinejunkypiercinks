"use client"
import { useState, useEffect } from "react"
import {
    Trash2, ShieldAlert, Loader2, X, Search,
    UserCog, Lock, Shield, RotateCcw, Plus, AlertCircle,
    Users, ShieldCheck, UserX, ArrowLeftRight
} from "lucide-react"
import { Toaster, toast } from "sonner"
import { db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { cn } from "@/lib/utils"

interface User {
    id: string;
    username: string;
    email: string;
    role: string;
    contact?: string;
}

// ─── AUDIT TRAIL HELPER ───────────────────────────────────────────────────────
async function logAudit({ action, details, module = "User Management" }: {
    action: string; details: string; module?: string;
}) {
    try {
        const stored = localStorage.getItem("user");
        const parsed = stored ? JSON.parse(stored) : null;
        await addDoc(collection(db, "audit_logs"), {
            adminName: parsed?.name ?? "Unknown Admin",
            adminEmail: parsed?.email ?? "—",
            action, details, module,
            timestamp: serverTimestamp(),
        });
    } catch (err) { console.warn("Audit log failed:", err); }
}

// ─── VALIDATION ───────────────────────────────────────────────────────────────
const SPECIAL_CHAR_REGEX = /[^a-zA-Z0-9\s\-'_.@]/;

interface AddFormErrors {
    username?: string;
    email?: string;
    password?: string;
    contact?: string;
    role?: string;
    systemPIN?: string;
}

interface EditFormErrors {
    username?: string;
    contact?: string;
    newPassword?: string;
    newSystemPIN?: string;
}

function validateAddUser(data: {
    username: string; email: string; password: string; contact: string; role: string; systemPIN?: string;
}): AddFormErrors {
    const errors: AddFormErrors = {};

    if (!data.username.trim()) errors.username = "Username is required.";
    else if (data.username.trim().length < 3) errors.username = "Minimum 3 characters.";
    else if (SPECIAL_CHAR_REGEX.test(data.username)) errors.username = "Invalid characters in username.";

    if (!data.email.trim()) errors.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = "Invalid email format.";

    if (!data.password.trim()) errors.password = "Password is required.";
    else if (data.password.length < 6) errors.password = "Minimum 6 characters.";

    if (data.contact && !/^(09|\+639)\d{9}$/.test(data.contact.replace(/\s/g, ''))) {
        errors.contact = "Must be a valid PH number (e.g. 09XXXXXXXXX).";
    }

    if (!data.role) errors.role = "Role is required.";

    if (data.role === "Super Admin" && !data.systemPIN?.trim()) {
        errors.systemPIN = "Master PIN is required for Super Admin.";
    } else if (data.role === "Super Admin" && data.systemPIN && data.systemPIN.length < 4) {
        errors.systemPIN = "PIN must be at least 4 characters.";
    }

    return errors;
}

function validateEditUser(data: {
    username: string; contact: string; newPassword?: string; newSystemPIN?: string; isSuperAdmin: boolean;
}): EditFormErrors {
    const errors: EditFormErrors = {};

    if (!data.username.trim()) errors.username = "Username is required.";
    else if (data.username.trim().length < 3) errors.username = "Minimum 3 characters.";
    else if (SPECIAL_CHAR_REGEX.test(data.username)) errors.username = "Invalid characters in username.";

    if (data.contact && !/^(09|\+639)\d{9}$/.test(data.contact.replace(/\s/g, ''))) {
        errors.contact = "Must be a valid PH number (e.g. 09XXXXXXXXX).";
    }

    if (data.newPassword && data.newPassword.length < 6) {
        errors.newPassword = "Password must be at least 6 characters.";
    }

    if (data.isSuperAdmin && data.newSystemPIN && data.newSystemPIN.length < 4) {
        errors.newSystemPIN = "PIN must be at least 4 characters.";
    }

    return errors;
}

export default function UserManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const [fetching, setFetching] = useState(true);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState("");

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isVerifyOpen, setIsVerifyOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);

    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [verifyData, setVerifyData] = useState({ password: "", pin: "" });
    const [showPinField, setShowPinField] = useState(false);
    const [editData, setEditData] = useState({ username: "", contact: "", newSystemPIN: "", newPassword: "", role: "" });
    const [formData, setFormData] = useState({ username: "", email: "", password: "", role: "Staff", contact: "", systemPIN: "" });

    const [addErrors, setAddErrors] = useState<AddFormErrors>({});
    const [editErrors, setEditErrors] = useState<EditFormErrors>({});

    const fetchUsers = async () => {
        setFetching(true);
        try {
            const res = await fetch("/api/users");
            if (!res.ok) throw new Error("Fetch failed");
            const data = await res.json();
            setUsers(Array.isArray(data) ? data : []);
        } catch {
            toast.error("Database Connection Offline");
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const filteredUsers = users.filter(user => {
        const isSearchingSuper = search.toLowerCase() === "superadmin";
        if (user.role === "Super Admin") return isSearchingSuper;
        return user.username?.toLowerCase().includes(search.toLowerCase()) ||
            user.email?.toLowerCase().includes(search.toLowerCase());
    });

    const adminCount = users.filter(u => u.role === "Admin").length;
    const staffCount = users.filter(u => u.role === "Staff").length;

    // ─── LIVE VALIDATE ────────────────────────────────────────────────────────
    const liveValidateAdd = (field: keyof AddFormErrors, value: string) => {
        const current = { ...formData, [field]: value };
        const errors = validateAddUser(current);
        setAddErrors(prev => ({ ...prev, [field]: errors[field] }));
    };

    const liveValidateEdit = (field: keyof EditFormErrors, value: string) => {
        const current = { ...editData, [field]: value, isSuperAdmin: selectedUser?.role === "Super Admin" };
        const errors = validateEditUser(current);
        setEditErrors(prev => ({ ...prev, [field]: errors[field] }));
    };

    // ─── DUPLICATE CHECK ON EDIT (username + contact, exclude self) ──────────
    const checkEditDuplicates = (field: "username" | "contact", value: string): string | undefined => {
        if (!value.trim()) return undefined;
        const taken = users.find(u =>
            u.id !== selectedUser?.id &&
            (field === "username"
                ? u.username?.toLowerCase() === value.toLowerCase()
                : u.contact === value)
        );
        if (taken) return field === "username" ? "Username already taken." : "Contact already registered.";
        return undefined;
    };

    // ─── ROW CLICK ────────────────────────────────────────────────────────────
    const handleRowClick = (user: User) => {
        setSelectedUser(user);
        setEditData({ username: user.username || "", contact: user.contact || "", newSystemPIN: "", newPassword: "", role: user.role });
        setEditErrors({});
        if (user.role === "Super Admin") {
            setVerifyData({ password: "", pin: "" });
            setShowPinField(false);
            setIsVerifyOpen(true);
        } else {
            setIsEditOpen(true);
        }
    };

    // ─── VERIFY SUPER ADMIN ───────────────────────────────────────────────────
    const handleVerifySubmit = async () => {
        if (!selectedUser?.id) return;
        const res = await fetch("/api/users", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: selectedUser.id,
                currentPassword: verifyData.password,
                systemPIN: verifyData.pin,
                isVerifying: true
            })
        });
        if (res.ok) {
            setIsVerifyOpen(false);
            setIsEditOpen(true);
            toast.success("Identity Confirmed: Access Granted");
        } else {
            toast.error("Security Authentication Failed");
        }
    };

    // ─── UPDATE ───────────────────────────────────────────────────────────────
    const handleUpdate = async () => {
        // Field validation
        const errors = validateEditUser({
            ...editData,
            isSuperAdmin: selectedUser?.role === "Super Admin"
        });

        // Duplicate check — username & contact (exclude self)
        const usernameDupe = checkEditDuplicates("username", editData.username);
        const contactDupe = editData.contact ? checkEditDuplicates("contact", editData.contact) : undefined;

        if (usernameDupe) errors.username = usernameDupe;
        if (contactDupe) errors.contact = contactDupe;

        if (Object.keys(errors).length > 0) {
            setEditErrors(errors);
            toast.error("Please fix the form errors before submitting.");
            return;
        }

        const prevRole = selectedUser?.role;
        const newRole = editData.role;
        setSaving(true);

        const doUpdate = async () => {
            const res = await fetch("/api/users", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: selectedUser!.id, ...editData })
            });
            if (!res.ok) throw new Error("Failed to update");

            // ✅ AUDIT LOG — note if role changed
            const roleChanged = prevRole !== newRole ? ` | Role changed: ${prevRole} → ${newRole}` : "";
            await logAudit({
                action: "EDITED USER",
                details: `Updated user "${selectedUser?.username}" (${prevRole})${roleChanged} — ID: ${selectedUser?.id}`,
            });

            setIsEditOpen(false);
            setEditErrors({});
            fetchUsers();
        };

        try {
            await toast.promise(doUpdate(), {
                loading: "Syncing Matrix...",
                success: "Personnel Updated!",
                error: (err: Error) => err.message,
            });
        } finally {
            setSaving(false);
        }
    };

    // ─── DELETE ───────────────────────────────────────────────────────────────
    const handleDelete = async (e: React.MouseEvent, user: User) => {
        e.stopPropagation();
        if (!confirm(`TERMINATE "${user.username.toUpperCase()}"?`)) return;

        toast.promise(async () => {
            const res = await fetch(`/api/users?id=${user.id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Unauthorized Action");
            await logAudit({
                action: "DELETED USER",
                details: `Deleted user "${user.username}" (${user.role}) — Email: ${user.email}`,
            });
            fetchUsers();
        }, {
            loading: `Purging "${user.username}"...`,
            success: `"${user.username}" has been removed.`,
            error: (err: Error) => err.message,
        });
    };

    // ─── ADD USER ─────────────────────────────────────────────────────────────
    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        const errors = validateAddUser(formData);
        if (Object.keys(errors).length > 0) {
            setAddErrors(errors);
            toast.error("Please fix the form errors before submitting.");
            return;
        }

        setSaving(true);
        const doAdd = async () => {
            const res = await fetch("/api/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Registration failed");
            }
            await logAudit({
                action: "ADDED USER",
                details: `Registered new user "${formData.username}" (${formData.role}) — Email: ${formData.email}`,
            });
            setIsAddOpen(false);
            setFormData({ username: "", email: "", password: "", role: "Staff", contact: "", systemPIN: "" });
            setAddErrors({});
            fetchUsers();
        };

        try {
            await toast.promise(doAdd(), {
                loading: "Registering Personnel...",
                success: "Personnel Registered!",
                error: (err: Error) => err.message,
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
            <Toaster position="bottom-right" richColors />

            <div className="max-w-5xl mx-auto space-y-8">

                {/* ── HEADER ── */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.35em] text-muted-foreground mb-2 flex items-center gap-2">
                            <span className="h-px w-5 bg-current inline-block" /> Access Control
                        </p>
                        <h1 className="text-5xl md:text-6xl font-black uppercase italic tracking-tighter leading-none">
                            The<br />
                            <span className="text-muted-foreground/30">Personnel</span>
                        </h1>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={fetchUsers}
                            disabled={fetching}
                            className="h-12 w-12 flex items-center justify-center bg-card border border-border rounded-xl hover:bg-muted transition-all disabled:opacity-40"
                        >
                            <RotateCcw size={16} className={cn(fetching && "animate-spin")} />
                        </button>
                        <button
                            onClick={() => { setIsAddOpen(true); setAddErrors({}); setFormData({ username: "", email: "", password: "", role: "Staff", contact: "", systemPIN: "" }); }}
                            className="h-12 px-6 bg-foreground text-background rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:opacity-90 transition-all shadow-lg"
                        >
                            <Plus size={16} /> Register Personnel
                        </button>
                    </div>
                </div>

                {/* ── STATS ROW ── */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: "Total Users", value: users.filter(u => u.role !== "Super Admin").length, icon: Users, color: "text-foreground", bg: "bg-muted" },
                        { label: "Admins", value: adminCount, icon: ShieldCheck, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                        { label: "Staff", value: staffCount, icon: UserCog, color: "text-amber-500", bg: "bg-amber-500/10" },
                    ].map(stat => (
                        <div key={stat.label} className="bg-card border border-border rounded-[1.5rem] p-5 flex items-center gap-4">
                            <div className={cn("p-2.5 rounded-xl", stat.bg, stat.color)}>
                                <stat.icon className="size-4" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                                <p className="text-2xl font-black">{stat.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── SEARCH ── */}
                <div className="relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        className="w-full bg-card border border-border rounded-xl py-3.5 pl-12 pr-6 text-sm font-bold uppercase tracking-widest outline-none focus:border-foreground transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {/* ── TABLE ── */}
                <div className="bg-card border border-border rounded-[2rem] overflow-hidden shadow-sm">
                    <div className="px-8 py-5 border-b border-border">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            {filteredUsers.length} Personnel
                        </p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[700px]">
                            <thead>
                                <tr className="text-[9px] font-black uppercase tracking-widest text-muted-foreground border-b border-border/50">
                                    <th className="px-8 py-4">Identity</th>
                                    <th className="px-8 py-4">Email</th>
                                    <th className="px-8 py-4">Contact</th>
                                    <th className="px-8 py-4 text-center">Security Level</th>
                                    <th className="px-8 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {fetching ? (
                                    <tr><td colSpan={5} className="py-20 text-center">
                                        <Loader2 className="animate-spin mx-auto size-8 text-muted-foreground/30" />
                                    </td></tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr><td colSpan={5} className="py-20 text-center">
                                        <UserX className="mx-auto size-10 text-muted-foreground/20 mb-3" />
                                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">No personnel found</p>
                                    </td></tr>
                                ) : filteredUsers.map((user) => {
                                    const isSuperAdmin = user.role === "Super Admin";
                                    return (
                                        <tr key={user.id} onClick={() => handleRowClick(user)} className="group cursor-pointer hover:bg-muted/30 transition-all">
                                            <td className="px-8 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm italic transition-all",
                                                        isSuperAdmin ? "bg-red-500/10 text-red-500"
                                                            : "bg-muted text-muted-foreground group-hover:bg-foreground group-hover:text-background"
                                                    )}>
                                                        {user.username?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="text-sm font-black uppercase italic tracking-tight">{user.username}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-4">
                                                <span className="text-xs font-bold text-muted-foreground lowercase">{user.email}</span>
                                            </td>
                                            <td className="px-8 py-4">
                                                <span className="text-xs font-bold text-muted-foreground">{user.contact || "—"}</span>
                                            </td>
                                            <td className="px-8 py-4 text-center">
                                                <span className={cn(
                                                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                                                    isSuperAdmin ? "bg-red-500/10 text-red-500 border-red-500/20 animate-pulse"
                                                        : user.role === "Admin" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                                            : "bg-muted text-muted-foreground border-border"
                                                )}>
                                                    {isSuperAdmin && <Shield size={9} />}
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-8 py-4 text-right">
                                                <div className="flex justify-end gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                                                    {isSuperAdmin ? (
                                                        <div className="h-9 w-9 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground/30">
                                                            <Lock size={13} />
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={(e) => handleDelete(e, user)}
                                                            className="h-9 w-9 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground hover:bg-destructive hover:text-white hover:border-transparent transition-all"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ── MODAL: ADD USER ── */}
            {isAddOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-card border border-border rounded-[2.5rem] shadow-2xl w-full max-w-sm animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="p-8 space-y-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-lg font-black uppercase italic tracking-tighter">Register Node</h2>
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Enroll new personnel</p>
                                </div>
                                <button onClick={() => { setIsAddOpen(false); setAddErrors({}); }} className="p-2.5 hover:bg-muted rounded-full transition-all text-muted-foreground">
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleAddUser} className="space-y-4">
                                <FormField label="Username" error={addErrors.username} input={
                                    <input required placeholder="Identity name..."
                                        className={cn("w-full bg-muted rounded-xl px-4 py-3.5 text-xs font-bold uppercase outline-none border-2 transition-all",
                                            addErrors.username ? "border-destructive bg-destructive/5" : "border-transparent focus:border-foreground")}
                                        value={formData.username}
                                        onChange={e => { setFormData({ ...formData, username: e.target.value }); liveValidateAdd("username", e.target.value); }}
                                    />
                                } />

                                <FormField label="Email Address" error={addErrors.email} input={
                                    <input required type="email" placeholder="email@domain.com"
                                        className={cn("w-full bg-muted rounded-xl px-4 py-3.5 text-xs font-bold outline-none border-2 transition-all",
                                            addErrors.email ? "border-destructive bg-destructive/5" : "border-transparent focus:border-foreground")}
                                        value={formData.email}
                                        onChange={e => { setFormData({ ...formData, email: e.target.value }); liveValidateAdd("email", e.target.value); }}
                                    />
                                } />

                                <FormField label="Password" error={addErrors.password} input={
                                    <input required type="password" placeholder="Min. 6 characters..."
                                        className={cn("w-full bg-foreground text-background rounded-xl px-4 py-3.5 text-xs font-bold outline-none border-2 transition-all",
                                            addErrors.password ? "border-destructive" : "border-transparent")}
                                        value={formData.password}
                                        onChange={e => { setFormData({ ...formData, password: e.target.value }); liveValidateAdd("password", e.target.value); }}
                                    />
                                } />

                                <FormField label="Contact No. (Optional)" error={addErrors.contact} input={
                                    <input placeholder="09XXXXXXXXX" maxLength={11}
                                        className={cn("w-full bg-muted rounded-xl px-4 py-3.5 text-xs font-bold outline-none border-2 transition-all",
                                            addErrors.contact ? "border-destructive bg-destructive/5" : "border-transparent focus:border-foreground")}
                                        value={formData.contact}
                                        onChange={e => {
                                            const val = e.target.value.replace(/\D/g, '').slice(0, 11);
                                            setFormData({ ...formData, contact: val });
                                            liveValidateAdd("contact", val);
                                        }}
                                    />
                                } />

                                <FormField label="Security Level" error={addErrors.role} input={
                                    <select className="w-full bg-muted rounded-xl px-4 py-3.5 text-xs font-black uppercase outline-none border-2 border-transparent focus:border-foreground transition-all"
                                        value={formData.role}
                                        onChange={e => { setFormData({ ...formData, role: e.target.value }); liveValidateAdd("role", e.target.value); }}>
                                        <option value="Staff">Staff Tier</option>
                                        <option value="Admin">Admin Tier</option>
                                        {!users.some(u => u.role === "Super Admin") && (
                                            <option value="Super Admin">Root Access (Limited)</option>
                                        )}
                                    </select>
                                } />

                                {formData.role === "Super Admin" && (
                                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl space-y-3">
                                        <p className="text-[9px] font-black uppercase text-red-500 tracking-widest">Master PIN Required</p>
                                        <FormField label="System PIN" error={addErrors.systemPIN} input={
                                            <input type="password" placeholder="••••••"
                                                className={cn("w-full bg-foreground text-background rounded-xl px-4 py-3.5 text-xs font-bold text-center tracking-[0.5em] outline-none border-2 transition-all",
                                                    addErrors.systemPIN ? "border-destructive" : "border-transparent")}
                                                value={formData.systemPIN}
                                                onChange={e => { setFormData({ ...formData, systemPIN: e.target.value }); liveValidateAdd("systemPIN", e.target.value); }}
                                            />
                                        } />
                                    </div>
                                )}

                                <button type="submit" disabled={saving || Object.values(addErrors).some(Boolean)}
                                    className="w-full h-14 bg-foreground text-background rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2">
                                    {saving ? <Loader2 className="animate-spin size-4" /> : "Commit Record"}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL: ROOT VERIFICATION ── */}
            {isVerifyOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-card border border-border rounded-[2.5rem] shadow-2xl w-full max-w-sm animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-8 space-y-6 text-center">
                            <div className="mx-auto w-14 h-14 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center -rotate-6">
                                <ShieldAlert size={24} />
                            </div>
                            <div>
                                <h2 className="text-lg font-black uppercase italic tracking-tighter">Root Auth</h2>
                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Verify identity to proceed</p>
                            </div>

                            <div className="space-y-3 text-left">
                                <FormField label="Account Password" error={undefined} input={
                                    <input type="password" placeholder="Enter password..."
                                        className="w-full bg-muted rounded-xl px-4 py-3.5 text-xs font-bold outline-none border-2 border-transparent focus:border-foreground transition-all"
                                        value={verifyData.password}
                                        onChange={e => setVerifyData({ ...verifyData, password: e.target.value })}
                                    />
                                } />
                            </div>

                            <button onClick={handleVerifySubmit}
                                className="w-full h-14 bg-foreground text-background rounded-2xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all">
                                Verify Identity
                            </button>
                            <button onClick={() => setIsVerifyOpen(false)}
                                className="text-[10px] font-black text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL: EDIT PERSONNEL ── */}
            {isEditOpen && selectedUser && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-card border border-border rounded-[2.5rem] shadow-2xl w-full max-w-sm animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="p-8 space-y-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-lg font-black uppercase italic tracking-tighter">Modify Node</h2>
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                                        Editing: {selectedUser.username}
                                    </p>
                                </div>
                                <button onClick={() => { setIsEditOpen(false); setEditErrors({}); }}
                                    className="p-2.5 hover:bg-muted rounded-full transition-all text-muted-foreground">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="space-y-4">

                                {/* ── ROLE TOGGLE (Staff ↔ Admin only, locked for Super Admin) ── */}
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest ml-1 flex items-center gap-1.5">
                                        Security Level
                                        {selectedUser.role === "Super Admin"
                                            ? <Lock size={9} className="text-red-500" />
                                            : <ArrowLeftRight size={9} className="text-emerald-500" />
                                        }
                                    </label>
                                    {selectedUser.role === "Super Admin" ? (
                                        // Locked — Super Admin cannot be demoted
                                        <div className="w-full bg-red-500/5 border-2 border-red-500/20 rounded-xl px-4 py-3.5 flex items-center justify-between">
                                            <span className="text-xs font-black uppercase text-red-500 flex items-center gap-2">
                                                <Shield size={12} /> Super Admin
                                            </span>
                                            <Lock size={12} className="text-red-500/40" />
                                        </div>
                                    ) : (
                                        // Toggle button — Staff ↔ Admin
                                        <button
                                            type="button"
                                            onClick={() => setEditData(prev => ({
                                                ...prev,
                                                role: prev.role === "Staff" ? "Admin" : "Staff"
                                            }))}
                                            className={cn(
                                                "w-full rounded-xl px-4 py-3.5 border-2 flex items-center justify-between transition-all group",
                                                editData.role === "Admin"
                                                    ? "bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20"
                                                    : "bg-muted border-border hover:border-foreground"
                                            )}
                                        >
                                            <span className={cn(
                                                "text-xs font-black uppercase tracking-widest flex items-center gap-2",
                                                editData.role === "Admin" ? "text-emerald-500" : "text-muted-foreground"
                                            )}>
                                                {editData.role === "Admin"
                                                    ? <><ShieldCheck size={13} /> Admin Tier</>
                                                    : <><UserCog size={13} /> Staff Tier</>
                                                }
                                            </span>
                                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                                                <ArrowLeftRight size={10} /> Switch
                                            </span>
                                        </button>
                                    )}
                                </div>

                                {/* Username + Contact */}
                                <div className="grid grid-cols-2 gap-3">
                                    <FormField label="Username" error={editErrors.username} input={
                                        <input
                                            className={cn("w-full bg-muted rounded-xl px-4 py-3.5 text-xs font-bold uppercase outline-none border-2 transition-all",
                                                editErrors.username ? "border-destructive bg-destructive/5" : "border-transparent focus:border-foreground")}
                                            value={editData.username}
                                            onChange={e => {
                                                setEditData({ ...editData, username: e.target.value });
                                                liveValidateEdit("username", e.target.value);
                                                // Also check duplicate on-the-fly
                                                const dupe = checkEditDuplicates("username", e.target.value);
                                                if (dupe) setEditErrors(prev => ({ ...prev, username: dupe }));
                                            }}
                                        />
                                    } />
                                    <FormField label="Contact No." error={editErrors.contact} input={
                                        <input placeholder="09XXXXXXXXX" maxLength={11}
                                            className={cn("w-full bg-muted rounded-xl px-4 py-3.5 text-xs font-bold outline-none border-2 transition-all",
                                                editErrors.contact ? "border-destructive bg-destructive/5" : "border-transparent focus:border-foreground")}
                                            value={editData.contact}
                                            onChange={e => {
                                                const val = e.target.value.replace(/\D/g, '').slice(0, 11);
                                                setEditData({ ...editData, contact: val });
                                                liveValidateEdit("contact", val);
                                                // Also check duplicate on-the-fly
                                                if (val.length === 11) {
                                                    const dupe = checkEditDuplicates("contact", val);
                                                    if (dupe) setEditErrors(prev => ({ ...prev, contact: dupe }));
                                                }
                                            }}
                                        />
                                    } />
                                </div>

                                {/* ── Super Admin ONLY: Password + PIN override ── */}
                                {selectedUser.role === "Super Admin" && (
                                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl space-y-3">
                                        <p className="text-[9px] font-black uppercase text-red-500 tracking-widest flex items-center gap-1.5">
                                            <Lock size={9} /> Credential Override
                                        </p>
                                        <FormField label="New Password (optional)" error={editErrors.newPassword} input={
                                            <input type="password" placeholder="Leave blank to keep current"
                                                className={cn("w-full bg-muted rounded-xl px-4 py-3.5 text-xs font-bold outline-none border-2 transition-all",
                                                    editErrors.newPassword ? "border-destructive bg-destructive/5" : "border-transparent focus:border-foreground")}
                                                onChange={e => { setEditData({ ...editData, newPassword: e.target.value }); liveValidateEdit("newPassword", e.target.value); }}
                                            />
                                        } />
                                    </div>
                                )}
                            </div>

                            <button onClick={handleUpdate} disabled={saving || Object.values(editErrors).some(Boolean)}
                                className="w-full h-14 bg-foreground text-background rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                {saving ? <Loader2 className="animate-spin size-4" /> : "Commit Record"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── REUSABLE FORM FIELD COMPONENT ───────────────────────────────────────────
function FormField({ label, error, input }: { label: React.ReactNode; error?: string; input: React.ReactNode; }) {
    return (
        <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest ml-1 flex items-center gap-1">
                {label}
            </label>
            {input}
            {error && (
                <div className="flex items-center gap-1.5 text-destructive text-[10px] font-bold ml-1">
                    <AlertCircle className="size-3 flex-shrink-0" /> {error}
                </div>
            )}
        </div>
    );
}