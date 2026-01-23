"use client";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { MessageSquare, Send, X, HelpCircle, ChevronUp } from "lucide-react"; 
import { useCallback, useEffect, useState, useRef } from "react";

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
  const [isOpen, setIsOpen] = useState(false);
  const [showFaq, setShowFaq] = useState(true);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. SETUP SESSION
  useEffect(() => {
    const sessionData = localStorage.getItem("disruptive_user_session");
    if (sessionData) {
      setCurrentUser(JSON.parse(sessionData));
    } else {
      setCurrentUser({
        displayName: "Customer",
        email: "customer@client.com",
      });
    }
  }, []);

  // 2. FETCH MESSAGES (Polling)
  const fetchMyMessages = async () => {
    if (!currentUser?.email) return;
    try {
      const res = await fetch("/api/chats");
      const data = await res.json();
      
      // I-filter natin para yung current user lang at yung tamang website ang makita
      const myChats = data.filter((chat: any) => 
        chat.senderEmail === currentUser.email && 
        chat.website === WEBSITE_IDENTIFIER
      );
      
      setMessages(myChats);
      
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    }
  };

  useEffect(() => {
    if (isOpen && currentUser) {
      fetchMyMessages();
      const interval = setInterval(fetchMyMessages, 5000); 
      return () => clearInterval(interval);
    }
  }, [isOpen, currentUser]);

  // 3. SEND MESSAGE
  const handleSendMessage = async (e?: React.FormEvent, customMsg?: string) => {
    if (e) e.preventDefault();
    const textToSend = customMsg || message;
    if (!textToSend.trim() || !currentUser) return;

    const payload = {
      senderEmail: currentUser.email,
      senderName: currentUser.displayName,
      message: textToSend,
      isAdmin: false,
      website: WEBSITE_IDENTIFIER // IMPORTANTE: Para lilitaw sa Admin GET request
    };

    try {
      await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!customMsg) setMessage("");
      fetchMyMessages();
    } catch (err) {
      console.error("Send Error:", err);
    }
  };

  const handleFAQSelection = async (faq: { question: string, answer: string }) => {
    await handleSendMessage(undefined, faq.question);

    setTimeout(async () => {
      const botPayload = {
        senderEmail: currentUser.email,
        senderName: "Support Bot",
        message: faq.answer,
        isAdmin: true,
        website: WEBSITE_IDENTIFIER
      };

      await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(botPayload),
      });
      fetchMyMessages();
    }, 800);
  };

  const toggleOpen = useCallback(() => setIsOpen((prev) => !prev), []);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="chat-window"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="w-[380px] overflow-hidden rounded-2xl border border-white/10 bg-[#050505]/95 shadow-2xl backdrop-blur-xl ring-1 ring-white/20"
          >
            {/* Header */}
            <div className="relative border-b border-white/10 bg-[#d11a2a]/10 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border-2 border-[#d11a2a]/50">
                    <AvatarImage src="https://github.com/shadcn.png" />
                    <AvatarFallback>AJ</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Junky Support</h3>
                    <div className="flex items-center gap-2">
                      <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] text-white/50 uppercase font-bold tracking-wider">Online</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setShowFaq(!showFaq)} 
                    className={cn(
                        "p-1.5 rounded-lg transition-colors",
                        showFaq ? "bg-[#d11a2a]/20 text-[#d11a2a]" : "text-white/50 hover:text-white"
                    )}
                  >
                    <HelpCircle className="h-5 w-5" />
                  </button>
                  <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-white transition">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Chat Content */}
            <div className="relative flex h-[420px] flex-col">
              <AnimatePresence>
                {showFaq && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden bg-white/5 border-b border-white/5"
                  >
                    <div className="p-3 space-y-2">
                      <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-1">Quick Help</p>
                      <div className="flex flex-col gap-1.5">
                        {FAQS.map((faq, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleFAQSelection(faq)}
                            className="text-left bg-white/5 hover:bg-[#d11a2a]/20 hover:text-white border border-white/5 text-white/70 text-[11px] py-2 px-3 rounded-lg transition-all"
                          >
                            {faq.question}
                          </button>
                        ))}
                      </div>
                      <button 
                        onClick={() => setShowFaq(false)}
                        className="w-full flex justify-center py-1 text-white/20 hover:text-white/50"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                {messages.length === 0 && !showFaq && (
                  <div className="flex h-full items-center justify-center text-center px-8">
                    <p className="text-white/20 text-xs italic">No messages yet. Ask a question to start.</p>
                  </div>
                )}
                
                {messages.map((msg) => (
                  <div key={msg._id} className={cn("flex gap-3", msg.isAdmin ? "flex-row" : "flex-row-reverse")}>
                    <div className={cn("flex max-w-[85%] flex-col gap-1", !msg.isAdmin && "items-end")}>
                      <div className={cn(
                        "rounded-2xl px-4 py-2 text-sm shadow-sm border",
                        msg.isAdmin 
                          ? "bg-white/10 border-white/10 text-white rounded-tl-none" 
                          : "bg-[#d11a2a] border-transparent text-white rounded-tr-none"
                      )}>
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                      </div>
                      <span className="text-[9px] text-white/30 font-medium px-1">
                         {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "..."}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Input Area */}
            <div className="border-t border-white/10 bg-black/60 p-4">
              <form className="relative flex items-center gap-2" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-[#d11a2a]/50 placeholder:text-white/20"
                />
                <Button 
                  size="icon" 
                  type="submit"
                  disabled={!message.trim()}
                  className="h-10 w-10 rounded-xl bg-[#d11a2a] hover:bg-[#b01622] text-white transition-all shadow-lg shadow-[#d11a2a]/20"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleOpen}
        className={cn(
          "flex h-16 w-16 items-center justify-center rounded-2xl shadow-2xl transition-all duration-300 ring-1 ring-white/10",
          isOpen ? "bg-[#d11a2a] text-white" : "bg-white text-black"
        )}
      >
        {isOpen ? <X className="h-7 w-7" /> : <MessageSquare className="h-7 w-7" />}
      </motion.button>
    </div>
  );
}