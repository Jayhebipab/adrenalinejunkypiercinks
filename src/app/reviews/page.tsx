"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  Star, 
  Quote, 
  Loader2, 
  MessageSquareQuote, 
  ChevronLeft,
  ArrowRight
} from "lucide-react";
import Link from "next/link";

// Shadcn UI components (Assuming these are in your components folder)
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Review {
  _id: string;
  name: string;
  stars: number;
  description: string;
  userImage?: string;
  isVisible: boolean;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  // Animation Variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const cardItem = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  useEffect(() => {
    fetch("/api/reviews")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          // Filter only visible ones
          setReviews(data.filter((r) => r.isVisible));
        }
      })
      .catch(() => console.error("Failed to fetch reviews"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      {/* HEADER SECTION */}
      <section className="relative pt-32 pb-16 px-4 border-b border-white/5 overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(234,88,12,0.05)_0%,transparent_70%)] pointer-events-none" />
        
        <div className="container mx-auto max-w-5xl relative z-10">
          <Link href="/">
            <Button variant="ghost" className="mb-8 text-zinc-500 hover:text-white transition-colors gap-2 text-xs uppercase tracking-widest p-0">
              <ChevronLeft size={14} /> Back to Home
            </Button>
          </Link>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <Badge className="bg-orange-500 text-white text-[10px] uppercase font-black tracking-[0.2em] px-4 py-1 italic border-none">
              The Wall of Fame
            </Badge>
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic leading-none">
              Client <span className="text-orange-600 text-outline">Stories</span>
            </h1>
            <p className="max-w-xl text-zinc-500 text-sm md:text-base uppercase tracking-wide font-medium">
              Real talk from the people who trust us with their skin. Every drop of ink and every piercing tells a story.
            </p>
          </motion.div>
        </div>
      </section>

      {/* REVIEWS GRID */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-40 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-orange-600 opacity-50" />
              <p className="text-xs uppercase font-black tracking-[0.3em] text-zinc-600">Retrieving Archive...</p>
            </div>
          ) : (
            <>
              {reviews.length > 0 ? (
                <motion.div
                  variants={container}
                  initial="hidden"
                  animate="show"
                  className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6"
                >
                  {reviews.map((item) => (
                    <motion.div key={item._id} variants={cardItem} className="break-inside-avoid">
                      <Card className="group relative overflow-hidden border-white/5 bg-zinc-900/40 p-6 transition-all duration-300 hover:border-orange-600/30 hover:bg-zinc-900/60">
                        <Quote className="absolute top-4 right-4 h-10 w-10 text-white/[0.03] transition-colors group-hover:text-orange-600/10" />

                        <div className="relative z-10">
                          {/* Rating Stars */}
                          <div className="mb-4 flex gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={10}
                                className={i < item.stars ? "fill-orange-600 text-orange-600" : "text-white/10"}
                              />
                            ))}
                          </div>

                          {/* Testimonial Content */}
                          <p className="text-sm md:text-base leading-relaxed text-zinc-200 italic font-medium mb-6">
                            &quot;{item.description}&quot;
                          </p>

                          {/* User Info */}
                          <div className="flex items-center gap-3 border-t border-white/5 pt-5">
                            <div className="relative">
                              <img
                                src={item.userImage || "https://avatar.iran.liara.run/public"}
                                alt={item.name}
                                className="w-9 h-9 rounded-full border border-white/10 grayscale group-hover:grayscale-0 transition-all duration-500 object-cover"
                              />
                              <div className="absolute -bottom-1 -right-1 bg-orange-600 rounded-full p-1">
                                <MessageSquareQuote size={7} className="text-white" />
                              </div>
                            </div>
                            <div>
                              <h4 className="text-white text-xs font-black uppercase tracking-widest">
                                {item.name}
                              </h4>
                              <p className="text-zinc-600 text-[8px] uppercase font-black tracking-tighter">
                                Verified Junkie • Customer
                              </p>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <div className="text-center py-20">
                  <p className="text-zinc-500 uppercase tracking-widest text-sm italic">No stories found yet. Be the first?</p>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* CTA FOOTER */}
      <section className="py-24 border-t border-white/5 bg-zinc-950 relative overflow-hidden">
        {/* Decorative background text */}
        <div className="absolute -bottom-4 -right-4 text-white/[0.02] text-9xl font-black uppercase italic pointer-events-none select-none">
          Social
        </div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto"
          >
            <h3 className="text-3xl md:text-4xl font-black uppercase italic mb-4 tracking-tighter">
              Want more <span className="text-orange-600">Proof?</span>
            </h3>
            <p className="text-zinc-500 text-sm uppercase tracking-[0.2em] mb-10 font-medium">
              Check out our community and recent works on social media.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {/* PRIMARY ACTION: FACEBOOK */}
              <a 
                href="https://www.facebook.com/junkypiercing/reviews/?id=100070663572121&sk=reviews" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full sm:w-auto"
              >
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-8 py-7 rounded-none font-black uppercase tracking-widest italic group transition-all"
                >
                  See All Reviews on Facebook
                  <ArrowRight className="ml-2 group-hover:translate-x-2 transition-transform" />
                </Button>
              </a>

              {/* SECONDARY ACTION: BOOKING */}
              <Link href="/bookings" className="w-full sm:w-auto">
                <Button 
                  variant="outline"
                  className="w-full border-white/10 hover:border-orange-600 hover:bg-orange-600/10 text-white px-8 py-7 rounded-none font-black uppercase tracking-widest italic transition-all"
                >
                  Book Your Session
                </Button>
              </Link>
            </div>

            <p className="mt-8 text-[10px] text-zinc-600 uppercase tracking-[0.3em] font-bold">
              Join 1,000+ satisfied junkies
            </p>
          </motion.div>
        </div>
      </section>
    </main>
  );
}