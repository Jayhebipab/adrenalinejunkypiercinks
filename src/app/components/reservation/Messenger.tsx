"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
  MessageSquare,
  Send,
  Image as ImageIcon,
  X,
  Loader2,
  ChevronLeft,
  Search,
  CheckCheck,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { uploadToCloudinary } from "@/lib/cloudinary";

// ---------- TYPES ----------
type Message = {
  id: string;
  sender: "user" | "contact";
  author: string;
  text: string;
  type: "text" | "image";
  timestamp: string;
  isFAQ?: boolean;
  isEdited?: boolean;
  rawTime: number;
  isAdmin: boolean;
  seenAt: string | null;
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

// ---------- UTILS ----------
const getSafeDate = (ts: any) => {
  if (!ts) return new Date();
  if (ts && typeof ts === "object" && "seconds" in ts) return new Date(ts.seconds * 1000);
  const d = new Date(ts);
  return isNaN(d.getTime()) ? new Date() : d;
};

const formatDateSeparator = (dateStr: any) => {
  const d = getSafeDate(dateStr);
  const today = new Date().toLocaleDateString();
  if (d.toLocaleDateString() === today) return "Today";
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toLocaleDateString() === yesterday.toLocaleDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
};

export function Messenger() {
  const scrollRef = useRef<HTMLDivElement>(null);
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
        const sortedMessages = [...data].sort((a, b) => {
          const timeA = a.createdAt?.seconds || new Date(a.timestamp).getTime();
          const timeB = b.createdAt?.seconds || new Date(b.timestamp).getTime();
          return timeA - timeB;
        });

        sortedMessages.forEach((msg: any) => {
          const clientEmail = msg.senderEmail;
          const d = getSafeDate(msg.createdAt || msg.timestamp);
          const msgTime = d.getTime();

          if (!grouped[clientEmail]) {
            grouped[clientEmail] = {
              id: clientEmail,
              email: clientEmail,
              name: msg.senderName || "Guest Client",
              initials: (msg.senderName || "G").substring(0, 2).toUpperCase(),
              messages: [],
              hasUnread: false,
              lastMessageTime: 0,
            };
          }

          grouped[clientEmail].messages.push({
            id: msg.id,
            sender: msg.isAdmin ? "user" : "contact",
            author: msg.senderName,
            text: msg.message,
            type: msg.type || "text",
            rawTime: msgTime,
            timestamp: d.toISOString(),
            isAdmin: msg.isAdmin || false,
            isFAQ: msg.isFAQ || false,
            isEdited: msg.isEdited || false,
            seenAt: msg.seenAt || null,
          });

          grouped[clientEmail].lastMessageTime = msgTime;
          const lastMsg = grouped[clientEmail].messages[grouped[clientEmail].messages.length - 1];
          grouped[clientEmail].hasUnread = !lastMsg.isAdmin && !lastMsg.seenAt;
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

  // When admin selects a conversation, mark client's messages as seen
  useEffect(() => {
    if (!selectedConversationId) return;

    const markSeenByAdmin = async () => {
      try {
        await fetch("/api/chats", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            markSeen: true,
            senderEmail: selectedConversationId,
            seenBy: "admin",
          }),
        });
      } catch (err) {
        console.error("Mark seen error:", err);
      }
    };

    markSeenByAdmin();
  }, [selectedConversationId]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 150;
    const scrollToBottom = () => container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    if (selectedConversationId || isAtBottom) {
      const timeoutId = setTimeout(scrollToBottom, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [conversations, selectedConversationId]);

  const editAdminMessage = async (id: string, newContent: string) => {
    if (!newContent.trim()) return;
    try {
      const res = await fetch("/api/chats", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, message: newContent }),
      });
      if (res.ok) { toast.success("Transmission updated."); fetchChats(); }
    } catch { toast.error("Failed to update message."); }
  };

  const deleteAdminMessage = async (id: string) => {
    try {
      const res = await fetch(`/api/chats?id=${id}`, { method: "DELETE" });
      if (res.ok) { toast.success("Data wiped."); fetchChats(); }
    } catch { toast.error("Wipe failed."); }
  };

  const saveToDB = async (content: string, type: "text" | "image") => {
    if (!selectedConversationId) return;
    const res = await fetch("/api/chats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        senderEmail: selectedConversationId,
        senderName: adminSession?.displayName || "Admin",
        message: content,
        isAdmin: true,
        type,
        isEdited: false,
        timestamp: new Date().toISOString(),
      }),
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
      if (uploadedUrl) { await saveToDB(uploadedUrl, "image"); toast.success("Image sent!"); }
    } catch { toast.error("Upload failed."); } 
    finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
  };

  const sortedAndFilteredConvos = useMemo(() => {
    return conversations
      .filter((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => b.lastMessageTime - a.lastMessageTime);
  }, [conversations, searchTerm]);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === selectedConversationId),
    [conversations, selectedConversationId]
  );

  // Find the last admin message in a conversation (to show seen status below it)
  const getLastAdminMsgId = (msgs: Message[]) => {
    const adminMsgs = msgs.filter((m) => m.isAdmin);
    return adminMsgs[adminMsgs.length - 1]?.id ?? null;
  };

  return (
    <section className="w-full h-[calc(100vh-80px)] lg:h-[calc(100vh-120px)] flex gap-6 overflow-hidden">
      <AnimatePresence>
        {maximizedImage && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setMaximizedImage(null)}
          >
            <img src={maximizedImage} className="max-w-full max-h-full object-contain rounded-lg" alt="Enlarged" />
            <Button className="absolute top-4 right-4 bg-white/10" variant="ghost" size="icon" onClick={() => setMaximizedImage(null)}>
              <X className="text-white" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SIDEBAR */}
      <div className={cn(
        "w-full lg:w-80 flex flex-col bg-card border border-border lg:rounded-3xl overflow-hidden shadow-sm transition-all",
        selectedConversationId ? "hidden lg:flex" : "flex"
      )}>
        <div className="p-5 border-b border-border space-y-4">
          <h2 className="font-black uppercase tracking-tight text-xl text-foreground">Inbox</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-muted border-none rounded-2xl h-11"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
          {sortedAndFilteredConvos.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setSelectedConversationId(conv.id)}
              className={cn(
                "w-full flex items-center gap-3 p-4 rounded-2xl mb-1 text-left transition-all",
                selectedConversationId === conv.id ? "bg-foreground text-background" : "hover:bg-muted text-foreground"
              )}
            >
              <Avatar className="h-12 w-12 border border-border/50">
                <AvatarFallback className={cn("font-bold", selectedConversationId === conv.id ? "bg-background text-foreground" : "bg-primary text-primary-foreground")}>
                  {conv.initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-0.5">
                  <p className="text-sm font-bold truncate">{conv.name}</p>
                  {conv.hasUnread && selectedConversationId !== conv.id && (
                    <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                  )}
                </div>
                <p className={cn("text-xs truncate font-medium", selectedConversationId === conv.id ? "opacity-70" : "text-muted-foreground")}>
                  {conv.messages[conv.messages.length - 1]?.type === "image" ? "Sent an image..." : conv.messages[conv.messages.length - 1]?.text}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* CHAT AREA */}
      <div className={cn(
        "flex-1 flex flex-col bg-card border border-border lg:rounded-3xl overflow-hidden relative shadow-sm transition-all",
        selectedConversationId ? "flex" : "hidden lg:flex"
      )}>
        {activeConversation ? (
          <div className="flex flex-col h-full bg-background/50">
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-card/80 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="lg:hidden mr-1" onClick={() => setSelectedConversationId("")}>
                  <ChevronLeft className="w-6 h-6" />
                </Button>
                <Avatar className="border border-border">
                  <AvatarFallback className="bg-primary text-primary-foreground font-bold">{activeConversation.initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <h3 className="text-sm font-black truncate uppercase text-foreground">{activeConversation.name}</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Live Channel</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scrollbar-hide scroll-smooth">
              {(() => {
                const lastAdminId = getLastAdminMsgId(activeConversation.messages);
                return activeConversation.messages.map((msg, index) => {
                  const isImage = msg.type === "image";
                  const isLink = /(https?:\/\/[^\s]+)/g.test(msg.text || "");
                  const isFAQ = msg.isFAQ === true;
                  const isMe = msg.isAdmin === true;
                  const currentMsgDate = getSafeDate(msg.timestamp);
                  const prevMsgDate = index > 0 ? getSafeDate(activeConversation.messages[index - 1].timestamp) : null;
                  const showDateSeparator = !prevMsgDate || currentMsgDate.toLocaleDateString() !== prevMsgDate.toLocaleDateString();

                  // Show "Seen" only below the last admin message, and only if client already saw it
                  const isLastAdminMsg = isMe && msg.id === lastAdminId;
                  const clientSawIt = isLastAdminMsg && !!msg.seenAt;

                  return (
                    <div key={msg.id || index} className="space-y-6">
                      {showDateSeparator && (
                        <div className="flex justify-center my-8">
                          <span className="px-3 py-1 rounded-full bg-muted/50 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground border border-border/50">
                            {formatDateSeparator(msg.timestamp)}
                          </span>
                        </div>
                      )}

                      <div className={cn("flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300", isMe ? "justify-end" : "justify-start")}>
                        <div className={cn("flex flex-col max-w-[85%] md:max-w-[70%] relative group", isMe ? "items-end" : "items-start")}>
                          
                          {/* Edit/Delete Actions */}
                          {isMe && !isFAQ && (
                            <div className="absolute -top-5 right-0 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 rounded-md px-2 py-1 border border-zinc-800 z-20 shadow-xl">
                              {!isImage && !isLink && (
                                <button
                                  onClick={() => { const n = prompt("Edit message:", msg.text); if (n) editAdminMessage(msg.id, n); }}
                                  className="text-[8px] font-black uppercase text-zinc-400 hover:text-blue-400"
                                >Edit</button>
                              )}
                              <button
                                onClick={() => confirm("Delete?") && deleteAdminMessage(msg.id)}
                                className="text-[8px] font-black uppercase text-zinc-400 hover:text-red-500"
                              >Wipe</button>
                            </div>
                          )}

                          {/* Bubble */}
                          <div className={cn(
                            "px-4 py-3 rounded-2xl text-sm border transition-colors leading-relaxed",
                            !isMe ? "bg-white text-black border-transparent rounded-tl-none font-medium shadow-sm"
                                  : "bg-muted text-foreground border-border rounded-tr-none"
                          )}>
                            {isImage ? (
                              <img src={msg.text} onClick={() => setMaximizedImage(msg.text)} className="max-h-64 rounded-lg cursor-zoom-in hover:scale-[1.02] transition-transform" alt="Sent" />
                            ) : (
                              <span className="whitespace-pre-wrap">{msg.text}</span>
                            )}
                          </div>

                          {/* Time + Edited + Seen */}
                          <div className={cn("flex items-center gap-1.5 mt-1.5", isMe ? "flex-row-reverse" : "flex-row")}>
                            <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-tighter">
                              {currentMsgDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })}
                            </span>
                            {msg.isEdited && (
                              <span className="text-[7px] font-black text-muted-foreground/40 uppercase italic">(Edited)</span>
                            )}
                            {/* SEEN INDICATOR — only on admin's last message */}
                            {isLastAdminMsg && (
                              <AnimatePresence>
                                <motion.div
                                  initial={{ opacity: 0, x: -4 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  className={cn("flex items-center gap-1", isMe ? "mr-1" : "ml-1")}
                                >
                                  <CheckCheck
                                    size={12}
                                    className={cn(
                                      "transition-colors duration-500",
                                      clientSawIt ? "text-blue-400" : "text-muted-foreground/30"
                                    )}
                                  />
                                  <span className={cn(
                                    "text-[8px] font-black uppercase tracking-wider transition-colors duration-500",
                                    clientSawIt ? "text-blue-400" : "text-muted-foreground/30"
                                  )}>
                                    {clientSawIt ? "Seen" : "Sent"}
                                  </span>
                                </motion.div>
                              </AnimatePresence>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
              <div ref={scrollRef} className="h-1" />
            </div>

            {/* Input */}
            <div className="p-4 bg-card border-t border-border">
              <form onSubmit={handleSubmit} className="bg-muted/30 rounded-3xl border border-border p-2 focus-within:ring-2 ring-primary/10 transition-all">
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type your response..."
                  className="min-h-[80px] w-full bg-transparent border-none focus-visible:ring-0 text-sm resize-none"
                  disabled={uploading}
                />
                <div className="flex items-center justify-between p-2 border-t border-border/50">
                  <div className="flex gap-2">
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                    <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="h-10 w-10 rounded-full">
                      {uploading ? <Loader2 className="animate-spin w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
                    </Button>
                  </div>
                  <Button type="submit" size="sm" className="rounded-2xl h-10 px-6 font-bold uppercase tracking-widest text-[11px]" disabled={!draft.trim() || uploading}>
                    <Send className="w-4 h-4 mr-2" /> Send
                  </Button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-muted/10">
            <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mb-6">
              <MessageSquare className="w-10 h-10 text-muted-foreground/40" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-foreground mb-2">Private Inbox</h3>
            <p className="text-xs text-muted-foreground max-w-[200px] leading-relaxed">Select a conversation from the sidebar to start responding to clients.</p>
          </div>
        )}
      </div>
    </section>
  );
}