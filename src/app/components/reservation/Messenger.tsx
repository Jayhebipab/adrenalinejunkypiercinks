"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
  MessageSquare,
  Send,
  ExternalLink,
  Image as ImageIcon,
  X,
  Loader2,
  ChevronLeft,
  Search
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { uploadToCloudinary } from "@/lib/cloudinary"; // Utility galing sa blog admin mo

// ---------- TYPES ----------
type Message = {
  id: string;
  sender: "user" | "contact";
  author: string;
  text: string;
  type: "text" | "image";
  timestamp: string;
  rawTime: number; // Para sa accurate sorting
  isAdmin: boolean;
};

type Conversation = {
  id: string;
  name: string;
  email: string;
  initials: string;
  messages: Message[];
  hasUnread: boolean;
  lastMessageTime: number;
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
        // 1. I-sort lahat ng messages from OLD to NEW para sa convo flow
        const sortedMessages = [...data].sort((a, b) => {
          const timeA = a.createdAt?.seconds || new Date(a.timestamp).getTime();
          const timeB = b.createdAt?.seconds || new Date(b.timestamp).getTime();
          return timeA - timeB;
        });

        sortedMessages.forEach((msg: any) => {
          const clientEmail = msg.senderEmail;
          const msgTime = msg.createdAt?.seconds * 1000 || new Date(msg.timestamp).getTime();

          if (!grouped[clientEmail]) {
            grouped[clientEmail] = {
              id: clientEmail,
              email: clientEmail,
              name: msg.senderName || "Guest Client",
              initials: (msg.senderName || "G").substring(0, 2).toUpperCase(),
              messages: [],
              hasUnread: false,
              lastMessageTime: 0
            };
          }
          
          grouped[clientEmail].messages.push({
            id: msg.id,
            sender: msg.isAdmin ? "user" : "contact",
            author: msg.senderName,
            text: msg.message,
            type: msg.type || "text",
            rawTime: msgTime,
            timestamp: new Date(msgTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isAdmin: msg.isAdmin || false
          });

          // Update last message time para sa sidebar sorting
          grouped[clientEmail].lastMessageTime = msgTime;
          // Unread marker: kung ang huling message ay hindi galing sa admin
          const lastMsg = grouped[clientEmail].messages[grouped[clientEmail].messages.length - 1];
          grouped[clientEmail].hasUnread = !lastMsg.isAdmin;
        });
      }
      setConversations(Object.values(grouped));
    } catch (err) { 
      console.error("Fetch Error:", err); 
    }
  };

  useEffect(() => {
    fetchChats();
    const interval = setInterval(fetchChats, 4000); 
    return () => clearInterval(interval);
  }, []);

  // Auto scroll sa pinakababa tuwing may bagong message
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [conversations, selectedConversationId]);

  const saveToDB = async (content: string, type: "text" | "image") => {
    if (!selectedConversationId) return;
    const payload = {
      senderEmail: selectedConversationId,
      senderName: adminSession?.displayName || "Admin",
      message: content,
      isAdmin: true,
      type: type,
      timestamp: new Date().toISOString()
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
    const currentDraft = draft;
    setDraft("");
    await saveToDB(currentDraft, "text");
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const uploadedUrl = await uploadToCloudinary(file);
      if (uploadedUrl) {
        await saveToDB(uploadedUrl, "image");
        toast.success("Image sent!");
      }
    } catch (error) {
      toast.error("Upload failed.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Sidebar sorting: Yung huling nag-chat ang nasa itaas
  const sortedAndFilteredConvos = useMemo(() => {
    return conversations
      .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => b.lastMessageTime - a.lastMessageTime);
  }, [conversations, searchTerm]);

  const activeConversation = useMemo(() => 
    conversations.find((c) => c.id === selectedConversationId), 
  [conversations, selectedConversationId]);

  return (
    <section className="w-full h-[calc(100vh-80px)] lg:h-[calc(100vh-120px)] flex gap-6 overflow-hidden">
      
      {/* IMAGE VIEW OVERLAY */}
      <AnimatePresence>
        {maximizedImage && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
            onClick={() => setMaximizedImage(null)}
          >
            <img src={maximizedImage} className="max-w-full max-h-full object-contain rounded-lg" />
            <Button className="absolute top-4 right-4 bg-white/10" variant="ghost" size="icon" onClick={() => setMaximizedImage(null)}>
              <X className="text-white" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SIDEBAR: List of Clients */}
      <div className={cn(
        "w-full lg:w-80 flex flex-col bg-card border lg:rounded-2xl overflow-hidden shadow-sm",
        selectedConversationId ? "hidden lg:flex" : "flex"
      )}>
        <div className="p-4 border-b space-y-4">
          <h2 className="font-black uppercase tracking-tight text-lg">Inbox</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input 
              placeholder="Search..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="pl-10 bg-muted/50 border-none rounded-xl" 
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
          {sortedAndFilteredConvos.map((conv) => (
            <button 
              key={conv.id} 
              onClick={() => setSelectedConversationId(conv.id)} 
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl mb-1 text-left transition-all", 
                selectedConversationId === conv.id ? "bg-zinc-900 text-white" : "hover:bg-muted"
              )}
            >
              <Avatar className="h-10 w-10 border shadow-sm">
                <AvatarFallback className={cn(selectedConversationId === conv.id ? "bg-zinc-700" : "bg-primary text-white")}>
                  {conv.initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-bold truncate">{conv.name}</p>
                  {conv.hasUnread && selectedConversationId !== conv.id && <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />}
                </div>
                <p className={cn("text-xs truncate opacity-70")}>
                  {conv.messages[conv.messages.length - 1]?.type === 'image' ? "Sent an image..." : conv.messages[conv.messages.length - 1]?.text}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* CHAT WINDOW */}
      <div className={cn(
        "flex-1 flex flex-col bg-card border lg:rounded-2xl overflow-hidden relative shadow-sm",
        selectedConversationId ? "flex" : "hidden lg:flex"
      )}>
        {activeConversation ? (
          <div className="flex flex-col h-full">
            <div className="p-4 border-b flex items-center justify-between bg-card/50 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="lg:hidden mr-1" onClick={() => setSelectedConversationId("")}>
                  <ChevronLeft className="w-6 h-6" />
                </Button>
                <Avatar><AvatarFallback className="bg-primary text-white font-bold">{activeConversation.initials}</AvatarFallback></Avatar>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold truncate uppercase">{activeConversation.name}</h3>
                  <p className="text-[10px] opacity-50 truncate tracking-widest font-bold">ACTIVE CONVERSATION</p>
                </div>
              </div>
            </div>

            {/* MESSAGES AREA - Dito lalabas yung convo pababa */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-muted/5 scrollbar-hide">
              {activeConversation.messages.map((msg) => (
                <div key={msg.id} className={cn("flex w-full", msg.sender === "user" ? "justify-end" : "justify-start")}>
                  <div className={cn("flex flex-col max-w-[85%] md:max-w-[70%]", msg.sender === "user" ? "items-end" : "items-start")}>
                    <div className={cn(
                      "px-4 py-2.5 rounded-2xl text-sm shadow-sm border leading-relaxed", 
                      msg.sender === "user" ? "bg-zinc-900 text-white border-transparent rounded-tr-none" : "bg-background rounded-tl-none text-foreground"
                    )}>
                      {msg.type === "image" ? (
                        <img src={msg.text} onClick={() => setMaximizedImage(msg.text)} className="rounded-lg cursor-zoom-in max-h-60 object-cover" />
                      ) : (
                        msg.text
                      )}
                    </div>
                    <span className="text-[9px] mt-1 font-bold opacity-30 uppercase tracking-widest">{msg.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* INPUT AREA */}
            <div className="p-4 bg-background border-t">
              <form onSubmit={handleSubmit} className="bg-muted/50 rounded-2xl border p-2 focus-within:ring-2 ring-primary/20 transition-all">
                <Textarea 
                  value={draft} 
                  onChange={(e) => setDraft(e.target.value)} 
                  placeholder="Reply to client..." 
                  className="min-h-16 w-full bg-transparent border-none focus-visible:ring-0 text-sm resize-none" 
                  disabled={uploading}
                />
                <div className="flex items-center justify-between p-2 border-t border-muted-foreground/10">
                  <div className="flex gap-2">
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                    <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="h-9 w-9">
                      {uploading ? <Loader2 className="animate-spin w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                    </Button>
                  </div>
                  <Button type="submit" size="sm" className="rounded-xl h-9 px-5 font-bold uppercase tracking-widest text-[11px]" disabled={!draft.trim() || uploading}>
                    <Send className="w-3.5 h-3.5 mr-2" /> Send Message
                  </Button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-20">
            <MessageSquare className="w-16 h-16 mb-4" />
            <p className="text-sm font-black uppercase tracking-widest">Select a message to respond</p>
          </div>
        )}
      </div>
    </section>
  );
}