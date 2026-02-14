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
import { 
  Loader2, User, PhilippinePeso, Hammer, MinusCircle, PlusCircle
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
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  const [availableArtists, setAvailableArtists] = useState<any[]>([]);
  const [inventoryProducts, setInventoryProducts] = useState<any[]>([]);
  
  const [price, setPrice] = useState("");
  const [selectedArtist, setSelectedArtist] = useState("");
  const [productsUsed, setProductsUsed] = useState([{ name: "", quantity: 1 }]);
  const [openFinishDialog, setOpenFinishDialog] = useState<string | null>(null);

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

      setItems((dataBookings.bookings || dataBookings || []).filter((b: Booking) => b.status === 'approved' || b.status === 'finished'));
      setAvailableArtists(Array.isArray(dataArtists) ? dataArtists : dataArtists.artists || []);
      setInventoryProducts(Array.isArray(dataInv) ? dataInv : dataInv.products || []);
      
    } catch (error) {
      toast.error("Failed to load resources");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const addProductRow = () => setProductsUsed([...productsUsed, { name: "", quantity: 1 }]);
  const removeProductRow = (index: number) => setProductsUsed(productsUsed.filter((_, i) => i !== index));
  const updateProductRow = (index: number, field: string, value: any) => {
    const updated = [...productsUsed];
    updated[index] = { ...updated[index], [field]: value };
    if (field === "name" && value !== "" && index === updated.length - 1) {
        updated.push({ name: "", quantity: 1 });
    }
    setProductsUsed(updated);
  };

  const updateStatus = async (id: string, newStatus: string) => {
    const cleanedProducts = productsUsed.filter(p => p.name !== "");
    if (newStatus === "finished") {
      if (!price || !selectedArtist || cleanedProducts.length === 0) {
        toast.error("Please provide price, artist, and at least one material.");
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
          finalPrice: price,
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

  if (loading) return <div className="flex h-60 items-center justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6 p-4">
      {/* HEADER SECTION */}
      <div>
        <h2 className="text-3xl font-black italic uppercase tracking-tighter text-foreground">Active Projects</h2>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Ongoing Sessions</p>
      </div>

      {/* TABLE CONTAINER */}
      <div className="border border-border rounded-[2rem] overflow-hidden bg-card shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Client / Service</TableHead>
              <TableHead className="font-black uppercase text-[10px] tracking-widest text-center text-muted-foreground">Artist & Fee</TableHead>
              <TableHead className="font-black uppercase text-[10px] tracking-widest text-right text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id} className={`border-border ${item.status === 'finished' ? 'bg-emerald-500/5' : ''}`}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-black uppercase text-sm text-foreground">{item.name}</span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">{item.service}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                   <div className="flex flex-col items-center gap-1">
                      <Badge variant="outline" className="rounded-none font-black uppercase text-[9px] border-border text-foreground">
                        {item.artist || "No Artist Assigned"}
                      </Badge>
                      {item.finalPrice && (
                        <span className="text-[11px] font-black text-emerald-500 flex items-center gap-0.5">
                          ₱{item.finalPrice.toLocaleString()}
                        </span>
                      )}
                   </div>
                </TableCell>
                <TableCell className="text-right">
                  {item.status !== 'finished' && (
                    <Dialog open={openFinishDialog === item.id} onOpenChange={(open) => setOpenFinishDialog(open ? item.id : null)}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="h-8 bg-foreground text-background hover:bg-emerald-600 hover:text-white font-black uppercase text-[10px] rounded-full transition-all">
                          Finish
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md rounded-[2.5rem] p-8 bg-popover border-border shadow-2xl overflow-y-auto max-h-[90vh]">
                        <DialogHeader>
                          <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter text-foreground">Session Complete</DialogTitle>
                        </DialogHeader>
                        
                        <div className="space-y-6 py-4">
                          {/* ARTIST SELECT */}
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase flex items-center gap-2 text-muted-foreground">
                              <User className="size-3 text-emerald-500"/> Artist <span className="text-destructive">*</span>
                            </Label>
                            <select 
                              className="w-full bg-muted p-3 rounded-xl text-[12px] font-bold border border-border outline-none focus:border-emerald-500 transition-all text-foreground"
                              value={selectedArtist}
                              onChange={(e) => setSelectedArtist(e.target.value)}
                            >
                              <option value="" className="bg-popover">Select Artist...</option>
                              {availableArtists.map(a => (
                                <option key={a.fullName} value={a.fullName} className="bg-popover">{a.fullName}</option>
                              ))}
                            </select>
                          </div>

                          {/* PRICE INPUT */}
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase flex items-center gap-2 text-muted-foreground">
                              <PhilippinePeso className="size-3 text-emerald-500"/> Final Price <span className="text-destructive">*</span>
                            </Label>
                            <Input 
                              type="number" 
                              placeholder="0.00"
                              className="rounded-xl h-12 font-bold focus-visible:ring-emerald-500 bg-muted border-border text-foreground" 
                              value={price} 
                              onChange={(e) => setPrice(e.target.value)} 
                            />
                          </div>

                          {/* DYNAMIC INVENTORY DEDUCTION */}
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <Label className="text-[10px] font-black uppercase flex items-center gap-2 text-muted-foreground">
                                <Hammer className="size-3 text-emerald-500"/> Materials Used
                              </Label>
                              <button onClick={addProductRow} className="text-emerald-500 hover:text-emerald-400 transition-colors">
                                <PlusCircle size={18} />
                              </button>
                            </div>
                            
                            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                              {productsUsed.map((row, index) => (
                                <div key={index} className="flex gap-2 items-center">
                                  <select 
                                    className="flex-1 bg-muted p-2.5 rounded-lg text-[11px] font-bold border border-border outline-none text-foreground"
                                    value={row.name}
                                    onChange={(e) => updateProductRow(index, "name", e.target.value)}
                                  >
                                    <option value="" className="bg-popover">Select Item...</option>
                                    {inventoryProducts.map(p => (
                                      <option key={p.id || p._id} value={p.name} className="bg-popover">
                                        {p.name} ({p.stock || p.quantity})
                                      </option>
                                    ))}
                                  </select>
                                  {row.name && (
                                    <input 
                                      type="number" 
                                      min="1"
                                      className="w-14 bg-muted border border-border p-2.5 rounded-lg text-center text-[11px] font-black outline-none text-foreground"
                                      value={row.quantity}
                                      onChange={(e) => updateProductRow(index, "quantity", Number(e.target.value))}
                                    />
                                  )}
                                  {productsUsed.length > 1 && (
                                    <button onClick={() => removeProductRow(index)} className="text-muted-foreground hover:text-destructive transition-colors">
                                      <MinusCircle size={16} />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <DialogFooter>
                          <Button 
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-black uppercase h-12 shadow-lg active:scale-95 transition-all"
                            disabled={updating}
                            onClick={() => updateStatus(item.id, "finished")}
                          >
                            {updating ? <Loader2 className="animate-spin" /> : "Verify & Close Project"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}