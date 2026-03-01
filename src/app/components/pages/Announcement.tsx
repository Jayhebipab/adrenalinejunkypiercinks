"use client"

import React, { useState, useEffect, useRef } from "react"
import {
  Loader2, Trash2, Megaphone, Globe,
  Users, Type, FileText, CheckCircle2, UserPlus,
  ShieldCheck, Clock, Send, Search, ChevronDown,
  X, Check, UserCheck
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { db } from "@/lib/firebase"
import { doc, getDoc, setDoc, collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

// ─── AUDIT TRAIL ──────────────────────────────────────────────────────────────
async function logAudit({ action, details, module = "Announcement Manager" }: {
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

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface DbUser {
  id: string;
  email: string;
  name?: string;
}

// ─── SEARCHABLE USER DROPDOWN ─────────────────────────────────────────────────
function UserDropdown({
  users,
  selected,
  onChange,
}: {
  users: DbUser[];
  selected: string[];   // selected emails
  onChange: (emails: string[]) => void;
}) {
  const [open, setOpen]         = useState(false);
  const [search, setSearch]     = useState("");
  const dropdownRef             = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (email: string) => {
    onChange(
      selected.includes(email)
        ? selected.filter(e => e !== email)
        : [...selected, email]
    );
  };

  const selectAll   = () => onChange(users.map(u => u.email));
  const deselectAll = () => onChange([]);

  return (
    <div ref={dropdownRef} className="relative w-full">

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={cn(
          "w-full flex items-center justify-between h-11 px-4 bg-background border text-left transition-all",
          open ? "border-foreground" : "border-border hover:border-muted-foreground"
        )}
      >
        <span className="flex items-center gap-2 text-[11px] font-bold text-foreground">
          <UserCheck size={13} className="text-orange-500 shrink-0" />
          {selected.length === 0
            ? "Select recipients..."
            : selected.length === users.length
              ? `All ${users.length} users selected`
              : `${selected.length} of ${users.length} selected`}
        </span>
        <ChevronDown size={14} className={cn("text-muted-foreground transition-transform shrink-0", open && "rotate-180")} />
      </button>

      {/* Selected chips (below trigger) */}
      {selected.length > 0 && selected.length < users.length && (
        <div className="flex flex-wrap gap-1.5 mt-2 max-h-24 overflow-y-auto">
          {selected.map(email => {
            const user = users.find(u => u.email === email);
            return (
              <span
                key={email}
                className="inline-flex items-center gap-1 bg-foreground text-background px-2.5 py-1 text-[9px] font-black uppercase tracking-wide"
              >
                {user?.name ? user.name : email}
                <button onClick={() => toggle(email)} className="hover:opacity-60 transition-opacity ml-0.5">
                  <X size={9} />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Dropdown panel */}
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border shadow-2xl max-h-72 flex flex-col">

          {/* Search + bulk actions */}
          <div className="p-2 border-b border-border space-y-2 shrink-0">
            <div className="relative">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-8 pr-3 py-2 bg-muted text-[11px] font-bold outline-none placeholder:text-muted-foreground/50 text-foreground"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={selectAll}
                className="flex-1 text-[9px] font-black uppercase tracking-widest py-1.5 bg-foreground text-background hover:opacity-80 transition-all flex items-center justify-center gap-1"
              >
                <Check size={10} /> All
              </button>
              <button
                onClick={deselectAll}
                className="flex-1 text-[9px] font-black uppercase tracking-widest py-1.5 bg-muted border border-border hover:bg-destructive/10 hover:text-destructive transition-all flex items-center justify-center gap-1"
              >
                <X size={10} /> Clear
              </button>
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1">
            {filtered.length === 0 ? (
              <p className="text-center text-[10px] font-black text-muted-foreground uppercase py-6 tracking-widest">
                No users found
              </p>
            ) : filtered.map(user => {
              const isChecked = selected.includes(user.email);
              return (
                <button
                  key={user.id}
                  onClick={() => toggle(user.email)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 text-left transition-all hover:bg-muted/50 border-b border-border/30 last:border-0",
                    isChecked && "bg-orange-500/5"
                  )}
                >
                  {/* Checkbox */}
                  <div className={cn(
                    "h-4 w-4 shrink-0 border-2 flex items-center justify-center transition-all",
                    isChecked ? "bg-orange-500 border-orange-500" : "border-border"
                  )}>
                    {isChecked && <Check size={10} className="text-white" strokeWidth={3} />}
                  </div>

                  {/* Avatar initial */}
                  <div className={cn(
                    "h-7 w-7 shrink-0 flex items-center justify-center text-[9px] font-black",
                    isChecked ? "bg-orange-500 text-white" : "bg-muted text-muted-foreground"
                  )}>
                    {(user.name || user.email).charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    {user.name && (
                      <p className="text-[10px] font-black uppercase tracking-tight truncate text-foreground">
                        {user.name}
                      </p>
                    )}
                    <p className={cn(
                      "text-[9px] font-mono truncate",
                      user.name ? "text-muted-foreground" : "text-foreground font-bold"
                    )}>
                      {user.email}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-border bg-muted/30 flex justify-between items-center shrink-0">
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
              {selected.length} selected
            </span>
            <button
              onClick={() => setOpen(false)}
              className="text-[9px] font-black uppercase tracking-widest text-foreground hover:text-orange-500 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function AnnouncementManager() {
  const [loading, setLoading]           = useState(true)
  const [isSaving, setIsSaving]         = useState(false)
  const [lastBroadcast, setLastBroadcast] = useState<any>(null)
  const textareaRef                     = useRef<HTMLTextAreaElement>(null)

  // All DB users
  const [allUsers, setAllUsers]         = useState<DbUser[]>([])

  // Sync mode: true = all users, false = manual selection
  const [syncAll, setSyncAll]           = useState(true)
  const [selectedEmails, setSelectedEmails] = useState<string[]>([])

  // Extra manual emails (raw input)
  const [showManualInput, setShowManualInput] = useState(false)
  const [extraRecipients, setExtraRecipients] = useState<string[]>([""])

  const [formData, setFormData] = useState({
    from: "AJ PIERCINKS ADMIN",
    replyTo: "jpablobscs@tfvc.edu.ph",
    subject: "",
    content: "",
  })

  // ─── FETCH SETTINGS + USERS ─────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Settings
        const docSnap = await getDoc(doc(db, "settings", "announcementConfig"));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData(prev => ({ ...prev, ...data }));
          if (data.lastSentAt) setLastBroadcast(data.lastSentAt.toDate());
        }

        // All subscribers/users
        const snapshot = await getDocs(collection(db, "subscribers"));
        const users: DbUser[] = snapshot.docs
          .map(d => ({ id: d.id, email: d.data().email, name: d.data().name }))
          .filter(u => u.email?.includes("@"));
        setAllUsers(users);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ─── DISPATCH ───────────────────────────────────────────────────────────
  const handlePublish = async () => {
    if (!formData.subject.trim()) { toast.error("Subject is required."); return; }
    if (!formData.content.trim()) { toast.error("Message content cannot be empty."); return; }

    const manualEmails = extraRecipients.map(e => e.trim()).filter(e => e.includes("@"));

    // Build final recipient list
    let base: string[] = [];
    if (syncAll) {
      base = allUsers.map(u => u.email);
    } else {
      base = selectedEmails;
    }

    const finalList = Array.from(new Set([...base, ...manualEmails]));
    if (finalList.length === 0) { toast.error("No recipients selected."); return; }

    setIsSaving(true);
    const toastId = toast.loading("Deploying official transmission...");

    try {
      const res = await fetch('/api/application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, recipients: finalList }),
      });
      if (!res.ok) throw new Error("API Transmission Failed");

      const timestamp = new Date();
      await setDoc(doc(db, "settings", "announcementConfig"), {
        ...formData, lastSentAt: serverTimestamp()
      }, { merge: true });

      await logAudit({
        action: "SENT ANNOUNCEMENT",
        details: `Broadcast "${formData.subject}" → ${finalList.length} recipient(s). Mode: ${syncAll ? "All Sync" : `Manual (${selectedEmails.length} selected)`}. Extra: ${manualEmails.length}.`,
      });

      setLastBroadcast(timestamp);
      toast.success("Broadcast successful.", { id: toastId });
      setFormData(prev => ({ ...prev, content: "", subject: "" }));
      if (!syncAll) setSelectedEmails([]);
    } catch (err: any) {
      toast.error(err.message, { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="animate-spin text-muted-foreground" size={32} />
    </div>
  );

  // Compute recipient count preview
  const recipientCount = syncAll
    ? allUsers.length
    : Array.from(new Set([
        ...selectedEmails,
        ...extraRecipients.map(e => e.trim()).filter(e => e.includes("@"))
      ])).length;

  return (
    <div className="max-w-7xl mx-auto rounded-none border border-border shadow-2xl bg-background text-foreground flex flex-col overflow-hidden animate-in fade-in duration-700">

      {/* TOP STATUS BAR */}
      <div className="bg-muted/50 px-6 py-2 border-b border-border flex justify-between items-center">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-[10px] font-black text-orange-500 tracking-widest uppercase animate-pulse">
            <ShieldCheck size={12} /> Secure Link
          </span>
          <span className="h-3 w-[1px] bg-border" />
          <span className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            <Clock size={12} />
            {lastBroadcast ? `Last Broadcast: ${format(lastBroadcast, 'MMM dd, yyyy HH:mm')}` : 'No Logs'}
          </span>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground/60">AJ-ADMIN-PROTOCOL</span>
      </div>

      {/* HEADER */}
      <div className="px-10 py-12 border-b border-border bg-gradient-to-b from-muted/30 to-transparent flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase mb-1 flex items-center gap-3">
            <Megaphone size={32} /> Command Center
          </h1>
          <p className="text-muted-foreground text-[11px] font-bold uppercase tracking-[0.4em]">Official Studio Correspondence Protocol</p>
        </div>

        <div className="flex flex-col items-end gap-2">
          {/* Live recipient count */}
          <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">
            {recipientCount} recipient{recipientCount !== 1 ? "s" : ""} targeted
          </span>
          <Button
            onClick={handlePublish}
            disabled={isSaving}
            className="bg-foreground text-background hover:bg-foreground/90 font-black px-10 h-14 rounded-none uppercase text-[12px] tracking-[0.2em] transition-all shadow-lg"
          >
            {isSaving ? <Loader2 className="animate-spin mr-2" size={16} /> : <Send className="mr-2" size={16} />}
            Execute Dispatch
          </Button>
        </div>
      </div>

      {/* BODY */}
      <div className="p-10 grid grid-cols-12 gap-10">

        {/* ── LEFT: SETTINGS ── */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="space-y-6 bg-muted/20 p-6 border border-border">

            {/* Sender */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <Users size={12} className="text-foreground" /> Sender Identity
              </Label>
              <Input
                value={formData.from}
                onChange={e => setFormData(p => ({ ...p, from: e.target.value }))}
                className="h-11 rounded-none bg-background border-border text-[13px] font-bold focus:ring-1 focus:ring-foreground transition-all"
              />
            </div>

            {/* ── ALL SYNC TOGGLE ── */}
            <div className="pt-4 border-t border-border space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <Globe size={12} className="text-foreground" /> All Sync
                  <span className="text-[9px] font-bold text-muted-foreground normal-case tracking-normal">
                    ({allUsers.length} users)
                  </span>
                </Label>
                <Switch
                  checked={syncAll}
                  onCheckedChange={(val) => {
                    setSyncAll(val);
                    if (val) setSelectedEmails([]);
                  }}
                  className="data-[state=checked]:bg-orange-600"
                />
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed font-medium">
                {syncAll
                  ? "All registered users will receive this broadcast."
                  : "Pick specific users from the dropdown below."}
              </p>
            </div>

            {/* ── MANUAL SELECTION DROPDOWN — shown when All Sync is OFF ── */}
            {!syncAll && (
              <div className="pt-2 space-y-2 animate-in slide-in-from-top-2 duration-300">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <UserCheck size={12} className="text-foreground" /> Select Recipients
                </Label>
                <UserDropdown
                  users={allUsers}
                  selected={selectedEmails}
                  onChange={setSelectedEmails}
                />
              </div>
            )}

            {/* ── EXTRA MANUAL EMAILS ── */}
            <div className="pt-4 border-t border-border space-y-3">
              <button
                onClick={() => setShowManualInput(!showManualInput)}
                className="w-full h-11 border border-dashed border-border text-[10px] font-black uppercase tracking-widest hover:bg-foreground hover:text-background transition-all flex items-center justify-center gap-2"
              >
                <UserPlus size={14} />
                {showManualInput ? "Hide Emails" : "Send Emails"}
              </button>
            </div>
          </div>

          {/* Extra email inputs */}
          {showManualInput && (
            <div className="bg-muted/10 border border-border p-4 space-y-3 animate-in slide-in-from-top-4 duration-500">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[9px] font-black text-muted-foreground uppercase">Extra Targets</span>
                <button onClick={() => setExtraRecipients([...extraRecipients, ""])} className="text-foreground hover:text-orange-500 transition-colors">
                  <UserPlus size={14} />
                </button>
              </div>
              {extraRecipients.map((email, idx) => (
                <div key={idx} className="flex gap-2 group">
                  <input
                    value={email}
                    onChange={e => {
                      const n = [...extraRecipients]; n[idx] = e.target.value; setExtraRecipients(n);
                    }}
                    className="flex-1 bg-transparent border-b border-border py-1 text-[11px] outline-none focus:border-foreground transition-all font-mono text-foreground"
                    placeholder="extra@email.com"
                  />
                  <button
                    onClick={() => setExtraRecipients(extraRecipients.filter((_, i) => i !== idx))}
                    className="text-muted-foreground hover:text-destructive transition-all"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── RIGHT: EDITOR ── */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <div className="space-y-3">
            <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] flex items-center gap-2">
              <Type size={12} className="text-foreground" /> Subject Header
            </Label>
            <Input
              value={formData.subject}
              onChange={e => setFormData(p => ({ ...p, subject: e.target.value }))}
              className="h-16 rounded-none bg-muted/10 border-border text-2xl font-black tracking-tight text-foreground placeholder:text-muted-foreground/30 focus:ring-1 focus:ring-foreground uppercase"
              placeholder="SUBJECT_OF_ANNOUNCEMENT"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] flex items-center gap-2">
              <FileText size={12} className="text-foreground" /> Message Payload
            </Label>
            <div className="relative border border-border bg-background shadow-inner">
              <textarea
                ref={textareaRef}
                className="w-full min-h-[450px] p-10 text-[16px] outline-none resize-none font-medium text-foreground bg-transparent leading-[1.8] placeholder:text-muted-foreground/20"
                placeholder="Type your official studio announcement here..."
                value={formData.content}
                onChange={e => setFormData(p => ({ ...p, content: e.target.value }))}
              />
              <div className="absolute bottom-0 left-0 w-full p-4 bg-muted/30 flex justify-between items-center border-t border-border">
                <span className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase">
                  <CheckCircle2 size={12} className={formData.content.length > 5 ? "text-green-600" : "text-muted-foreground/30"} />
                  System Ready
                </span>
                <span className="text-[10px] font-mono text-muted-foreground/50">
                  CHARS: {formData.content.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}