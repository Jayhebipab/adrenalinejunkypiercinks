"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { 
  Loader2, 
  Search, 
  UserCog, 
  Trash2, 
  Plus, 
  Settings2, 
  X, 
  ShieldCheck, 
  ShieldAlert 
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Module {
  id: string;
  label: string;
  order: number;
}

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  [key: string]: any; 
}

export default function AccessControl() {
  const [users, setUsers] = useState<User[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [showModuleMgr, setShowModuleMgr] = useState(false);
  const [newModule, setNewModule] = useState({ id: '', label: '', order: 0 });
  const [isAddingModule, setIsAddingModule] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, modulesRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/modules')
      ]);

      if (!usersRes.ok || !modulesRes.ok) throw new Error("Fetch failed");

      const userData = await usersRes.json();
      const moduleData = await modulesRes.json();

      const filteredUsers = userData.filter((u: User) => u.role !== 'Super Admin');
      
      setUsers(filteredUsers);
      setModules(moduleData);
    } catch (err) {
      toast.error("Database connection error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

  const addModule = async () => {
    if (!newModule.id || !newModule.label) {
      toast.error("Module ID and Label are required");
      return;
    }
    
    setIsAddingModule(true);
    try {
      const res = await fetch('/api/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newModule),
      });

      if (res.ok) {
        toast.success(`Module ${newModule.label} initialized`);
        setNewModule({ id: '', label: '', order: modules.length + 1 });
        fetchData();
      } else {
        toast.error("Failed to create module");
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setIsAddingModule(false);
    }
  };

  const deleteModule = async (id: string) => {
    try {
      const res = await fetch(`/api/modules?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success("Module purged from core");
        fetchData();
      } else {
        toast.error("Purge failed");
      }
    } catch (err) {
      toast.error("Network error");
    }
  };

  const toggleAccess = async (userId: string, field: string, currentStatus: string | undefined) => {
    const newStatus = currentStatus === "live" ? "locked" : "live"; 
    setUpdatingId(`${userId}-${field}`);

    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: userId, 
          [field]: newStatus 
        }),
      });

      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, [field]: newStatus } : u));
        toast.success(`${field} is now ${newStatus}`);
      } else {
        toast.error("Sync failed");
      }
    } catch (err) {
      toast.error("Update failed");
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteStaff = async (id: string) => {
    try {
      const res = await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== id));
        toast.success("Personnel removed from system");
      }
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-500 animate-pulse">Syncing Core...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-background p-6 lg:p-12 font-mono transition-colors duration-300">
      <Toaster richColors position="top-center" />
      
      <header className="max-w-7xl mx-auto mb-16 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-7xl font-black uppercase tracking-tighter leading-[0.8] text-zinc-900 dark:text-foreground">
            Access<br /><span className="text-zinc-300 dark:text-muted-foreground/10">Control</span>
          </h1>
          <div className="flex gap-4 mt-6">
            <Button 
              onClick={() => setShowModuleMgr(!showModuleMgr)}
              variant="outline" 
              className={`rounded-xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-[10px] font-black tracking-widest uppercase h-10 px-6 shadow-sm transition-all ${showModuleMgr ? 'border-primary text-primary' : 'text-zinc-600 dark:text-zinc-400'}`}
            >
              <Settings2 className="mr-2 h-4 w-4" /> 
              {showModuleMgr ? "Close Manager" : "Manage Modules"}
            </Button>
          </div>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input 
            placeholder="FIND PERSONNEL..." 
            className="h-14 pl-12 rounded-2xl bg-white dark:bg-card border-zinc-200 dark:border-border uppercase font-bold text-xs shadow-sm focus:ring-primary/20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      {showModuleMgr && (
        <div className="max-w-7xl mx-auto mb-12 p-8 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-primary/20 rounded-[2.5rem] animate-in fade-in slide-in-from-top-4 shadow-xl">
          <h2 className="text-xl font-black uppercase mb-6 flex items-center gap-2 text-zinc-900 dark:text-white">
            <Plus className="text-primary h-5 w-5" /> Core Module Registration
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="hidden">
              <p>System ID</p>
              <Input value={newModule.id} readOnly />
            </div>
            <div className="space-y-1">
              <p className="text-[8px] font-bold text-zinc-400 dark:text-zinc-500 ml-2 uppercase">Display Label (UI Name)</p>
              <Input 
                placeholder="e.g. Category" 
                value={newModule.label}
                onChange={e => {
                  const val = e.target.value;
                  setNewModule({ ...newModule, label: val, id: val.replace(/\s+/g, '') });
                }}
                className="bg-zinc-50 dark:bg-background border-zinc-200 dark:border-zinc-800 rounded-xl text-[10px] h-12"
              />
            </div>
            <div className="hidden">
              <p>Sort Order</p>
              <Input value={newModule.order} readOnly />
            </div>
            <Button 
              onClick={addModule} 
              disabled={isAddingModule}
              className="mt-5 rounded-xl bg-primary text-black font-black uppercase text-[10px] h-12 hover:bg-primary/90"
            >
              {isAddingModule ? <Loader2 className="animate-spin" /> : "Initialize Module"}
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {modules.map(mod => (
              <Badge key={mod.id} variant="secondary" className="pl-4 pr-1 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-[9px] uppercase font-black tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                {mod.label}
                <button 
                  onClick={() => deleteModule(mod.id)} 
                  className="ml-2 p-1 bg-zinc-200 dark:bg-zinc-800 rounded-full hover:text-destructive hover:bg-destructive/10 transition-all"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto grid gap-8">
        {users.filter(u => u.username.toLowerCase().includes(searchQuery.toLowerCase())).map(user => (
          <div key={user.id} className="bg-white dark:bg-card border border-zinc-200 dark:border-border rounded-[3rem] p-8 flex flex-col xl:flex-row items-center justify-between gap-8 hover:border-primary/30 transition-all group shadow-sm dark:shadow-xl">
            <div className="flex items-center gap-6 w-full xl:w-1/4">
              <div className="h-16 w-16 rounded-[1.5rem] bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center border border-zinc-200 dark:border-border group-hover:scale-110 transition-transform shadow-inner">
                <UserCog className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter text-zinc-900 dark:text-foreground">{user.username}</h3>
                <Badge className="bg-primary/10 text-primary border-none text-[9px] uppercase font-black tracking-widest px-3 mt-1">
                  {user.role}
                </Badge>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 bg-zinc-50 dark:bg-zinc-950/40 p-6 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-900 shadow-inner">
              {modules.length > 0 ? (
                modules.map((mod) => (
                  <PermissionToggle 
                    key={mod.id}
                    label={mod.label} 
                    status={user[mod.id] || "locked"} 
                    onToggle={() => toggleAccess(user.id, mod.id, user[mod.id])}
                    disabled={updatingId === `${user.id}-${mod.id}`}
                  />
                ))
              ) : (
                <div className="col-span-full py-4 text-center">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest animate-pulse italic">
                    Waiting for core module initialization...
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full h-12 w-12 text-zinc-400 hover:text-destructive hover:bg-destructive/10 transition-colors">
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-[2.5rem] bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 font-mono">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="font-black uppercase tracking-tighter text-2xl text-zinc-900 dark:text-white">Remove Personnel?</AlertDialogTitle>
                    <AlertDialogDescription className="italic text-xs text-zinc-500">
                      This action will purge <span className="text-primary font-bold">{user.username}</span> from the system core.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="mt-6">
                    <AlertDialogCancel className="rounded-xl uppercase font-black text-[10px] border-zinc-200 dark:border-zinc-800">Abort</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteStaff(user.id)} className="bg-destructive text-white hover:bg-destructive/90 rounded-xl uppercase font-black text-[10px]">Confirm Purge</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PermissionToggle({ label, status, onToggle, disabled }: any) {
  const isLive = status === "live";
  
  return (
    <div className={`flex items-center justify-between p-3 rounded-2xl border transition-all duration-300 ${isLive ? 'bg-primary/5 border-primary/20 ring-1 ring-primary/10' : 'bg-white dark:bg-background border-zinc-200 dark:border-border/50 opacity-40 grayscale'}`}>
      <div className="flex flex-col">
        <p className="text-[8px] font-black uppercase tracking-tighter text-zinc-400 dark:text-muted-foreground mb-0.5">{label}</p>
        <div className="flex items-center gap-1">
          {isLive ? <ShieldCheck className="h-3 w-3 text-primary" /> : <ShieldAlert className="h-3 w-3 text-zinc-400 dark:text-zinc-600" />}
          <span className={`text-[9px] font-bold uppercase tracking-widest ${isLive ? 'text-primary' : 'text-zinc-400 dark:text-zinc-600'}`}>
            {status} 
          </span>
        </div>
      </div>
      <Switch 
        checked={isLive} 
        onCheckedChange={onToggle} 
        disabled={disabled}
        className="data-[state=checked]:bg-primary"
      />
    </div>
  );
}