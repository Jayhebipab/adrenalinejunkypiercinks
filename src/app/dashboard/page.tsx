"use client"
import { motion } from "framer-motion"
import { ShoppingBag, ArrowRight, MapPin, Clock, Phone, Instagram, Twitter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Navbar } from "../components/navigation/navbar"
import { Footer } from "../components/navigation/footer"

// --- Sections ---

const Hero = () => (
  <section id="home" className="relative flex min-h-screen items-center justify-center overflow-hidden pt-20">
    <div
      className="absolute inset-0 -z-20"
      style={{
        backgroundImage: 'url("image/about2.jpeg")',
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    />
    <div className="absolute inset-0 -z-10 bg-black/60" />

    <div className="container relative z-10 px-4 text-center">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
        <Badge variant="outline" className="mb-4 px-4 py-1 text-sm uppercase tracking-widest bg-primary/5">
          The Premier Tattoo Studio
        </Badge>
        <h1 className="mb-6 text-5xl font-extrabold tracking-tight md:text-7xl lg:text-8xl">
          YOUR BODY IS <br />
          <span className="text-primary">A CANVAS.</span>
        </h1>
        <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground">
          Eksperto sa custom designs, portraiture, at traditional styles. Gawing sining ang iyong kwento kasama ang
          aming award-winning artists.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button size="lg" className="h-14 rounded-full px-8 text-lg shadow-lg shadow-primary/20">
            View Gallery <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-14 rounded-full px-8 text-lg border-primary/20 hover:bg-primary/5 bg-transparent"
          >
            Our Artists
          </Button>
        </div>
      </motion.div>
    </div>
    <div className="absolute top-1/2 left-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-[120px]" />
  </section>
)

const Gallery = () => (
  <section id="gallery" className="py-24 bg-zinc-950/50">
    <div className="container mx-auto px-4">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold mb-4">Featured Gallery</h2>
        <div className="h-1 w-20 bg-primary mx-auto rounded-full" />
      </div>
      <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <motion.div
            key={item}
            className="relative overflow-hidden rounded-2xl bg-zinc-800 break-inside-avoid group cursor-pointer"
            whileHover={{ scale: 1.02 }}
          >
            <div
              className={`w-full bg-zinc-700/50 ${item % 2 === 0 ? "h-64" : "h-80"} flex items-center justify-center`}
            >
              <span className="text-zinc-500 text-xs">Portfolio Image {item}</span>
            </div>
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <p className="text-white font-bold tracking-widest uppercase text-sm">View Work</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
)

const Artists = () => {
  const artists = [
    { name: "Marco 'Ink' Cruz", role: "Realism Expert" },
    { name: "Elena Black", role: "Traditional Style" },
    { name: "Juno Reyes", role: "Fine Line" },
  ]

  return (
    <section id="artists" className="py-24">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold mb-12 text-center">Master Artists</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {artists.map((artist, i) => (
            <motion.div key={i} whileHover={{ y: -10 }}>
              <Card className="relative overflow-hidden border-none group bg-zinc-900/50">
                <div className="aspect-[3/4] bg-muted flex items-center justify-center text-zinc-500">Artist Photo</div>
                <div className="absolute bottom-0 p-6 w-full bg-gradient-to-t from-black to-transparent">
                  <h3 className="text-xl font-bold text-white">{artist.name}</h3>
                  <p className="text-primary text-sm mb-4">{artist.role}</p>
                  <div className="flex gap-3 text-white/70">
                    <Instagram className="h-4 w-4 hover:text-primary cursor-pointer" />
                    <Twitter className="h-4 w-4 hover:text-primary cursor-pointer" />
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

const ContactUs = () => (
  <section id="contact" className="py-24 bg-card/30">
    <div className="container mx-auto px-4">
      <div className="grid lg:grid-cols-2 gap-12">
        <div>
          <h2 className="text-4xl font-bold mb-6">Start Your Journey</h2>
          <p className="text-muted-foreground mb-10 text-lg">
            May idea ka na ba? Pag-usapan natin ang susunod mong tattoo.
          </p>
          <div className="space-y-6">
            <div className="flex gap-4 items-start">
              <div className="bg-primary/10 p-3 rounded-lg text-primary">
                <MapPin />
              </div>
              <div>
                <h4 className="font-bold">Studio Location</h4>
                <p className="text-muted-foreground text-sm">Metro Manila, Philippines</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="bg-primary/10 p-3 rounded-lg text-primary">
                <Clock />
              </div>
              <div>
                <h4 className="font-bold">Hours</h4>
                <p className="text-muted-foreground text-sm">Tue - Sun: 11AM - 8PM</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="bg-primary/10 p-3 rounded-lg text-primary">
                <Phone />
              </div>
              <div>
                <h4 className="font-bold">Phone</h4>
                <p className="text-muted-foreground text-sm">+63 912 345 6789</p>
              </div>
            </div>
          </div>
        </div>
        <Card className="p-8 border-border/50 bg-background/50 backdrop-blur-sm">
          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input placeholder="Name" className="h-12 bg-background/50" />
              <Input placeholder="Email" type="email" className="h-12 bg-background/50" />
            </div>
            <Input placeholder="Subject" className="h-12 bg-background/50" />
            <Textarea placeholder="Describe your tattoo idea..." className="min-h-[120px] bg-background/50" />
            <Button className="w-full h-12 text-lg font-bold">Book Appointment</Button>
          </form>
        </Card>
      </div>
    </div>
  </section>
)

const Shop = () => {
  const products = [
    { name: "Aftercare Balm", price: "₱450", tag: "Best Seller" },
    { name: "Ink & Art Tee", price: "₱899", tag: "Merch" },
    { name: "Gift Voucher", price: "₱1,000", tag: "Gift" },
  ]

  return (
    <section id="shop" className="py-24">
      <div className="container mx-auto px-4">
        <div className="mb-12 flex items-end justify-between">
          <div>
            <h2 className="text-4xl font-bold">Ink Shop</h2>
            <p className="text-muted-foreground">Aftercare and Apparel.</p>
          </div>
          <Button variant="ghost">
            View All <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((item, i) => (
            <motion.div key={i} whileHover={{ y: -5 }}>
              <Card className="overflow-hidden border-border/50 bg-card/50">
                <div className="aspect-square bg-muted flex items-center justify-center">
                  <ShoppingBag className="h-12 w-12 opacity-20" />
                </div>
                <div className="p-6">
                  <Badge className="mb-2 bg-primary/20 text-primary hover:bg-primary/30 border-none">{item.tag}</Badge>
                  <h3 className="text-xl font-bold">{item.name}</h3>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-lg font-semibold">{item.price}</span>
                    <Button size="sm">Add to Cart</Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// --- Main Page ---

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      <Navbar />
      <main>
        <Hero />
        <Gallery />
        <Artists />
        <Shop />
        <ContactUs />
      </main>
      <Footer />
    </div>
  )
}
