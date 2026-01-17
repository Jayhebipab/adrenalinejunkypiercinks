"use client";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { MessageSquare, Send, X, Zap } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const FAQ_DATA = [
  { id: 1, q: "Magkano Piercing?", a: "Rates start at ₱500 (standard lobe). Includes basic jewelry! PM us for specific areas." },
  { id: 2, q: "Saan ang shop?", a: "Located kami sa [Address]. Open Tue-Sun, 1PM-9PM. Kita-kits!" },
  { id: 3, q: "Masakit ba?", a: "Tattoo? Parang kagat lang ng langgam... tolerable naman par! 😂" },
  { id: 4, q: "Jewelry available?", a: "Yes! We have premium titanium and surgical steel studs in-store." }
];

export function FloatingChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<{role: string, text: string}[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

// 1. LOAD: Pag-open ng site, kunin ang messages sa localStorage
  useEffect(() => {
    const savedChat = localStorage.getItem("aj_chat_history");
    if (savedChat) {
      setMessages(JSON.parse(savedChat));
    } else {
      // Custom aggressive/funny greeting para sa brand identity mo
      setMessages([
        { 
          role: 'bot', 
          text: "Baliw ka ba? Nagtanong ba ako kung sino ang nawawalan ng nanay? Magpa-tattoo o piercing ka na lang dito!" 
        }
      ]);
    }
  }, []);

  // 2. SAVE: Kada magbabago ang messages, i-save sa localStorage
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

    // Custom response logic o default bot reply
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'bot',  text: "Baliw ka ba? Nagtanong ba ako kung sino ang nawawalan ng nanay? Magpa-tattoo o piercing ka na lang dito!" }]);
    }, 1000);
  };

  const clearChat = () => {
    const defaultMsg = [{ role: 'bot', text: "Chat cleared! How can I help you again?" }];
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
            <div className="relative border-b border-white/10 bg-red-600 p-5 text-white">
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
                      ? "bg-zinc-900 text-zinc-300 rounded-tl-none border border-white/5" 
                      : "bg-red-600 text-white rounded-tr-none"
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
                    className="text-[10px] font-bold uppercase bg-zinc-800 hover:bg-red-600/20 text-zinc-300 border border-white/5 px-3 py-1.5 rounded-full transition-all"
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
                placeholder="Type a message..."
                className="flex-1 rounded-full border border-white/10 bg-zinc-900 px-4 py-2 text-[12px] outline-none text-white focus:border-red-600/50"
              />
              <Button type="submit" size="icon" className="h-9 w-9 rounded-full bg-red-600 hover:bg-red-700">
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
          "relative flex h-16 w-16 items-center justify-center rounded-full shadow-2xl z-50",
          isOpen ? "bg-zinc-900 text-white" : "bg-red-600 text-white"
        )}
      >
        {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
      </motion.button>
    </div>
  );
}