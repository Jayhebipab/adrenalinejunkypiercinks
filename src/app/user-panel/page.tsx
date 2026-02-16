"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Star, Send, MessageSquare, Package, Calendar, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function UserPanel() {
  const { data: session } = useSession();
  const [rating, setRating] = useState(5);
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(false);

  // Dito natin ilalagay yung data galing sa database mamaya
  const [bookings, setBookings] = useState([]);
  const [orders, setOrders] = useState([]);

  const submitReview = async () => {
    if (!desc) return alert("Pakilagay ang iyong karanasan!");
    setLoading(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: session?.user?.name,
          stars: rating,
          description: desc,
          userEmail: session?.user?.email,
          userImage: session?.user?.image
        }),
      });
      if (res.ok) {
        alert("Review submitted!");
        setDesc("");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-10 space-y-10">
      
      {/* HEADER SECTION - USER INFO */}
      <header className="flex flex-col md:flex-row items-center justify-between gap-6 bg-zinc-900/50 p-8 rounded-3xl border border-zinc-800">
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 rounded-full overflow-hidden border-2 border-red-600">
            <img src={session?.user?.image || "/api/placeholder/80/80"} alt="Profile" className="object-cover w-full h-full" />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter italic text-white">
              Welcome back, {session?.user?.name?.split(' ')[0]}!
            </h1>
            <p className="text-zinc-400 text-sm font-mono">{session?.user?.email}</p>
          </div>
        </div>
        <div className="flex gap-3">
            <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                Edit Profile
            </Button>
        </div>
      </header>

      {/* MAIN CONTENT TABS */}
      <Tabs defaultValue="bookings" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-black border border-zinc-800 h-16 p-1 mb-8">
          <TabsTrigger value="bookings" className="data-[state=active]:bg-red-600 data-[state=active]:text-white uppercase font-bold text-xs">
            <Calendar size={16} className="mr-2" /> My Bookings
          </TabsTrigger>
          <TabsTrigger value="orders" className="data-[state=active]:bg-red-600 data-[state=active]:text-white uppercase font-bold text-xs">
            <Package size={16} className="mr-2" /> Orders
          </TabsTrigger>
          <TabsTrigger value="review" className="data-[state=active]:bg-red-600 data-[state=active]:text-white uppercase font-bold text-xs">
            <MessageSquare size={16} className="mr-2" /> Write Review
          </TabsTrigger>
        </TabsList>

        {/* BOOKINGS TAB */}
        <TabsContent value="bookings" className="space-y-4">
          <div className="grid gap-4">
            {bookings.length > 0 ? (
                bookings.map((booking: any) => (
                    <Card key={booking.id} className="bg-zinc-900 border-zinc-800 text-white">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg font-bold uppercase">{booking.service}</CardTitle>
                            <span className="px-3 py-1 bg-yellow-500/20 text-yellow-500 text-[10px] font-bold rounded-full uppercase">
                                {booking.status}
                            </span>
                        </CardHeader>
                        <CardContent>
                            <p className="text-zinc-400 text-sm italic">Scheduled for: {booking.date}</p>
                        </CardContent>
                    </Card>
                ))
            ) : (
                <div className="text-center py-20 border-2 border-dashed border-zinc-800 rounded-3xl">
                    <p className="text-zinc-500 uppercase font-black italic">No active bookings found.</p>
                </div>
            )}
          </div>
        </TabsContent>

        {/* ORDERS TAB */}
        <TabsContent value="orders" className="space-y-4">
           <div className="grid gap-4">
            {orders.length > 0 ? (
                orders.map((order: any) => (
                    <Card key={order.id} className="bg-zinc-900 border-zinc-800 text-white">
                        <CardContent className="p-6 flex justify-between items-center">
                            <div>
                                <p className="font-bold uppercase tracking-tight">Order #{order.id.slice(-6)}</p>
                                <p className="text-xs text-zinc-500">{order.items.length} items</p>
                            </div>
                            <div className="text-right">
                                <p className="text-red-500 font-black">₱{order.total}</p>
                                <p className="text-[10px] uppercase text-zinc-400">Paid via GCash</p>
                            </div>
                        </CardContent>
                    </Card>
                ))
            ) : (
                <div className="text-center py-20 border-2 border-dashed border-zinc-800 rounded-3xl">
                    <p className="text-zinc-500 uppercase font-black italic">No order history yet.</p>
                </div>
            )}
          </div>
        </TabsContent>

        {/* REVIEW TAB (Yung ginawa mo) */}
        <TabsContent value="review">
          <section className="bg-black text-white p-8 rounded-3xl shadow-2xl border border-zinc-800">
            <div className="flex items-center gap-3 mb-6">
              <MessageSquare className="text-red-600" />
              <h2 className="text-xl font-black uppercase tracking-tighter italic">Leave a Review</h2>
            </div>

            <div className="space-y-6">
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={24}
                    className={`cursor-pointer transition-all ${s <= rating ? "fill-yellow-400 text-yellow-400" : "text-zinc-700"}`}
                    onClick={() => setRating(s)}
                  />
                ))}
              </div>

              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Tell us about your masterpiece..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-sm focus:border-red-600 outline-none min-h-[120px] text-white"
              />

              <Button 
                onClick={submitReview}
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-[0.2em] py-6"
              >
                {loading ? "Submitting..." : "Post Review"} <Send size={16} className="ml-2" />
              </Button>
            </div>
          </section>
        </TabsContent>
      </Tabs>
      
    </div>
  );
}