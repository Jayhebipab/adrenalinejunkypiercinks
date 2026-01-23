"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Plus, Clock, User2 } from "lucide-react";

// Dynamic Import ng Calendar para iwas sa SSR errors
const Calendar = dynamic(
  async () => {
    const { Calendar } = await import("@/components/ui/calendar");
    return Calendar;
  },
  { ssr: false }
);

export default function AdminCalendarSidebar() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());

  // Halimbawang data - Pwede mong palitan ng real data mula sa API
  const bookings = [
    { id: 1, name: "Santi Ramos", time: "1:00 PM", type: "Tattoo" },
    { id: 2, name: "Maya Cruz", time: "4:30 PM", type: "Piercing" },
  ];

  return (
    <aside className="fixed right-0 top-0 h-screen w-[320px] border-l border-white/5 bg-zinc-950 flex flex-col hidden xl:flex z-30">
      {/* HEADER SECTION */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-orange-500 to-yellow-400">
            Reservations
          </h3>
          <div className="h-2 w-2 rounded-full bg-red-600 animate-ping" />
        </div>
        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">
          {date?.toDateString() || "Select Date"}
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-8">
          {/* THE CALENDAR */}
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-2xl border border-white/5 bg-zinc-900/50 p-3 shadow-2xl shadow-black"
              captionLayout="dropdown"
              classNames={{
                day_selected: "bg-red-600 text-white hover:bg-orange-600 rounded-lg",
                day_today: "bg-zinc-800 text-white rounded-lg",
                head_cell: "text-zinc-600 font-black uppercase text-[10px] w-9",
                day: "h-9 w-9 p-0 font-bold text-xs hover:bg-red-600/20 rounded-lg transition-all text-zinc-400",
              }}
            />
          </div>

          {/* LIST SECTION */}
          <div className="space-y-4 px-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Scheduled Today</span>
              <Badge className="bg-zinc-900 text-[9px] border-white/5 font-black uppercase tracking-tighter">
                {bookings.length} Slots
              </Badge>
            </div>

            <div className="grid gap-3">
              {bookings.map((b) => (
                <div key={b.id} className="group relative p-4 rounded-2xl bg-zinc-900/30 border border-white/5 hover:border-red-600/30 transition-all duration-300 cursor-pointer">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-xs font-black text-white uppercase group-hover:text-red-500 transition-colors leading-none">
                      {b.name}
                    </p>
                    <span className="text-[9px] font-black text-zinc-500 flex items-center gap-1">
                      <Clock size={10} /> {b.time}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">{b.type}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* FOOTER ACTION */}
      <div className="p-6 border-t border-white/5 bg-zinc-950">
        <button className="w-full flex items-center justify-center gap-2 py-4 rounded-full bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-gradient-to-r hover:from-red-600 hover:to-orange-500 hover:text-white transition-all active:scale-95 shadow-lg">
          <Plus size={14} strokeWidth={3} />
          Add Appointment
        </button>
      </div>
    </aside>
  );
}