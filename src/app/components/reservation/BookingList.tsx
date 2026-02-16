"use client";

import React, { useEffect, useState, useMemo } from 'react';
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
import { Calendar } from "@/components/ui/calendar";
import {
  Loader2, User, PhilippinePeso, Hammer, MinusCircle, PlusCircle,
  Calendar as CalendarIcon, Clock, CheckCircle2, Download, Image as ImageIcon, Maximize2
} from "lucide-react";
import { toast } from "sonner";

interface Booking {
  id: string;
  name: string;
  artist: string;
  service: string;
  preferredDate: string;
  preferredTime?: string;
  status: string;
  images?: string[];
  email: string;
  phone: string;
  finalPrice?: number;
}

export default function TattooGallery() {
  const [items, setItems] = useState<Booking[]>([]);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const [availableArtists, setAvailableArtists] = useState<any[]>([]);
  const [inventoryProducts, setInventoryProducts] = useState<any[]>([]);

  const [price, setPrice] = useState("");
  const [selectedArtist, setSelectedArtist] = useState("");
  const [productsUsed, setProductsUsed] = useState([{ name: "", quantity: 1 }]);
  const [openFinishDialog, setOpenFinishDialog] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fetchData = async () => {
    setLoading(true);
    try {
      const [resBookings, resArtists, resInv] = await Promise.all([
        fetch('/api/bookings'),
        fetch('/api/artists'),
        fetch('/api/products')
      ]);

      const dataBookings = await resBookings.json();
      const dataArtists = await resArtists.json();
      const dataInv = await resInv.json();

      const bookingsArray = dataBookings.bookings || dataBookings || [];
      setAllBookings(bookingsArray);
      setItems(bookingsArray.filter((b: Booking) => b.status === 'approved' || b.status === 'finished'));
      setAvailableArtists(Array.isArray(dataArtists) ? dataArtists : dataArtists.artists || []);
      setInventoryProducts(Array.isArray(dataInv) ? dataInv : dataInv.products || []);

    } catch (error) {
      toast.error("Failed to load resources");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);


  const handleDownload = async (imageUrl: string, fileName: string) => {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}-reference.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Download failed", error);
  }
};

  // TWIST: Logic para sa Red Dots sa Calendar
  const bookedDates = useMemo(() => {
    return items.map(b => new Date(b.preferredDate));
  }, [items]);

  // Filter table based sa click sa Calendar
  const filteredItems = useMemo(() => {
    if (!selectedDate) return items;
    return items.filter(item =>
      new Date(item.preferredDate).toDateString() === selectedDate.toDateString()
    );
  }, [items, selectedDate]);

  const addProductRow = () => setProductsUsed([...productsUsed, { name: "", quantity: 1 }]);
  const removeProductRow = (index: number) => setProductsUsed(productsUsed.filter((_, i) => i !== index));
  const updateProductRow = (index: number, field: string, value: any) => {
    const updated = [...productsUsed];
    updated[index] = { ...updated[index], [field]: value };
    setProductsUsed(updated);
  };

  const updateStatus = async (id: string, newStatus: string) => {
    const cleanedProducts = productsUsed.filter(p => p.name !== "");
    if (newStatus === "finished") {
      if (!price || !selectedArtist || cleanedProducts.length === 0) {
        toast.error("Please provide price, artist, and materials.");
        return;
      }
    }

    setUpdating(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status: newStatus,
          artist: selectedArtist,
          finalPrice: Number(price),
          inventoryUsed: cleanedProducts,
          finishedAt: new Date().toISOString()
        }),
      });

      if (res.ok) {
        toast.success(`Project closed successfully!`);
        setOpenFinishDialog(null);
        setPrice("");
        setSelectedArtist("");
        setProductsUsed([{ name: "", quantity: 1 }]);
        fetchData();
      }
    } catch (error) {
      toast.error("Update failed");
    } finally {
      setUpdating(false);
    }
  };

  const updateToPending = async (id: string) => {
    if (!confirm("Are you sure you want to move this project back to pending?")) return;

    setUpdating(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'pending' }),
      });

      if (res.ok) {
        toast.success("Project moved back to pending");
        fetchData();
      }
    } catch (error) {
      toast.error("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="flex h-60 items-center justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>;

  return (
    <div className="flex flex-col lg:flex-row gap-8 p-4">



      {/* MAIN CONTENT: TABLE SECTION */}
      <main className="flex-1 space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-4xl font-black italic uppercase tracking-tighter text-foreground leading-none">
              Active <span className="text-primary">Projects</span>
            </h2>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2">
              {selectedDate ? `Schedule for ${selectedDate.toDateString()}` : "Select a date to filter"}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setSelectedDate(undefined)} className="rounded-full text-[9px] font-black uppercase">
            View All
          </Button>
        </div>

        <div className="border border-border rounded-[2.5rem] overflow-hidden bg-card shadow-sm">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="font-black uppercase text-[10px] tracking-widest px-6 h-12">Client / Service</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-center">Status & Artist</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-right px-6">Action</TableHead>
              </TableRow>
            </TableHeader>
<TableBody>
  {filteredItems.length > 0 ? (
    filteredItems.map((item) => (
      <TableRow key={item.id} className="border-border group">
        {/* CLIENT & SERVICE INFO */}
        <TableCell className="px-6 py-4">
          <div className="flex flex-col">
            <span className="font-black uppercase text-sm text-foreground">{item.name}</span>
            <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase">
              <span>{item.service}</span>
              <span className="text-primary opacity-50">•</span>
              <span className="flex items-center gap-1"><Clock className="size-3"/> {item.preferredTime || "TBA"}</span>
            </div>
          </div>
        </TableCell>

        {/* STATUS & ASSIGNED ARTIST */}
        <TableCell className="text-center">
          <div className="flex flex-col items-center gap-1">
            {item.status === 'finished' ? (
              <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[9px] font-black uppercase italic">
                <CheckCircle2 className="size-3 mr-1"/> Finished
              </Badge>
            ) : (
              <Badge variant="outline" className="border-primary/20 text-primary text-[9px] font-black uppercase italic">
                Ongoing
              </Badge>
            )}
            {/* Displaying the Assigned Artist here */}
            <div className="flex items-center gap-1 text-[10px] font-black text-muted-foreground uppercase">
              <User className="size-2.5 text-primary opacity-50"/>
              {item.artist || "No Artist Assigned"}
            </div>
          </div>
        </TableCell>

        {/* ACTIONS SECTION */}
        <TableCell className="text-right px-6">
          <div className="flex justify-end items-center gap-2">
            
            {/* 1. INFO DIALOG (Tattoo Details & Reference) */}
{/* 1. INFO DIALOG (Tattoo Details & Reference) */}
<Dialog>
  <DialogTrigger asChild>
    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full hover:bg-muted text-muted-foreground transition-all">
      <User size={14} />
    </Button>
  </DialogTrigger>
  <DialogContent className="max-w-md rounded-[2.5rem] p-8 bg-popover border-border">
    <DialogHeader>
      <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">Project Details</DialogTitle>
    </DialogHeader>
    
    <div className="space-y-4 py-4">
      {/* Reference Image Container */}
      <div className="relative aspect-square w-full rounded-[2rem] bg-muted overflow-hidden border border-border group">
        {item.images && item.images.length > 0 ? (
          <>
            <img src={item.images[0]} alt="Reference" className="w-full h-full object-cover" />
            
            {/* OVERLAY ACTIONS */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <Button 
                onClick={() => setSelectedImage(item.images![0])} 
                className="bg-white text-black hover:bg-white/90 rounded-full h-10 w-10 p-0"
              >
                <Maximize2 size={18} />
              </Button>
              <Button 
                onClick={() => handleDownload(item.images![0], item.name)} 
                className="bg-primary text-white hover:bg-primary/90 rounded-full h-10 w-10 p-0"
              >
                <Download size={18} />
              </Button>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-[10px] font-black text-muted-foreground uppercase">
            <ImageIcon className="size-5 opacity-20"/>
            No Image
          </div>
        )}
      </div>
    </div>
  </DialogContent>
</Dialog>

{/* FULL IMAGE VIEW WITH DOWNLOAD */}
<Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
  <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/90 border-none flex items-center justify-center overflow-hidden">
    <div className="sr-only"><DialogTitle>Preview</DialogTitle></div>
    {selectedImage && (
      <div className="relative w-full h-full flex flex-col items-center justify-center p-4 gap-4">
        <img 
          src={selectedImage} 
          className="max-w-full max-h-[80vh] object-contain rounded-3xl shadow-2xl animate-in zoom-in-95 duration-300" 
          alt="Preview" 
        />
        
        <Button 
          onClick={() => handleDownload(selectedImage, "tattoo-ref")}
          className="bg-white text-black hover:bg-zinc-200 rounded-full font-black uppercase px-8 h-12 shadow-xl"
        >
          <Download className="mr-2 size-5" /> Download Reference
        </Button>
      </div>
    )}
  </DialogContent>
</Dialog>

            {item.status !== 'finished' ? (
              <>
                {/* 2. RESET TO PENDING BUTTON */}
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => updateToPending(item.id)}
                  className="h-8 text-[9px] font-black uppercase text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-full px-3"
                >
                  Reset
                </Button>

                {/* 3. FINISH SESSION DIALOG */}
                <Dialog open={openFinishDialog === item.id} onOpenChange={(open) => setOpenFinishDialog(open ? item.id : null)}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="h-8 bg-foreground text-background hover:bg-primary hover:text-white font-black uppercase text-[10px] rounded-full transition-all px-4">
                      Finish
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md rounded-[2.5rem] p-8 bg-popover font-mono">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">Close Project</DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-6 py-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2">
                          <User className="size-3 text-primary"/> Artist
                        </Label>
                        <select 
                          className="w-full bg-muted p-3 rounded-xl text-[12px] font-bold border border-border outline-none focus:ring-2 ring-primary/20 text-foreground"
                          value={selectedArtist}
                          onChange={(e) => setSelectedArtist(e.target.value)}
                        >
                          <option value="">Select Artist...</option>
                          {availableArtists.map(a => (
                            <option key={a.fullName} value={a.fullName}>{a.fullName}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2">
                          <PhilippinePeso className="size-3 text-primary"/> Final Price
                        </Label>
                        <Input 
                          type="number" 
                          className="rounded-xl h-12 font-bold bg-muted border-border" 
                          value={price} 
                          onChange={(e) => setPrice(e.target.value)} 
                        />
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2">
                            <Hammer className="size-3 text-primary"/> Materials
                          </Label>
                          <button onClick={addProductRow} className="text-primary hover:scale-110 transition-transform"><PlusCircle size={18}/></button>
                        </div>
                        <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                          {productsUsed.map((row, index) => (
                            <div key={index} className="flex gap-2 items-center animate-in slide-in-from-right-2">
                              <select 
                                className="flex-1 bg-muted p-2.5 rounded-lg text-[11px] font-bold border border-border text-foreground"
                                value={row.name}
                                onChange={(e) => updateProductRow(index, "name", e.target.value)}
                              >
                                <option value="">Item...</option>
                                {inventoryProducts.map(p => (
                                  <option key={p.id || p._id} value={p.name}>{p.name} ({p.stock || p.quantity})</option>
                                ))}
                              </select>
                              <input 
                                type="number" 
                                className="w-14 bg-muted border border-border p-2.5 rounded-lg text-center text-[11px] font-black text-foreground"
                                value={row.quantity}
                                onChange={(e) => updateProductRow(index, "quantity", Number(e.target.value))}
                              />
                              <button onClick={() => removeProductRow(index)} className="text-muted-foreground hover:text-destructive"><MinusCircle size={16}/></button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button 
                        className="w-full bg-primary hover:bg-primary/90 text-white rounded-full font-black uppercase h-12 shadow-lg active:scale-95 transition-all"
                        disabled={updating}
                        onClick={() => updateStatus(item.id, "finished")}
                      >
                        {updating ? <Loader2 className="animate-spin" /> : "Verify & Complete"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            ) : (
              <div className="flex flex-col items-end">
                <span className="text-emerald-500 font-black text-[10px] uppercase italic">Paid & Closed</span>
                <span className="text-xs font-bold text-muted-foreground">₱{item.finalPrice?.toLocaleString()}</span>
              </div>
            )}
          </div>
        </TableCell>
      </TableRow>
    ))
  ) : (
    <TableRow>
      <TableCell colSpan={3} className="h-40 text-center">
        <div className="flex flex-col items-center justify-center opacity-20">
          <CalendarIcon className="size-10 mb-2"/>
          <p className="text-[10px] font-black uppercase tracking-widest">No Projects Found</p>
        </div>
      </TableCell>
    </TableRow>
  )}
</TableBody>
          </Table>
        </div>
      </main>
      {/* SIDEBAR: CALENDAR SECTION */}
      <aside className="w-full lg:w-80 space-y-6">
        <div className="bg-card border border-border rounded-[2.5rem] p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4 px-2">
            <CalendarIcon className="size-4 text-primary" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Booking Map</h3>
          </div>

          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            modifiers={{
              booked: bookedDates
            }}
            modifiersStyles={{
              booked: {
                textDecoration: 'underline',
                fontWeight: 'bold',
                color: 'red'
              }
            }}
            className="rounded-3xl border-none p-0"
          />
        </div>

        <div className="p-6 bg-primary/5 border border-primary/10 rounded-[2rem] flex flex-col gap-1">
          <p className="text-[9px] font-black text-primary uppercase tracking-widest">Selected Date</p>
          <div className="flex items-center justify-between">
            <span className="text-xl font-black uppercase italic tracking-tighter">
              {selectedDate?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
            <Badge className="bg-primary text-white text-[10px]">{filteredItems.length} Sessions</Badge>
          </div>
        </div>
      </aside>
    </div>
  );
}