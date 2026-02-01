"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from 'next/navigation';
import {
  Mail, MapPin, Phone, Send, Clock, Sparkles, ImagePlus,
  Calendar as CalendarIcon, User, Loader2, Check, X, ChevronLeft, ChevronRight
} from "lucide-react";
import { Footer } from "../components/navigation/footer";
import { Navbar } from "../components/navigation/navbar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import FloatingChatWidget from "../components/chatbot";
import BookingPopup from "../components/popup";

const contactInfo = [
  { icon: Mail, label: "Email Us", value: "caranicolas.819@icloud.com", href: "mailto:caranicolas.819@icloud.com" },
  { icon: Phone, label: "Call/Text", value: "+63 935 595 5699" },
  { icon: MapPin, label: "Studio Location", value: "7/11, 2nd Flr, National Road, Putatan, Muntinlupa City", href: "#" },
];

export default function ContactPage() {
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);
  const [artistsList, setArtistsList] = useState<any[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showCustomCalendar, setShowCustomCalendar] = useState(false);


  const searchParams = useSearchParams();
  const artistFromUrl = searchParams.get("artist"); // Dito natin makukuha si "Pablo" o kung sino man

  const [selectedArtist, setSelectedArtist] = useState("");

  useEffect(() => {
    if (artistFromUrl) {
      setSelectedArtist(artistFromUrl);
      console.log("Auto-selected artist:", artistFromUrl);
    }
  }, [artistFromUrl]);


  // --- 1. FETCH ARTISTS PARA SA DROPDOWN (FILTERED) ---
  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const res = await fetch("/api/artists");
        if (res.ok) {
          const data = await res.json();

          // I-filter lang ang mga artists na 'active' ang status
          // Kung ang logic mo ay status !== 'inactive', ganito ang gawin:
          const activeArtists = data.filter((artist: any) => artist.status === 'active');

          setArtistsList(activeArtists);
        }
      } catch (error) {
        console.error("Failed to fetch artists:", error);
      }
    };
    fetchArtists();
  }, []);

  // --- 2. MULTI-IMAGE HANDLER ---
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...files]);
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setPreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // --- 3. CLOUDINARY UPLOAD LOGIC ---
  const uploadToCloudinary = async (files: File[]) => {
    const uploadPreset = "adrenalinejunkypiercinks"; // PALITAN MO ITO PAR
    const cloudName = "diwrwmjgw"; // PALITAN MO ITO PAR

    const urls = await Promise.all(
      files.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", uploadPreset);

        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        return data.secure_url;
      })
    );
    return urls;
  };

  // --- 4. FORM SUBMISSION ---
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!date || !time) {
      toast.error("Please select both preferred date and time");
      return;
    }

    setLoading(true);
    const formData = new FormData(e.currentTarget);

    try {
      // Upload images muna
      let imageUrls: string[] = [];
      if (selectedFiles.length > 0) {
        imageUrls = await uploadToCloudinary(selectedFiles);
      }

      const bookingData = {
        name: formData.get("name"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        artist: formData.get("artist"),
        service: formData.get("service"),
        message: formData.get("message"),
        date: date,
        time: time,
        images: imageUrls, // Array na ito
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
      } else {
        toast.error("Failed to send booking. Try again.");
      }
    } catch (error) {
      toast.error("Error submitting form.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <BookingPopup />
      <FloatingChatWidget />
      <Navbar />
      <main className="bg-black min-h-screen">
        {/* HERO SECTION */}
        <section className="relative h-[60vh] w-full flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('/images/logo/contact.png')` }}>
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/70 to-black"></div>
          </div>
          <div className="relative z-10 text-center">
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-5xl md:text-7xl font-black uppercase italic text-white tracking-tighter">
              Get In <span className="text-orange-600">Touch</span>
            </motion.h1>
          </div>
        </section>

        {/* FORM SECTION */}
        <section id="contact" className="relative w-full px-6 pb-32 z-20">
          <div className="mx-auto w-full max-w-7xl">
            <div className="grid gap-12 lg:grid-cols-5">

              <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} className="lg:col-span-3">
                <Card className="rounded-[2rem] border-white/10 bg-zinc-950/50 p-8 md:p-14 backdrop-blur-xl shadow-2xl">
                  <div className="mb-10">
                    <h2 className="text-2xl font-black uppercase italic text-white flex items-center gap-2">
                      <Sparkles className="text-orange-600 h-5 w-5" /> Booking Form
                    </h2>
                    <p className="text-zinc-500 text-[10px] font-bold uppercase mt-2">Custom Tattoos & Piercings</p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-10">
                    <div className="relative group">
                      <Input name="name" required className="peer bg-zinc-900/40 border-zinc-800 focus:border-orange-600 text-white h-12 rounded-xl" />
                      <Label className="absolute left-0 -top-6 text-[10px] font-black uppercase text-zinc-500">Full Name</Label>
                    </div>

                    <div className="grid gap-10 sm:grid-cols-2">
                      <div className="relative group">
                        <Input name="email" type="email" required className="peer bg-zinc-900/40 border-zinc-800 text-white h-12 rounded-xl" />
                        <Label className="absolute left-0 -top-6 text-[10px] font-black uppercase text-zinc-500">Email</Label>
                      </div>
                      <div className="relative group">
                        <Input name="phone" type="tel" required className="peer bg-zinc-900/40 border-zinc-800 text-white h-12 rounded-xl" />
                        <Label className="absolute left-0 -top-6 text-[10px] font-black uppercase text-zinc-500">Phone</Label>
                      </div>
                    </div>

                    <div className="grid gap-10 sm:grid-cols-2">
                      {/* CUSTOM DATE PICKER */}
                      <div className="relative group">
                        <Label className="absolute left-0 -top-6 text-[10px] font-black uppercase text-zinc-500">Date</Label>
                        <div className="relative">
                          <motion.button
                            type="button"
                            onClick={() => setShowCustomCalendar(!showCustomCalendar)}
                            className="w-full h-12 bg-gradient-to-r from-zinc-900/60 to-zinc-800/60 border border-orange-500/30 rounded-xl px-4 text-white text-xs font-bold uppercase flex items-center justify-between hover:border-orange-500/60 transition-all"
                          >
                            <span className="flex items-center gap-2">
                              <CalendarIcon className="h-4 w-4 text-orange-500" />
                              {date ? format(date, "MMM dd") : "Select Date"}
                            </span>
                            <ChevronRight className={`h-4 w-4 transition-transform ${showCustomCalendar ? 'rotate-90' : ''}`} />
                          </motion.button>

                          <AnimatePresence>
                            {showCustomCalendar && (
                              <motion.div
                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                className="absolute top-14 left-0 z-50 w-full bg-zinc-950 border border-orange-500/40 rounded-2xl p-4 shadow-2xl"
                              >
                                <div className="flex items-center justify-between mb-4">
                                  <button
                                    type="button"
                                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                                    className="p-2 hover:bg-orange-500/20 rounded-lg transition-all"
                                  >
                                    <ChevronLeft className="h-4 w-4 text-orange-500" />
                                  </button>
                                  <span className="text-white font-bold text-sm">{format(currentMonth, "MMMM yyyy")}</span>
                                  <button
                                    type="button"
                                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                                    className="p-2 hover:bg-orange-500/20 rounded-lg transition-all"
                                  >
                                    <ChevronRight className="h-4 w-4 text-orange-500" />
                                  </button>
                                </div>
                                <div className="grid grid-cols-7 gap-2 text-center">
                                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(day => (
                                    <div key={day} className="text-zinc-500 text-[10px] font-bold py-2">
                                      {day}
                                    </div>
                                  ))}
                                  {Array.from({ length: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay() }).map((_, i) => (
                                    <div key={`empty-${i}`} />
                                  ))}
                                  {Array.from({ length: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate() }).map((_, i) => {
                                    const dayDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i + 1);
                                    const isSelected = date && date.toDateString() === dayDate.toDateString();
                                    const isPast = dayDate < new Date();
                                    return (
                                      <motion.button
                                        key={i}
                                        type="button"
                                        disabled={isPast}
                                        onClick={() => {
                                          setDate(dayDate);
                                          setShowCustomCalendar(false);
                                        }}
                                        whileHover={!isPast ? { scale: 1.1 } : {}}
                                        className={`py-2 rounded-lg text-[11px] font-bold transition-all ${isPast
                                          ? "text-zinc-700 cursor-not-allowed"
                                          : isSelected
                                            ? "bg-gradient-to-r from-orange-600 to-red-600 text-white"
                                            : "text-white hover:bg-orange-500/20"
                                          }`}
                                      >
                                        {i + 1}
                                      </motion.button>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      {/* CUSTOM TIME PICKER */}
                      <div className="relative group">
                        <Label className="absolute left-0 -top-6 text-[10px] font-black uppercase text-zinc-500">Time</Label>
                        <div className="relative">
                          <motion.select
                            name="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            required
                            className="w-full h-12 bg-gradient-to-r from-zinc-900/60 to-zinc-800/60 border border-orange-500/30 rounded-xl px-4 pr-10 text-white text-xs font-bold uppercase appearance-none hover:border-orange-500/60 focus:border-orange-500 transition-all cursor-pointer"
                          >
                            {/* Nilagyan natin ng text-black ang bawat option */}
                            <option value="" disabled className="text-black">Select Time</option>
                            <option value="09:00 AM" className="text-black">09:00 AM</option>
                            <option value="11:00 AM" className="text-black">11:00 AM</option>
                            <option value="01:00 PM" className="text-black">01:00 PM</option>
                            <option value="03:00 PM" className="text-black">03:00 PM</option>
                            <option value="05:00 PM" className="text-black">05:00 PM</option>
                          </motion.select>
                          <Clock className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-500 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    {/* ARTIST DROPDOWN */}
                    <div className="relative group">
                      <Label className="absolute left-0 -top-6 text-[10px] font-black uppercase text-zinc-500">Artist</Label>
                      <select
                        name="artist"
                        required
                        // Dito papasok yung logic ng auto-select
                        value={selectedArtist}
                        onChange={(e) => setSelectedArtist(e.target.value)}
                        className="w-full h-12 bg-linear-to-r from-zinc-900/60 to-zinc-800/60 border border-orange-500/30 rounded-xl px-4 pr-10 text-white text-xs font-bold uppercase appearance-none hover:border-orange-500/60 focus:border-orange-500 transition-all cursor-pointer"
                      >
                        <option value="" disabled className="text-black">Select Artist</option>
                        {artistsList.map((a) => (
                          <option key={a.id} value={a.fullName} className="text-black">
                            {a.fullName}
                          </option>
                        ))}
                      </select>
                      <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-500 pointer-events-none rotate-90" />
                    </div>

                    {/* SERVICE DROPDOWN */}
                    <div className="relative group">
                      <Label className="absolute left-0 -top-6 text-[10px] font-black uppercase text-zinc-500">Service</Label>
                      <select
                        name="service"
                        required
                        defaultValue=""
                        className="w-full h-12 bg-gradient-to-r from-zinc-900/60 to-zinc-800/60 border border-orange-500/30 rounded-xl px-4 pr-10 text-white text-xs font-bold uppercase appearance-none hover:border-orange-500/60 focus:border-orange-500 transition-all cursor-pointer"
                      >
                        <option value="" disabled className="text-black">Service Type</option>
                        <option value="Tattoo" className="text-black">Tattoo Session</option>
                        <option value="Piercing" className="text-black">Body Piercing</option>
                      </select>
                      <Sparkles className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-500 pointer-events-none" />
                    </div>

                    {/* MULTI IMAGE PREVIEW */}
                    <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase text-zinc-500">References ({previews.length})</Label>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                        <AnimatePresence>
                          {previews.map((src, idx) => (
                            <motion.div key={src} initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }} className="relative aspect-square rounded-xl overflow-hidden border border-white/10">
                              <img src={src || "/placeholder.svg"} className="w-full h-full object-cover" alt="ref" />
                              <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-red-600 p-1 rounded-full"><X className="h-3 w-3 text-white" /></button>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                        <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-zinc-800 rounded-xl cursor-pointer hover:border-orange-600 transition-all">
                          <ImagePlus className="w-6 h-6 text-zinc-600" />
                          <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
                        </label>
                      </div>
                    </div>

                    <div className="relative group">
                      <Textarea name="message" required rows={3} className="bg-zinc-900/40 border-zinc-800 text-white rounded-xl" />
                      <Label className="absolute left-0 -top-6 text-[10px] font-black uppercase text-zinc-500">Project Details</Label>
                    </div>

                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        disabled={loading}
                        type="submit"
                        className="w-full h-16 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-black uppercase tracking-widest rounded-xl transition-all duration-500 shadow-lg shadow-orange-600/40 hover:shadow-orange-600/60 border border-orange-400/30"
                      >
                        {loading ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            <Send size={18} />
                            Submit Request
                          </span>
                        )}
                      </Button>
                    </motion.div>
                  </form>
                </Card>
              </motion.div>
              {/* SIDEBAR */}
              <div className="lg:col-span-2 space-y-6">
                {/* I-loop lang natin yung contact info cards */}
                {contactInfo.map((info, i) => (
                  <div key={i} className="flex items-center gap-5 p-6 rounded-3xl bg-zinc-900/20 border border-white/5 backdrop-blur-sm">
                    <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-zinc-800 text-orange-600">
                      <info.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-zinc-600 uppercase">{info.label}</p>
                      <p className="font-bold text-zinc-200 text-sm">{info.value}</p>
                    </div>
                  </div>
                ))}

                {/* MAPA - Dapat nasa labas ng loop pero nasa loob pa rin ng Sidebar container */}
                <div className="relative w-full h-96 rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d1932.2818319891596!2d121.04308456282615!3d14.394638999999993!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397d0fa06ec1541%3A0x2703c40b18fa6b04!2s7-Eleven%20BRUGER%200078!5e0!3m2!1sen!2sph!4v1769938954850!5m2!1sen!2sph"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="grayscale hover:grayscale-0 transition-all duration-300"
                  />
                </div>
              </div>

            </div>
          </div>
        </section>
      </main>
      <Footer />

      {/* SUCCESS OVERLAY */}
      <AnimatePresence>
        {isSuccess && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center px-6">
            <div className="text-center space-y-8">
              <div className="mx-auto w-24 h-24 bg-orange-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-orange-600/40">
                <Check className="w-12 h-12 text-white stroke-[4]" />
              </div>
              <h2 className="text-4xl font-black text-white italic uppercase">Request Sent!</h2>
              <Button onClick={() => setIsSuccess(false)} className="bg-white text-black rounded-full px-12 h-14 font-black uppercase">Close</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
