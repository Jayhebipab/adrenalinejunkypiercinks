"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { 
    Trash2, UserPlus, ShieldAlert, Loader2, X, Search, 
    UserCog, Lock, KeyRound, Sparkles, Mail, Phone, Shield 
} from "lucide-react"
import { Toaster, toast } from "sonner"

export default function UserManagement() {
    const [users, setUsers] = useState<any[]>([]);
    const [fetching, setFetching] = useState(true);
    const [search, setSearch] = useState("");
    
    // Modals & UI
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isVerifyOpen, setIsVerifyOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [showPinField, setShowPinField] = useState(false);

    // Data
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [verifyData, setVerifyData] = useState({ password: "", pin: "" });
    const [editData, setEditData] = useState({ username: "", contact: "", newSystemPIN: "", newPassword: "" });
    const [formData, setFormData] = useState({ username: "", email: "", password: "", role: "Staff", contact: "", systemPIN: "" });

const fetchUsers = async () => {
    setFetching(true); // Simulan ang loading
    try {
        const res = await fetch("/api/users");

        if (!res.ok) {
            const errorText = await res.text();
            console.error("Server Error Output:", errorText || "Empty Response from Server");
            setFetching(false);
            return;
        }

        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            console.error("Hindi JSON ang binalik ng server!");
            setFetching(false);
            return;
        }

        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []); // Siguraduhing array ang ise-set
    } catch (error) {
        console.error("Fetch Error:", error);
        toast.error("Connection Refused by Database");
    } finally {
        setFetching(false); // Patayin ang loading spinner
    }
};

    useEffect(() => { fetchUsers(); }, []);

    // --- LOGIC: SEARCH FILTER (STEALTH MODE) ---
    const filteredUsers = users.filter(user => {
        const isSearchingSuper = search.toLowerCase() === "superadmin";
        
        // Kung hindi "superadmin" ang sinesearch, itago ang Super Admin role
        if (user.role === "Super Admin") {
            return isSearchingSuper;
        }

        // Normal search para sa ibang staff
        return user.username?.toLowerCase().includes(search.toLowerCase()) || 
               user.email?.toLowerCase().includes(search.toLowerCase());
    });

    const handleRowClick = (user: any) => {
        setSelectedUser(user);
        setEditData({ username: user.username || "", contact: user.contact || "", newSystemPIN: "", newPassword: "" });
        if (user.role === "Super Admin") {
            setVerifyData({ password: "", pin: "" });
            setShowPinField(false);
            setIsVerifyOpen(true);
        } else {
            setIsEditOpen(true);
        }
    };

    const handleVerifySubmit = async () => {
        if (!selectedUser?._id) return;
        const res = await fetch("/api/users", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: selectedUser._id, currentPassword: verifyData.password, systemPIN: verifyData.pin, isVerifying: true })
        });

        if (res.ok) {
            setIsVerifyOpen(false);
            setIsEditOpen(true);
            toast.success("Root Access Granted");
        } else {
            toast.error("Security Bypass Failed");
        }
    };

    const handleUpdate = async () => {
        toast.promise(async () => {
            const res = await fetch("/api/users", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: selectedUser._id, ...editData })
            });
            if (!res.ok) throw new Error();
            setIsEditOpen(false);
            fetchUsers();
        }, { loading: 'Syncing database...', success: 'Data Updated', error: 'Failed to update' });
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 bg-white min-h-screen text-black">
            <Toaster position="top-center" richColors />
            
            <header className="flex flex-col md:flex-row justify-between items-center bg-zinc-900 p-8 rounded-[2.5rem] text-white shadow-2xl gap-6">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-white rounded-3xl -rotate-6 shadow-xl text-black"><UserCog /></div>
                    <div>
                        <h1 className="text-3xl font-black italic uppercase tracking-tighter">Staff Registry</h1>
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic">Database Matrix v2.0</p>
                    </div>
                </div>
                <Button onClick={() => setIsAddOpen(true)} className="bg-white text-black hover:bg-zinc-200 rounded-2xl h-14 px-8 font-black uppercase text-xs tracking-widest shadow-xl">Register New</Button>
            </header>

            {/* SEARCH BAR (WITH STEALTH HINT) */}
            <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black transition-colors" />
                <input 
                    type="text" 
                    placeholder="Search personnel name or email..." 
                    className="w-full pl-16 pr-8 py-5 bg-zinc-50 rounded-3xl outline-none font-bold border border-zinc-100 focus:ring-2 ring-black transition-all shadow-sm" 
                    value={search}
                    onChange={e => setSearch(e.target.value)} 
                />
            </div>

            {/* TABLE */}
            <div className="bg-white border border-zinc-100 rounded-[2.5rem] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[800px]">
                        <thead className="bg-zinc-900 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                            <tr>
                                <th className="px-10 py-6">Personal Info</th>
                                <th className="px-10 py-6">Role / Level</th>
                                <th className="px-10 py-6 text-right">Protection</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 font-sans">
                            {fetching ? (
                                <tr><td colSpan={3} className="py-20 text-center"><Loader2 className="animate-spin mx-auto w-10 h-10" /></td></tr>
                            ) : filteredUsers.map(user => (
                                <tr key={user._id} onClick={() => handleRowClick(user)} className="group cursor-pointer hover:bg-zinc-50 transition-all">
                                    <td className="px-10 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center font-black italic text-zinc-400 group-hover:bg-black group-hover:text-white transition-all">
                                                {user.username?.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="space-y-1">
                                                <div className="font-black uppercase italic tracking-tighter text-lg leading-none">{user.username}</div>
                                                <div className="flex items-center gap-3 text-zinc-400 text-xs font-bold">
                                                    <span className="flex items-center gap-1"><Mail size={12}/> {user.email}</span>
                                                    {user.contact && <span className="flex items-center gap-1 border-l pl-3"><Phone size={12}/> {user.contact}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6">
                                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                            user.role === 'Super Admin' ? 'bg-red-600 text-white animate-pulse shadow-lg shadow-red-200' : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                                        }`}>
                                            {user.role === 'Super Admin' && <Shield size={10} />}
                                            {user.role}
                                        </div>
                                    </td>
                                    <td className="px-10 py-6 text-right">
                                        {user.role === 'Super Admin' ? <Lock className="inline w-5 h-5 text-red-200" /> : <Trash2 className="inline w-5 h-5 text-red-300 opacity-0 group-hover:opacity-100 transition-opacity" />}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL: SECURITY BYPASS */}
            {isVerifyOpen && (
                <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6">
                    <div className="bg-white w-full max-w-md rounded-[3rem] p-10 space-y-6 text-center shadow-2xl animate-in zoom-in">
                        <div className="mx-auto w-16 h-16 bg-red-600 text-white rounded-2xl flex items-center justify-center -rotate-6 shadow-2xl"><ShieldAlert /></div>
                        <h2 className="text-3xl font-black italic uppercase tracking-tighter">Root Auth</h2>
                        <div className="space-y-4 text-left">
                            <input type="password" placeholder="Account Password" className="w-full p-5 bg-zinc-100 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-black" value={verifyData.password} onChange={e => setVerifyData({...verifyData, password: e.target.value})} />
                            {!showPinField ? (
                                <button onClick={() => setShowPinField(true)} className="w-full py-4 border-2 border-dashed border-zinc-200 rounded-2xl text-[9px] font-black uppercase text-zinc-400 hover:bg-zinc-50 flex items-center justify-center gap-2 tracking-widest">
                                    <Sparkles className="w-3 h-3 text-red-500" /> Activate Master Vault
                                </button>
                            ) : (
                                <div className="space-y-1 animate-in slide-in-from-top-2">
                                    <label className="text-[9px] font-black uppercase text-red-600 ml-2 tracking-widest">Vault PIN</label>
                                    <input type="password" placeholder="••••••" className="w-full p-5 bg-zinc-900 text-white rounded-2xl font-black outline-none text-center tracking-[0.8em]" value={verifyData.pin} onChange={e => setVerifyData({...verifyData, pin: e.target.value})} />
                                </div>
                            )}
                        </div>
                        <Button onClick={handleVerifySubmit} className="w-full h-16 bg-black text-white rounded-2xl font-black uppercase tracking-widest shadow-2xl">Unlock Root</Button>
                        <button onClick={() => setIsVerifyOpen(false)} className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Abort</button>
                    </div>
                </div>
            )}

            {/* MODAL: EDIT MODE */}
            {isEditOpen && selectedUser && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
                    <div className="bg-white w-full max-w-lg rounded-[3.5rem] p-12 space-y-8 animate-in fade-in">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-black uppercase italic tracking-tighter">Edit Personnel</h2>
                            <X className="cursor-pointer hover:rotate-90 transition-transform" onClick={() => setIsEditOpen(false)} />
                        </div>
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-zinc-400 uppercase ml-2 italic">Username</label>
                                    <input className="w-full p-4 bg-zinc-50 rounded-xl font-bold border outline-none focus:ring-2 ring-black" value={editData.username} onChange={e => setEditData({...editData, username: e.target.value})} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-zinc-400 uppercase ml-2 italic">Contact</label>
                                    <input className="w-full p-4 bg-zinc-50 rounded-xl font-bold border outline-none focus:ring-2 ring-black" value={editData.contact} onChange={e => setEditData({...editData, contact: e.target.value})} />
                                </div>
                            </div>

                            {selectedUser?.role === "Super Admin" && (
                                <div className="p-8 bg-zinc-950 rounded-[2.5rem] space-y-5 text-white border-t-4 border-red-600 shadow-2xl">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500">Root Credentials Bypass</h3>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black uppercase ml-1 opacity-50 italic">New Account Password</label>
                                        <input type="password" placeholder="Change personal password" className="w-full p-4 bg-white/5 border border-white/10 rounded-xl font-bold text-white outline-none focus:border-red-500 transition-all" onChange={e => setEditData({...editData, newPassword: e.target.value})} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black uppercase ml-1 opacity-50 italic">New Master PIN</label>
                                        <input type="password" placeholder="Change vault pin" className="w-full p-4 bg-white/5 border border-white/10 rounded-xl font-bold text-white outline-none focus:border-red-500 text-center tracking-widest transition-all" onChange={e => setEditData({...editData, newSystemPIN: e.target.value})} />
                                    </div>
                                </div>
                            )}
                        </div>
                        <Button onClick={handleUpdate} className="w-full h-18 bg-black text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl text-xs py-8 active:scale-95 transition-all">Save Personnel Data</Button>
                    </div>
                </div>
            )}

            {/* MODAL: ADD */}
            {isAddOpen && (
                <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-6">
                    <div className="bg-white w-full max-w-xl rounded-[3rem] p-12 space-y-4">
                        <h2 className="text-3xl font-black uppercase italic tracking-tighter">Registration</h2>
                        <input className="w-full p-4 bg-zinc-100 rounded-2xl font-bold outline-none" placeholder="Username" onChange={e => setFormData({...formData, username: e.target.value})} />
                        <input className="w-full p-4 bg-zinc-100 rounded-2xl font-bold outline-none" placeholder="Email Address" onChange={e => setFormData({...formData, email: e.target.value})} />
                        <input type="password" className="w-full p-4 bg-zinc-100 rounded-2xl font-bold outline-none" placeholder="Account Password" onChange={e => setFormData({...formData, password: e.target.value})} />
                        <select className="w-full p-4 bg-zinc-100 rounded-2xl font-bold outline-none cursor-pointer" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                            <option value="Staff">Staff Access</option>
                            <option value="Admin">Admin Access</option>
                            {!users.some(u => u.role === "Super Admin") && <option value="Super Admin">Root Access (Limited)</option>}
                        </select>
                        {formData.role === "Super Admin" && <input type="password" placeholder="Set Master System PIN" className="w-full p-4 bg-zinc-900 text-white rounded-2xl text-center font-black tracking-widest" onChange={e => setFormData({...formData, systemPIN: e.target.value})} />}
                        <Button className="w-full h-16 bg-black text-white rounded-2xl font-black uppercase tracking-widest" onClick={async () => {
                             const res = await fetch("/api/users", { method: "POST", body: JSON.stringify(formData) });
                             if(res.ok) { setIsAddOpen(false); fetchUsers(); toast.success("Personnel Added"); } else { toast.error("Role or Email restricted."); }
                        }}>Confirm Access</Button>
                        <button className="text-[10px] font-black uppercase text-zinc-400 w-full" onClick={() => setIsAddOpen(false)}>Cancel</button>
                    </div>
                </div>
            )}
        </div>
    );
}