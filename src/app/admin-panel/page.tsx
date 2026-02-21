"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { AppSidebar } from "../components/app-sidebar"
import { JetBrains_Mono } from "next/font/google"

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
})

// VIEWS IMPORTS
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
import ActivityLogs from "../components/settings/ActivityLogs"
import CategoryManagement from "../components/maintenance/CategoryManagement"
import ProductManagement from "../components/maintenance/ProductManagement"
import SupplierMaintenance from "../components/maintenance/SuppliersMaintenance"
import EquipmentManagement from "../components/maintenance/EquipmentManagement"
import VatManagement from "../components/maintenance/VatManagement"
import { Messenger } from "../components/reservation/Messenger";
import Inquiries from "../components/reservation/Inquiries";
import ArtistProfile from "../components/pages/ArtistProfile"
import BlogAdminPage from "../components/pages/Blogs"
import QrImagesManager from "../components/shop/Qrimages"
import PromoPage from "../components/promo"
import DeliveryReports from "../components/reports/DeliveryReports"
import FAQEditor from "../components/pages/Faqsettings"
import AccessControl from "../components/settings/Access-Control"
import AnnouncementDialog from "../components/pages/Announcement"
import ProtocolManager from "../components/pages/SafetyProtocols"
import AuditTrail from "../components/reports/AuditTrail"
import StockReports from "../components/reports/StockReports"

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
import { Bell, Clock, Calendar } from "lucide-react"

export default function AdminPanelPage() {
  const [activeView, setActiveView] = useState("Dashboard")
  const [upcomingSessions, setUpcomingSessions] = useState([])

  // FETCH UPCOMING SESSIONS
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
          return diffDays >= 0 && diffDays <= 1; 
        });
        setUpcomingSessions(filtered);
      } catch (error) {
        console.error("Notif fetch error:", error);
      }
    };
    fetchUpcoming();
    const interval = setInterval(fetchUpcoming, 30000);
    return () => clearInterval(interval);
  }, []);

  const renderContent = () => {
    switch (activeView) {
      case "Dashboard": return <DashboardHome />
      case "List": return <BookingList />
      case "BookingRequest": return <BookingRequest />
      case "Messenger": return <Messenger/>
      case "Inquiries": return <Inquiries/>
      case "Product": return <ProductList />
      case "Checkout": return <Checkout />
      case "TattooGallery": return <TattooGallery />
      case "PiercingGallery": return <PiercingGallery />
      case "Blogs": return <BlogAdminPage/>
      case "Artist" : return <ArtistProfile/>
      case "Reviews": return <Reviewgallery/>
      case "UserManagement": return <UserManagement />
      case "StockReports" : return <StockReports/>
      case "AuditTrail": return <AuditTrail/>
      case "Category": return <CategoryManagement />
      case "Product&Materials": return <ProductManagement />
      case "Supplier": return <SupplierMaintenance />
      case "Equipment": return <EquipmentManagement />
      case "VatManagement": return <VatManagement />
      case "QrSettings": return <QrImagesManager/>
      case "Inventory": return <Inventory/>
      case "FAQ": return <FAQEditor/>
      case "Waiver": return <ProtocolManager/>
      case "Announcement": return <AnnouncementDialog/>
      case "SalesReports": return <SalesReports />
      case "DeliveryReports": return <DeliveryReports />
      case "ChangePassword": return <ChangePassword />
      case "ActivityLogs": return <ActivityLogs />
      case "PromoList": return <PromoPage/>
      case "AccessControl": return <AccessControl/>
      default: return <DashboardHome />
    }
  }

  return (
    <SidebarProvider className={jetbrainsMono.className}>
      {/* FIX ERROR 2741: Nilagyan ng empty object o fallback kung hindi mo ipapasa ang permissions */}
      <AppSidebar onNavigate={setActiveView} userPermissions={undefined} />
      
      <SidebarInset className="bg-background">
        <header className="flex h-16 shrink-0 items-center justify-between border-b px-4 bg-background/95 backdrop-blur-sm sticky top-0 z-10 border-border/50">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1 text-foreground" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage className="capitalize font-black italic tracking-tighter text-primary text-sm">
                    {activeView}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex items-center gap-3">
             <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className="relative rounded-full border-border bg-background hover:bg-accent transition-all">
                    <Bell className="size-5 text-muted-foreground" />
                    {upcomingSessions.length > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 size-3 bg-destructive border-2 border-background rounded-full animate-pulse" />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0 mr-4 border-border shadow-2xl rounded-3xl overflow-hidden bg-popover text-popover-foreground font-mono" align="end">
                  <div className="bg-zinc-900 dark:bg-zinc-950 p-5 text-white">
                    <div className="flex justify-between items-center">
                        <h4 className="font-black uppercase italic tracking-tighter flex items-center gap-2 text-lg">
                          <Clock className="size-4 text-primary" /> Alerts
                        </h4>
                        <Badge className="bg-primary text-white border-none text-[10px] font-black">
                            {upcomingSessions.length} NEW
                        </Badge>
                    </div>
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Today & Tomorrow's Inks</p>
                  </div>

                  {/* FIX TAILWIND CLASS: max-h-[350px] to max-h-87.5 */}
                  <div className="max-h-87.5 overflow-y-auto p-2 bg-popover">
                    {upcomingSessions.length === 0 ? (
                      <div className="py-12 text-center text-muted-foreground/30">
                        <Calendar className="size-10 mx-auto mb-2 opacity-10" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Clear Schedule</p>
                      </div>
                    ) : (
                      upcomingSessions.map((session: any) => (
                        <div 
                            key={session.id || `session-${session.name}-${session.preferredDate}`} 
                            onClick={() => setActiveView("List")}
                            className="p-4 hover:bg-accent rounded-2xl transition-all cursor-pointer border-b border-border/50 last:border-none group"
                        >
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase italic ${
                                    new Date(session.preferredDate).toLocaleDateString() === new Date().toLocaleDateString() 
                                    ? "bg-destructive/10 text-destructive" 
                                    : "bg-muted text-muted-foreground"
                                }`}>
                                  {new Date(session.preferredDate).toLocaleDateString() === new Date().toLocaleDateString() ? "TODAY" : "TOMORROW"}
                                </span>
                                <h5 className="text-sm font-black uppercase tracking-tighter text-foreground pt-1 leading-none group-hover:text-primary transition-colors">
                                  {session.name}
                                </h5>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight italic">{session.service}</p>
                              </div>
                              <div className="text-right flex flex-col items-end gap-1">
                                <Badge variant="outline" className="text-[9px] font-black border-border">
                                    {session.preferredTime}
                                </Badge>
                                <span className="text-[8px] text-muted-foreground/60 font-bold uppercase tracking-tighter">{session.artist}</span>
                              </div>
                            </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-4 bg-muted/50 text-center border-t border-border/50">
                    <button 
                        onClick={() => setActiveView("List")}
                        className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Check Full Registry
                    </button>
                  </div>
                </PopoverContent>
             </Popover>
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-4 p-4 bg-background">
          <div className="min-h-screen flex-1 rounded-4xl bg-card p-8 shadow-sm border border-border/50 animate-in fade-in zoom-in-95 duration-500 text-card-foreground">
            {renderContent()}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}