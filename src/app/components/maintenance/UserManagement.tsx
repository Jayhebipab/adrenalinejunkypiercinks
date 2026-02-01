"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { 
    Trash2, UserPlus, ShieldAlert, Loader2, X, Search, 
    UserCog, Lock, KeyRound, Sparkles, Mail, Phone, Shield, ChevronRight
} from "lucide-react"
import { Toaster, toast } from "sonner"

export default function UserManagement() {
    const [users, setUsers] = useState<any[]>([]);
    const [fetching, setFetching] = useState(true);
    const [search, setSearch] = useState("");
    
    // Modals & UI State
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isVerifyOpen, setIsVerifyOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [showPinField, setShowPinField] = useState(false);

    // Data State
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [verifyData, setVerifyData] = useState({ password: "", pin: "" });
    const [editData, setEditData] = useState({ username: "", contact: "", newSystemPIN: "", newPassword: "" });
    const [formData, setFormData] = useState({ username: "", email: "", password: "", role: "Staff", contact: "", systemPIN: "" });

    const fetchUsers = async () => {
        setFetching(true);
        try {
            const res = await fetch("/api/users");
            if (!res.ok) throw new Error("Fetch failed");
            const data = await res.json();
            setUsers(Array.isArray(data) ? data : []);
        } catch (error) {
            toast.error("Database Connection Offline");
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    // Logic: Search Filter
    const filteredUsers = users.filter(user => {
        const isSearchingSuper = search.toLowerCase() === "superadmin";
        if (user.role === "Super Admin") return isSearchingSuper;
        return user.username?.toLowerCase().includes(search.toLowerCase()) || 
               user.email?.toLowerCase().includes(search.toLowerCase());
    });

    const handleRowClick = (user: any) => {
        setSelectedUser(user);
        setEditData({ 
            username: user.username || "", 
            contact: user.contact || "", 
            newSystemPIN: "", 
            newPassword: "" 
        });
        if (user.role === "Super Admin") {
            setVerifyData({ password: "", pin: "" });
            setShowPinField(false);
            setIsVerifyOpen(true);
        } else {
            setIsEditOpen(true);
        }
    };

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

    const handleUpdate = async () => {
        toast.promise(async () => {
            const res = await fetch("/api/users", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: selectedUser.id, ...editData })
            });
            if (!res.ok) throw new Error("Failed to update");
            setIsEditOpen(false);
            fetchUsers();
        }, { loading: 'Syncing...', success: 'Database Updated', error: 'Process Failed' });
    };

    const handleDelete = async (e: React.MouseEvent, userId: string) => {
        e.stopPropagation();
        if(!confirm("Are you sure you want to remove this personnel?")) return;
        toast.promise(async () => {
            const res = await fetch(`/api/users?id=${userId}`, { method: "DELETE" });
            if (!res.ok) throw new Error();
            fetchUsers();
        }, { loading: 'Removing...', success: 'Personnel Deleted', error: 'Unauthorized Action' });
    };

    const handleAddUser = async () => {
        toast.promise(async () => {
            const res = await fetch("/api/users", { method: "POST", body: JSON.stringify(formData) });
            if(!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed");
            }
            setIsAddOpen(false);
            fetchUsers();
        }, { loading: 'Registering...', success: 'Personnel Registered', error: (e) => e.message });
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 bg-white min-h-screen text-black italic antialiased">
            <Toaster position="top-center" richColors />
            
            {/* --- HEADER (Supplier Style) --- */}
            <header className="flex flex-col md:flex-row justify-between items-center bg-zinc-900 p-8 rounded-[2rem] text-white gap-6 shadow-2xl border-b-4 border-black">
                <div className="flex items-center gap-5">
                    <div className="bg-white p-4 rounded-2xl text-black -rotate-3 shadow-lg">
                        <UserCog size={32} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black uppercase tracking-tighter italic">Personnel</h1>
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Master Database v3.0</p>
                    </div>
                </div>
                <Button onClick={() => setIsAddOpen(true)} className="bg-white text-black hover:bg-zinc-200 h-16 px-10 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all active:scale-95">
                    Register New Entry +
                </Button>
            </header>

            {/* --- SEARCH --- */}
            <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black transition-colors" size={20} />
                <input 
                    type="text" 
                    placeholder="SCANNING DATABASE: ENTER NAME OR EMAIL..." 
                    className="w-full pl-16 pr-8 py-5 bg-zinc-50 border-2 border-zinc-100 rounded-3xl outline-none font-bold uppercase text-xs tracking-widest focus:border-black transition-all shadow-sm" 
                    value={search}
                    onChange={e => setSearch(e.target.value)} 
                />
            </div>

            {/* --- TABLE (Supplier Style with Overflow) --- */}
            <div className="border-2 border-zinc-100 rounded-[2.5rem] overflow-hidden bg-white shadow-sm">
                <div className="overflow-x-auto scrollbar-hide">
                    <table className="w-full text-left min-w-[900px] border-collapse">
                        <thead className="bg-zinc-50 border-b-2 border-zinc-100 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                            <tr>
                                <th className="px-10 py-6">Personal Identity</th>
                                <th className="px-10 py-6 text-center">Contact Access</th>
                                <th className="px-10 py-6 text-center">Security Level</th>
                                <th className="px-10 py-6 text-right">Protection</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50 font-bold">
                            {fetching ? (
                                <tr><td colSpan={4} className="py-24 text-center"><Loader2 className="animate-spin mx-auto w-10 h-10 text-zinc-200" /></td></tr>
                            ) : filteredUsers.map(user => (
                                <tr key={user.id} onClick={() => handleRowClick(user)} className="group cursor-pointer hover:bg-zinc-50/80 transition-all">
                                    <td className="px-10 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-zinc-100 rounded-2xl flex items-center justify-center text-zinc-400 group-hover:bg-black group-hover:text-white transition-all font-black text-xl italic border border-transparent group-hover:border-black shadow-inner">
                                                {user.username?.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="text-xl font-black uppercase italic tracking-tighter leading-none">{user.username}</div>
                                                <div className="text-[10px] text-zinc-400 mt-1 font-bold lowercase italic">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6 text-center text-xs text-zinc-500 uppercase">
                                        {user.contact || "No Contact"}
                                    </td>
                                    <td className="px-10 py-6 text-center">
                                        <div className={`inline-flex items-center gap-2 px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border-2 ${
                                            user.role === 'Super Admin' ? 'bg-red-50 border-red-100 text-red-600 animate-pulse' : 'bg-zinc-50 border-zinc-100 text-zinc-400'
                                        }`}>
                                            {user.role === 'Super Admin' && <Shield size={10} />}
                                            {user.role}
                                        </div>
                                    </td>
                                    <td className="px-10 py-6 text-right">
                                        {user.role === 'Super Admin' ? (
                                            <Lock size={18} className="inline text-zinc-200" />
                                        ) : (
                                            <button onClick={(e) => handleDelete(e, user.id)} className="p-3 bg-zinc-50 rounded-xl text-zinc-300 hover:text-red-600 hover:bg-red-50 transition-all">
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- MODAL: REGISTRATION --- */}
            {isAddOpen && (
                <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-xl rounded-[3rem] p-10 space-y-6 border-4 border-black shadow-2xl relative">
                        <button onClick={() => setIsAddOpen(false)} className="absolute top-8 right-8 p-2 hover:bg-zinc-100 rounded-full transition-colors"><X/></button>
                        <h2 className="text-3xl font-black uppercase italic tracking-tighter border-b-4 border-zinc-100 pb-4">Personnel Intake</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input className="w-full p-4 bg-zinc-50 border-2 border-zinc-100 rounded-2xl font-bold uppercase text-[11px] outline-none focus:border-black" placeholder="Identity Name" onChange={e => setFormData({...formData, username: e.target.value})} />
                            <input className="w-full p-4 bg-zinc-50 border-2 border-zinc-100 rounded-2xl font-bold uppercase text-[11px] outline-none focus:border-black" placeholder="Contact Link" onChange={e => setFormData({...formData, contact: e.target.value})} />
                        </div>
                        <input className="w-full p-4 bg-zinc-50 border-2 border-zinc-100 rounded-2xl font-bold uppercase text-[11px] outline-none focus:border-black" placeholder="Email Address" onChange={e => setFormData({...formData, email: e.target.value})} />
                        <input type="password" className="w-full p-4 bg-zinc-50 border-2 border-zinc-100 rounded-2xl font-bold uppercase text-[11px] outline-none focus:border-black" placeholder="Primary Password" onChange={e => setFormData({...formData, password: e.target.value})} />
                        
                        <select className="w-full p-4 bg-zinc-50 border-2 border-zinc-100 rounded-2xl font-black uppercase text-[11px] outline-none" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                            <option value="Staff">Staff Tier</option>
                            <option value="Admin">Admin Tier</option>
                            {!users.some(u => u.role === "Super Admin") && <option value="Super Admin">Root Access (Limited)</option>}
                        </select>

                        {formData.role === "Super Admin" && (
                            <div className="p-6 bg-red-600 rounded-2xl space-y-2">
                                <label className="text-[9px] font-black uppercase text-white tracking-[0.2em]">Set Master PIN (Required)</label>
                                <input type="password" placeholder="••••••" className="w-full p-4 bg-black text-white rounded-xl text-center font-black tracking-[1em] outline-none" onChange={e => setFormData({...formData, systemPIN: e.target.value})} />
                            </div>
                        )}

                        <Button onClick={handleAddUser} className="w-full h-16 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs">Confirm Registration</Button>
                    </div>
                </div>
            )}

            {/* --- MODAL: ROOT VERIFICATION --- */}
            {isVerifyOpen && (
                <div className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6">
                    <div className="bg-white w-full max-w-sm rounded-[3rem] p-12 text-center space-y-6 border-t-8 border-red-600 shadow-2xl">
                        <div className="mx-auto w-20 h-20 bg-red-600 text-white rounded-3xl flex items-center justify-center -rotate-6 shadow-2xl"><ShieldAlert size={40} /></div>
                        <h2 className="text-3xl font-black italic uppercase tracking-tighter">Root Auth</h2>
                        <div className="space-y-4">
                            <input type="password" placeholder="Account Password" className="w-full p-5 bg-zinc-100 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-black text-center" value={verifyData.password} onChange={e => setVerifyData({...verifyData, password: e.target.value})} />
                            {!showPinField ? (
                                <button onClick={() => setShowPinField(true)} className="w-full py-4 border-2 border-dashed border-zinc-200 rounded-2xl text-[9px] font-black uppercase text-zinc-400 hover:text-black hover:border-black transition-all tracking-[0.3em]">
                                    + Unlock Vault PIN
                                </button>
                            ) : (
                                <input type="password" placeholder="VAULT PIN" className="w-full p-5 bg-zinc-900 text-white rounded-2xl font-black outline-none text-center tracking-[1em]" value={verifyData.pin} onChange={e => setVerifyData({...verifyData, pin: e.target.value})} />
                            )}
                        </div>
                        <Button onClick={handleVerifySubmit} className="w-full h-16 bg-black text-white rounded-2xl font-black uppercase tracking-widest">Verify Identity</Button>
                        <button onClick={() => setIsVerifyOpen(false)} className="text-[10px] font-black text-zinc-400 uppercase tracking-widest hover:text-black">Abort Mission</button>
                    </div>
                </div>
            )}

            {/* --- MODAL: EDIT PERSONNEL --- */}
            {isEditOpen && selectedUser && (
                <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-6">
                    <div className="bg-white w-full max-w-lg rounded-[3.5rem] p-12 space-y-8 border-4 border-black">
                        <div className="flex justify-between items-center border-b-2 border-zinc-100 pb-6">
                            <h2 className="text-2xl font-black uppercase italic tracking-tighter">Update Data</h2>
                            <X className="cursor-pointer hover:rotate-90 transition-transform" onClick={() => setIsEditOpen(false)} />
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <input className="w-full p-4 bg-zinc-50 border-2 border-zinc-100 rounded-xl font-bold outline-none focus:border-black" value={editData.username} onChange={e => setEditData({...editData, username: e.target.value})} />
                                <input className="w-full p-4 bg-zinc-50 border-2 border-zinc-100 rounded-xl font-bold outline-none focus:border-black" value={editData.contact} onChange={e => setEditData({...editData, contact: e.target.value})} />
                            </div>
                            {selectedUser.role === "Super Admin" && (
                                <div className="p-8 bg-zinc-950 rounded-[2.5rem] space-y-4 border-l-8 border-red-600 shadow-2xl">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-red-500">Credential Override</h3>
                                    <input type="password" placeholder="New Account Password" className="w-full p-4 bg-white/10 border border-white/20 rounded-xl font-bold text-white outline-none focus:border-red-500" onChange={e => setEditData({...editData, newPassword: e.target.value})} />
                                    <input type="password" placeholder="New Master PIN" className="w-full p-4 bg-white/10 border border-white/20 rounded-xl font-bold text-white outline-none focus:border-red-500 text-center tracking-widest" onChange={e => setEditData({...editData, newSystemPIN: e.target.value})} />
                                </div>
                            )}
                        </div>
                        <Button onClick={handleUpdate} className="w-full h-18 bg-black text-white rounded-2xl font-black uppercase tracking-widest py-8 transition-transform active:scale-95">Push Updates to Cloud</Button>
                    </div>
                </div>
            )}
        </div>
    );
}