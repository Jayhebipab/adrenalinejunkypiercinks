"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2, Calendar, User, RefreshCw, Clock, Maximize2,
  ChevronRight, Hash, Sparkles, Edit3, Image as ImageIcon, X, FilterX,
  PhilippinePeso, ChevronDown
} from "lucide-react";
import { toast, Toaster } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { DatePicker } from "../../components/date-picker";
import { Calendars } from "../../components/calendars";
import { SidebarProvider } from "@/components/ui/sidebar";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

interface Booking {
  id: string;
  name: string;
  email: string;
  phone: string;
  artist: string;
  service: string;
  preferredDate: string;
  preferredTime?: string;
  message: string;
  status: string;
  images?: string[];
  downPayment?: number;
  timestamp: any;
}

const calendarData = [
  {
    name: "System Filters",
    items: ["All Requests", "Pending", "Approved", "Declined", "Finished", "Adjusted"],
  },
];

// ─── AUDIT TRAIL HELPER ───────────────────────────────────────────────────────
async function logAudit({
  action,
  details,
  module = "Bookings",
}: {
  action: string;
  details: string;
  module?: string;
}) {
  try {
    const stored = localStorage.getItem("user");
    const adminName = stored ? JSON.parse(stored)?.name ?? "Unknown Admin" : "Unknown Admin";
    const adminRole = stored ? JSON.parse(stored)?.role ?? "—" : "—";

    await addDoc(collection(db, "audit_logs"), {
      adminName,
      adminRole,
      action,
      details,
      module,
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.warn("Audit log failed:", err);
  }
}
// ─────────────────────────────────────────────────────────────────────────────

export default function BookingRequest() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [decliningBooking, setDecliningBooking] = useState<Booking | null>(null);
  const [declineReason, setDeclineReason] = useState("");

  // FILTER STATES
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string>("All Requests");

  // Controlled dossier dialog — tracks which booking's dossier is open
  const [openDossierId, setOpenDossierId] = useState<string | null>(null);

  // Adjustment states
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newArtist, setNewArtist] = useState("");
  const [newService, setNewService] = useState("");

  // Artist list for dropdown
  const [artistList, setArtistList] = useState<string[]>([]);

  // DP (Downpayment) dialog states — triggered for tattoo bookings
  const [dpBooking, setDpBooking] = useState<Booking | null>(null);
  const [dpAmount, setDpAmount] = useState("");

  // Min date for date input (today)
  const todayStr = new Date().toISOString().split("T")[0];

  // ─── FETCH BOOKINGS ──────────────────────────────────────────────────────────
  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
      const data = await res.json();
      setBookings(data.bookings || []);
    } catch (err: any) {
      toast.error("Database connection lost");
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── FETCH ARTISTS for dropdown ──────────────────────────────────────────────
  const fetchArtists = useCallback(async () => {
    try {
      const res = await fetch(`/api/artists`, { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      const list: any[] = Array.isArray(data) ? data : (data.artists || []);
      const names = list
        .map((a: any) => (typeof a === "string" ? a : a.fullName ?? ""))
        .filter((name: string, idx: number, arr: string[]) => name && arr.indexOf(name) === idx);
      setArtistList(names);
    } catch {
      // Silent fail — falls back to text input
    }
  }, []);

  useEffect(() => {
    fetchBookings();
    fetchArtists();
  }, [fetchBookings, fetchArtists]);

  // ─── FILTERED BOOKINGS ───────────────────────────────────────────────────────
  const filteredBookings = useMemo(() => {
    return bookings.filter(booking => {
      const matchesDate = selectedDate
        ? new Date(booking.preferredDate).toDateString() === selectedDate.toDateString()
        : true;
      const normalizedStatus = statusFilter.toLowerCase();
      const matchesStatus = normalizedStatus === "all requests"
        ? true
        : booking.status.toLowerCase() === normalizedStatus;
      return matchesDate && matchesStatus;
    });
  }, [bookings, selectedDate, statusFilter]);

  // ─── APPROVE CLICK — always show DP dialog; required for tattoo, optional for others ──
  const handleApproveClick = (booking: Booking) => {
    setDpBooking(booking);
    setDpAmount("");
  };

  // ─── CONFIRM APPROVE WITH DP ─────────────────────────────────────────────────
  const isTattoo = (booking: Booking | null) => !!booking?.service.toLowerCase().includes("tattoo");

  const confirmApproveWithDp = async () => {
    if (!dpBooking) return;
    const amount = parseFloat(dpAmount);
    const hasAmount = !isNaN(amount) && amount > 0;

    // Tattoo: DP is required
    if (isTattoo(dpBooking) && !hasAmount) {
      toast.error("Invalid Amount", { description: "Tattoo sessions require a downpayment amount." });
      return;
    }

    await updateStatus(dpBooking.id, "approved", undefined, hasAmount ? amount : undefined);
    setDpBooking(null);
    setDpAmount("");
  };

  // ─── UPDATE STATUS ───────────────────────────────────────────────────────────
  const updateStatus = async (
    id: string,
    newStatus: string,
    reason?: string,
    downPayment?: number
  ) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/bookings`, {
        method: 'PATCH',
        body: JSON.stringify({ id, status: newStatus, declineReason: reason, downPayment }),
        headers: { 'Content-Type': 'application/json' }
      });

      if (res.ok) {
        const targetBooking = bookings.find(b => b.id === id);

        toast.success(newStatus === 'approved' ? "Booking Approved! 🔥" : `Booking ${newStatus}!`);

        setBookings(prev =>
          prev.map(b => b.id === id
            ? { ...b, status: newStatus, ...(reason && { declineReason: reason }), ...(downPayment && { downPayment }) }
            : b
          )
        );

        setDecliningBooking(null);
        setDeclineReason("");

        // ✅ Auto-close dossier dialog after approval
        if (newStatus === 'approved') {
          setOpenDossierId(null);
        }

        await logAudit({
          action: newStatus === 'declined' ? 'DECLINED BOOKING' : 'APPROVED BOOKING',
          details: `${newStatus === 'declined' ? 'Declined' : 'Approved'} booking of ${targetBooking?.name ?? id} (${targetBooking?.service ?? '—'})${reason ? ` — Reason: ${reason}` : ''}${downPayment ? ` — DP: ₱${downPayment.toLocaleString()}` : ''}`,
        });
      }
    } catch (error) {
      toast.error("Update failed");
    } finally {
      setUpdatingId(null);
    }
  };

  // ─── HANDLE ADJUSTMENT ───────────────────────────────────────────────────────
  const handleAdjustment = async () => {
    if (!editingBooking) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(newDate) < today) {
      toast.error("Invalid Date", { description: "Past dates are not allowed. Please select a current or future date." });
      return;
    }

    const validateBusinessHours = (timeStr: string) => {
      const input = timeStr.toUpperCase().trim();
      const isAM = input.includes("AM"), isPM = input.includes("PM");
      if (!isAM && !isPM) return { valid: false, msg: "Format Error", desc: "Please include 'AM' or 'PM' (e.g., 8:00 AM)." };
      const m = input.match(/(\d+):(\d+)/);
      if (!m) return { valid: false, msg: "Format Error", desc: "Please use HH:MM format." };
      let hour = parseInt(m[1]);
      const mins = parseInt(m[2]);
      if (isPM && hour < 12) hour += 12;
      if (isAM && hour === 12) hour = 0;
      const total = hour * 60 + mins;
      if (total < 480 || total > 1320) return { valid: false, msg: "Outside Business Hours", desc: "Operating hours are strictly from 8:00 AM to 10:00 PM." };
      return { valid: true };
    };

    const timeCheck = validateBusinessHours(newTime);
    if (!timeCheck.valid) { toast.error(timeCheck.msg, { description: timeCheck.desc }); return; }

    const artistToCheck = newArtist.trim() || editingBooking.artist;
    const conflict = bookings.find(b =>
      b.preferredDate?.split('T')[0] === newDate &&
      (b.preferredTime ?? "").toLowerCase().trim() === newTime.toLowerCase().trim() &&
      b.artist?.toLowerCase() === artistToCheck.toLowerCase() &&
      b.id !== editingBooking.id &&
      !['declined', 'finished'].includes(b.status.toLowerCase())
    );

    if (conflict) {
      toast.error("Schedule Conflict", { description: `${artistToCheck} is already booked on ${formatDate(newDate)} at ${newTime}. (Conflicting Client: ${conflict.name})` });
      return;
    }

    setUpdatingId(editingBooking.id);
    try {
      // If already approved, keep it approved after adjustment (don't downgrade to "adjusted")
      const adjustedStatus = editingBooking.status.toLowerCase() === "approved" ? "approved" : "adjusted";

      const res = await fetch(`/api/bookings`, {
        method: 'PATCH',
        body: JSON.stringify({
          id: editingBooking.id,
          status: adjustedStatus,
          preferredDate: newDate,
          preferredTime: newTime,
          artist: newArtist.trim() || editingBooking.artist,
          service: newService.trim() || editingBooking.service,
        }),
        headers: { 'Content-Type': 'application/json' }
      });

      if (res.ok) {
        toast.success("Schedule Updated", { description: "The appointment has been successfully rescheduled." });
        setBookings(prev =>
          prev.map(b => b.id === editingBooking.id
            ? { ...b, preferredDate: newDate, preferredTime: newTime, artist: newArtist.trim() || b.artist, service: newService.trim() || b.service, status: adjustedStatus }
            : b
          )
        );
        await logAudit({
          action: 'BOOKING ADJUSTMENT',
          details: `Rescheduled ${editingBooking.name} — Service: ${newService.trim() || editingBooking.service}, Artist: ${newArtist.trim() || editingBooking.artist}, Schedule: ${formatDate(newDate)} at ${newTime}`,
        });
        setEditingBooking(null);
      }
    } catch {
      toast.error("Process Failed", { description: "Unable to update the schedule. Please check your connection." });
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });
    } catch { return dateStr; }
  };

  const clearFilters = () => { setSelectedDate(undefined); setStatusFilter("All Requests"); };

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-6 bg-background text-center text-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-[0.5em]">Initializing Portal</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <Toaster richColors position="top-right" />

      <div className="flex flex-col lg:flex-row-reverse">
        {/* SIDEBAR */}
        <aside className="w-full lg:w-80 border-l border-border p-6 space-y-6 bg-card/30 lg:h-fit lg:sticky lg:top-10">
          <div className="space-y-2">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Scheduler</h3>
              {(selectedDate || statusFilter !== "All Requests") && (
                <button onClick={clearFilters} className="text-[9px] font-bold text-red-500 uppercase hover:underline flex items-center gap-1">
                  <FilterX className="size-3" /> Clear
                </button>
              )}
            </div>
            <SidebarProvider>
              <div className="rounded-3xl border border-border bg-card p-2">
                <DatePicker selected={selectedDate} onSelect={setSelectedDate} />
                <Separator className="my-2 bg-border" />
                <div onClick={(e: any) => {
                  const val = e.target.innerText;
                  if (calendarData[0].items.includes(val)) setStatusFilter(val);
                }}>
                  <Calendars calendars={calendarData} activeFilter={statusFilter} onFilterChange={setStatusFilter} />
                </div>
              </div>
            </SidebarProvider>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 p-6 lg:p-12">
          <header className="max-w-[1600px] mx-auto mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8">
            <h2 className="text-5xl md:text-6xl font-black uppercase tracking-tighter leading-[0.85]">
              Inbound<br /><span className="text-muted-foreground/30">Requests</span>
            </h2>
            <div className="flex items-center gap-4">
              <div className="text-right hidden md:block">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Total Results</p>
                <p className="text-2xl font-black">{filteredBookings.length}</p>
              </div>
              <Button variant="outline" onClick={fetchBookings} disabled={loading} className="rounded-full px-8 h-14 border-border bg-card hover:bg-muted transition-all">
                <RefreshCw className={cn("h-3.5 w-3.5 mr-3", loading && "animate-spin")} />
                <span className="text-xs font-bold uppercase tracking-widest">Refresh</span>
              </Button>
            </div>
          </header>

          <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
            {filteredBookings.length > 0 ? filteredBookings.map((booking) => (
              <div key={booking.id} className="group flex flex-col bg-card border border-border rounded-[2.5rem] overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">

                <div className="relative h-64 w-full bg-muted overflow-hidden">
                  {booking.images && booking.images.length > 0 ? (
                    <>
                      <img src={booking.images[0]} alt="Reference" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button onClick={() => setSelectedImage(booking.images![0])} className="bg-white text-zinc-900 rounded-full h-14 w-14 hover:scale-110 transition-transform">
                          <Maximize2 className="h-6 w-6" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center text-muted-foreground/40">
                      <ImageIcon className="h-10 w-10 opacity-20 mb-3" />
                      <span className="uppercase font-bold text-[10px] tracking-widest">No Reference</span>
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <Badge className={cn(
                      "px-3 py-1 rounded-full uppercase text-[9px] font-bold border-none",
                      booking.status.toLowerCase() === 'pending'  ? 'bg-amber-400 text-amber-950 shadow-lg shadow-amber-400/20' :
                      booking.status.toLowerCase() === 'approved' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' :
                      booking.status.toLowerCase() === 'declined' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' :
                      booking.status.toLowerCase() === 'adjusted' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' :
                      'bg-foreground text-background'
                    )}>
                      {booking.status}
                    </Badge>
                  </div>
                </div>

                <div className="p-6 flex flex-col grow">
                  <div className="mb-4">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{booking.service}</p>
                    <h3 className="text-xl font-black text-foreground uppercase tracking-tighter leading-none">{booking.name}</h3>
                  </div>

                  <div className="space-y-2 mb-6">
                    <div className="flex items-center text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 mr-2 shrink-0" />
                      <span className="text-xs font-medium truncate">{formatDate(booking.preferredDate)}</span>
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 mr-2 shrink-0" />
                      <span className="text-xs font-medium">{booking.preferredTime || "Flexible"}</span>
                    </div>
                    {/* DP badge on card */}
                    {booking.downPayment !== undefined && booking.downPayment > 0 && (
                      <div className="flex items-center text-emerald-500">
                        <PhilippinePeso className="h-3.5 w-3.5 mr-2 shrink-0" />
                        <span className="text-xs font-bold">DP: ₱{booking.downPayment.toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-auto pt-5 border-t border-border flex items-center justify-between">
                    {/* ── CONTROLLED DOSSIER DIALOG ── */}
                    <Dialog
                      open={openDossierId === booking.id}
                      onOpenChange={(open) => setOpenDossierId(open ? booking.id : null)}
                    >
                      <DialogTrigger asChild>
                        <button
                          onClick={() => setOpenDossierId(booking.id)}
                          className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-foreground hover:text-muted-foreground cursor-pointer transition-colors"
                        >
                          View Dossier <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-[3rem] bg-popover border-border shadow-2xl">
                        <div className="p-8 md:p-14 max-h-[90vh] overflow-y-auto custom-scrollbar">
                          <DialogHeader className="mb-10">
                            <DialogTitle className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">Request Overview</DialogTitle>
                            <DialogDescription className="text-xs font-bold text-muted-foreground/60">Ref: {booking.id.slice(-8).toUpperCase()}</DialogDescription>
                          </DialogHeader>

                          <div className="grid grid-cols-1 gap-8">
                            {booking.images && booking.images.length > 0 && (
                              <div className="grid grid-cols-3 gap-2">
                                {booking.images.map((img, idx) => (
                                  <img key={idx} src={img} className="aspect-square object-cover rounded-xl border border-border cursor-pointer hover:opacity-80 transition" onClick={() => setSelectedImage(img)} />
                                ))}
                              </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                              <DetailItem label="Artist" value={booking.artist} icon={User} />
                              <DetailItem label="Service" value={booking.service} icon={Sparkles} />
                              <DetailItem label="Time" value={booking.preferredTime || "Flexible"} icon={Clock} />
                              <DetailItem label="Date" value={formatDate(booking.preferredDate)} icon={Calendar} />
                              {booking.downPayment !== undefined && booking.downPayment > 0 && (
                                <DetailItem label="Downpayment" value={`₱${booking.downPayment.toLocaleString()}`} icon={PhilippinePeso} />
                              )}
                            </div>

                            <Separator className="bg-border" />

                            <div className="space-y-4">
                              <p className="text-[10px] font-black uppercase text-muted-foreground">Notes from Client</p>
                              <div className="bg-muted p-6 rounded-2xl border border-border">
                                <p className="text-foreground/80 italic text-sm">{booking.message || "No notes provided."}</p>
                              </div>
                            </div>

                            {/* ACTIONS */}
                            <div className="pt-6 flex flex-col gap-3">
                              {['finished', 'declined'].includes(booking.status.toLowerCase()) ? (
                                <div className={cn(
                                  "border p-6 rounded-2xl text-center",
                                  booking.status.toLowerCase() === 'declined' ? "bg-red-500/10 border-red-500/20" : "bg-emerald-500/10 border-emerald-500/20"
                                )}>
                                  <p className={cn("text-[10px] font-black uppercase tracking-[0.2em] mb-1", booking.status.toLowerCase() === 'declined' ? "text-red-500" : "text-emerald-500")}>
                                    Project Status
                                  </p>
                                  <h4 className={cn("text-xl font-black uppercase italic", booking.status.toLowerCase() === 'declined' ? "text-red-600" : "text-emerald-600")}>
                                    {booking.status.toLowerCase() === 'declined' ? "Request Declined" : "Session Completed"}
                                  </h4>
                                  <p className="text-[10px] font-bold text-muted-foreground mt-2">
                                    {booking.status.toLowerCase() === 'declined'
                                      ? "This request has been declined and cannot be reactivated."
                                      : "This dossier is now locked for archival purposes."}
                                  </p>
                                </div>
                              ) : (
                                <>
                                  <div className="flex gap-3">
                                    {/* ── APPROVE — disabled if already approved ── */}
                                    <Button
                                      onClick={() => handleApproveClick(booking)}
                                      disabled={updatingId === booking.id || booking.status.toLowerCase() === 'approved'}
                                      className={cn(
                                        "flex-1 h-14 rounded-xl font-bold uppercase text-xs transition-all",
                                        booking.status.toLowerCase() === 'approved'
                                          ? "bg-emerald-500/15 text-emerald-600 cursor-not-allowed border border-emerald-500/30"
                                          : "bg-foreground text-background hover:opacity-90"
                                      )}
                                    >
                                      {updatingId === booking.id
                                        ? <Loader2 className="animate-spin h-4 w-4" />
                                        : booking.status.toLowerCase() === 'approved'
                                          ? "✓ Already Approved"
                                          : booking.service.toLowerCase().includes('tattoo')
                                            ? "Approve + Set DP"
                                            : "Approve Session"
                                      }
                                    </Button>

                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        setEditingBooking(booking);
                                        setNewDate(booking.preferredDate.includes('T') ? booking.preferredDate.split('T')[0] : booking.preferredDate);
                                        setNewTime(booking.preferredTime || "");
                                        setNewArtist(booking.artist || "");
                                        setNewService(booking.service || "");
                                      }}
                                      className="h-14 rounded-xl px-6 border-border bg-transparent"
                                    >
                                      <Edit3 className="h-4 w-4" />
                                    </Button>
                                  </div>

                                  {booking.status.toLowerCase() !== 'approved' && (
                                    <Button
                                      variant="ghost"
                                      onClick={() => setDecliningBooking(booking)}
                                      disabled={updatingId === booking.id}
                                      className="h-12 text-muted-foreground hover:text-destructive font-bold uppercase text-[10px]"
                                    >
                                      Decline Request
                                    </Button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center border border-border group-hover:bg-foreground group-hover:text-background transition-all">
                      <Hash className="h-3 w-3 opacity-30" />
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="col-span-full py-20 text-center border-2 border-dashed border-border rounded-[3rem]">
                <FilterX className="mx-auto h-12 w-12 text-muted-foreground/20 mb-4" />
                <h3 className="text-xl font-black uppercase tracking-tighter">No Bookings Found</h3>
                <p className="text-muted-foreground text-sm">Try adjusting your filters or refresh the data.</p>
                <Button variant="link" onClick={clearFilters} className="mt-4 text-primary uppercase font-bold text-xs tracking-widest">Reset Filters</Button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ─── DOWNPAYMENT DIALOG ──────────────────────────────────────────────────── */}
      <Dialog open={!!dpBooking} onOpenChange={() => { setDpBooking(null); setDpAmount(""); }}>
        <DialogContent className="max-w-md p-8 bg-popover border-border rounded-[2rem]">
          <DialogHeader className="mb-6">
            <DialogTitle className="font-black uppercase tracking-tighter text-foreground flex items-center gap-2">
              <PhilippinePeso className="size-5 text-emerald-500" />
              {isTattoo(dpBooking) ? "Downpayment Required" : "Downpayment (Optional)"}
            </DialogTitle>
            {dpBooking && (
              <DialogDescription className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">
                {dpBooking.service} — {dpBooking.name}
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="space-y-5">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {isTattoo(dpBooking)
                ? "Tattoo sessions require a downpayment before approval. Enter the agreed DP amount below — this will be included in the client's confirmation email."
                : "You can optionally collect a downpayment for this session. Leave it blank and click Skip to approve without DP."}
            </p>

            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground font-black text-sm select-none">₱</span>
              <input
                type="number"
                min="1"
                placeholder={isTattoo(dpBooking) ? "e.g. 500 (required)" : "e.g. 500 (optional)"}
                value={dpAmount}
                onChange={(e) => setDpAmount(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && confirmApproveWithDp()}
                className="w-full h-14 pl-10 pr-5 rounded-xl border border-border bg-muted text-foreground font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <Button
                variant="outline"
                onClick={() => { setDpBooking(null); setDpAmount(""); }}
                className="flex-1 h-14 rounded-xl font-black uppercase text-[10px]"
              >
                Cancel
              </Button>

              {/* Skip button — only visible for non-tattoo services */}
              {!isTattoo(dpBooking) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setDpAmount("");
                    confirmApproveWithDp();
                  }}
                  disabled={updatingId !== null}
                  className="flex-1 h-14 rounded-xl font-black uppercase text-[10px] border-muted-foreground/30 text-muted-foreground hover:text-foreground"
                >
                  {updatingId !== null ? <Loader2 className="animate-spin size-4" /> : "Skip DP"}
                </Button>
              )}

              <Button
                onClick={confirmApproveWithDp}
                disabled={
                  updatingId !== null ||
                  (isTattoo(dpBooking) && (!dpAmount || parseFloat(dpAmount) <= 0))
                }
                className="flex-[2] h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black uppercase text-[10px]"
              >
                {updatingId !== null ? <Loader2 className="animate-spin size-4" /> : "Confirm & Approve"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── ADJUSTMENT DIALOG ─────────────────────────────────────────────────── */}
      <Dialog open={!!editingBooking} onOpenChange={() => setEditingBooking(null)}>
        <DialogContent className="max-w-md p-8 bg-popover border-border rounded-[2rem]">
          <DialogHeader className="mb-6">
            <DialogTitle className="font-black uppercase tracking-tighter text-foreground">Adjustment</DialogTitle>
            {editingBooking && (
              <DialogDescription className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">
                Editing: {editingBooking.name}
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="space-y-4">

            {/* Artist dropdown (or text fallback) */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <User className="size-3" /> Artist
              </label>
              {artistList.length > 0 ? (
                <div className="relative">
                  <select
                    value={newArtist}
                    onChange={(e) => setNewArtist(e.target.value)}
                    className="w-full h-14 pl-5 pr-10 rounded-xl border border-border bg-muted text-foreground font-bold text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Select artist...</option>
                    {artistList.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                </div>
              ) : (
                <input
                  type="text"
                  placeholder="Artist name"
                  value={newArtist}
                  onChange={(e) => setNewArtist(e.target.value)}
                  className="w-full h-14 px-5 rounded-xl border border-border bg-muted text-foreground font-bold text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              )}
            </div>

            {/* Service */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="size-3" /> Service
              </label>
              <input
                type="text"
                placeholder="Service type"
                value={newService}
                onChange={(e) => setNewService(e.target.value)}
                className="w-full h-14 px-5 rounded-xl border border-border bg-muted text-foreground font-bold text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            {/* Date — future only */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <Calendar className="size-3" /> Date
              </label>
              <input
                type="date"
                value={newDate}
                min={todayStr}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full h-14 px-5 rounded-xl border border-border bg-muted text-foreground font-bold text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            {/* Time */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <Clock className="size-3" /> Time
              </label>
              <input
                type="text"
                placeholder="e.g. 2:00 PM"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-full h-14 px-5 rounded-xl border border-border bg-muted text-foreground font-bold text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            <Button
              onClick={handleAdjustment}
              disabled={updatingId !== null || !newDate || !newTime || !newArtist || !newService}
              className="w-full h-14 bg-foreground text-background rounded-xl font-black uppercase text-xs mt-2"
            >
              {updatingId !== null ? <Loader2 className="animate-spin h-4 w-4" /> : "Confirm Adjustments"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* FULL IMAGE VIEW */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/90 border-none flex items-center justify-center overflow-hidden">
          <div className="sr-only"><DialogTitle>Preview</DialogTitle></div>
          {selectedImage && (
            <div className="relative w-full h-full flex items-center justify-center p-4">
              <img src={selectedImage} className="max-w-full max-h-[85vh] object-contain rounded-3xl shadow-2xl" alt="Preview" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* DECLINE REASON DIALOG */}
      <Dialog open={!!decliningBooking} onOpenChange={() => setDecliningBooking(null)}>
        <DialogContent className="max-w-md p-8 bg-popover border-border rounded-[2rem]">
          <DialogHeader className="mb-6">
            <DialogTitle className="font-black uppercase tracking-tighter text-destructive flex items-center gap-2">
              <X className="size-5" /> Reject Request
            </DialogTitle>
            <DialogDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
              Providing a reason will help the client understand.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <textarea
              placeholder="Bakit mo i-re-reject, par? (e.g. Full slots, not my style, etc.)"
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              className="w-full h-32 p-5 rounded-xl border border-border bg-muted text-foreground font-medium text-sm outline-none focus:ring-2 focus:ring-red-500/20 transition-all resize-none"
            />
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setDecliningBooking(null)} className="flex-1 h-14 rounded-xl font-black uppercase text-[10px]">
                Cancel
              </Button>
              <Button
                onClick={() => updateStatus(decliningBooking!.id, 'declined', declineReason)}
                disabled={!declineReason || updatingId !== null}
                className="flex-[2] h-14 bg-destructive text-white hover:bg-destructive/90 rounded-xl font-black uppercase text-[10px]"
              >
                {updatingId !== null ? <Loader2 className="animate-spin size-4" /> : "Confirm Rejection"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailItem({ label, value, icon: Icon }: DetailItemProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-muted-foreground/60">
        <Icon className="h-3 w-3" />
        <p className="text-[9px] font-black uppercase tracking-widest">{label}</p>
      </div>
      <p className="text-foreground font-bold text-sm pl-1">{value}</p>
    </div>
  );
}

interface DetailItemProps { label: string; value: string; icon: any; }
function cn(...inputs: any[]) { return inputs.filter(Boolean).join(' '); }