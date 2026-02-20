"use client"

import React, { useState, useEffect, useRef } from "react"
import { 
  Loader2, Trash2, Megaphone, Globe, 
  Users, Type, FileText, CheckCircle2, UserPlus,
  ShieldCheck, Clock, Send,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { db } from "@/lib/firebase"
import { doc, getDoc, setDoc, collection, getDocs, serverTimestamp } from "firebase/firestore"
import { format } from "date-fns"

export default function AnnouncementManager() {
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [lastBroadcast, setLastBroadcast] = useState<any>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  const [includeDbUsers, setIncludeDbUsers] = useState(true)
  const [showManualRecipients, setShowManualRecipients] = useState(false)
  const [extraRecipients, setExtraRecipients] = useState<string[]>([""])

  const [formData, setFormData] = useState({
    from: "AJ PIERCINKS ADMIN",
    replyTo: "jpablobscs@tfvc.edu.ph",
    subject: "",
    content: "",
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const docRef = doc(db, "settings", "announcementConfig");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData(prev => ({ ...prev, ...data }));
          if (data.lastSentAt) setLastBroadcast(data.lastSentAt.toDate());
        }
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handlePublish = async () => {
    const manualEmails = extraRecipients.map(e => e.trim()).filter(e => e !== "" && e.includes("@"));
    setIsSaving(true);
    const toastId = toast.loading("Deploying official transmission...");

    try {
      let finalRecipientList: string[] = [];
      if (includeDbUsers) {
        const querySnapshot = await getDocs(collection(db, "subscribers")); 
        finalRecipientList = querySnapshot.docs.map(doc => doc.data().email).filter(e => e?.includes("@"));
      }
      finalRecipientList = Array.from(new Set([...finalRecipientList, ...manualEmails]));

      if (finalRecipientList.length === 0) throw new Error("No recipients found.");

      const res = await fetch('/api/application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, recipients: finalRecipientList })
      });

      if (!res.ok) throw new Error("API Transmission Failed");

      const timestamp = new Date();
      await setDoc(doc(db, "settings", "announcementConfig"), { 
        ...formData, 
        lastSentAt: serverTimestamp() 
      }, { merge: true });
      
      setLastBroadcast(timestamp);
      toast.success("Broadcast successful. Logged in Command Center.", { id: toastId });
      setFormData(prev => ({ ...prev, content: "", subject: "" }));
    } catch (error: any) {
      toast.error(error.message, { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="animate-spin text-muted-foreground" size={32} />
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto rounded-none border border-border shadow-2xl bg-background text-foreground flex flex-col overflow-hidden animate-in fade-in duration-700">
      
      {/* TOP STATUS BAR */}
      <div className="bg-muted/50 px-6 py-2 border-b border-border flex justify-between items-center">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-[10px] font-black text-orange-500 tracking-widest uppercase animate-pulse">
            <ShieldCheck size={12}/> Secure Link
          </span>
          <span className="h-3 w-[1px] bg-border"></span>
          <span className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            <Clock size={12}/> {lastBroadcast ? `Last Broadcast: ${format(lastBroadcast, 'MMM dd, yyyy HH:mm')}` : 'No Logs'}
          </span>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground/60">AJ-ADMIN-PROTOCOL</span>
      </div>

      {/* HEADER SECTION */}
      <div className="px-10 py-12 border-b border-border bg-gradient-to-b from-muted/30 to-transparent flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase mb-1 flex items-center gap-3">
            <Megaphone size={32} /> Command Center
          </h1>
          <p className="text-muted-foreground text-[11px] font-bold uppercase tracking-[0.4em]">Official Studio Correspondence Protocol</p>
        </div>
        
        <Button 
          onClick={handlePublish} 
          disabled={isSaving} 
          variant="default"
          className="bg-foreground text-background hover:bg-foreground/90 font-black px-10 h-14 rounded-none uppercase text-[12px] tracking-[0.2em] transition-all shadow-lg"
        >
          {isSaving ? <Loader2 className="animate-spin mr-2" size={16} /> : <Send className="mr-2" size={16} />}
          Execute Dispatch
        </Button>
      </div>

      {/* MAIN BODY */}
      <div className="p-10 grid grid-cols-12 gap-10">
        
        {/* LEFT COLUMN: SETTINGS */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          <div className="space-y-6 bg-muted/20 p-6 border border-border">
            <div className="space-y-4">
              <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <Users size={12} className="text-foreground"/> Sender Identity
              </Label>
              <Input 
                value={formData.from} 
                onChange={(e) => setFormData(p => ({ ...p, from: e.target.value }))} 
                className="h-11 rounded-none bg-background border-border text-[13px] font-bold focus:ring-1 focus:ring-foreground transition-all" 
              />
            </div>

            <div className="pt-4 border-t border-border space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <Globe size={12} className="text-foreground"/> Database Sync
                </Label>
                <Switch 
                  checked={includeDbUsers} 
                  onCheckedChange={setIncludeDbUsers} 
                  className="data-[state=checked]:bg-orange-600"
                />
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed font-medium">
                Include all registered studio members in this transmission.
              </p>
            </div>

            <div className="pt-4 border-t border-border space-y-4">
              <button 
                onClick={() => setShowManualRecipients(!showManualRecipients)}
                className="w-full h-11 border border-dashed border-border text-[10px] font-black uppercase tracking-widest hover:bg-foreground hover:text-background transition-all flex items-center justify-center gap-2"
              >
                <UserPlus size={14}/> {showManualRecipients ? "Hide Manual List" : "Inject Direct Emails"}
              </button>
            </div>
          </div>

          {showManualRecipients && (
            <div className="bg-muted/10 border border-border p-4 space-y-3 animate-in slide-in-from-top-4 duration-500">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[9px] font-black text-muted-foreground uppercase">Override Targets</span>
                <button onClick={() => setExtraRecipients([...extraRecipients, ""])} className="text-foreground hover:text-orange-500 transition-colors"><UserPlus size={14}/></button>
              </div>
              {extraRecipients.map((email, idx) => (
                <div key={idx} className="flex gap-2 group">
                  <input 
                    value={email} 
                    onChange={(e) => {
                      const n = [...extraRecipients]; n[idx] = e.target.value; setExtraRecipients(n);
                    }}
                    className="flex-1 bg-transparent border-b border-border py-1 text-[11px] outline-none focus:border-foreground transition-all font-mono text-foreground"
                    placeholder="manual@target.com"
                  />
                  <button onClick={() => setExtraRecipients(extraRecipients.filter((_, i) => i !== idx))} className="text-muted-foreground hover:text-destructive transition-all"><Trash2 size={12}/></button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: EDITOR */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <div className="space-y-3">
            <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] flex items-center gap-2">
              <Type size={12} className="text-foreground"/> Subject Header
            </Label>
            <Input 
              value={formData.subject} 
              onChange={(e) => setFormData(p => ({ ...p, subject: e.target.value }))} 
              className="h-16 rounded-none bg-muted/10 border-border text-2xl font-black tracking-tight text-foreground placeholder:text-muted-foreground/30 focus:ring-1 focus:ring-foreground uppercase" 
              placeholder="SUBJECT_OF_ANNOUNCEMENT"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] flex items-center gap-2">
              <FileText size={12} className="text-foreground"/> Message Payload
            </Label>
            <div className="relative border border-border bg-background shadow-inner">
              <textarea 
                ref={textareaRef} 
                className="w-full min-h-[450px] p-10 text-[16px] outline-none resize-none font-medium text-foreground bg-transparent leading-[1.8] placeholder:text-muted-foreground/20" 
                placeholder="Type your official studio announcement here..."
                value={formData.content} 
                onChange={(e) => setFormData(p => ({ ...p, content: e.target.value }))} 
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
  )
}

// Small helper icon if not imported
function Plus({ size, className }: { size: number, className: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
}