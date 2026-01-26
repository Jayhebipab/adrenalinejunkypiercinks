"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
  Circle,
  MessageSquare,
  MoreVertical,
  Search,
  Send,
  Trash2,
  ExternalLink,
  Image as ImageIcon,
  X,
  Loader2,
  ChevronLeft // Dagdag para sa back button sa phone
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ---------- TYPES ----------
type Message = {
  id: string;
  sender: "user" | "contact";
  author: string;
  text: string;
  type: "text" | "image";
  timestamp: string;
  isAdmin: boolean;
};

type Conversation = {
  id: string;
  name: string;
  email: string;
  status: "online" | "offline";
  initials: string;
  messages: Message[];
  hasUnread: boolean;
};

export function Messenger() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string>("");
  const [draft, setDraft] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [adminSession, setAdminSession] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [maximizedImage, setMaximizedImage] = useState<string | null>(null);
  
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const session = localStorage.getItem("disruptive_user_session");
    if (session) setAdminSession(JSON.parse(session));
  }, []);

  const fetchChats = async () => {
    try {
      const res = await fetch("/api/chats");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json(); 
      const grouped: Record<string, Conversation> = {};

      if (Array.isArray(data)) {
        data.forEach((msg: any) => {
          const clientEmail = msg.senderEmail;
          if (!grouped[clientEmail]) {
            grouped[clientEmail] = {
              id: clientEmail,
              email: clientEmail,
              name: msg.senderName || "Guest Client",
              status: "online",
              initials: (msg.senderName || "G").substring(0, 2).toUpperCase(),
              messages: [],
              hasUnread: false
            };
          }
          grouped[clientEmail].messages.push({
            id: msg._id,
            sender: msg.isAdmin ? "user" : "contact",
            author: msg.senderName,
            text: msg.message,
            type: msg.type || (msg.message.startsWith("data:image") ? "image" : "text"),
            timestamp: msg.timestamp 
              ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
              : "...",
            isAdmin: msg.isAdmin || false
          });
          const lastMsg = grouped[clientEmail].messages[grouped[clientEmail].messages.length - 1];
          grouped[clientEmail].hasUnread = !lastMsg.isAdmin;
        });
      }
      setConversations(Object.values(grouped));
    } catch (err) { console.error("Fetch Error:", err); }
  };

  useEffect(() => {
    fetchChats();
    const interval = setInterval(fetchChats, 4000); 
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [conversations, selectedConversationId]);

  const saveToDB = async (content: string, type: "text" | "image") => {
    if (!selectedConversationId) return;
    const payload = {
      senderEmail: selectedConversationId,
      senderName: adminSession?.displayName || "Admin",
      message: content,
      isAdmin: true,
      type: type
    };
    const res = await fetch("/api/chats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) fetchChats();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.trim()) return;
    await saveToDB(draft.trim(), "text");
    setDraft("");
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      await saveToDB(reader.result as string, "image");
      setUploading(false);
    };
  };

  const renderMessageContent = (msg: Message) => {
    if (msg.type === "image") {
      return (
        <img 
          src={msg.text} 
          alt="attachment" 
          className="rounded-lg max-w-full md:max-w-[250px] transition-transform hover:scale-[1.02] cursor-zoom-in"
          onClick={() => setMaximizedImage(msg.text)}
        />
      );
    }
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return msg.text.split(urlRegex).map((part, i) => 
      urlRegex.test(part) ? (
        <a key={i} href={part} target="_blank" rel="noreferrer" className="underline text-blue-500 hover:text-blue-600 inline-flex items-center gap-1">
          {part} <ExternalLink size={12} />
        </a>
      ) : part
    );
  };

  const activeConversation = useMemo(() => conversations.find((c) => c.id === selectedConversationId), [conversations, selectedConversationId]);
  const filteredConversations = conversations.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <section className="w-full h-[calc(100vh-80px)] lg:h-[calc(100vh-120px)] flex gap-6 p-0 lg:p-0 overflow-hidden">
      
      {/* IMAGE MAXIMIZE OVERLAY */}
      <AnimatePresence>
        {maximizedImage && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
            onClick={() => setMaximizedImage(null)}
          >
            <Button className="absolute top-6 right-6 rounded-full bg-white/10" variant="ghost" size="icon" onClick={() => setMaximizedImage(null)}>
              <X className="text-white" />
            </Button>
            <motion.img 
              initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              src={maximizedImage} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" 
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* SIDEBAR: Hidden on mobile when a conversation is active */}
      <div className={cn(
        "w-full lg:w-80 flex flex-col bg-card border lg:rounded-2xl overflow-hidden shadow-sm",
        selectedConversationId ? "hidden lg:flex" : "flex"
      )}>
        <div className="p-4 border-b space-y-4">
          <h2 className="font-bold text-lg">Messages</h2>
          <Input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-muted/50 border-none rounded-xl" />
        </div>
        <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
          {filteredConversations.map((conv) => (
            <button key={conv.id} onClick={() => setSelectedConversationId(conv.id)} className={cn("w-full flex items-center gap-3 p-3 rounded-xl mb-1 text-left transition-all", selectedConversationId === conv.id ? "bg-primary text-primary-foreground" : "hover:bg-muted")}>
              <Avatar className="h-10 w-10 border shadow-sm"><AvatarFallback>{conv.initials}</AvatarFallback></Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-semibold truncate">{conv.name}</p>
                  {conv.hasUnread && selectedConversationId !== conv.id && <span className="h-2 w-2 rounded-full bg-red-500" />}
                </div>
                <p className={cn("text-xs truncate opacity-70", selectedConversationId === conv.id ? "text-white" : "text-muted-foreground")}>
                  {conv.messages[conv.messages.length - 1]?.type === 'image' ? "Sent an image..." : conv.messages[conv.messages.length - 1]?.text}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* CHAT WINDOW: Full screen on mobile when a conversation is active */}
      <div className={cn(
        "flex-1 flex flex-col bg-card border lg:rounded-2xl overflow-hidden relative shadow-sm",
        selectedConversationId ? "flex" : "hidden lg:flex"
      )}>
        {activeConversation ? (
          <div className="flex flex-col h-full">
            <div className="p-4 border-b flex items-center justify-between bg-card/50 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                {/* Mobile Back Button */}
                <Button variant="ghost" size="icon" className="lg:hidden mr-1" onClick={() => setSelectedConversationId("")}>
                  <ChevronLeft className="w-6 h-6" />
                </Button>
                <Avatar><AvatarFallback className="bg-primary text-white font-bold">{activeConversation.initials}</AvatarFallback></Avatar>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold truncate">{activeConversation.name}</h3>
                  <p className="text-[11px] opacity-50 truncate">{activeConversation.email}</p>
                </div>
              </div>
            </div>

            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-muted/5 scrollbar-hide">
              {activeConversation.messages.map((msg) => (
                <div key={msg.id} className={cn("flex", msg.sender === "user" ? "justify-end" : "justify-start")}>
                  <div className={cn("flex flex-col max-w-[85%] md:max-w-[75%]", msg.sender === "user" ? "items-end" : "items-start")}>
                    <div className={cn(
                      "px-4 py-2.5 rounded-2xl text-sm shadow-sm border", 
                      msg.sender === "user" ? "bg-primary text-primary-foreground border-transparent rounded-tr-none" : "bg-background rounded-tl-none text-foreground"
                    )}>
                      {renderMessageContent(msg)}
                    </div>
                    <span className="text-[9px] mt-1 font-bold opacity-40">{msg.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-background border-t">
              <form onSubmit={handleSubmit}>
                <div className="bg-muted/50 rounded-2xl border p-2 focus-within:border-primary transition-all">
                  <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type a message..." className="min-h-16 w-full bg-transparent border-none focus-visible:ring-0 text-sm resize-none" />
                  <div className="flex items-center justify-between p-2 border-t border-muted-foreground/10">
                    <div className="flex gap-2">
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                      <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className="text-muted-foreground hover:text-primary h-8 w-8">
                        {uploading ? <Loader2 className="animate-spin w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                      </Button>
                    </div>
                    <Button type="submit" size="sm" className="rounded-lg h-9 px-4" disabled={!draft.trim() && !uploading}>
                      <Send className="w-3.5 h-3.5 mr-2" /> Send
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-30">
            <MessageSquare className="w-12 h-12 mb-2" />
            <p className="text-sm font-medium">Select a client to start chatting</p>
          </div>
        )}
      </div>
    </section>
  );
}