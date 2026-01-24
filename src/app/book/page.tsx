"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, MapPin, Phone, Send, Clock, Sparkles, ImagePlus, Calendar as CalendarIcon, User, Loader2, Check } from "lucide-react";
import { Footer } from "../components/navigation/footer";
import { Navbar } from "../components/navigation/navbar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";

const contactInfo = [
  { icon: Mail, label: "Email Us", value: "caranicolas.819@icloud.com", href: "mailto:caranicolas.819@icloud.com" },
  { icon: Phone, label: "Call/Text", value: "+63 935 595 5699" },
  { icon: MapPin, label: "Studio Location", value: "7/11, 2nd Flr, National Road, Putatan, Muntinlupa City", href: "#" },
];

export default function ContactPage() {
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [base64Image, setBase64Image] = useState<string>("");
  const [isSuccess, setIsSuccess] = useState(false);

  // Handler para sa Image to Base64
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBase64Image(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      artist: formData.get("artist"),
      service: formData.get("service"),
      message: formData.get("message"),
      date: date,
      time: time,
      image: base64Image,
    };

    if (!date || !time) {
      toast.error("Please select both preferred date and time");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setIsSuccess(true);
        (e.target as HTMLFormElement).reset();
        setDate(undefined);
        setTime("");
        setBase64Image("");
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } catch (error) {
      toast.error("Failed to send request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="bg-black min-h-screen">
        {/* HERO SECTION */}
        <section className="relative h-[60vh] w-full flex items-center justify-center overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url('/images/logo/contact.png')`,
              backgroundPosition: 'center',
              backgroundSize: 'cover'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/70 to-black"></div>
          </div>
          <div className="relative z-10 text-center px-4">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-7xl font-black uppercase italic text-white tracking-tighter"
            >
              Get In <span className="text-orange-600">Touch</span>
            </motion.h1>
          </div>
        </section>

        {/* CONTACT FORM SECTION */}
        <section id="contact" className="relative w-full px-6 pb-32 mt-0 z-20">
          <div className="mx-auto w-full max-w-7xl">
            <div className="grid gap-12 lg:grid-cols-5">
              <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} className="lg:col-span-3">
                <Card className="relative overflow-hidden rounded-[2rem] border-white/10 bg-zinc-950/50 p-8 md:p-14 backdrop-blur-xl shadow-2xl">
                  <div className="mb-10">
                    <h2 className="text-2xl font-black uppercase italic text-white flex items-center gap-2">
                      <Sparkles className="text-orange-600 h-5 w-5" /> Booking Form
                    </h2>
                    <p className="text-zinc-500 text-xs font-bold uppercase mt-2">Personalize your session details below</p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-10">
                    {/* CLIENT NAME */}
                    <div className="relative group">
                      <Input name="name" id="name" required className="peer bg-zinc-900/40 border-zinc-800 focus-visible:border-orange-600 text-white h-12" />
                      <Label htmlFor="name" className="absolute left-0 -top-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 peer-focus:text-orange-600">Client Name</Label>
                    </div>

                    <div className="grid gap-10 sm:grid-cols-2">
                      <div className="relative group">
                        <Input name="email" id="email" type="email" required className="peer bg-zinc-900/40 border-zinc-800 focus-visible:border-orange-600 text-white h-12" />
                        <Label htmlFor="email" className="absolute left-0 -top-6 text-[10px] font-black uppercase text-zinc-500 peer-focus:text-orange-600">Email Address</Label>
                      </div>
                      <div className="relative group">
                        <Input name="phone" id="phone" type="tel" required className="peer bg-zinc-900/40 border-zinc-800 focus-visible:border-orange-600 text-white h-12" />
                        <Label htmlFor="phone" className="absolute left-0 -top-6 text-[10px] font-black uppercase text-zinc-500 peer-focus:text-orange-600">Contact Number</Label>
                      </div>
                    </div>

                    <div className="grid gap-10 sm:grid-cols-2">
                      {/* DATE PICKER */}
                      <div className="relative group">
                        <Label className="absolute left-0 -top-6 text-[10px] font-black uppercase text-zinc-500 flex items-center gap-2">Preferred Date <CalendarIcon className="h-3 w-3" /></Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant={"outline"} className={cn("w-full justify-between text-left font-bold uppercase text-xs h-12 rounded-lg px-4 border-zinc-800 hover:border-orange-600 transition-all bg-zinc-900/40", !date && "text-zinc-500", date && "text-white")}>
                              {date ? format(date, "PPP") : <span>Pick a date</span>}
                              <CalendarIcon className="h-4 w-4 text-zinc-500" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 bg-zinc-950 border-zinc-800" align="start">
                            <Calendar
                              mode="single"
                              selected={date}
                              onSelect={setDate}
                              initialFocus
                              className="p-3 text-white bg-zinc-950"
                              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* TIME SELECT */}
                      <div className="relative group">
                        <Label htmlFor="time" className="absolute left-0 -top-6 text-[10px] font-black uppercase text-zinc-500 flex items-center gap-2">Preferred Time <Clock className="h-3 w-3" /></Label>
                        <select
                          name="time"
                          id="time"
                          required
                          value={time}
                          onChange={(e) => setTime(e.target.value)}
                          className="peer w-full h-12 bg-zinc-900/40 border-zinc-800 border rounded-lg px-4 focus:outline-none focus:border-orange-600 text-white font-bold uppercase text-xs appearance-none cursor-pointer"
                        >
                          <option value="" disabled className="bg-zinc-950 text-zinc-700">Select Time (8AM-7PM)</option>
                          <optgroup label="Morning" className="bg-zinc-950 text-orange-600">
                            <option value="08:00 AM">08:00 AM</option>
                            <option value="09:00 AM">09:00 AM</option>
                            <option value="10:00 AM">10:00 AM</option>
                            <option value="11:00 AM">11:00 AM</option>
                          </optgroup>
                          <optgroup label="Afternoon" className="bg-zinc-950 text-orange-600">
                            <option value="12:00 PM">12:00 PM</option>
                            <option value="01:00 PM">01:00 PM</option>
                            <option value="02:00 PM">02:00 PM</option>
                            <option value="03:00 PM">03:00 PM</option>
                            <option value="04:00 PM">04:00 PM</option>
                            <option value="05:00 PM">05:00 PM</option>
                            <option value="06:00 PM">06:00 PM</option>
                            <option value="07:00 PM">07:00 PM</option>
                          </optgroup>
                        </select>
                      </div>
                    </div>

                    <div className="grid gap-10 sm:grid-cols-2">
                      <div className="relative group">
                        <Label htmlFor="artist" className="absolute left-0 -top-6 text-[10px] font-black uppercase text-zinc-500 flex items-center gap-2">Select Artist <User className="h-3 w-3" /></Label>
                        <select
                          name="artist"
                          id="artist"
                          required
                          defaultValue="" // Dito natin ilalagay yung default
                          className="peer w-full h-12 bg-zinc-900/40 border-zinc-800 border rounded-lg px-4 focus:outline-none focus:border-orange-600 text-white font-bold uppercase text-xs appearance-none"
                        >
                          <option value="" disabled className="bg-zinc-950">Choose your artist</option>
                          <option value="lead-artist" className="bg-zinc-950">Lead Artist (Caraan)</option>
                          <option value="guest-artist" className="bg-zinc-950">Guest Artist</option>
                        </select>
                      </div>

                      <div className="relative group">
                        <Label htmlFor="service" className="absolute left-0 -top-6 text-[10px] font-black uppercase text-zinc-500">Service Type</Label>
                        <select
                          name="service"
                          id="service"
                          required
                          defaultValue="" // Dito rin
                          className="peer w-full h-12 bg-zinc-900/40 border-zinc-800 border rounded-lg px-4 focus:border-orange-600 text-white font-bold uppercase text-xs appearance-none"
                        >
                          <option value="" disabled className="bg-zinc-950">Select a service</option>
                          <option value="tattoo" className="bg-zinc-950">Tattoo Session</option>
                          <option value="piercing" className="bg-zinc-950">Body Piercing</option>
                        </select>
                      </div>
                    </div>

                    {/* IMAGE UPLOAD WITH PREVIEW */}
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase text-zinc-500">Reference Image (Design Idea)</Label>
                      <div className="relative">
                        <label htmlFor="image-upload" className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-zinc-800 rounded-2xl cursor-pointer hover:border-orange-600/50 hover:bg-zinc-900/30 transition-all overflow-hidden">
                          {base64Image ? (
                            <img src={base64Image} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <ImagePlus className="w-8 h-8 mb-2 text-zinc-600" />
                              <p className="text-xs text-zinc-500 font-bold uppercase text-center px-4">Click to upload reference photo</p>
                            </div>
                          )}
                          <input id="image-upload" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                        </label>
                      </div>
                    </div>

                    <div className="relative group">
                      <Textarea name="message" id="message" required rows={3} className="peer bg-zinc-900/40 border-zinc-800 focus-visible:border-orange-600 text-white text-sm rounded-xl" />
                      <Label htmlFor="message" className="absolute left-0 -top-6 text-[10px] font-black uppercase text-zinc-500">Project Details</Label>
                    </div>

                    <Button disabled={loading} type="submit" className="w-full h-16 gap-3 text-sm font-black uppercase tracking-[0.2em] bg-orange-600 text-white hover:bg-white hover:text-black transition-all duration-500 rounded-xl shadow-lg shadow-orange-600/20">
                      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Send className="h-4 w-4" /> Send Booking Request</>}
                    </Button>
                  </form>
                </Card>
              </motion.div>

              {/* SIDEBAR */}
              <div className="lg:col-span-2 space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                  {contactInfo.map((info, index) => (
                    <a key={index} href={info.href} className="block group">
                      <div className="flex items-center gap-5 p-6 rounded-3xl border border-white/5 bg-zinc-900/20 hover:bg-zinc-900/60 transition-all backdrop-blur-sm">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800 text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-all">
                          <info.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase text-zinc-600">{info.label}</p>
                          <p className="font-bold text-zinc-200 text-xs sm:text-sm leading-tight">{info.value}</p>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
                <Card className="rounded-[2rem] border-white/5 bg-zinc-900/20 overflow-hidden h-[300px] relative shadow-2xl">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15456.88583492576!2d121.0346337!3d14.385566!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397d057a6e1f37d%3A0x7d06e2a87d0e8e6d!2sPutatan%2C%20Muntinlupa%2C%20Metro%20Manila!5e0!3m2!1sen!2sph!4v1710000000000"
                    width="100%" height="100%" style={{ border: 0, filter: "grayscale(1) invert(0.9) contrast(1.2)" }} allowFullScreen loading="lazy"
                  ></iframe>
                </Card>
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
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl px-6"
          >
            <motion.div
              initial={{ scale: 0.8, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="max-w-md w-full text-center space-y-8"
            >
              <div className="relative mx-auto w-32 h-32">
                <motion.div
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", damping: 10, delay: 0.2 }}
                  className="absolute inset-0 bg-orange-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-orange-600/40"
                >
                  <Check className="w-16 h-16 text-white stroke-[4]" />
                </motion.div>
                <motion.div
                  animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute inset-0 bg-orange-600 rounded-[2rem] -z-10"
                />
              </div>

              <div className="space-y-4">
                <h2 className="text-4xl font-black uppercase italic text-white tracking-tighter">Booking Sent!</h2>
                <p className="text-zinc-400 text-base font-medium leading-relaxed px-4">
                  Stay tight, <span className="text-orange-500 font-bold italic underline">Junky!</span> We’ve locked in your request. Check your inbox for the confirmation details.
                </p>
              </div>

              <Button
                onClick={() => setIsSuccess(false)}
                className="bg-white text-black hover:bg-orange-600 hover:text-white font-black uppercase text-xs px-12 h-14 rounded-full transition-all duration-300 shadow-xl"
              >
                Back to Studio
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}