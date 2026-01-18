"use client";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { MessageSquare, Send, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const FAQ_DATA = [
  { id: 1, q: "Piercing Rates?", a: "Rates start at ₱500 (standard lobe). Includes basic jewelry! DM us for specific body parts." },
  { id: 2, q: "Shop Location?", a: "We are located at [Address]. Open Tue-Sun, 1PM-9PM. See you there!" },
  { id: 3, q: "Does it hurt?", a: "Tattoo? It's just like a tiny pinch... totally tolerable, bro! 😂" },
  { id: 4, q: "Jewelry options?", a: "Yes! We stock premium titanium and surgical steel studs in-store." }
];

export function FloatingChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<{role: string, text: string}[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. LOAD: Fetch chat history from localStorage
  useEffect(() => {
    const savedChat = localStorage.getItem("aj_chat_history");
    if (savedChat) {
      setMessages(JSON.parse(savedChat));
    } else {
      // Aggressive/Funny English Greeting
      setMessages([
        { 
          role: 'bot', 
          text: "Are you out of your mind? Did I ask who's looking for their mama? Just get a tattoo or a piercing already!" 
        }
      ]);
    }
  }, []);

  // 2. SAVE: Persist messages to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("aj_chat_history", JSON.stringify(messages));
    }
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const toggleOpen = useCallback(() => setIsOpen((prev) => !prev), []);

  const handleFAQClick = (q: string, a: string) => {
    const newMessages = [...messages, { role: 'user', text: q }];
    setMessages(newMessages);
    
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'bot', text: a }]);
    }, 600);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMsg = { role: 'user', text: inputMessage };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage("");

    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'bot', 
        text: "Stop overthinking it! Are you getting inked or what? Talk to us for real or just book now!" 
      }]);
    }, 1000);
  };

  const clearChat = () => {
    const defaultMsg = [{ role: 'bot', text: "Chat cleared! Ready to stop being a wuss and get pierced?" }];
    setMessages(defaultMsg);
    localStorage.removeItem("aj_chat_history");
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-4">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="w-[350px] sm:w-[380px] overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950 shadow-2xl backdrop-blur-xl ring-1 ring-white/10"
          >
            {/* Header */}
            <div className="relative border-b border-white/10 bg-zinc-800 p-5 text-white">
              <div className="relative flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                    <AvatarFallback className="bg-zinc-900">AJ</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-tighter text-white">AJ Assistant</h3>
                    <button onClick={clearChat} className="text-[9px] uppercase font-bold opacity-60 hover:opacity-100 transition-opacity">Clear Chat</button>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="text-white hover:bg-black/20" onClick={() => setIsOpen(false)}>
                  <X size={18} />
                </Button>
              </div>
            </div>

            {/* Chat Area */}
            <div ref={scrollRef} className="flex h-[300px] flex-col gap-4 overflow-y-auto p-4 bg-zinc-950">
              {messages.map((m, i) => (
                <div key={i} className={cn("flex gap-3", m.role === 'user' && "flex-row-reverse self-end")}>
                  <div className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2 text-sm",
                    m.role === 'bot' 
                      ? "bg-zinc-900 text-zinc-300 rounded-tl-none border border-white/5 shadow-inner" 
                      : "bg-white text-black font-semibold rounded-tr-none shadow-lg"
                  )}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions (FAQs) */}
            <div className="p-4 border-t border-white/5 bg-zinc-900/50">
              <div className="flex flex-wrap gap-2">
                {FAQ_DATA.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleFAQClick(item.q, item.a)}
                    className="text-[10px] font-bold uppercase bg-zinc-800 hover:bg-gradient-to-r hover:from-red-600 hover:to-orange-500 text-white border border-white/5 px-3 py-1.5 rounded-full transition-all"
                  >
                    {item.q}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="p-3 bg-zinc-950 border-t border-white/5 flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask something..."
                className="flex-1 rounded-full border border-white/10 bg-zinc-900 px-4 py-2 text-[12px] outline-none text-white focus:border-orange-500/50"
              />
              <Button type="submit" size="icon" className="h-9 w-9 rounded-full bg-white text-black hover:bg-orange-500 hover:text-white transition-colors">
                <Send size={16} />
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleOpen}
        className={cn(
          "relative flex items-center justify-center rounded-full shadow-2xl z-50 transition-all",
          "h-12 w-12 md:h-16 md:w-16", 
isOpen ? "bg-zinc-900 text-white" : "bg-gray-600 text-white"
        )}
      >
        {isOpen ? <X className="h-5 w-5 md:h-7 md:w-7" /> : <MessageSquare className="h-5 w-5 md:h-7 md:w-7" />}
      </motion.button>
    </div>
  );
}