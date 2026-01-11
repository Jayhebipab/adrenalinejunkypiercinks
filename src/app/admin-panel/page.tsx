"use client"

import * as React from "react"
import { useState } from "react"
import { AppSidebar } from "../components/app-sidebar"
import HomeView from "@/app/components/dashboard/home-view";

// I-IMPORT ANG MGA VIEWS (Siguraduhin na may 'export default' ang bawat isa nito)
import DashboardHome from "../components/dashboard/home-view"
import BookingList from "../components/reservation/BookingList"
import BookingRequest from "../components/reservation/BookingRequest"
import ProductList from "../components/shop/ProductList"
import Checkout from "../components/shop/ShopList"
import TattooGallery from "../components/pages/TattooGallery"
import PiercingGallery from "../components/pages/PiercingGallery"
import Inventory from "../components/maintenance/Inventory"
import UserManagement from "../components/maintenance/UserManagement"
import SalesReports from "../components/reports/SaleReports"
import ChangePassword from "../components/settings/change-password-view"
import SystemLogs from "../components/settings/SystemLogs"
import CategoryManagement from "../components/maintenance/CategoryManagement"
import ProductManagement from "../components/maintenance/ProductManagement"
import SupplierMaintenance from "../components/maintenance/SuppliersMaintenance"
import EquipmentManagement from "../components/maintenance/EquipmentManagement"
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

export default function AdminPanelPage() {
  // Ang default view ay Dashboard
  const [activeView, setActiveView] = useState("Dashboard")

  // Dito natin i-ma-map ang bawat title mula sa sidebar patungo sa component
  const renderContent = () => {
    switch (activeView) {
      case "Dashboard": return <DashboardHome />
      
      // Reservation
      case "List": return <BookingList />
      case "Booking Request": return <BookingRequest />
      
      // Shop
      case "Product": return <ProductList />
      case "Checkout": return <Checkout />
      
      // Pages
      case "Tattoo Gallery": return <TattooGallery />
      case "Piercing Gallery": return <PiercingGallery />
      
      // Maintenance
      case "Inventory": return <Inventory />
      case "User Management": return <UserManagement />
      case "Category": return <CategoryManagement />
       case "Product Management": return <ProductManagement />
        case "Supplier": return <SupplierMaintenance />
        case "Equipment": return <EquipmentManagement />
      // Reports
      case "Sales Reports": return <SalesReports />
      
      // Projects/Settings (Inilabas natin)
      case "Change Password": return <ChangePassword />
      case "System Logs": return <SystemLogs />

      default:
        return <DashboardHome />
    }
  }

  return (
    <SidebarProvider>
      {/* I-pasa ang navigation function sa Sidebar */}
      <AppSidebar onNavigate={(view) => setActiveView(view)} />
      
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage className="capitalize font-black italic tracking-tighter text-[#d11a2a]">
                  {activeView}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 bg-muted/20">
          <div className="min-h-[100vh] flex-1 rounded-[2rem] bg-white p-6 md:min-h-min shadow-sm border border-gray-100 animate-in fade-in zoom-in-95 duration-300">
            {renderContent()}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}