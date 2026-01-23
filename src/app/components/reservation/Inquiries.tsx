"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCheck,
  MoreVertical,
  Paperclip,
  Search,
  Send,
  Circle,
  Inbox,
  MessageSquare,
  Trash2
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

// FIREBASE IMPORTS
import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  where,
  getDocs,
  writeBatch,
  doc
} from "firebase/firestore";

// UI IMPORTS (Siguraduhin na may dropdown menu ka or gamitin ang simple button)
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  quickReplies: string[];
  hasUnread: boolean; // Para sa notification badge
};

export function Messenger() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string>("");
  const [draft, setDraft] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [adminSession, setAdminSession] = useState<any>(null);
  
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const session = localStorage.getItem("disruptive_user_session");
    if (session) setAdminSession(JSON.parse(session));
  }, []);

  // 1. REAL-TIME FETCH WITH UNREAD DETECTION
  useEffect(() => {
    const q = query(
      collection(db, "chats"),
      where("website", "==", "disruptivesolutionsinc"),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const grouped: Record<string, Conversation> = {};

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const clientEmail = data.senderEmail;

        if (!grouped[clientEmail]) {
          grouped[clientEmail] = {
            id: clientEmail,
            email: clientEmail,
            name: data.senderName || "Guest Client",
            status: "online",
            initials: (data.senderName || "G").substring(0, 2).toUpperCase(),
            messages: [],
            quickReplies: ["I'll check on this.", "Copy that.", "Can you provide more details?"],
            hasUnread: false
          };
        }

        const msgIsAdmin = data.isAdmin || false;
        grouped[clientEmail].messages.push({
          id: doc.id,
          sender: msgIsAdmin ? "user" : "contact",
          author: data.senderName,
          text: data.message,
          timestamp: data.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || "...",
          isAdmin: msgIsAdmin
        });

        // NOTIFICATION LOGIC: 
        // Kung ang huling message sa thread ay hindi galing sa Admin, mark as Unread.
        const lastMsg = grouped[clientEmail].messages[grouped[clientEmail].messages.length - 1];
        grouped[clientEmail].hasUnread = !lastMsg.isAdmin;
      });

      const convList = Object.values(grouped);
      setConversations(convList);

      if (!selectedConversationId && convList.length > 0) {
        setSelectedConversationId(convList[0].id);
      }
    });

    return () => unsubscribe();
  }, [selectedConversationId]);

  // 2. DELETE CONVERSATION FUNCTION
  const handleDeleteConversation = async (clientEmail: string) => {
    if (!confirm("Sigurado ka par? Mabubura lahat ng messages sa thread na 'to.")) return;

    try {
      const q = query(
        collection(db, "chats"),
        where("senderEmail", "==", clientEmail),
        where("website", "==", "disruptivesolutionsinc")
      );
      
      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);

      querySnapshot.forEach((document) => {
        batch.delete(doc(db, "chats", document.id));
      });

      await batch.commit();
      setSelectedConversationId(""); // Reset selection
    } catch (err) {
      console.error("Delete Error:", err);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.trim() || !selectedConversationId || !adminSession) return;

    try {
      await addDoc(collection(db, "chats"), {
        senderEmail: selectedConversationId,
        senderName: adminSession.displayName || "Admin",
        message: draft.trim(),
        isAdmin: true,
        timestamp: serverTimestamp(),
        website: "disruptivesolutionsinc"
      });
      setDraft("");
    } catch (err) {
      console.error("Firebase Send Error:", err);
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
      {/* SIDEBAR */}
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

        <div className="flex-1 overflow-y-auto p-2">
          {filteredConversations.map((conv) => (
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
                {/* NOTIFICATION BADGE */}
                {conv.hasUnread && selectedConversationId !== conv.id && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white"></span>
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-semibold truncate">{conv.name}</p>
                </div>
                <p className={cn("text-xs truncate opacity-70", selectedConversationId === conv.id ? "text-white" : "text-muted-foreground")}>
                  {conv.messages[conv.messages.length - 1]?.text}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* CHAT WINDOW */}
      <div className="hidden lg:flex flex-1 flex-col bg-card border rounded-2xl overflow-hidden shadow-sm relative">
        <AnimatePresence mode="wait">
          {activeConversation ? (
            <motion.div key={activeConversation.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full">
              {/* Header */}
              <div className="p-4 border-b flex items-center justify-between bg-card/50 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10"><AvatarFallback className="bg-primary text-white font-bold">{activeConversation.initials}</AvatarFallback></Avatar>
                  <div>
                    <h3 className="text-sm font-bold">{activeConversation.name}</h3>
                    <p className="text-[11px] text-muted-foreground">{activeConversation.email}</p>
                  </div>
                </div>
                
                {/* DELETE BUTTON IN DROPDOWN */}
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

              {/* Messages Container */}
              <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-muted/20">
                {activeConversation.messages.map((msg) => (
                  <div key={msg.id} className={cn("flex", msg.sender === "user" ? "justify-end" : "justify-start")}>
                    <div className={cn("flex flex-col max-w-[70%]", msg.sender === "user" ? "items-end" : "items-start")}>
                      <div className={cn("px-4 py-2.5 rounded-2xl text-sm shadow-sm", msg.sender === "user" ? "bg-primary text-white rounded-tr-none" : "bg-background border rounded-tl-none")}>
                        <p>{msg.text}</p>
                      </div>
                      <span className="text-[9px] text-muted-foreground mt-1 uppercase font-bold">{msg.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input */}
              <div className="p-4 bg-background border-t">
                <form onSubmit={handleSubmit}>
                  <div className="bg-muted/50 rounded-2xl border p-2">
                    <Textarea 
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder="Type a professional reply..."
                      className="min-h-20 w-full bg-transparent border-none focus-visible:ring-0 text-sm p-3"
                    />
                    <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t">
                      <Button type="submit" size="sm" disabled={!draft.trim()} className="rounded-lg h-8">
                        <Send className="w-3.5 h-3.5 mr-2" /> Reply
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            </motion.div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <MessageSquare className="w-12 h-12 opacity-10 mb-4" />
              <p>Select a client to view conversation</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}