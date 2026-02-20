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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import FloatingChatWidget from "../components/chatbot";
import BookingPopup from "../components/popup";
import SafetyVaultModal from "../components/SafetyVaultModal"; // Palitan ang path kung saan mo man sinave

const contactInfo = [
  { icon: Mail, label: "Email Us", value: "caranicolas.819@icloud.com", href: "mailto:caranicolas.819@icloud.com" },
  { icon: Phone, label: "Call/Text", value: "+63 935 595 5699" },
  { icon: MapPin, label: "Studio Location", value: "7/11, 2nd Flr, National Road, Putatan, Muntinlupa City", href: "#" },
];

export default function ContactPage() {
  const { data: session } = useSession(); // Kunin ang session data
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);
  const [artistsList, setArtistsList] = useState<any[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showCustomCalendar, setShowCustomCalendar] = useState(false);

  const [isVaultOpen, setIsVaultOpen] = useState(false);


  const [shippingData, setShippingData] = useState({
        name: '',
        email: '',
        phone: '',
        address: ''
    });

  const searchParams = useSearchParams();
  const artistFromUrl = searchParams.get("artist");

  const [selectedArtist, setSelectedArtist] = useState("");

  useEffect(() => {
    if (artistFromUrl) {
      setSelectedArtist(artistFromUrl);
      console.log("Auto-selected artist:", artistFromUrl);
    }
  }, [artistFromUrl]);

  useEffect(() => {
  if (session?.user) {
    setShippingData({
      ...shippingData,
      name: session.user.name || '',
      email: session.user.email || '',
    });
  }
}, [session]);
  // FETCH ARTISTS PARA SA DROPDOWN (FILTERED)
  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const res = await fetch("/api/artists");
        if (res.ok) {
          const data = await res.json();
          const activeArtists = data.filter((artist: any) => artist.status === 'active');
          setArtistsList(activeArtists);
        }
      } catch (error) {
        console.error("Failed to fetch artists:", error);
      }
    };
    fetchArtists();
  }, []);

  // MULTI-IMAGE HANDLER
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

  // CLOUDINARY UPLOAD LOGIC
  const uploadToCloudinary = async (files: File[]) => {
    const uploadPreset = "adrenalinejunkypiercinks";
    const cloudName = "diwrwmjgw";

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

  // FORM SUBMISSION
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
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-black"></div>
          </div>
          <div className="relative z-10 text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="text-5xl md:text-7xl font-black uppercase italic text-white tracking-tighter"
            >
              Get In <span className="text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]">Touch</span>
            </motion.h1>
          </div>
        </section>

        {/* FORM SECTION */}
        <section id="contact" className="relative w-full px-6 pb-32 z-20">
          <div className="mx-auto w-full max-w-7xl">
            <div className="grid gap-12 lg:grid-cols-5">

              <motion.div 
                initial={{ opacity: 0, y: 40 }} 
                whileInView={{ opacity: 1, y: 0 }} 
                className="lg:col-span-3"
              >
                <Card className="rounded-[2rem] border-white/10 bg-zinc-950/50 p-8 md:p-14 backdrop-blur-xl shadow-2xl">
                  <div className="mb-10">
                    <h2 className="text-2xl font-black uppercase italic text-white flex items-center gap-2">
                      <Sparkles className="text-white h-5 w-5" /> Booking Form
                    </h2>
                    <p className="text-zinc-400 text-[10px] font-bold uppercase mt-2">Custom Tattoos & Piercings</p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-10">
<div className="relative group">
  <input
    type="text"
    name="name" // Importante para sa formData.get("name")
    placeholder="FULL NAME"
    value={shippingData.name}
    readOnly
    className="w-full bg-zinc-800/30 border border-white/5 rounded-xl p-4 text-[10px] font-bold tracking-widest uppercase text-zinc-500 cursor-not-allowed outline-none h-12"
  />
  <Label className="absolute left-0 -top-6 text-[10px] font-black uppercase text-zinc-400">Full Name</Label>
</div>

                    <div className="grid gap-10 sm:grid-cols-2">
<div className="relative group">
  <input
    type="email"
    name="email" // Importante para sa formData.get("email")
    placeholder="EMAIL"
    value={shippingData.email}
    readOnly
    className="w-full bg-zinc-800/30 border border-white/5 rounded-xl p-4 text-[10px] font-bold tracking-widest uppercase text-zinc-500 cursor-not-allowed outline-none h-12"
  />
  <Label className="absolute left-0 -top-6 text-[10px] font-black uppercase text-zinc-400">Email</Label>
</div>
                      <div className="relative group">
                        <Input 
                          name="phone" 
                          type="tel" 
                          required 
                          className="peer bg-zinc-900/40 border-zinc-700 focus:border-white text-white h-12 rounded-xl transition-all duration-300" 
                        />
                        <Label className="absolute left-0 -top-6 text-[10px] font-black uppercase text-zinc-400">Phone</Label>
                      </div>
                    </div>

                    <div className="grid gap-10 sm:grid-cols-2">
                      {/* CUSTOM DATE PICKER */}
                      <div className="relative group">
                        <Label className="absolute left-0 -top-6 text-[10px] font-black uppercase text-zinc-400">Date</Label>
                        <div className="relative">
                          <motion.button
                            type="button"
                            onClick={() => setShowCustomCalendar(!showCustomCalendar)}
                            className="w-full h-12 bg-zinc-900/60 border border-zinc-700 rounded-xl px-4 text-white text-xs font-bold uppercase flex items-center justify-between hover:border-white transition-all duration-300"
                          >
                            <span className="flex items-center gap-2">
                              <CalendarIcon className="h-4 w-4 text-white" />
                              {date ? format(date, "MMM dd") : "Select Date"}
                            </span>
                            <ChevronRight className={`h-4 w-4 transition-transform duration-300 ${showCustomCalendar ? 'rotate-90' : ''}`} />
                          </motion.button>

                          <AnimatePresence>
                            {showCustomCalendar && (
                              <motion.div
                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className="absolute top-14 left-0 z-50 w-full bg-zinc-950 border border-white/20 rounded-2xl p-4 shadow-2xl"
                              >
                                <div className="flex items-center justify-between mb-4">
                                  <button
                                    type="button"
                                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-all duration-300"
                                  >
                                    <ChevronLeft className="h-4 w-4 text-white" />
                                  </button>
                                  <span className="text-white font-bold text-sm">{format(currentMonth, "MMMM yyyy")}</span>
                                  <button
                                    type="button"
                                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-all duration-300"
                                  >
                                    <ChevronRight className="h-4 w-4 text-white" />
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
                                        className={`py-2 rounded-lg text-[11px] font-bold transition-all duration-300 ${
                                          isPast
                                            ? "text-zinc-700 cursor-not-allowed"
                                            : isSelected
                                            ? "bg-white text-black"
                                            : "text-white hover:bg-white/20"
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
                        <Label className="absolute left-0 -top-6 text-[10px] font-black uppercase text-zinc-400">Time</Label>
                        <div className="relative">
                          <motion.select
                            name="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            required
                            className="w-full h-12 bg-zinc-900/60 border border-zinc-700 rounded-xl px-4 pr-10 text-white text-xs font-bold uppercase appearance-none hover:border-white focus:border-white transition-all duration-300 cursor-pointer"
                          >
                            <option value="" disabled className="text-black">Select Time</option>
                            <option value="09:00 AM" className="text-black">09:00 AM</option>
                            <option value="11:00 AM" className="text-black">11:00 AM</option>
                            <option value="01:00 PM" className="text-black">01:00 PM</option>
                            <option value="03:00 PM" className="text-black">03:00 PM</option>
                            <option value="05:00 PM" className="text-black">05:00 PM</option>
                          </motion.select>
                          <Clock className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    {/* ARTIST DROPDOWN */}
                    <div className="relative group">
                      <Label className="absolute left-0 -top-6 text-[10px] font-black uppercase text-zinc-400">Artist</Label>
                      <select
                        name="artist"
                        required
                        value={selectedArtist}
                        onChange={(e) => setSelectedArtist(e.target.value)}
                        className="w-full h-12 bg-zinc-900/60 border border-zinc-700 rounded-xl px-4 pr-10 text-white text-xs font-bold uppercase appearance-none hover:border-white focus:border-white transition-all duration-300 cursor-pointer"
                      >
                        <option value="" disabled className="text-black">Select Artist</option>
                        {artistsList.map((a) => (
                          <option key={a.id} value={a.fullName} className="text-black">
                            {a.fullName}
                          </option>
                        ))}
                      </select>
                      <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white pointer-events-none rotate-90" />
                    </div>

                    {/* SERVICE DROPDOWN */}
                    <div className="relative group">
                      <Label className="absolute left-0 -top-6 text-[10px] font-black uppercase text-zinc-400">Service</Label>
                      <select
                        name="service"
                        required
                        defaultValue=""
                        className="w-full h-12 bg-zinc-900/60 border border-zinc-700 rounded-xl px-4 pr-10 text-white text-xs font-bold uppercase appearance-none hover:border-white focus:border-white transition-all duration-300 cursor-pointer"
                      >
                        <option value="" disabled className="text-black">Service Type</option>
                        <option value="Tattoo" className="text-black">Tattoo Session</option>
                        <option value="Piercing" className="text-black">Body Piercing</option>
                      </select>
                      <Sparkles className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white pointer-events-none" />
                    </div>

                    {/* MULTI IMAGE PREVIEW */}
                    <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase text-zinc-400">References ({previews.length})</Label>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                        <AnimatePresence>
                          {previews.map((src, idx) => (
                            <motion.div 
                              key={src} 
                              initial={{ scale: 0.8, opacity: 0 }} 
                              animate={{ scale: 1, opacity: 1 }} 
                              exit={{ scale: 0.8, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="relative aspect-square rounded-xl overflow-hidden border border-white/10 group"
                            >
                              <img src={src || "/placeholder.svg"} className="w-full h-full object-cover transition-all duration-300 group-hover:scale-110" alt="ref" />
                              <button 
                                type="button" 
                                onClick={() => removeImage(idx)} 
                                className="absolute top-1 right-1 bg-white text-black p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                        <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-zinc-700 rounded-xl cursor-pointer hover:border-white transition-all duration-300 group">
                          <ImagePlus className="w-6 h-6 text-zinc-600 group-hover:text-white transition-all duration-300" />
                          <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
                        </label>
                      </div>
                    </div>

                    <div className="relative group">
                      <Textarea 
                        name="message" 
                        required 
                        rows={3} 
                        className="bg-zinc-900/40 border-zinc-700 focus:border-white text-white rounded-xl transition-all duration-300" 
                      />
                      <Label className="absolute left-0 -top-6 text-[10px] font-black uppercase text-zinc-400">Project Details</Label>
                    </div>

                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        disabled={loading}
                        type="submit"
                        className="w-full h-16 bg-white hover:bg-zinc-200 text-black font-black uppercase tracking-widest rounded-xl transition-all duration-300 shadow-lg shadow-white/10 hover:shadow-white/20 border border-white/20"
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
                {contactInfo.map((info, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-5 p-6 rounded-3xl bg-zinc-900/20 border border-white/5 backdrop-blur-sm hover:border-white/20 transition-all duration-300 group"
                  >
                    <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-zinc-800 text-white group-hover:bg-white group-hover:text-black transition-all duration-300">
                      <info.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-zinc-500 uppercase">{info.label}</p>
                      <p className="font-bold text-zinc-200 text-sm">{info.value}</p>
                    </div>
                  </motion.div>
                ))}

                {/* MAPA */}
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="relative w-full h-96 rounded-3xl overflow-hidden border border-white/10 shadow-2xl"
                >
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d1932.2818319891596!2d121.04308456282615!3d14.394638999999993!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397d0fa06ec1541%3A0x2703c40b18fa6b04!2s7-Eleven%20BRUGER%200078!5e0!3m2!1sen!2sph!4v1769938954850!5m2!1sen!2sph"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="grayscale hover:grayscale-0 transition-all duration-500"
                  />
                </motion.div>
                <motion.div 
  onClick={() => setIsVaultOpen(true)}
  className="cursor-pointer flex items-center gap-5 p-6 rounded-3xl bg-grey/10 border"
>
  <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-[#d11a2a] text-white group-hover:scale-110 transition-all duration-300">
    <Download className="h-5 w-5" />
  </div>
  <div>
    <p className="text-[10px] font-black text-[#d11a2a] uppercase tracking-widest">Pre-appointment</p>
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
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center px-6"
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center space-y-8"
            >
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.3 }}
                className="mx-auto w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-2xl shadow-white/20"
              >
                <Check className="w-12 h-12 text-black stroke-[4]" />
              </motion.div>
              <h2 className="text-4xl font-black text-white italic uppercase">Request Sent!</h2>
              <Button 
                onClick={() => setIsSuccess(false)} 
                className="bg-white hover:bg-zinc-200 text-black rounded-full px-12 h-14 font-black uppercase transition-all duration-300"
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
  userSession={session} // Ito yung session mo sa ContactPage
/>

    </>
  );
}