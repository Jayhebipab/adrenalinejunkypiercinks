"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from 'next/navigation';
import { useSession } from "next-auth/react";
import {
  Mail, MapPin, Phone, Send, Clock, Sparkles, ImagePlus,
  Calendar as CalendarIcon, User, Loader2, Check, X, ChevronLeft, ChevronRight, Download
} from "lucide-react";
import { Footer } from "../components/navigation/footer";
import { Navbar } from "../components/navigation/navbar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import FloatingChatWidget from "../components/chatbot";
import BookingPopup from "../components/popup";
import SafetyVaultModal from "../components/SafetyVaultModal";

const contactInfo = [
  { icon: Mail, label: "Email Us", value: "caranicolas.819@icloud.com", href: "mailto:caranicolas.819@icloud.com" },
  { icon: Phone, label: "Call/Text", value: "+63 935 595 5699" },
  { icon: MapPin, label: "Studio Location", value: "7/11, 2nd Flr, National Road, Putatan, Muntinlupa City", href: "#" },
];

export default function ContactPage() {
  const { data: session } = useSession();
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);
  const [artistsList, setArtistsList] = useState<any[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showCustomCalendar, setShowCustomCalendar] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [isVaultOpen, setIsVaultOpen] = useState(false);

  // --- NEW: booked slots state ---
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [shippingData, setShippingData] = useState({ name: '', email: '', phone: '', address: '' });

  const searchParams = useSearchParams();
  const artistFromUrl = searchParams.get("artist");
  const [selectedArtist, setSelectedArtist] = useState("");

  useEffect(() => {
    if (artistFromUrl) setSelectedArtist(artistFromUrl);
  }, [artistFromUrl]);

useEffect(() => {
    if (session?.user) {
      setShippingData(prev => ({
        ...prev,
        name: session.user?.name || '',
        email: session.user?.email || '',
      }));
    }
  }, [session]);

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const res = await fetch("/api/artists");
        if (res.ok) {
          const data = await res.json();
          setArtistsList(data.filter((a: any) => a.status === 'active'));
        }
      } catch (error) {
        console.error("Failed to fetch artists:", error);
      }
    };
    fetchArtists();
  }, []);

  // --- NEW: fetch booked slots kapag may date + artist na ---
  useEffect(() => {
    const fetchBookedSlots = async () => {
      if (!date || !selectedArtist) {
        setBookedSlots([]);
        return;
      }

      setLoadingSlots(true);
      try {
        const res = await fetch(`/api/bookings`);
        if (res.ok) {
          const data = await res.json();
          const allBookings = Array.isArray(data) ? data : (data.bookings || []);

          const selectedDateStr = date.toDateString();

          // Filter: same artist, same date, hindi cancelled
          const taken = allBookings
            .filter((b: any) => {
              const bDate = new Date(b.date || b.preferredDate);
              const bArtist = b.artist || b.preferredArtist || "";
              return (
                bDate.toDateString() === selectedDateStr &&
                bArtist === selectedArtist &&
                b.status !== "cancelled"
              );
            })
            .map((b: any) => b.time || b.preferredTime || "");

          setBookedSlots(taken.filter(Boolean));
        }
      } catch (err) {
        console.error("Failed to fetch booked slots:", err);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchBookedSlots();
  }, [date, selectedArtist]);

  useEffect(() => {
    setTime("");
  }, [selectedService]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]);
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadToCloudinary = async (files: File[]) => {
    const uploadPreset = "adrenalinejunkypiercinks";
    const cloudName = "diwrwmjgw";
    const urls = await Promise.all(
      files.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", uploadPreset);
        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: formData });
        const data = await res.json();
        return data.secure_url;
      })
    );
    return urls;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!date || !time) {
      toast.error("Please select both preferred date and time");
      return;
    }
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      let imageUrls: string[] = [];
      if (selectedFiles.length > 0) imageUrls = await uploadToCloudinary(selectedFiles);

      const bookingData = {
        name: formData.get("name"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        artist: formData.get("artist"),
        service: formData.get("service"),
        message: formData.get("message"),
        date: date,
        time: time,
        images: imageUrls,
      };

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData),
      });

      if (res.ok) {
        setIsSuccess(true);
        (e.target as HTMLFormElement).reset();
        setDate(undefined);
        setTime("");
        setSelectedFiles([]);
        setPreviews([]);
        setSelectedArtist("");
        setBookedSlots([]);
      } else {
        toast.error("Failed to send booking. Try again.");
      }
    } catch (error) {
      toast.error("Error submitting form.");
    } finally {
      setLoading(false);
    }
  };

  // --- TIME SLOTS ---
  const piercingSlots = [
    "08:00 AM","09:00 AM","10:00 AM","11:00 AM","12:00 PM",
    "01:00 PM","02:00 PM","03:00 PM","04:00 PM","05:00 PM",
    "06:00 PM","07:00 PM","08:00 PM","09:00 PM","10:00 PM"
  ];
  const tattooSlots = [
    "09:00 AM","11:00 AM","01:00 PM","03:00 PM","05:00 PM","07:00 PM","09:00 PM"
  ];
  const activeSlots = selectedService === "Piercing" ? piercingSlots : tattooSlots;

  return (
    <>
      <BookingPopup />
      <FloatingChatWidget />
      <Navbar />
      <main className="bg-black min-h-screen">

        {/* HERO */}
        <section className="relative h-[50vh] w-full flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('/images/logo/contact.png')` }}>
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/85 to-black" />
          </div>
          <div className="relative z-10 text-center px-4">
            <motion.p
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 mb-3"
            >
              Adrenaline Junky Studio
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="text-5xl md:text-7xl font-black uppercase italic text-white tracking-tighter"
            >
              Book A <span className="text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">Session</span>
            </motion.h1>
            <motion.div
              initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.3 }}
              className="mt-4 h-px w-32 bg-white/30 mx-auto"
            />
          </div>
        </section>

        {/* FORM SECTION */}
        <section id="contact" className="relative w-full px-4 md:px-6 pb-32 z-20 -mt-8">
          <div className="mx-auto w-full max-w-7xl">
            <div className="grid gap-8 lg:grid-cols-5">

              {/* FORM */}
              <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} className="lg:col-span-3">
                <Card className="rounded-[2rem] border-white/10 bg-zinc-950 p-8 md:p-12 shadow-2xl shadow-black/60">
                  <div className="mb-10 pb-8 border-b border-white/5">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center">
                        <Sparkles className="text-black h-4 w-4" />
                      </div>
                      <h2 className="text-xl font-black uppercase italic text-white tracking-tight">Booking Request</h2>
                    </div>
                    <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">Custom Tattoos & Piercings</p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-9">

                    {/* NAME */}
                    <div className="relative">
                      <Label className="text-[9px] font-black uppercase text-zinc-500 tracking-widest block mb-2">Full Name</Label>
                      <input
                        type="text" name="name"
                        value={shippingData.name} readOnly
                        className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 h-12 text-[11px] font-bold tracking-widest uppercase text-zinc-500 cursor-not-allowed outline-none"
                      />
                    </div>

                    {/* EMAIL + PHONE */}
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="relative">
                        <Label className="text-[9px] font-black uppercase text-zinc-500 tracking-widest block mb-2">Email</Label>
                        <input
                          type="email" name="email"
                          value={shippingData.email} readOnly
                          className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 h-12 text-[11px] font-bold tracking-widest uppercase text-zinc-500 cursor-not-allowed outline-none"
                        />
                      </div>
                      <div className="relative">
                        <Label className="text-[9px] font-black uppercase text-zinc-500 tracking-widest block mb-2">Phone</Label>
                        <Input
                          name="phone" type="tel" required maxLength={11}
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                          placeholder="*"
                          className="bg-zinc-900/60 border-zinc-800 focus:border-white text-white h-12 rounded-xl text-[11px] font-bold tracking-widest transition-all"
                        />
                      </div>
                    </div>

                    {/* ARTIST */}
                    <div className="relative">
                      <Label className="text-[9px] font-black uppercase text-zinc-500 tracking-widest block mb-2">Artist</Label>
                      <div className="relative">
                        <select
                          name="artist" required
                          value={selectedArtist}
                          onChange={(e) => { setSelectedArtist(e.target.value); setTime(""); }}
                          className="w-full h-12 bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 pr-10 text-white text-[11px] font-bold uppercase appearance-none hover:border-white focus:border-white transition-all cursor-pointer"
                        >
                          <option value="" disabled className="text-black">Select Artist</option>
                          {artistsList.map(a => (
                            <option key={a.id} value={a.fullName} className="text-black">{a.fullName}</option>
                          ))}
                        </select>
                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none rotate-90" />
                      </div>
                    </div>

                    {/* SERVICE */}
                    <div className="relative">
                      <Label className="text-[9px] font-black uppercase text-zinc-500 tracking-widest block mb-2">Service</Label>
                      <div className="relative">
                        <select
                          name="service" required
                          value={selectedService}
                          onChange={(e) => { setSelectedService(e.target.value); setTime(""); }}
                          className="w-full h-12 bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 pr-10 text-white text-[11px] font-bold uppercase appearance-none hover:border-white focus:border-white transition-all cursor-pointer"
                        >
                          <option value="" disabled className="text-black">Service Type</option>
                          <option value="Tattoo" className="text-black">Tattoo Session</option>
                          <option value="Piercing" className="text-black">Body Piercing</option>
                        </select>
                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none rotate-90" />
                      </div>
                    </div>

                    {/* DATE + TIME */}
                    <div className="grid gap-6 sm:grid-cols-2">

                      {/* DATE PICKER */}
                      <div className="relative">
                        <Label className="text-[9px] font-black uppercase text-zinc-500 tracking-widest block mb-2">Date</Label>
                        <button
                          type="button"
                          onClick={() => setShowCustomCalendar(!showCustomCalendar)}
                          className="w-full h-12 bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 text-white text-[11px] font-bold uppercase flex items-center justify-between hover:border-white transition-all"
                        >
                          <span className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4 text-zinc-500" />
                            {date ? format(date, "MMM dd, yyyy") : "Select Date"}
                          </span>
                          <ChevronRight className={cn("h-4 w-4 text-zinc-500 transition-transform duration-300", showCustomCalendar && "rotate-90")} />
                        </button>

                        <AnimatePresence>
                          {showCustomCalendar && (
                            <motion.div
                              initial={{ opacity: 0, y: -8, scale: 0.97 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -8, scale: 0.97 }}
                              transition={{ duration: 0.15 }}
                              className="absolute top-14 left-0 z-50 w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 shadow-2xl"
                            >
                              <div className="flex items-center justify-between mb-4">
                                <button type="button"
                                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                                  className="p-2 hover:bg-white/10 rounded-lg transition-all">
                                  <ChevronLeft className="h-4 w-4 text-white" />
                                </button>
                                <span className="text-white font-black text-xs uppercase tracking-wider">{format(currentMonth, "MMMM yyyy")}</span>
                                <button type="button"
                                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                                  className="p-2 hover:bg-white/10 rounded-lg transition-all">
                                  <ChevronRight className="h-4 w-4 text-white" />
                                </button>
                              </div>
                              <div className="grid grid-cols-7 gap-1 text-center">
                                {["Su","Mo","Tu","We","Th","Fr","Sa"].map(day => (
                                  <div key={day} className="text-zinc-600 text-[9px] font-black py-2 uppercase">{day}</div>
                                ))}
                                {Array.from({ length: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay() }).map((_, i) => (
                                  <div key={`e-${i}`} />
                                ))}
                                {Array.from({ length: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate() }).map((_, i) => {
                                  const dayDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i + 1);
                                  const isSelected = date && date.toDateString() === dayDate.toDateString();
                                  const isPast = dayDate < new Date(new Date().setHours(0,0,0,0));
                                  return (
                                    <button key={i} type="button" disabled={isPast}
                                      onClick={() => { setDate(dayDate); setShowCustomCalendar(false); }}
                                      className={cn(
                                        "py-2 rounded-lg text-[11px] font-bold transition-all",
                                        isPast ? "text-zinc-700 cursor-not-allowed" :
                                        isSelected ? "bg-white text-black" :
                                        "text-white hover:bg-white/10"
                                      )}>
                                      {i + 1}
                                    </button>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* TIME PICKER */}
                      <div className="relative">
                        <Label className="text-[9px] font-black uppercase text-zinc-500 tracking-widest block mb-2">
                          Time
                          {loadingSlots && <span className="ml-2 text-zinc-600">— checking availability...</span>}
                        </Label>
                        <div className="relative">
                          <select
                            name="time" value={time}
                            onChange={(e) => setTime(e.target.value)}
                            required
                            className="w-full h-12 bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 pr-10 text-white text-[11px] font-bold uppercase appearance-none hover:border-white focus:border-white transition-all cursor-pointer"
                          >
                            <option value="" disabled className="text-black">
                              {!selectedArtist || !date ? "Pick artist & date first" : "Select Time"}
                            </option>
                            {activeSlots.map(slot => {
                              const isBooked = bookedSlots.includes(slot);
                              return (
                                <option key={slot} value={slot} disabled={isBooked} className="text-black">
                                  {slot}{isBooked ? " — BOOKED" : ""}
                                </option>
                              );
                            })}
                          </select>
                          <Clock className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
                        </div>

                        {/* VISUAL SLOT GRID — para mas malinaw ang available/booked */}
                        {selectedArtist && date && !loadingSlots && activeSlots.length > 0 && (
                          <div className="mt-3 grid grid-cols-3 gap-1.5">
                            {activeSlots.map(slot => {
                              const isBooked = bookedSlots.includes(slot);
                              const isSelected = time === slot;
                              return (
                                <button
                                  key={slot} type="button"
                                  disabled={isBooked}
                                  onClick={() => !isBooked && setTime(slot)}
                                  className={cn(
                                    "py-2 px-1 rounded-xl text-[8px] font-black uppercase tracking-tight transition-all border",
                                    isBooked
                                      ? "bg-zinc-900/40 text-zinc-700 border-zinc-900 cursor-not-allowed line-through"
                                      : isSelected
                                        ? "bg-white text-black border-white shadow-lg"
                                        : "bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:border-white hover:text-white"
                                  )}
                                >
                                  {isBooked ? "✕" : ""} {slot}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* Hint kung hindi pa napili yung artist/date */}
                        {(!selectedArtist || !date) && (
                          <p className="mt-2 text-[9px] font-bold text-zinc-700 uppercase tracking-wider">
                            Select artist &amp; date to see availability
                          </p>
                        )}
                      </div>
                    </div>

                    {/* IMAGE REFERENCES */}
                    <div className="space-y-3">
                      <Label className="text-[9px] font-black uppercase text-zinc-500 tracking-widest block">
                        References ({previews.length})
                      </Label>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        <AnimatePresence>
                          {previews.map((src, idx) => (
                            <motion.div key={src}
                              initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
                              className="relative aspect-square rounded-xl overflow-hidden border border-zinc-800 group">
                              <img src={src} className="w-full h-full object-cover" alt="ref" />
                              <button type="button" onClick={() => removeImage(idx)}
                                className="absolute top-1 right-1 bg-white text-black p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all">
                                <X className="h-3 w-3" />
                              </button>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                        <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-zinc-800 rounded-xl cursor-pointer hover:border-white transition-all group">
                          <ImagePlus className="w-5 h-5 text-zinc-700 group-hover:text-white transition-all" />
                          <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
                        </label>
                      </div>
                    </div>

                    {/* MESSAGE */}
                    <div className="relative">
                      <Label className="text-[9px] font-black uppercase text-zinc-500 tracking-widest block mb-2">Project Details</Label>
                      <Textarea
                        name="message" required rows={3}
                        className="bg-zinc-900/60 border-zinc-800 focus:border-white text-white rounded-xl transition-all resize-none"
                      />
                    </div>

                    {/* SUBMIT */}
                    <Button
                      disabled={loading || phoneNumber.length !== 11}
                      type="submit"
                      className={cn(
                        "w-full h-14 font-black uppercase tracking-widest rounded-xl transition-all text-[11px] border",
                        loading || phoneNumber.length !== 11
                          ? "bg-zinc-900 text-zinc-600 border-zinc-800 cursor-not-allowed"
                          : "bg-white hover:bg-zinc-100 text-black border-white/20 shadow-lg shadow-white/5"
                      )}
                    >
                      {loading ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <Send size={16} />
                          {phoneNumber.length !== 11 ? "Submit Request" : "Submit Request"}
                        </span>
                      )}
                    </Button>
                  </form>
                </Card>
              </motion.div>

              {/* SIDEBAR */}
              <div className="lg:col-span-2 space-y-4">
                {contactInfo.map((info, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-4 p-5 rounded-2xl bg-zinc-950 border border-zinc-900 hover:border-zinc-700 transition-all group"
                  >
                    <div className="h-11 w-11 flex items-center justify-center rounded-xl bg-zinc-900 text-zinc-400 group-hover:bg-white group-hover:text-black transition-all">
                      <info.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{info.label}</p>
                      <p className="font-bold text-white text-sm">{info.value}</p>
                    </div>
                  </motion.div>
                ))}

                {/* MAP */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
                  className="relative w-full h-80 rounded-2xl overflow-hidden border border-zinc-900"
                >
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d1932.2818319891596!2d121.04308456282615!3d14.394638999999993!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397d0fa06ec1541%3A0x2703c40b18fa6b04!2s7-Eleven%20BRUGER%200078!5e0!3m2!1sen!2sph!4v1769938954850!5m2!1sen!2sph"
                    width="100%" height="100%"
                    style={{ border: 0 }} allowFullScreen loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="grayscale hover:grayscale-0 transition-all duration-500"
                  />
                </motion.div>

                {/* SAFETY WAIVER */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
                  onClick={() => setIsVaultOpen(true)}
                  className="cursor-pointer flex items-center gap-4 p-5 rounded-2xl bg-zinc-950 border border-zinc-900 hover:border-white transition-all group"
                >
                  <div className="h-11 w-11 flex items-center justify-center rounded-xl bg-white text-black group-hover:bg-zinc-200 transition-all">
                    <Download className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Pre-appointment</p>
                    <p className="font-bold text-white text-sm">Download Safety Waiver</p>
                  </div>
                </motion.div>
              </div>

            </div>
          </div>
        </section>
      </main>
      <Footer />

      {/* SUCCESS OVERLAY */}
      <AnimatePresence>
        {isSuccess && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/97 backdrop-blur-md flex items-center justify-center px-6"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.15 }}
              className="text-center space-y-8 max-w-sm"
            >
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.25 }}
                className="mx-auto w-20 h-20 bg-white rounded-[1.5rem] flex items-center justify-center shadow-2xl"
              >
                <Check className="w-10 h-10 text-black stroke-[3]" />
              </motion.div>
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600">Booking Request</p>
                <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">Submitted!</h2>
                <p className="text-zinc-500 text-sm font-bold">We'll get back to you shortly to confirm your session.</p>
              </div>
              <Button
                onClick={() => setIsSuccess(false)}
                className="bg-white hover:bg-zinc-100 text-black rounded-full px-12 h-13 font-black uppercase border border-white/20 transition-all"
              >
                Close
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <SafetyVaultModal
        isOpen={isVaultOpen}
        onClose={() => setIsVaultOpen(false)}
        userSession={session}
      />
    </>
  );
}