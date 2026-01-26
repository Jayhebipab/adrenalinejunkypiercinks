"use client";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { 
  MessageSquare, 
  Send, 
  X, 
  LogIn, 
  ChevronRight, 
  Sparkles,
  Bot,
  Mail,
  Image as ImageIcon,
  Loader2,
  ExternalLink
} from "lucide-react"; 
import { useCallback, useEffect, useState, useRef } from "react";
import { signIn, useSession } from "next-auth/react";

const WEBSITE_IDENTIFIER = "disruptivesolutionsinc";

const FAQS = [
  {
    question: "What are your services?",
    answer: "We specialize in professional piercing services and high-quality equipment here at Adrenalin Junky Piercinks."
  },
  {
    question: "How to book a session?",
    answer: "Consult with us first! You can message us here or via Gmail to check artist availability before booking."
  },
  {
    question: "Where are you located?",
    answer: "Visit our shop to see our full range of equipment and get expert piercing services!"
  }
];

export default function FloatingChatWidget() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [showFAQs, setShowFAQs] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0); // Counter para sa red number
  const [shouldJiggle, setShouldJiggle] = useState(false); // Para sa animation
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMyMessages = useCallback(async () => {
    if (!session?.user?.email) return;
    try {
      const res = await fetch("/api/chats");
      const data = await res.json();
      const myChats = data.filter((chat: any) => 
        chat.senderEmail === session.user?.email && 
        chat.website === WEBSITE_IDENTIFIER
      );

      // --- LOGIC PARA SA NOTIFICATION ---
      if (myChats.length > messages.length) {
        const lastMsg = myChats[myChats.length - 1];
        // Kung admin ang nag reply at nakasara ang widget
        if (lastMsg.isAdmin && !isOpen) {
          setUnreadCount(prev => prev + 1);
          setShouldJiggle(true);
          // I-stop ang jiggle after 1 second
          setTimeout(() => setShouldJiggle(false), 1000);
        }
      }
      
      setMessages(myChats);
    } catch (err) {
      console.error("Fetch Error:", err);
    }
  }, [session?.user?.email, messages.length, isOpen]);

  useEffect(() => {
    if (session) {
      fetchMyMessages();
      const interval = setInterval(fetchMyMessages, 5000); 
      return () => clearInterval(interval);
    }
  }, [session, fetchMyMessages]);

  // Kapag binuksan ang chat, i-reset ang unread count
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const saveMessageToDB = async (content: string, isAdmin: boolean, type: "text" | "image" = "text") => {
    if (!session?.user?.email) return;
    await fetch("/api/chats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        senderEmail: session.user.email,
        senderName: isAdmin ? "Support Bot" : (session.user.name || "Customer"),
        message: content,
        type: type,
        isAdmin: isAdmin,
        website: WEBSITE_IDENTIFIER
      }),
    });
    fetchMyMessages();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64 = reader.result as string;
      await saveMessageToDB(base64, false, "image");
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !session) return;
    await saveMessageToDB(message, false, "text");
    setMessage("");
  };

  const handleFAQSelection = (faq: { question: string, answer: string }) => {
    saveMessageToDB(faq.question, false, "text");
    setTimeout(() => saveMessageToDB(faq.answer, true, "text"), 500);
    setShowFAQs(false);
  };

  const renderMessage = (msg: any) => {
    if (msg.type === "image" || msg.message.startsWith("data:image")) {
      return (
        <img 
          src={msg.message} 
          alt="Shared Image" 
          className="rounded-xl max-w-full h-auto border border-white/10 shadow-lg cursor-zoom-in" 
          onClick={() => window.open(msg.message, '_blank')}
        />
      );
    }

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = msg.message.split(urlRegex);
    return parts.map((part: string, i: number) => 
      urlRegex.test(part) ? (
        <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="underline text-blue-400 inline-flex items-center gap-1 hover:text-blue-300">
          {part} <ExternalLink size={10} />
        </a>
      ) : part
    );
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4 font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="w-[350px] md:w-[400px] overflow-hidden rounded-[2.5rem] border border-zinc-800 bg-black shadow-2xl ring-1 ring-zinc-700/50"
          >
            {/* Header */}
            <div className="border-b border-zinc-800 bg-zinc-900/40 p-6 flex items-center justify-between backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="relative">
                    <Avatar className="h-12 w-12 border-2 border-[#d11a2a]">
                    <AvatarImage src="/logo.png" />
                    <AvatarFallback className="bg-zinc-900 text-[10px] font-black uppercase text-white">AJ</AvatarFallback>
                    </Avatar>
                    <span className="absolute bottom-0 right-0 size-3 bg-emerald-500 border-2 border-black rounded-full animate-pulse" />
                </div>
                <div>
                  <h3 className="text-[12px] font-black uppercase italic tracking-wider text-white flex items-center gap-1.5">
                    Live Support <Sparkles className="w-3 h-3 text-[#d11a2a]" />
                  </h3>
                  <p className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">Always Active</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white transition-all p-2 rounded-full hover:bg-white/5"><X className="h-5 w-5" /></button>
            </div>

{/* Chat Content */}
            <div className="relative flex h-[480px] flex-col bg-zinc-950/20">
              
              {/* FAQ Section */}
              <div className="border-b border-zinc-900 bg-zinc-900/10">
                <button onClick={() => setShowFAQs(!showFAQs)} className="w-full flex items-center justify-between p-4 hover:bg-zinc-900/40 transition-colors">
                  <div className="flex items-center gap-2">
                    <Bot className="w-3 h-3 text-white" /> {/* Puti na ang Bot icon */}
                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">Quick Help</p>
                  </div>
                  <motion.div animate={{ rotate: showFAQs ? 90 : 0 }}>
                    <ChevronRight className="h-3 w-3 text-zinc-600" />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {showFAQs && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden px-4 pb-4">
                      {FAQS.map((faq, i) => (
                        <button key={i} onClick={() => handleFAQSelection(faq)} className="w-full text-left p-3 mb-1 rounded-xl border border-zinc-800 bg-zinc-900/20 hover:border-white/40 text-[10px] text-zinc-400 font-bold uppercase tracking-tight hover:text-white transition-all">
                          {faq.question}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Messages Area */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-hide">
                {messages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center opacity-20 grayscale">
                    <MessageSquare size={48} className="mb-2 text-zinc-500" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Start a Conversation</p>
                  </div>
                )}
                {messages.map((msg) => (
                  <div key={msg._id} className={cn("flex gap-3", msg.isAdmin ? "flex-row" : "flex-row-reverse")}>
                    <div className={cn("flex max-w-[85%] flex-col gap-1", !msg.isAdmin && "items-end")}>
                      <div className={cn(
                        "px-4 py-3 text-[11px] font-bold shadow-lg border leading-relaxed",
                        msg.isAdmin 
                          ? "bg-zinc-900 border-zinc-800 text-zinc-200 rounded-3xl rounded-tl-none" 
                          : "bg-white border-transparent text-black rounded-3xl rounded-tr-none" // User messages: White bg, Black text
                      )}>
                        {renderMessage(msg)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input Footer */}
              <div className="p-6 border-t border-zinc-900 bg-black backdrop-blur-md">
                {session ? (
                  <form className="flex items-center gap-3" onSubmit={handleSendMessage}>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                    <button type="button" disabled={uploading} onClick={() => fileInputRef.current?.click()} className="text-zinc-600 hover:text-white transition-colors">
                      {uploading ? <Loader2 className="animate-spin" size={20} /> : <ImageIcon size={20} />}
                    </button>
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 bg-transparent border-b border-zinc-800 py-2 text-[11px] text-white outline-none focus:border-white placeholder:text-zinc-700 uppercase font-black transition-colors"
                    />
                    <button type="submit" disabled={!message.trim()} className="text-white hover:opacity-70 disabled:text-zinc-800 transition-all">
                      <Send size={20} />
                    </button>
                  </form>
                ) : (
                  <Button onClick={() => signIn("google")} className="w-full bg-white hover:bg-zinc-200 text-black h-14 text-[10px] font-black uppercase tracking-widest rounded-full transition-all">
                    <Mail size={14} className="mr-2" /> Login with Gmail to Chat
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Toggle Button with Jiggle and Notification Badge */}
      <div className="relative">
        <AnimatePresence>
          {unreadCount > 0 && !isOpen && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 z-[110] flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-[10px] font-black text-white ring-2 ring-black shadow-lg"
            >
              {unreadCount}
            </motion.div>
          )}
        </AnimatePresence>
<motion.button
          animate={shouldJiggle ? {
            x: [0, -10, 10, -10, 10, 0],
            rotate: [0, -5, 5, -5, 5, 0]
          } : {}}
          transition={{ duration: 0.5 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex h-16 w-16 items-center justify-center rounded-full shadow-2xl transition-all border-4 cursor-pointer",
            // Clean Monochrome Logic:
            isOpen 
              ? "bg-black border-zinc-800 text-white" 
              : "bg-white border-white text-black"
          )}
        >
          {isOpen ? (
            <X size={28} />
          ) : (
            <MessageSquare size={28} className="fill-current" />
          )}
        </motion.button>
      </div>
    </div>
  );
}