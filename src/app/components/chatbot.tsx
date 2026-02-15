"use client";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { 
  MessageSquare, Send, X, ChevronRight, Sparkles,
  Bot, Mail, ImageIcon, Loader2, ExternalLink 
} from "lucide-react"; 
import { useCallback, useEffect, useState, useRef } from "react";
import { signIn, useSession } from "next-auth/react";
import { uploadToCloudinary } from "@/lib/cloudinary"; 
import { toast } from "sonner"; 

// FIREBASE IMPORTS
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";

const WEBSITE_IDENTIFIER = "disruptivesolutionsinc";

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

  const saveMessageToDB = async (content: string, isAdmin: boolean, type: "text" | "image" = "text") => {
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
          website: WEBSITE_IDENTIFIER
        }),
      });
      fetchMyMessages();
    } catch (error) {
      console.error("Save Error:", error);
    }
  };

  const handleFAQSelection = (faq: { question: string, answer: string }) => {
    const timestamp = new Date().toISOString();
    
    // Gawa ng fake local messages para makita agad sa UI kahit guest
    const guestChat = [
      { id: `q-${Date.now()}`, message: faq.question, isAdmin: false, timestamp, type: "text" },
      { id: `a-${Date.now()}`, message: faq.answer, isAdmin: true, timestamp, type: "text" }
    ];

    setLocalMessages(prev => [...prev, ...guestChat]);

    // Kung naka-login, i-save din sa history ng account niya
    if (session) {
      saveMessageToDB(faq.question, false, "text");
      setTimeout(() => saveMessageToDB(faq.answer, true, "text"), 500);
    }

    setShowFAQs(false);
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
                    <Bot size={14} className="text-[#d11a2a]"/> Quick Help
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
                {allMessages.map((msg) => (
                  <div key={msg.id} className={cn("flex", msg.isAdmin ? "justify-start" : "justify-end")}>
                    <div className={cn(
                      "max-w-[85%] px-4 py-2.5 text-[11px] font-medium leading-relaxed shadow-lg border",
                      msg.isAdmin 
                        ? "bg-zinc-900 text-zinc-200 rounded-2xl rounded-tl-none border-zinc-800" 
                        : "bg-white text-black rounded-2xl rounded-tr-none border-transparent"
                    )}>
                      {renderMessage(msg)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer Input */}
              <div className="p-4 border-t border-zinc-900 bg-black">
                {session ? (
                  <form className="flex items-center gap-2" onSubmit={handleSendMessage}>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                    <button type="button" disabled={uploading} onClick={() => fileInputRef.current?.click()} className="text-zinc-500 hover:text-white">
                      {uploading ? <Loader2 className="animate-spin" size={18} /> : <ImageIcon size={18} />}
                    </button>
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 bg-transparent border-b border-zinc-800 py-1 text-[11px] text-white outline-none focus:border-[#d11a2a] transition-all"
                    />
                    <button type="submit" disabled={!message.trim()} className="text-[#d11a2a] disabled:text-zinc-800">
                      <Send size={18} />
                    </button>
                  </form>
                ) : (
                  <div className="flex flex-col gap-2">
                    <p className="text-[8px] text-zinc-600 text-center font-bold uppercase tracking-widest">Login to send custom messages</p>
                    <Button onClick={() => signIn("google")} className="w-full bg-white text-black text-[9px] font-black uppercase rounded-full tracking-widest h-10 shadow-lg">
                      <Mail size={14} className="mr-2" /> Sign in with Google
                    </Button>
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