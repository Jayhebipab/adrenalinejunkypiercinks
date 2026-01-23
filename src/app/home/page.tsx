"use client"

import React, { useState, useEffect } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card";
import {
  Star,
  ArrowRight,
  PlayCircle,
  Mail,
  Phone,
  Facebook,
  Instagram,
  ChevronRight,
  ShoppingBag,
  Syringe,
  Sparkles,
  X,
  ChevronLeft,
  MessageSquareQuote,
  Quote,
  Loader2,
  Calendar, ArrowUpRight
} from "lucide-react"
import Swal from "sweetalert2"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Navbar } from "../components/navigation/navbar"
import { Footer } from "../components/navigation/footer"
import FloatingChatWidget from "../components/chatbot"
// ---------- TYPES ----------
interface GalleryItem {
  _id: string
  image: string
  placement: string
  category?: string
  name?: string
  price?: number | string
}

interface Review {
  _id: string;
  name: string;
  stars: number;
  description: string;
  userImage?: string;
  isVisible: boolean;
}

// Sample Data para sa mga Blogs/Posts niyo
const blogPosts = [
  {
    id: 1,
    category: "Event",
    title: "Wedding Tattoo Sponsoring: A New Trend",
    date: "Jan 15, 2024",
    image: "/images/blog1.png", // Palitan niyo ng actual images
    link: "#"
  },
  {
    id: 2,
    category: "Studio News",
    title: "New Artist Alert: Guest Session this Feb",
    date: "Jan 20, 2024",
    image: "/images/blog2.png",
    link: "#"
  },
  {
    id: 3,
    category: "Maintenance",
    title: "Tattoo Aftercare: The Ultimate Guide",
    date: "Jan 22, 2024",
    image: "/images/blog3.png",
    link: "#"
  }
];
// ---------- LIGHTBOX / IMAGE MODAL ----------
const ImageModal = ({
  images,
  currentIndex,
  onClose,
}: {
  images: string[]
  currentIndex: number
  onClose: () => void
}) => {
  const [index, setIndex] = useState(currentIndex)

  const prev = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setIndex((i) => (i - 1 + images.length) % images.length)
  }
  const next = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setIndex((i) => (i + 1) % images.length)
  }

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowLeft") prev()
      if (e.key === "ArrowRight") next()
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [images])

  return (
    <div 
      className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-6 backdrop-blur-md"
      onClick={onClose}
    >
      <div 
        className="relative max-w-xl w-full flex flex-col items-center" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute -top-12 right-0 text-white/70 hover:text-red-500 transition-colors"
        >
          <X size={32} />
        </button>

        {/* Main Image Container */}
        <div className="relative w-full aspect-square md:aspect-[4/5] bg-zinc-900 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
          <img
            src={images[index]}
            className="w-full h-full object-contain"
            alt="Art Gallery Preview"
          />

          {/* Navigation Controls inside the box for mobile friendliness */}
          <div className="absolute inset-y-0 left-0 flex items-center">
             <button onClick={prev} className="p-2 ml-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition-all">
                <ChevronLeft size={24} />
             </button>
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center">
             <button onClick={next} className="p-2 mr-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition-all">
                <ChevronRight size={24} />
             </button>
          </div>
        </div>

        {/* Image Counter */}
        <div className="mt-4 px-4 py-1 bg-white/5 border border-white/10 rounded-full">
           <p className="text-[10px] text-zinc-400 font-mono">
             {index + 1} / {images.length}
           </p>
        </div>
      </div>
    </div>
  )
}
// ---------- HERO ----------
const Hero = () => (
  <section id="home" className="relative flex min-h-[100vh] items-center justify-center overflow-hidden bg-black">
    <div
      className="absolute inset-0 bg-cover bg-center"
      style={{ backgroundImage: "url('/images/about2.jpeg')", backgroundPosition: "center 45%" }}
    >
      {/* BINABAWASAN ANG DILIM DITO: Mula 60/80/100, ginawa nating 30/40/60 */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/50 to-black/99"></div>
    </div>
    
    <div className="container relative z-10 text-center px-4">
      {/* ... rest of your code (buttons, h1, etc) stay the same ... */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9 }}
        className="space-y-6 md:space-y-8"
      >
        <p className="text-xs md:text-lg text-gray-300 uppercase tracking-[0.3em] font-medium">
          Adrenaline Junky Piercinks
        </p>

        <h1 className="text-4xl md:text-7xl font-black leading-tight tracking-tighter text-white uppercase">
          SERMON IS TEMPORARY,<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-orange-500 to-yellow-400">
            VANITY IS FOREVER!
          </span>
        </h1>


      </motion.div>
    </div>
  </section>
)

export const BlogSection = () => (
  <section id="blogs" className="relative py-20 md:py-32 bg-black border-y border-white/5 overflow-hidden">
    {/* Background Fire Glow */}
    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-600/5 blur-[120px] rounded-full pointer-events-none" />

    <div className="container mx-auto px-6 max-w-7xl relative z-10">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full">
            <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
            <span className="text-white uppercase text-[10px] tracking-[0.3em] font-black">
              Latest from the Studio
            </span>
          </div>
          <h2 className="text-4xl md:text-6xl font-black uppercase text-white tracking-tighter leading-none">
            Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-orange-500 to-yellow-400">Journal</span>
          </h2>
        </div>
        
        <Button variant="ghost" className="text-zinc-500 hover:text-white group p-0">
          VIEW ALL POSTS <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>

      {/* BLOG GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {blogPosts.map((post, idx) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            className="group relative flex flex-col"
          >
            {/* Image Container */}
            <div className="relative aspect-[16/10] overflow-hidden rounded-3xl border border-white/5 bg-zinc-900">
              <Image 
                src={post.image} 
                alt={post.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
              
              {/* Category Badge */}
              <div className="absolute top-4 left-4">
                <span className="bg-black/60 backdrop-blur-md border border-white/10 text-orange-500 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                  {post.category}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="pt-6 space-y-3">
              <div className="flex items-center text-zinc-500 text-[10px] uppercase tracking-widest font-bold">
                <Calendar className="mr-2 h-3 w-3 text-orange-600" />
                {post.date}
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-orange-500 transition-colors line-clamp-2">
                {post.title}
              </h3>
              
              <a 
                href={post.link} 
                className="inline-flex items-center text-xs font-black uppercase tracking-[0.2em] text-white pt-2 group/link"
              >
                Read Article 
                <div className="ml-2 p-1 rounded-full border border-white/10 group-hover/link:bg-orange-600 group-hover/link:border-orange-600 transition-all">
                  <ArrowUpRight className="h-3 w-3" />
                </div>
              </a>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);
// ---------- PIERCING GALLERY ----------
const GallerySection = ({ openModal }: { openModal: (imgs: string[], i: number) => void }) => {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/gallery")
      .then(res => res.json())
      .then(data => Array.isArray(data) ? setGalleryItems(data) : null)
      .finally(() => setLoading(false))
  }, [])

  return (
    <section id="gallery-section" className="py-20 bg-black px-6">
      {/* Nilakihan ang max-width mula 4xl patungong 6xl para mas malapad ang display */}
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12 space-y-4">

         <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-orange-400 to-yellow-400">
    The ART OF BODY PIERCINGS
  </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((_, idx) => (
              <div key={idx} className="aspect-[3/4] bg-zinc-900 rounded-2xl" />
            ))}
          </div>
        ) : (
          <>
            {/* GRID LOGIC: Gap-3 sa mobile, Gap-8 sa desktop para mas hinga ang images */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
              {galleryItems.slice(0, 6).map((item, idx) => (
                <motion.div
                  key={item._id}
                  whileHover={{ y: -10 }} // Aangat nang kaunti pag hino-hover sa desktop
                  whileTap={{ scale: 0.97 }}
                  className="group relative overflow-hidden rounded-2xl border border-white/5 aspect-[3/4] cursor-pointer shadow-2xl"
                  onClick={() => openModal(galleryItems.slice(0, 6).map(g => g.image), idx)}
                >
                  <img
                    src={item.image}
                    alt={item.placement}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  
                  {/* Overlay with Fire Gradient Border on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-6">
                    <p className="text-white text-xs md:text-sm font-black uppercase tracking-[0.2em] text-center bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg border-b-2 border-orange-500">
                      {item.placement}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <div className="mt-12 flex justify-center">
              <Button 
                variant="ghost" 
                className="text-zinc-400 hover:text-white transition-all group"
              >
                <span className="text-[11px] font-black uppercase tracking-[0.3em] flex items-center">
                  See More Piercings 
                  <ChevronRight size={16} className="ml-2 group-hover:translate-x-2 transition-transform text-orange-500" />
                </span>
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
// ---------- TATTOO SECTION ----------
const TattooSection = ({ openModal }: { openModal: (imgs: string[], i: number) => void }) => {
  const [tattoos, setTattoos] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/tattoo")
      .then(res => res.json())
      .then(data => Array.isArray(data) ? setTattoos(data) : null)
      .finally(() => setLoading(false))
  }, [])

  return (
    <section id="tattoo-section" className="py-20 bg-zinc-950 px-6">
      {/* Nilakihan sa max-w-6xl para bumuka ang grid sa desktop */}
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12 space-y-4">
          {/* Fire Gradient Badge */}
         <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-orange-400 to-yellow-400">
    The ART OF BODY TATTOO
  </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((_, idx) => (
              <div key={idx} className="aspect-[3/4] bg-zinc-900 rounded-2xl" />
            ))}
          </div>
        ) : (
          <>
            {/* GRID LOGIC: Nilakihan ang gap sa md:gap-8 */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
              {/* Slice 0, 6 para punan ang 3 columns sa desktop */}
              {tattoos.slice(0, 6).map((item, idx) => (
                <motion.div
                  key={item._id}
                  whileHover={{ y: -10 }} // Float effect pag hover
                  whileTap={{ scale: 0.97 }}
                  className="group relative overflow-hidden rounded-2xl border border-white/5 aspect-[3/4] cursor-pointer shadow-2xl"
                  onClick={() => openModal(tattoos.slice(0, 6).map(t => t.image), idx)}
                >
                  <img
                    src={item.image}
                    alt={item.placement}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  
                  {/* Fire Gradient Bottom Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-6">
                    <p className="text-white text-xs md:text-sm font-black uppercase tracking-[0.2em] text-center bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg border-b-2 border-orange-500">
                      {item.placement}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-12 flex justify-center">
              <Button 
                variant="ghost" 
                className="text-zinc-400 hover:text-white transition-all group"
              >
                <span className="text-[11px] font-black uppercase tracking-[0.3em] flex items-center">
                  See More Tattoos 
                  <ChevronRight size={16} className="ml-2 group-hover:translate-x-2 transition-transform text-yellow-500" />
                </span>
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
export const ReviewsSection = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const cardItem = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

  useEffect(() => {
    fetch("/api/reviews")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          // Filter lang ang Visible
          setReviews(data.filter((r) => r.isVisible));
        }
      })
      .catch(() => console.error("Failed to fetch reviews"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section id="reviews-section" className="py-20 bg-zinc-950 px-4 border-t border-white/5 overflow-hidden">
      <div className="container mx-auto max-w-5xl">
        
        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-16 space-y-4"
        >
          <Badge className="bg-white text-black text-[10px] uppercase font-black tracking-[0.2em] px-4 py-1 italic">
            Testimonials
          </Badge>
          <h2 className="text-3xl md:text-5xl font-black uppercase text-white tracking-tighter italic">
            Client <span className="text-orange-600">Stories</span>
          </h2>
          <p className="mx-auto max-w-xl text-zinc-500 text-xs md:text-sm uppercase tracking-wide font-medium">
            Trusted by junkies for exceptional ink and precision piercing results.
          </p>
        </motion.div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-orange-600 opacity-50" />
            <p className="text-[10px] uppercase font-black tracking-widest text-zinc-600">Loading Stories...</p>
          </div>
        ) : (
          <>
            <motion.div
              variants={container}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="grid gap-6 grid-cols-1 md:grid-cols-2"
            >
              {reviews.slice(0, 4).map((item, idx) => (
                <motion.div key={item._id} variants={cardItem}>
                  <Card className="group relative h-full overflow-hidden border-white/5 bg-zinc-900/40 p-6 md:p-8 transition-all duration-300 hover:border-orange-600/30 hover:bg-zinc-900/60">
                    {/* Background Quote Icon */}
                    <Quote className="absolute top-4 right-4 h-12 w-12 text-white/[0.03] transition-colors group-hover:text-orange-600/10" />

                    <div className="relative z-10 flex flex-col h-full justify-between">
                      <div>
                        {/* Rating Stars */}
                        <div className="mb-6 flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={12}
                              className={i < item.stars ? "fill-orange-600 text-orange-600" : "text-zinc-800"}
                            />
                          ))}
                        </div>

                        {/* Testimonial Content */}
                        <p className="text-sm md:text-base leading-relaxed text-zinc-400 italic font-medium mb-8">
                          &quot;{item.description}&quot;
                        </p>
                      </div>

                      {/* User Info */}
                      <div className="flex items-center gap-4 border-t border-white/5 pt-6">
                        <div className="relative">
                          <img
                            src={item.userImage || "https://avatar.iran.liara.run/public"}
                            alt={item.name}
                            className="w-10 h-10 rounded-full border border-white/10 grayscale group-hover:grayscale-0 transition-all duration-500 object-cover"
                          />
                          <div className="absolute -bottom-1 -right-1 bg-orange-600 rounded-full p-1">
                            <MessageSquareQuote size={8} className="text-white" />
                          </div>
                        </div>
                        <div>
                          <h4 className="text-white text-xs md:text-sm font-black uppercase tracking-widest">
                            {item.name}
                          </h4>
                          <p className="text-zinc-600 text-[9px] uppercase font-black tracking-tighter">
                            Verified Junkie • Customer
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            {/* FOOTER ACTION */}
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              className="mt-12 flex justify-center"
            >
              <Button 
                variant="ghost" 
                className="group text-zinc-500 hover:text-orange-600 text-[10px] uppercase font-black tracking-[0.3em] transition-all"
              >
                Read All Reviews 
                <ChevronRight size={14} className="ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
            </motion.div>
          </>
        )}
      </div>
    </section>
  );
};
// ---------- PRODUCTS SECTION ----------
const ProductSection = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setProducts(data);
      })
      .catch((err) => console.error("Error fetching products:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section id="shop" className="py-20 bg-black px-6">
      <div className="container mx-auto max-w-5xl">
        <div className="flex flex-col items-center text-center mb-12 space-y-3">
          <Badge className="bg-yellow-500 text-black px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest">
            Premium Supplies
          </Badge>
          <div className="space-y-1">
            <h2 className="text-3xl md:text-5xl font-black uppercase text-white tracking-tighter italic">
              Aftercare & <span className="text-yellow-500">Jewelry</span>
            </h2>
            <p className="text-zinc-500 text-[10px] md:text-xs uppercase tracking-[0.3em] font-bold">
              High-Quality Piercings • Balms • Studio Merch
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-square bg-zinc-900 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
              {products.slice(0, 3).map((product) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="group relative bg-zinc-900/30 border border-white/5 rounded-[2rem] p-3 md:p-4 hover:border-yellow-500/30 transition-all duration-500"
                >
                  {/* Product Category Tag */}
                  <div className="absolute top-6 left-6 z-10">
                    <span className="bg-black/60 backdrop-blur-md text-white text-[8px] font-black px-2 py-1 rounded-lg border border-white/10 uppercase tracking-tighter">
                      {product.category || "Item"}
                    </span>
                  </div>

                  <div className="relative aspect-square overflow-hidden rounded-[1.2rem] mb-4 bg-zinc-800">
                    <img
                      src={product.image || "/images/placeholder.jpg"}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button className="bg-white text-black hover:bg-yellow-500 font-bold rounded-full text-xs h-9 px-4">
                        <ShoppingBag className="mr-1.5 h-3 w-3" /> Buy Now
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1 px-1">
                    <h3 className="text-sm md:text-base font-bold text-white uppercase tracking-tight truncate">
                      {product.name}
                    </h3>
                    <div className="flex justify-between items-center">
                      <p className="text-zinc-500 text-[9px] md:text-[10px] uppercase font-bold tracking-widest">
                        Available In-Store
                      </p>
                      <span className="text-yellow-500 font-black text-sm md:text-base">
                        ₱{product.cost_price}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-12 flex justify-center">
              <Button 
                variant="outline" 
                className="group rounded-full px-8 h-12 border-white/10 hover:border-yellow-500 text-white hover:bg-transparent"
              >
                <span className="flex items-center text-[10px] font-black uppercase tracking-[0.2em]">
                  Browse All Items 
                  <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  );
};
// ---------- MAIN PAGE ----------
export default function Dashboard() {
  const [modalOpen, setModalOpen] = useState(false)
  const [modalImages, setModalImages] = useState<string[]>([])
  const [modalIndex, setModalIndex] = useState(0)
  
  const openModal = (imgs: string[], i: number) => {
    setModalImages(imgs)
    setModalIndex(i)
    setModalOpen(true)
  }

  

  return (
    <div className="bg-black text-white selection:bg-yellow-400/30 font-sans">
      <Navbar />

      {modalOpen && (
        <ImageModal
          images={modalImages}
          currentIndex={modalIndex}
          onClose={() => setModalOpen(false)}
        />
      )}

      <main>
        <Hero />
        <BlogSection />
        
        <GallerySection openModal={openModal} />
        <TattooSection openModal={openModal} />
        <ProductSection/>
        <ReviewsSection/>
      </main>
      <FloatingChatWidget/>
      <Footer />
    </div>
  )
}
