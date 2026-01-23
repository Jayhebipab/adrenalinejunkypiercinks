"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  Trash2
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
  
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  // 1. INITIALIZE ADMIN SESSION
  useEffect(() => {
    const session = localStorage.getItem("disruptive_user_session");
    if (session) setAdminSession(JSON.parse(session));
  }, []);

  // 2. FETCH & GROUP MESSAGES FROM MONGODB
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
            timestamp: msg.timestamp 
              ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
              : "...",
            isAdmin: msg.isAdmin || false
          });

          // Logic for unread badge
          const lastMsg = grouped[clientEmail].messages[grouped[clientEmail].messages.length - 1];
          grouped[clientEmail].hasUnread = !lastMsg.isAdmin;
        });
      }

      const convList = Object.values(grouped);
      setConversations(convList);

      // Auto-select first conversation if none selected
      if (!selectedConversationId && convList.length > 0) {
        setSelectedConversationId(convList[0].id);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    }
  };

  // 3. POLLING FOR UPDATES (Global fetch)
  useEffect(() => {
    fetchChats();
    const interval = setInterval(fetchChats, 4000); 
    return () => clearInterval(interval);
  }, []); // Polling runs independently of selection

  // 4. AUTO-SCROLL TO BOTTOM
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [conversations, selectedConversationId]);

  // 5. DELETE THREAD
  const handleDeleteConversation = async (clientEmail: string) => {
    if (!confirm("Are you sure? This will delete the entire conversation history.")) return;

    try {
      const res = await fetch(`/api/chats?email=${clientEmail}`, { method: "DELETE" });
      if (res.ok) {
        setConversations(prev => prev.filter(c => c.id !== clientEmail));
        setSelectedConversationId("");
      }
    } catch (err) {
      console.error("Delete Error:", err);
    }
  };

  // 6. SEND MESSAGE (ADMIN REPLY)
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.trim() || !selectedConversationId) return;

    const payload = {
      senderEmail: selectedConversationId, // Target the specific client thread
      senderName: adminSession?.displayName || "Admin",
      message: draft.trim(),
      isAdmin: true,
    };

    try {
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setDraft("");
        fetchChats(); // Refresh immediately
      }
    } catch (err) {
      console.error("Send Error:", err);
    }
  };

  const activeConversation = useMemo(() => {
    return conversations.find((c) => c.id === selectedConversationId);
  }, [conversations, selectedConversationId]);

  const filteredConversations = conversations.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <section className="w-full h-[calc(100vh-120px)] flex gap-6 p-4 lg:p-0">
      {/* SIDEBAR: CLIENT LIST */}
      <div className="w-full lg:w-80 flex flex-col bg-card border rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg tracking-tight">Messages</h2>
            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-none">
              <Circle className="w-2 h-2 fill-current mr-1.5 animate-pulse" /> Live
            </Badge>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search clients..." 
              className="pl-9 bg-muted/50 border-none rounded-xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
          {filteredConversations.length === 0 ? (
             <div className="p-8 text-center text-xs text-muted-foreground italic">No conversations found.</div>
          ) : (
            filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversationId(conv.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 mb-1 text-left relative group",
                  selectedConversationId === conv.id ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-muted"
                )}
              >
                <div className="relative">
                  <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                    <AvatarFallback className={cn(selectedConversationId === conv.id ? "bg-white/20" : "bg-primary/10 text-primary")}>
                      {conv.initials}
                    </AvatarFallback>
                  </Avatar>
                  {conv.hasUnread && selectedConversationId !== conv.id && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white"></span>
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-semibold truncate">{conv.name}</p>
                  </div>
                  <p className={cn("text-xs truncate opacity-70", selectedConversationId === conv.id ? "text-white" : "text-muted-foreground")}>
                    {conv.messages[conv.messages.length - 1]?.text}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* CHAT WINDOW: MESSAGES */}
      <div className="hidden lg:flex flex-1 flex-col bg-card border rounded-2xl overflow-hidden shadow-sm relative">
        <AnimatePresence mode="wait">
          {activeConversation ? (
            <motion.div key={activeConversation.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full">
              <div className="p-4 border-b flex items-center justify-between bg-card/50 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary text-white font-bold">{activeConversation.initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-sm font-bold">{activeConversation.name}</h3>
                    <p className="text-[11px] text-muted-foreground">{activeConversation.email}</p>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full"><MoreVertical className="w-4 h-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40 rounded-xl">
                    <DropdownMenuItem 
                      className="text-destructive focus:text-destructive cursor-pointer"
                      onClick={() => handleDeleteConversation(activeConversation.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Thread
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* MESSAGE LIST */}
              <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-muted/10 scrollbar-hide">
                {activeConversation.messages.map((msg) => (
                  <div key={msg.id} className={cn("flex", msg.sender === "user" ? "justify-end" : "justify-start")}>
                    <div className={cn("flex flex-col max-w-[75%]", msg.sender === "user" ? "items-end" : "items-start")}>
                      <div className={cn(
                        "px-4 py-2.5 rounded-2xl text-sm shadow-sm border", 
                        msg.sender === "user" 
                          ? "bg-primary text-primary-foreground border-transparent rounded-tr-none" 
                          : "bg-background rounded-tl-none"
                      )}>
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      </div>
                      <span className="text-[9px] text-muted-foreground mt-1 uppercase font-bold tracking-tighter">
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* INPUT AREA */}
              <div className="p-4 bg-background border-t">
                <form onSubmit={handleSubmit}>
                  <div className="bg-muted/50 rounded-2xl border p-2 focus-within:border-primary/50 transition-colors">
                    <Textarea 
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder={`Reply to ${activeConversation.name}...`}
                      className="min-h-20 w-full bg-transparent border-none focus-visible:ring-0 text-sm p-3 resize-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          const target = e.target as HTMLTextAreaElement;
                          target.form?.requestSubmit();
                        }
                      }}
                    />
                    <div className="flex items-center justify-end gap-2 mt-1 pt-2 border-t border-muted-foreground/10">
                      <Button type="submit" size="sm" disabled={!draft.trim()} className="rounded-lg h-9 px-4">
                        <Send className="w-3.5 h-3.5 mr-2" /> Send Reply
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            </motion.div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <div className="bg-muted rounded-full p-6 mb-4 animate-pulse">
                <MessageSquare className="w-12 h-12 opacity-20" />
              </div>
              <p className="text-sm font-medium">Select a conversation to start messaging</p>
              <p className="text-xs opacity-50 mt-1">Real-time updates enabled</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}