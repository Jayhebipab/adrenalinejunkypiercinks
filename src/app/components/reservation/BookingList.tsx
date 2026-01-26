"use client";

import React, { useEffect, useState } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Loader2, Eye, User, Calendar, Camera, RotateCcw, 
  CheckCircle2, PhilippinePeso, Hammer, Mail, Phone
} from "lucide-react";
import { toast } from "sonner";

interface Booking {
  _id: string;
  name: string;
  artist: string;
  service: string;
  preferredDate: string;
  preferredTime?: string;
  status: string;
  image?: string;
  email: string;
  phone: string;
  message?: string;
}

export default function TattooGallery() {
  const [items, setItems] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  const [price, setPrice] = useState("");
  const [equipments, setEquipments] = useState("");
  const [openFinishDialog, setOpenFinishDialog] = useState<string | null>(null);

  const fetchConfirmed = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bookings');
      const data = await res.json();
      const approved = (data.bookings || []).filter((b: Booking) => b.status === 'approved');
      setItems(approved);
    } catch (error) {
      toast.error("Failed to load records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchConfirmed(); }, []);

  const updateStatus = async (id: string, newStatus: string, extraData = {}) => {
    if (newStatus === "finished" && (!price || !equipments)) {
      toast.error("Please fill up Price and Equipments used.");
      return;
    }

    setUpdating(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus, ...extraData }),
      });

      if (res.ok) {
        toast.success(`Project moved to ${newStatus}`);
        setPrice("");
        setEquipments("");
        setOpenFinishDialog(null);
        fetchConfirmed();
      }
    } catch (error) {
      toast.error("Update failed");
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) return <div className="flex h-60 items-center justify-center"><Loader2 className="animate-spin text-zinc-300" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black italic uppercase tracking-tighter text-zinc-900">Active Projects</h2>
        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Ongoing Sessions & Masterpieces</p>
      </div>

      <div className="border border-zinc-100 rounded-[2rem] overflow-hidden bg-white shadow-sm">
        <Table>
          <TableHeader className="bg-zinc-50/50">
            <TableRow className="hover:bg-transparent border-zinc-100">
              <TableHead className="font-black uppercase text-[10px] tracking-widest text-zinc-400">Client / Service</TableHead>
              <TableHead className="font-black uppercase text-[10px] tracking-widest text-zinc-400">Artist</TableHead>
              <TableHead className="font-black uppercase text-[10px] tracking-widest text-zinc-400 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item._id} className="group border-zinc-50 hover:bg-zinc-50/30 transition-colors">
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-black uppercase text-sm text-zinc-900">{item.name}</span>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">{item.service}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="rounded-none font-black uppercase text-[9px] px-2 border-zinc-200">{item.artist}</Badge>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  
                  {/* --- VIEW INFO DIALOG (FIXED WITH DIALOGTITLE) --- */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-zinc-100 text-zinc-600">
                        <Eye className="size-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl bg-white">
                        <DialogHeader className="bg-zinc-900 p-6 text-left">
                            <DialogTitle className="font-black uppercase italic text-xl tracking-tighter text-white">Project Details</DialogTitle>
                            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Reference ID: {item._id.slice(-6)}</p>
                        </DialogHeader>
                        <div className="p-8 space-y-6">
                            {item.image && (
                                <div className="aspect-video w-full rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-100 shadow-inner">
                                    <img src={item.image} alt="Reference" className="w-full h-full object-cover" />
                                </div>
                            )}
                            <div className="grid grid-cols-1 gap-4 text-sm">
                                <div className="flex items-center gap-3 font-black uppercase tracking-tighter text-zinc-800">
                                    <User className="size-4 text-orange-600" /> {item.name}
                                </div>
                                <div className="flex items-center gap-3 text-zinc-500 font-bold uppercase text-[11px]">
                                    <Mail className="size-4" /> {item.email}
                                </div>
                                <div className="flex items-center gap-3 text-zinc-500 font-bold uppercase text-[11px]">
                                    <Phone className="size-4" /> {item.phone}
                                </div>
                                <div className="flex items-center gap-3 text-zinc-500 font-bold uppercase text-[11px]">
                                    <Calendar className="size-4 text-orange-600" /> {formatDate(item.preferredDate)} @ {item.preferredTime}
                                </div>
                                {item.message && (
                                    <div className="p-4 bg-zinc-50 rounded-2xl text-[11px] text-zinc-500 italic border border-zinc-100">
                                        "{item.message}"
                                    </div>
                                )}
                            </div>
                        </div>
                    </DialogContent>
                  </Dialog>

                  {/* REVERT BUTTON */}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => updateStatus(item._id, "pending")}
                    className="h-8 w-8 p-0 rounded-full hover:bg-orange-50 text-orange-600"
                  >
                    <RotateCcw className="size-4" />
                  </Button>

                  {/* --- FINISH DIALOG --- */}
                  <Dialog open={openFinishDialog === item._id} onOpenChange={(open) => setOpenFinishDialog(open ? item._id : null)}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="h-8 bg-zinc-900 hover:bg-emerald-600 text-white font-black uppercase text-[10px] px-4 rounded-full">
                        <CheckCircle2 className="size-3 mr-1.5" /> Finish
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md rounded-[2.5rem] p-8 bg-white border-none shadow-2xl">
                      <DialogHeader>
                        <div className="size-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 className="size-6" />
                        </div>
                        <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">Session Complete</DialogTitle>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase">Closing project for {item.name}</p>
                      </DialogHeader>
                      
                      <div className="space-y-4 py-6">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase flex items-center gap-2">
                            <PhilippinePeso className="size-3 text-emerald-500"/> Final Price <span className="text-red-500">*</span>
                          </Label>
                          <Input 
                            placeholder="e.g. 2500" 
                            type="number"
                            className="rounded-xl border-zinc-100 h-12 font-bold"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase flex items-center gap-2">
                            <Hammer className="size-3 text-emerald-500"/> Materials Used <span className="text-red-500">*</span>
                          </Label>
                          <Textarea 
                            placeholder="Needles, Inks, Aftercare..." 
                            className="rounded-2xl border-zinc-100 min-h-[100px] text-xs"
                            value={equipments}
                            onChange={(e) => setEquipments(e.target.value)}
                          />
                        </div>
                      </div>

                      <DialogFooter>
                        <Button 
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-black uppercase tracking-widest text-xs h-12"
                          disabled={updating || !price || !equipments}
                          onClick={() => updateStatus(item._id, "finished", { finalPrice: price, inventoryUsed: equipments })}
                        >
                          {updating ? <Loader2 className="animate-spin" /> : "Verify & Close Project"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}