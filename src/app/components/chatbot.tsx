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
  Bot
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
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMyMessages = useCallback(async () => {
    if (!session?.user?.email) return;
    try {
      const res = await fetch("/api/chats");
      const data = await res.json();
      const myChats = data.filter((chat: any) => 
        chat.senderEmail === session.user?.email && 
        chat.website === WEBSITE_IDENTIFIER
      );
      setMessages(myChats);
    } catch (err) {
      console.error("Fetch Error:", err);
    }
  }, [session?.user?.email]);

  useEffect(() => {
    if (isOpen && session) {
      fetchMyMessages();
      const interval = setInterval(fetchMyMessages, 5000); 
      return () => clearInterval(interval);
    }
  }, [isOpen, session, fetchMyMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleFAQSelection = (faq: { question: string, answer: string }) => {
    const userMsg = { _id: Date.now().toString(), message: faq.question, isAdmin: false, timestamp: new Date() };
    const botMsg = { _id: (Date.now() + 1).toString(), message: faq.answer, isAdmin: true, timestamp: new Date(), isBot: true };
    
    setMessages((prev) => [...prev, userMsg, botMsg]);
    setShowFAQs(false);

    if (session?.user?.email) {
      saveMessageToDB(faq.question, false);
      setTimeout(() => saveMessageToDB(faq.answer, true), 500);
    }
  };

  const saveMessageToDB = async (msg: string, isAdmin: boolean) => {
    if (!session?.user?.email) return;
    await fetch("/api/chats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        senderEmail: session.user.email,
        senderName: isAdmin ? "Support Bot" : (session.user.name || "Customer"),
        message: msg,
        isAdmin: isAdmin,
        website: WEBSITE_IDENTIFIER
      }),
    });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !session) return;
    
    await saveMessageToDB(message, false);
    setMessage("");
    fetchMyMessages();
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            /* FIXED: w-87.5 md:w-95 */
            className="w-87.5 md:w-95 overflow-hidden rounded-3xl border border-zinc-800 bg-black shadow-2xl ring-1 ring-zinc-700"
          >
            {/* Header */}
            <div className="border-b border-zinc-800 bg-zinc-900/40 p-5 flex items-center justify-between backdrop-blur-md">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-orange-600/50">
                  <AvatarImage src="/logo.png" />
                  <AvatarFallback className="bg-orange-600 text-[10px] font-black uppercase">AJ</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-white flex items-center gap-1.5">
                    Live Support <Sparkles className="w-3 h-3 text-orange-500" />
                  </h3>
                  <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest">Always Active</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white transition-all"><X className="h-5 w-5" /></button>
            </div>

            {/* Content Area */}
            {/* FIXED: h-120 */}
            <div className="relative flex h-120 flex-col bg-zinc-950/30">
              
              {/* COLLAPSIBLE FAQ SECTION */}
              <div className="border-b border-zinc-900 bg-zinc-900/10">
                <button 
                  onClick={() => setShowFAQs(!showFAQs)}
                  className="w-full flex items-center justify-between p-4 hover:bg-zinc-900/40 transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <Bot className="w-3 h-3 text-orange-500" />
                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">Quick Solutions</p>
                  </div>
                  <motion.div
                    animate={{ rotate: showFAQs ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronRight className="h-3 w-3 text-zinc-600 group-hover:text-white" />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {showFAQs && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden px-4 pb-4"
                    >
                      <div className="grid grid-cols-1 gap-2">
                        {FAQS.map((faq, i) => (
                          <button
                            key={i}
                            onClick={() => handleFAQSelection(faq)}
                            className="w-full text-left p-3 rounded-xl border border-zinc-800/50 bg-zinc-900/30 hover:bg-orange-600/10 hover:border-orange-600/40 transition-all group flex items-center justify-between"
                          >
                            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-tight group-hover:text-white">{faq.question}</span>
                            <ChevronRight className="h-3 w-3 text-zinc-700 group-hover:text-orange-600 transition-all" />
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Chat Area */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                {messages.length === 0 && !showFAQs && (
                  <div className="flex h-full items-center justify-center text-center px-10">
                    <div className="space-y-3">
                        <Bot className="w-8 h-8 text-zinc-800 mx-auto" />
                        <p className="text-zinc-700 text-[9px] uppercase font-black tracking-widest leading-loose">
                          How can we help you today? <br/>
                          <span 
                            className="text-orange-600/50 cursor-pointer hover:text-orange-600 transition-colors underline underline-offset-4" 
                            onClick={() => setShowFAQs(true)}
                          >
                            Browse FAQs
                          </span>
                        </p>
                    </div>
                  </div>
                )}
                {messages.map((msg) => (
                  <div key={msg._id} className={cn("flex gap-3", msg.isAdmin ? "flex-row" : "flex-row-reverse")}>
                    <div className={cn("flex max-w-[85%] flex-col gap-1", !msg.isAdmin && "items-end")}>
                      <div className={cn(
                        "px-4 py-2.5 text-[11px] font-bold shadow-xl border leading-relaxed transition-all",
                        msg.isAdmin 
                          ? "bg-zinc-900 border-zinc-800 text-zinc-200 rounded-2xl rounded-tl-none" 
                          : "bg-orange-600 border-transparent text-white rounded-2xl rounded-tr-none"
                      )}>
                        {msg.message}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer Input */}
              <div className="p-5 border-t border-zinc-900 bg-black/80 backdrop-blur-md">
                {session ? (
                  <form className="flex items-center gap-3" onSubmit={handleSendMessage}>
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 bg-transparent border-b border-zinc-800 py-2 text-[11px] text-white outline-none focus:border-orange-600 placeholder:text-zinc-800 uppercase font-bold"
                    />
                    <button type="submit" disabled={!message.trim()} className="text-white hover:text-orange-600 disabled:text-zinc-800 transition-all cursor-pointer">
                      <Send className="h-5 w-5" />
                    </button>
                  </form>
                ) : (
                  <div className="space-y-4 text-center">
                    <p className="text-[8px] text-zinc-600 font-black uppercase tracking-[0.2em]">Want to talk to a human?</p>
                    <Button 
                      onClick={() => signIn("google")}
                      className="w-full bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-800 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl py-6 cursor-pointer"
                    >
                      <LogIn size={14} className="mr-2 text-orange-600" /> Connect Email to Chat
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        /* FIXED: rounded-4xl */
        className={cn(
          "flex h-16 w-16 items-center justify-center rounded-4xl shadow-2xl transition-all border cursor-pointer",
          isOpen ? "bg-black border-zinc-800 text-orange-600" : "bg-orange-600 border-transparent text-white"
        )}
      >
        {isOpen ? <X className="h-7 w-7" /> : <MessageSquare className="h-7 w-7" />}
      </motion.button>
    </div>
  );
}