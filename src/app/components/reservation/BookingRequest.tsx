"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2, Calendar, User, Phone,
  X, RefreshCw, Clock, Eye, Sparkles, Maximize2,
  ChevronRight, Hash, Mail, LucideIcon
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

interface Booking {
  _id: string;
  name: string;
  email: string;
  phone: string;
  artist: string;
  service: string;
  preferredDate: string;
  preferredTime?: string;
  message: string;
  status: string;
  image?: string;
  timestamp: string;
}

export default function BookingRequest() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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
          prev.map(b => b._id === id ? { ...b, status: newStatus } : b)
        );
      }
    } catch (error) {
      toast.error("Update failed");
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

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-6 bg-white text-center">
        <div className="relative flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-zinc-900" />
          <div className="absolute h-16 w-16 rounded-full border-t-2 border-zinc-100 animate-pulse" />
        </div>
        <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-[0.5em] animate-pulse pl-[0.5em]">Initializing Portal</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 p-6 lg:p-12 selection:bg-zinc-900 selection:text-white">
      <Toaster richColors position="top-right" />

      {/* HEADER SECTION */}
      <header className="max-w-7xl mx-auto mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <h2 className="text-5xl md:text-6xl font-black uppercase tracking-tighter leading-[0.85]">
            Inbound<br />
            <span className="text-zinc-300">Requests</span>
          </h2>
        </div>

        <Button
          variant="outline"
          onClick={fetchBookings}
          disabled={loading}
          className="h-14 border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-900 hover:text-white rounded-full px-8 transition-all duration-300 shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={cn("h-3 w-2 mr-3", loading && "animate-spin")} />
          <span className="text-xs font-bold uppercase tracking-widest">Refresh</span>
        </Button>
      </header>

      {/* BOOKING GRID */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-10">
        {bookings.map((booking) => (
          <div key={booking._id} className="group flex flex-col bg-white border border-zinc-100 rounded-[2.5rem] overflow-hidden transition-all duration-500 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] hover:-translate-y-2">

            <div className="relative h-80 w-full bg-zinc-100 overflow-hidden">
              {booking.image ? (
                <>
                  <img src={booking.image} alt="Reference" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <Button
                      onClick={() => setSelectedImage(booking.image!)}
                      className="bg-white text-zinc-900 hover:bg-zinc-100 rounded-full h-14 w-14 p-0 shadow-2xl scale-90 group-hover:scale-100 transition-all duration-300"
                    >
                      <Maximize2 className="h-6 w-6" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-zinc-300">
                  <Eye className="h-10 w-10 opacity-10 mb-3" />
                  <span className="uppercase font-bold text-[10px] tracking-[0.2em]">Visual pending</span>
                </div>
              )}

              <div className="absolute top-6 left-6">
                <Badge className={cn("px-4 py-1.5 rounded-full uppercase text-[10px] font-bold tracking-tighter border-none shadow-sm",
                  booking.status === 'pending' ? 'bg-amber-400 text-amber-950' :
                    booking.status === 'approved' ? 'bg-emerald-500 text-white' : 'bg-zinc-900 text-white')}>
                  {booking.status}
                </Badge>
              </div>
            </div>

            <div className="p-8 flex flex-col grow">
              <div className="mb-6">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">{booking.service}</p>
                <h3 className="text-3xl font-black text-zinc-900 uppercase tracking-tighter leading-none">{booking.name}</h3>
              </div>

              <div className="space-y-3 mb-8">
                <div className="flex items-center text-zinc-500">
                  <Calendar className="h-3.5 w-3.5 mr-2" />
                  <span className="text-xs font-medium">{formatDate(booking.preferredDate)}</span>
                  <span className="mx-2 text-zinc-200">|</span>
                  <Clock className="h-3.5 w-3.5 mr-2" />
                  <span className="text-xs font-medium">{booking.preferredTime || "Anytime"}</span>
                </div>
              </div>

              <div className="mt-auto pt-6 border-t border-zinc-50 flex items-center justify-between">
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="group/btn flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-zinc-900 hover:text-zinc-500 transition-colors cursor-pointer">
                      View Dossier
                      <ChevronRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                    </button>
                  </DialogTrigger>

                  <DialogContent className="max-w-2xl p-0 overflow-hidden border-none rounded-[3rem] bg-white shadow-2xl">
                    {/* Tinanggal ang flex-row at image side. Ginawang max-h para sa scrolling. */}
                    <div className="w-full p-8 md:p-14 max-h-[90vh] overflow-y-auto bg-white">

                      <DialogHeader className="mb-12 text-center md:text-left">
                        <div className="space-y-1">
                          <DialogTitle className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">
                            Request Overview
                          </DialogTitle>
                          <DialogDescription className="text-xs text-zinc-400 font-medium">
                            Reference ID: <span className="text-zinc-900 font-bold">{booking._id.slice(-6).toUpperCase()}</span>
                          </DialogDescription>
                        </div>
                      </DialogHeader>

                      <div className="grid grid-cols-1 gap-8">
                        {/* Grid Container - Dynamic columns para hindi siksikan */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-10">
                          <DetailItem label="Lead Artist" value={booking.artist} icon={User} />
                          <DetailItem label="Service Type" value={booking.service} icon={Sparkles} />
                          <DetailItem label="Time Slot" value={booking.preferredTime || "Flexible"} icon={Clock} />
                          <DetailItem label="Target Date" value={formatDate(booking.preferredDate)} icon={Calendar} />
                          <DetailItem label="Contact" value={booking.phone} icon={Phone} />
                          <DetailItem
                            label="Email Address"
                            value={booking.email}
                            icon={Mail}
                          />
                        </div>

                        <Separator className="bg-zinc-100/80" />

                        {/* Client Notes Section - Mas malaki ang breathing room */}
                        <div className="space-y-4">
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">
                            Client Notes
                          </p>
                          <div className="bg-zinc-50/50 p-8 md:p-5 rounded-4xl border border-zinc-100/50 shadow-inner">
                            <p className="text-zinc-700 leading-relaxed italic text-sm md:text-sm text-center md:text-left">
                              {booking.message || "No additional notes provided."}
                            </p>
                          </div>
                        </div>

                        {/* Action Buttons - Pinaghiwalay ng maayos */}
                        <div className="pt-6 space-y-6">
                          <div className="flex flex-col sm:flex-row gap-4">
                            <Button
                              onClick={() => updateStatus(booking._id, 'approved')}
                              disabled={updatingId === booking._id}
                              className="flex-1 h-16 bg-zinc-900 text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-200 cursor-pointer"
                            >
                              {updatingId === booking._id ? <Loader2 className="animate-spin h-5 w-5" /> : "Approve Session"}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => updateStatus(booking._id, 'rejected')}
                              disabled={updatingId === booking._id}
                              className="h-16 px-10 border-zinc-200 rounded-2xl font-bold uppercase tracking-widest text-xs text-zinc-400 hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all cursor-pointer"
                            >
                              Decline
                            </Button>
                          </div>
                          <p className="text-center text-[9px] font-bold text-zinc-300 uppercase tracking-[0.2em]">
                            Automated notification will be dispatched via email
                          </p>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <div className="h-10 w-10 rounded-full bg-zinc-50 flex items-center justify-center border border-zinc-100 group-hover:bg-zinc-900 group-hover:text-white transition-colors duration-300">
                  <Hash className="h-3.5 w-3.5 opacity-50" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* FULL-SCREEN IMAGE VIEW */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-transparent border-none shadow-none flex items-center justify-center focus:outline-none">
          <div className="sr-only">
            <DialogTitle>Image Preview</DialogTitle>
            <DialogDescription>Full view of tattoo reference</DialogDescription>
          </div>
          {selectedImage && (
            <div className="relative animate-in zoom-in-95 duration-300">
              <img
                src={selectedImage}
                className="max-w-full max-h-[85vh] object-contain rounded-3xl shadow-[0_0_100px_rgba(0,0,0,0.5)] bg-zinc-900"
                alt="Full Reference"
              />
              <Button
                onClick={() => setSelectedImage(null)}
                className="absolute -top-4 -right-4 h-12 w-12 rounded-full bg-white text-zinc-900 hover:bg-zinc-100 shadow-2xl border-none p-0"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface DetailItemProps {
  label: string;
  value: string;
  icon: LucideIcon;
}

function DetailItem({ label, value, icon: Icon }: DetailItemProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2.5 text-zinc-400">
        <div className="p-2 bg-zinc-50 rounded-lg border border-zinc-100">
          <Icon className="h-3.5 w-3.5" />
        </div>
        <p className="text-[9px] font-black uppercase tracking-[0.2em]">{label}</p>
      </div>
      <p className="text-zinc-900 font-bold text-sm leading-none pl-1">{value}</p>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}