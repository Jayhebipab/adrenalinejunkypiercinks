"use client";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { 
  MessageSquare, Send, X, ChevronRight, Sparkles,
  Bot, Mail, ImageIcon, Loader2, ExternalLink, UserPlus 
} from "lucide-react"; 
import { useCallback, useEffect, useState, useRef } from "react";
import { signIn, useSession } from "next-auth/react";
import { uploadToCloudinary } from "@/lib/cloudinary"; 
import { toast } from "sonner"; 

// FIREBASE IMPORTS
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";

const WEBSITE_IDENTIFIER = "adrenaline_junky_studio";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  createdAt?: any;
}

export default function FloatingChatWidget() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [showFAQs, setShowFAQs] = useState(false);
  const [message, setMessage] = useState("");
  const [dbMessages, setDbMessages] = useState<any[]>([]); // Galing sa Firestore
  const [localMessages, setLocalMessages] = useState<any[]>([]); // Para sa Guest FAQs
  const [uploading, setUploading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0); 
  const [shouldJiggle, setShouldJiggle] = useState(false); 
  const [faqs, setFaqs] = useState<FAQItem[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Combine DB messages at Local (FAQ) messages
  const allMessages = [...dbMessages, ...localMessages].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // 1. FETCH REAL-TIME FAQS (Always active kahit guest)
  useEffect(() => {
    const q = query(collection(db, "faq_settings"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setFaqs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as FAQItem[]);
    });
    return () => unsubscribe();
  }, []);

  // 2. FETCH MESSAGES (For logged in users only)
  const fetchMyMessages = useCallback(async () => {
    if (!session?.user?.email) return;
    try {
      const res = await fetch("/api/chats");
      const data = await res.json();
      if (!Array.isArray(data)) return;

      const myChats = data
        .filter((chat: any) => chat.senderEmail === session.user?.email)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      if (myChats.length > dbMessages.length) {
        const lastMsg = myChats[myChats.length - 1];
        if (lastMsg.isAdmin && !isOpen) {
          setUnreadCount(prev => prev + 1);
          setShouldJiggle(true);
          setTimeout(() => setShouldJiggle(false), 1000);
        }
      }
      setDbMessages(myChats);
    } catch (err) {
      console.error("Fetch Error:", err);
    }
  }, [session?.user?.email, dbMessages.length, isOpen]);

  useEffect(() => {
    if (session) {
      fetchMyMessages();
      const interval = setInterval(fetchMyMessages, 4000); 
      return () => clearInterval(interval);
    } else {
      setDbMessages([]); // Clear pag nag logout
    }
  }, [session, fetchMyMessages]);

  useEffect(() => {
    if (isOpen) setUnreadCount(0);
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [allMessages]);

// 1. Inupdate na natin ang parameters para tanggapin ang isFAQ (default ay false)
const saveMessageToDB = async (
  content: string, 
  isAdmin: boolean, 
  type: "text" | "image" = "text", 
  isFAQ: boolean = false // <--- Dinagdag natin ito para mawala ang error sa handleFAQSelection
) => {
  if (!session?.user?.email) return;
  try {
    await fetch("/api/chats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        senderEmail: session.user.email,
        senderName: isAdmin ? "Support Bot" : (session.user.name || "Customer"),
        message: content,
        type,
        isAdmin,
        isFAQ, // <--- Ngayon, may value na ito sa scope ng function
        website: WEBSITE_IDENTIFIER
      }),
    });
    fetchMyMessages();
  } catch (error) {
    console.error("Save Error:", error);
  }
};

// 2. Swak na ito ngayon kasi tumatanggap na ng 4th argument ang function sa itaas
const handleFAQSelection = (faq: { question: string, answer: string }) => {
  const timestamp = new Date().toISOString();
  
  if (session) {
    // Papasok ito sa database na may tatak na isFAQ: true
    saveMessageToDB(faq.question, false, "text", true); 
    setTimeout(() => saveMessageToDB(faq.answer, true, "text", true), 500);
  } else {
    // Para sa mga hindi naka-login (Local state)
    const guestChat = [
      { id: `q-${Date.now()}`, message: faq.question, isAdmin: false, timestamp, type: "text", isFAQ: true },
      { id: `a-${Date.now()}`, message: faq.answer, isAdmin: true, timestamp, type: "text", isFAQ: true }
    ];
    setLocalMessages(prev => [...prev, ...guestChat]);
  }
  setShowFAQs(false);
};

  // --- DELETE MESSAGE PROTOCOL ---
  const deleteMessage = async (id: string) => {
    if (!session) return;
    try {
      await fetch(`/api/chats?id=${id}`, { method: "DELETE" });
      setDbMessages(prev => prev.filter(msg => msg.id !== id));
      toast.success("Message wiped.");
    } catch (error) {
      toast.error("Failed to delete.");
    }
  };

  // --- EDIT MESSAGE PROTOCOL ---
  const editMessage = async (id: string, newContent: string) => {
    if (!session || !newContent.trim()) return;
    try {
      await fetch("/api/chats", {
        method: "PATCH", // O PUT depende sa API route mo
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, message: newContent }),
      });
      setDbMessages(prev => prev.map(msg => msg.id === id ? { ...msg, message: newContent } : msg));
      toast.success("Transmission updated.");
    } catch (error) {
      toast.error("Update failed.");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const uploadedUrl = await uploadToCloudinary(file);
      if (uploadedUrl) {
        await saveMessageToDB(uploadedUrl, false, "image");
        toast.success("Image sent!");
      }
    } catch (error) {
      toast.error("Upload failed.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !session) return;
    const currentMsg = message;
    setMessage(""); 
    await saveMessageToDB(currentMsg, false, "text");
  };

  const renderMessage = (msg: any) => {
    const content = msg.message || "";
    if (msg.type === "image") {
      return (
        <img 
          src={content} 
          alt="Shared" 
          className="rounded-lg max-w-full h-auto cursor-zoom-in border border-zinc-800" 
          onClick={() => window.open(content, '_blank')}
        />
      );
    }
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return content.split(urlRegex).map((part: string, i: number) => 
      urlRegex.test(part) ? (
        <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="underline text-blue-400 inline-flex items-center gap-1">
          {part} <ExternalLink size={10} />
        </a>
      ) : part
    );
  };

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col items-end gap-3 font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            className="w-[320px] md:w-[360px] overflow-hidden rounded-[2rem] border border-zinc-800 bg-black shadow-2xl"
          >
            {/* Header */}
            <div className="border-b border-zinc-800 bg-zinc-900/40 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2">
                  <AvatarImage src="/images/logo/pic4.png" />
                  <AvatarFallback className="bg-zinc-800 text-white">DS</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-[11px] font-black uppercase italic text-white flex items-center gap-1">
                   Customer Care<Sparkles className="w-3 h-3 text-[#d11a2a]" />
                  </h3>
                  <p className="text-[9px] text-emerald-500 font-bold uppercase tracking-widest">Online</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex h-[400px] flex-col bg-zinc-950/50">
              {/* FAQ Section - AVAILABLE KAHIT GUEST */}
              <div className="border-b border-zinc-900">
                <button onClick={() => setShowFAQs(!showFAQs)} className="w-full flex items-center justify-between p-3 text-zinc-400 hover:bg-zinc-900/50">
                  <span className="text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                    <Bot size={14} className="text-[#d11a2a]"/> Quick FAQ
                  </span>
                  <ChevronRight size={14} className={cn("transition-transform", showFAQs && "rotate-90")} />
                </button>
                <AnimatePresence>
                  {showFAQs && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden px-3 pb-3 space-y-1">
                      {faqs.map((faq) => (
                        <button key={faq.id} onClick={() => handleFAQSelection(faq)} className="w-full text-left p-2 rounded-lg bg-zinc-900/50 text-[10px] text-zinc-300 hover:text-white border border-transparent hover:border-zinc-700 transition-all">
                          {faq.question}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Messages Area */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                {allMessages.length === 0 && (
                  <div className="text-center py-10 opacity-20">
                    <MessageSquare className="mx-auto mb-2" size={30} />
                    <p className="text-[10px] uppercase font-bold tracking-widest">No conversation yet</p>
                  </div>
                )}
{allMessages.map((msg) => {
  const isQuestionInFAQ = faqs.some(f => f.question === msg.message);
  const isAnswerInFAQ = faqs.some(f => f.answer === msg.message);
  const isImage = msg.type === "image";
  const isLink = /(https?:\/\/[^\s]+)/g.test(msg.message || "");
  const isProtected = msg.isAdmin || msg.isFAQ === true || isQuestionInFAQ || isAnswerInFAQ || msg.id.startsWith('q-') || msg.id.startsWith('a-');

  // Formatting ng Oras at Araw
  const msgDate = new Date(msg.timestamp);
  const timeString = msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dayString = msgDate.toLocaleDateString([], { weekday: 'short' });

  return (
    <div key={msg.id} className={cn("flex flex-col mb-4", msg.isAdmin ? "items-start" : "items-end")}>
      <div className={cn("flex group relative max-w-[85%]", msg.isAdmin ? "justify-start" : "justify-end")}>
        
        {/* Mobile/Desktop Actions Panel */}
        {!isProtected && session?.user?.email === msg.senderEmail && (
          <div className="absolute -top-6 right-0 flex gap-2 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity bg-black/90 rounded-md px-2 py-1 border border-zinc-800 z-20 shadow-2xl">
            {!isImage && !isLink && (
              <button 
                onClick={() => {
                  const newMsg = prompt("Edit transmission:", msg.message);
                  if (newMsg) editMessage(msg.id, newMsg);
                }}
                className="text-[9px] font-black uppercase text-zinc-400 hover:text-orange-500"
              >
                Edit
              </button>
            )}
            <button 
              onClick={() => {
                if(confirm("Wipe this data?")) deleteMessage(msg.id);
              }}
              className="text-[9px] font-black uppercase text-zinc-400 hover:text-red-500"
            >
              Wipe
            </button>
          </div>
        )}

        {/* Message Bubble - Tap/Click for Mobile Support */}
        <div 
          onClick={(e) => {
            // Force show actions for mobile on tap
            const el = e.currentTarget.previousElementSibling;
            if (el) el.classList.toggle('opacity-100');
          }}
          className={cn(
            "px-4 py-3 text-[11px] font-black leading-relaxed shadow-xl border cursor-pointer select-none",
            msg.isAdmin 
              ? "bg-zinc-900 text-white rounded-2xl rounded-tl-none border-zinc-800" 
              : "bg-zinc-900 text-white rounded-2xl rounded-tl-none border-zinc-800"
          )}
        >
          {renderMessage(msg)}
        </div>
      </div>

      {/* Timestamp Section */}
      <span className={cn(
        "text-[7px] uppercase font-bold tracking-tighter mt-1 opacity-40 px-1",
        msg.isAdmin ? "text-left" : "text-right"
      )}>
        {dayString} • {timeString} {msg.isEdited && "(Edited)"}
      </span>
    </div>
  );
})}
{/* Invisible div para sa scroll anchor */}
<div ref={scrollRef} />
              </div>

{/* Footer Input / Login Gate */}
              <div className="p-4 border-t border-zinc-900 bg-black/80 backdrop-blur-xl">
                {session ? (
                  <form className="flex items-center gap-2" onSubmit={handleSendMessage}>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                    <button type="button" disabled={uploading} onClick={() => fileInputRef.current?.click()} className="p-2 text-zinc-500 hover:text-orange-500 transition-colors">
                      {uploading ? <Loader2 className="animate-spin" size={18} /> : <ImageIcon size={18} />}
                    </button>
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Secure transmission..."
                      className="flex-1 bg-zinc-900/50 rounded-full px-4 py-2 text-[11px] text-white outline-none border border-zinc-800 focus:border-orange-600 transition-all placeholder:text-zinc-700"
                    />
                    <button type="submit" disabled={!message.trim()} className="p-2 text-orange-600 disabled:text-zinc-800 transition-colors">
                      <Send size={18} />
                    </button>
                  </form>
                ) : (
                  <div className="space-y-3 py-2">
                    <div className="text-center space-y-1">
                      <p className="text-[10px] text-white font-black uppercase tracking-widest italic">Identity Required</p>
                      <p className="text-[8px] text-zinc-600 uppercase font-bold tracking-tighter">Priority member access needed for custom chat</p>
                    </div>
                    <Button 
                      onClick={() => signIn("google")} 
                      className="w-full bg-white hover:bg-zinc-200 text-black text-[10px] font-black uppercase rounded-xl tracking-[0.2em] h-12 shadow-xl flex items-center justify-center gap-2 transition-transform active:scale-95"
                    >
                      <UserPlus size={14} /> Join the Cult
                    </Button>
                    <p className="text-[7px] text-zinc-500 text-center uppercase tracking-widest opacity-50">Secure Link • Adrenaline Junky Studio</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Trigger Button */}
      <motion.button
        animate={shouldJiggle ? { x: [0, -5, 5, -5, 5, 0] } : {}}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative h-16 w-16 rounded-full flex items-center justify-center shadow-2xl transition-all border-4",
          isOpen ? "bg-black border-zinc-800 text-white" : "bg-white border-white text-black"
        )}
      >
        {unreadCount > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 h-6 w-6 bg-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-black animate-bounce">
            {unreadCount}
          </span>
        )}
        {isOpen ? <X size={28} /> : <MessageSquare size={28} className="fill-current" />}
      </motion.button>
    </div>
  );
}