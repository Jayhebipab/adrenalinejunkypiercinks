"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { AppSidebar } from "../components/app-sidebar"

// I-IMPORT ANG MGA VIEWS
import DashboardHome from "../components/dashboard/home-view"
import BookingList from "../components/reservation/BookingList"
import BookingRequest from "../components/reservation/BookingRequest"
import ProductList from "../components/shop/ProductList"
import Checkout from "../components/shop/ShopList"
import TattooGallery from "../components/pages/TattooGallery"
import PiercingGallery from "../components/pages/PiercingGallery"
import Reviewgallery from "../components/pages/Reviewspanel"
import Inventory from "../components/maintenance/Inventory"
import UserManagement from "../components/maintenance/UserManagement"
import SalesReports from "../components/reports/SaleReports"
import ChangePassword from "../components/settings/change-password-view"
import SystemLogs from "../components/settings/SystemLogs"
import CategoryManagement from "../components/maintenance/CategoryManagement"
import ProductManagement from "../components/maintenance/ProductManagement"
import SupplierMaintenance from "../components/maintenance/SuppliersMaintenance"
import EquipmentManagement from "../components/maintenance/EquipmentManagement"
import VatManagement from "../components/maintenance/VatManagement"
import { Messenger } from "../components/reservation/Messenger";
import Inquiries from "../components/reservation/Inquiries";
import ArtistProfile from "../components/pages/ArtistProfile"
import { BlogSection

 } from "../components/pages/Blogs"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Bell, Clock, AlertCircle, Calendar } from "lucide-react"

export default function AdminPanelPage() {
  const [activeView, setActiveView] = useState("Dashboard")
  const [upcomingSessions, setUpcomingSessions] = useState([])

  // FETCH UPCOMING SESSIONS (TODAY & TOMORROW)
  useEffect(() => {
    const fetchUpcoming = async () => {
      try {
        const res = await fetch('/api/bookings');
        const data = await res.json();
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const filtered = (data.bookings || []).filter((b: any) => {
          if (b.status !== 'approved') return false;
          const sessionDate = new Date(b.preferredDate);
          sessionDate.setHours(0, 0, 0, 0);
          
          const diffTime = sessionDate.getTime() - today.getTime();
          const diffDays = diffTime / (1000 * 60 * 60 * 24);
          // 0 = Today, 1 = Tomorrow
          return diffDays >= 0 && diffDays <= 1; 
        });

        setUpcomingSessions(filtered);
      } catch (error) {
        console.error("Notif fetch error:", error);
      }
    };

    fetchUpcoming();
    const interval = setInterval(fetchUpcoming, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const renderContent = () => {
    switch (activeView) {
      case "Dashboard": return <DashboardHome />
      case "List": return <BookingList />
      case "Booking Request": return <BookingRequest />
      case "Messenger": return <Messenger/>
      case "Inquiries": return <Inquiries/>
      case "Product": return <ProductList />
      case "Checkout": return <Checkout />
      case "Tattoo Gallery": return <TattooGallery />
      case "Piercing Gallery": return <PiercingGallery />
      case "Blogs": return <BlogSection/>
      case "Artist" : return <ArtistProfile/>
      case "Reviews": return <Reviewgallery/>
      case "User Management": return <UserManagement />
      case "Category": return <CategoryManagement />
      case "Product Management": return <ProductManagement />
      case "Supplier": return <SupplierMaintenance />
      case "Equipment": return <EquipmentManagement />
      case "Vat": return <VatManagement />
      case "Inventory": return <Inventory/>
      case "Sales Reports": return <SalesReports />
      case "Change Password": return <ChangePassword />
      case "System Logs": return <SystemLogs />
      default: return <DashboardHome />
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar onNavigate={(view) => setActiveView(view)} />
      
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between border-b px-4 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage className="capitalize font-black italic tracking-tighter text-[#d11a2a] text-lg">
                    {activeView}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* FLOATING NOTIFICATION HUB */}
          <div className="flex items-center gap-3">
             <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className="relative rounded-full border-zinc-100 hover:bg-zinc-50 transition-all">
                    <Bell className="size-5 text-zinc-600" />
                    {upcomingSessions.length > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 size-3 bg-[#d11a2a] border-2 border-white rounded-full animate-pulse" />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0 mr-4 border-none shadow-2xl rounded-[2rem] overflow-hidden bg-white" align="end">
                  <div className="bg-zinc-900 p-5 text-white">
                    <div className="flex justify-between items-center">
                        <h4 className="font-black uppercase italic tracking-tighter flex items-center gap-2 text-lg">
                          <Clock className="size-4 text-[#d11a2a]" /> Alerts
                        </h4>
                        <Badge className="bg-[#d11a2a] text-white border-none text-[10px] font-black">
                            {upcomingSessions.length} NEW
                        </Badge>
                    </div>
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Today & Tomorrow's Inks</p>
                  </div>

                  <div className="max-h-[350px] overflow-y-auto p-2">
                    {upcomingSessions.length === 0 ? (
                      <div className="py-12 text-center text-zinc-300">
                        <Calendar className="size-10 mx-auto mb-2 opacity-10" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Clear Schedule</p>
                      </div>
                    ) : (
                      upcomingSessions.map((session: any) => (
                        <div 
                            key={session._id} 
                            onClick={() => {
                                setActiveView("List");
                                // Add logic here to open the specific dialog if needed
                            }}
                            className="p-4 hover:bg-zinc-50 rounded-[1.5rem] transition-all cursor-pointer border-b border-zinc-50 last:border-none group"
                        >
                           <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase italic ${
                                    new Date(session.preferredDate).toLocaleDateString() === new Date().toLocaleDateString() 
                                    ? "bg-red-100 text-red-600" 
                                    : "bg-zinc-100 text-zinc-600"
                                }`}>
                                  {new Date(session.preferredDate).toLocaleDateString() === new Date().toLocaleDateString() ? "TODAY" : "TOMORROW"}
                                </span>
                                <h5 className="text-sm font-black uppercase tracking-tighter text-zinc-900 pt-1 leading-none group-hover:text-[#d11a2a] transition-colors">
                                  {session.name}
                                </h5>
                                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-tight italic">{session.service}</p>
                              </div>
                              <div className="text-right flex flex-col items-end gap-1">
                                <Badge variant="outline" className="text-[9px] font-black border-zinc-200">
                                    {session.preferredTime}
                                </Badge>
                                <span className="text-[8px] text-zinc-300 font-bold uppercase tracking-tighter">{session.artist}</span>
                              </div>
                           </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-4 bg-zinc-50 text-center">
                    <button 
                        onClick={() => setActiveView("List")}
                        className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-black transition-colors"
                    >
                        Check Full Registry
                    </button>
                  </div>
                </PopoverContent>
             </Popover>
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-4 p-4 bg-[#fafafa]">
          <div className="min-h-[100vh] flex-1 rounded-[2.5rem] bg-white p-8 md:min-h-min shadow-sm border border-zinc-200/50 animate-in fade-in zoom-in-95 duration-500">
            {renderContent()}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}