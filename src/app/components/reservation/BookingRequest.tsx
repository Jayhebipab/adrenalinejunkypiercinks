"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2, Calendar, User, RefreshCw, Clock, Maximize2,
  ChevronRight, Hash, Sparkles, Edit3, Image as ImageIcon, X, FilterX
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
  timestamp: any;
}

const calendarData = [
  {
    name: "System Filters",
    items: ["All Requests", "Pending", "Approved", "Rejected", "Finished"],
  },
];

export default function BookingRequest() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // FILTER STATES
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string>("All Requests");

  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");

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

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // DERIVED STATE: FILTERED BOOKINGS
  const filteredBookings = useMemo(() => {
    return bookings.filter(booking => {
      // Filter by Date
      const matchesDate = selectedDate
        ? new Date(booking.preferredDate).toDateString() === selectedDate.toDateString()
        : true;

      // Filter by Status
      const normalizedStatus = statusFilter.toLowerCase();
      const matchesStatus = (normalizedStatus === "all requests")
        ? true
        : booking.status.toLowerCase() === normalizedStatus;

      return matchesDate && matchesStatus;
    });
  }, [bookings, selectedDate, statusFilter]);

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/bookings`, {
        method: 'PATCH',
        body: JSON.stringify({ id, status: newStatus }),
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        toast.success(`Booking ${newStatus}!`);
        setBookings(prev =>
          prev.map(b => b.id === id ? { ...b, status: newStatus } : b)
        );
      }
    } catch (error) {
      toast.error("Update failed");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAdjustment = async () => {
    if (!editingBooking) return;
    setUpdatingId(editingBooking.id);
    try {
      const res = await fetch(`/api/bookings`, {
        method: 'PATCH',
        body: JSON.stringify({
          id: editingBooking.id,
          status: "adjusted", // Siguraduhin na "adjusted" ang ipapasa
          preferredDate: newDate,
          preferredTime: newTime
        }),
        headers: { 'Content-Type': 'application/json' }
      });

      if (res.ok) {
        toast.success("Schedule Updated & Notification Sent!");

        // I-update ang main bookings state
        setBookings(prev =>
          prev.map(b => b.id === editingBooking.id
            ? { ...b, preferredDate: newDate, preferredTime: newTime, status: "adjusted" }
            : b
          )
        );

        // RESET STATES
        setEditingBooking(null); // Isasara nito ang Adjustment Dialog

        // TIP: Kung gusto mo pati yung Dossier Dialog ay sumara kusa, 
        // kailangan mong i-manage ang 'open' state ng Dossier Dialog gamit ang useState.
      }
    } catch (error) {
      toast.error("Adjustment failed");
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-PH', {
        month: 'long', day: 'numeric', year: 'numeric'
      });
    } catch { return dateStr; }
  };

  const clearFilters = () => {
    setSelectedDate(undefined);
    setStatusFilter("All Requests");
  };

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
        {/* RIGHT SIDE: SIDEBAR CONTROLS */}
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
                {/* Map selectedDate and onSelect if your DatePicker supports it */}
                <DatePicker selected={selectedDate} onSelect={setSelectedDate} />
                <Separator className="my-2 bg-border" />
                {/* Add logic to Calendars to handle clicks via statusFilter state */}
                <div onClick={(e: any) => {
                  const val = e.target.innerText;
                  if (calendarData[0].items.includes(val)) setStatusFilter(val);
                }}>
                  <Calendars
                    calendars={calendarData}
                    activeFilter={statusFilter} // Ipasa ang kasalukuyang filter
                    onFilterChange={setStatusFilter} // Direct function para mag-update
                  />
                </div>
              </div>
            </SidebarProvider>

          </div>

        </aside>

        {/* LEFT/CENTER SIDE: MAIN CONTENT */}
        <main className="flex-1 p-6 lg:p-12">
          <header className="max-w-7xl mx-auto mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4">
              <h2 className="text-5xl md:text-6xl font-black uppercase tracking-tighter leading-[0.85]">
                Inbound<br />
                <span className="text-muted-foreground/30">Requests</span>
              </h2>
            </div>
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

          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-10">
            {filteredBookings.length > 0 ? (
              filteredBookings.map((booking) => (
                <div key={booking.id} className="group flex flex-col bg-card border border-border rounded-[2.5rem] overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">

                  <div className="relative h-80 w-full bg-muted overflow-hidden">
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
                    <div className="absolute top-6 left-6">
                      <Badge className={cn(
                        "px-4 py-1.5 rounded-full uppercase text-[10px] font-bold border-none",
                        booking.status.toLowerCase() === 'pending' ? 'bg-amber-400 text-amber-950 shadow-lg shadow-amber-400/20' :
                          booking.status.toLowerCase() === 'approved' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' :
                            booking.status.toLowerCase() === 'rejected' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' :
                              booking.status.toLowerCase() === 'adjusted' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : // DAGDAG ITO
                                'bg-foreground text-background'
                      )}>
                        {booking.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-8 flex flex-col grow">
                    <div className="mb-6">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{booking.service}</p>
                      <h3 className="text-2xl font-black text-foreground uppercase tracking-tighter leading-none">{booking.name}</h3>
                    </div>

                    <div className="space-y-3 mb-8">
                      <div className="flex items-center text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5 mr-2" />
                        <span className="text-xs font-medium">{formatDate(booking.preferredDate)}</span>
                      </div>
                      <div className="flex items-center text-muted-foreground">
                        <Clock className="h-3.5 w-3.5 mr-2" />
                        <span className="text-xs font-medium">{booking.preferredTime || "Flexible"}</span>
                      </div>
                    </div>

                    <div className="mt-auto pt-6 border-t border-border flex items-center justify-between">
                      <Dialog>
                        <DialogTrigger asChild>
                          <button className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-foreground hover:text-muted-foreground cursor-pointer transition-colors">
                            View Dossier <ChevronRight className="h-4 w-4" />
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
                              </div>

                              <Separator className="bg-border" />

                              <div className="space-y-4">
                                <p className="text-[10px] font-black uppercase text-muted-foreground">Notes from Client</p>
                                <div className="bg-muted p-6 rounded-2xl border border-border">
                                  <p className="text-foreground/80 italic text-sm">{booking.message || "No notes provided."}</p>
                                </div>
                              </div>

                              {/* ACTION SECTION - Conditionals based on status */}
                              <div className="pt-6 flex flex-col gap-3">
                                {booking.status.toLowerCase() === 'finished' ? (
                                  /* If Finished: Show only a read-only badge and no edit buttons */
                                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl text-center">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 mb-1">Project Status</p>
                                    <h4 className="text-xl font-black uppercase italic text-emerald-600">Session Completed</h4>
                                    <p className="text-[10px] font-bold text-muted-foreground mt-2">This dossier is now locked for archival purposes.</p>
                                  </div>
                                ) : (
                                  /* If NOT Finished: Show Approve, Edit, and Decline buttons */
                                  <>
                                    <div className="flex gap-3">
                                      <Button
                                        onClick={() => updateStatus(booking.id, 'approved')}
                                        disabled={updatingId === booking.id}
                                        className="flex-1 h-14 bg-foreground text-background hover:opacity-90 rounded-xl font-bold uppercase text-xs"
                                      >
                                        {updatingId === booking.id ? <Loader2 className="animate-spin h-4 w-4" /> : "Approve Session"}
                                      </Button>

                                      <Button
                                        variant="outline"
                                        onClick={() => {
                                          setEditingBooking(booking);
                                          const cleanDate = booking.preferredDate.includes('T')
                                            ? booking.preferredDate.split('T')[0]
                                            : booking.preferredDate;
                                          setNewDate(cleanDate);
                                          setNewTime(booking.preferredTime || "");
                                        }}
                                        className="h-14 rounded-xl px-6 border-border bg-transparent"
                                      >
                                        <Edit3 className="h-4 w-4" />
                                      </Button>
                                    </div>

                                    <Button
                                      variant="ghost"
                                      onClick={() => updateStatus(booking.id, 'rejected')}
                                      disabled={updatingId === booking.id}
                                      className="h-12 text-muted-foreground hover:text-destructive font-bold uppercase text-[10px]"
                                    >
                                      Decline Request
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center border border-border group-hover:bg-foreground group-hover:text-background transition-all">
                        <Hash className="h-3.5 w-3.5 opacity-30" />
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
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

      {/* ADJUSTMENT DIALOG */}
      <Dialog open={!!editingBooking} onOpenChange={() => setEditingBooking(null)}>
        <DialogContent className="max-w-md p-8 bg-popover border-border rounded-[2rem]">
          <DialogHeader className="mb-6">
            <DialogTitle className="font-black uppercase tracking-tighter text-foreground">Adjustment</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="w-full h-14 px-5 rounded-xl border border-border bg-muted text-foreground font-bold text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
            <input type="text" placeholder="e.g. 2:00 PM" value={newTime} onChange={(e) => setNewTime(e.target.value)} className="w-full h-14 px-5 rounded-xl border border-border bg-muted text-foreground font-bold text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
            <Button onClick={handleAdjustment} disabled={updatingId !== null} className="w-full h-14 bg-foreground text-background rounded-xl font-black uppercase text-xs">
              Confirm Adjustments
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