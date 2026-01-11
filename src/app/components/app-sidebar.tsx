"use client"

import * as React from "react"
import {
    LayoutDashboard,
    GalleryVerticalEnd,
    CalendarCheck,
    Store,
    FileText,
    Wrench,
    BarChart3,
    KeyRound,
    ShieldCheck,
    ClipboardList
} from "lucide-react"

import { NavMain } from "../components/nav-main"
import { NavProjects } from "../components/nav-projects"
import { NavUser } from "../components/nav-user"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
} from "@/components/ui/sidebar"

// 1. PALITAN ANG 'url' NG 'id' PARA MAG-MATCH SA NAV COMPONENTS
const data = {
    user: {
        name: "Admin Junkie",
        email: "admin@adrenaline.com",
        avatar: "/avatars/admin.jpg",
    },
    navMain: [
        {
            title: "Reservation",
            icon: CalendarCheck,
            isActive: true,
            items: [
                { title: "List", id: "List" },
                { title: "Booking Request", id: "Booking Request" },
            ],
        },
        {
            title: "Shop",
            icon: Store,
            items: [
                { title: "Product", id: "Product" },
                { title: "Checkout", id: "Checkout" },
            ],
        },
        {
            title: "Pages",
            icon: FileText,
            items: [
                { title: "Tattoo Gallery", id: "Tattoo Gallery" },
                { title: "Piercing Gallery", id: "Piercing Gallery" },
            ],
        },
        {
            title: "Maintenance",
            icon: Wrench,
            items: [
                { title: "Inventory", id: "Inventory" },
                { title: "Product Management", id: "Product Management" },
                { title: "Category", id: "Category" },
                { title: "Equipment", id: "Equipment" },
                { title: "Supplier", id: "Supplier" },
                { title: "User Management", id: "User Management" },
            ],
        },
        {
            title: "Reports",
            icon: BarChart3,
            items: [
                { title: "Sales Reports", id: "Sales Reports" },
                { title: "Delivery Reports", id: "Delivery Reports" },
                { title: "Stock Reports", id: "Stock Reports" },
                { title: "Audit Trail", id: "Audit Trail" },
                { title: "Activity Logs", id: "Activity Logs" },

            ],
        },
    ],
    projects: [
        {
            name: "Change Password",
            id: "Change Password", // Pinalitan ang url: "#" ng id
            icon: KeyRound,
        },
        {
            name: "Privacy Policy",
            id: "Privacy Policy",
            icon: ShieldCheck,
        },
        {
            name: "System Logs",
            id: "System Logs",
            icon: ClipboardList,
        },
    ],
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
    onNavigate: (view: string) => void
}

export function AppSidebar({ onNavigate, ...props }: AppSidebarProps) {
    return (
        <Sidebar collapsible="icon" {...props} className="border-r border-border/50">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton 
                            size="lg" 
                            onClick={() => onNavigate("Dashboard")}
                            className="hover:bg-transparent cursor-pointer group"
                        >
                            <div className="flex aspect-square size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(var(--primary),0.5)] group-hover:scale-105">
                                <GalleryVerticalEnd className="size-5" />
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight ml-2">
                                <span className="truncate font-black tracking-tighter text-base uppercase bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                                    Adrenaline Junky
                                </span>
                                <span className="truncate text-[10px] text-muted-foreground font-medium tracking-widest uppercase opacity-70">
                                    Piercinks Admin
                                </span>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="gap-0">
                <div className="px-2 py-2">
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                tooltip="Dashboard"
                                onClick={() => onNavigate("Dashboard")}
                                className="hover:bg-primary/10 hover:text-primary transition-colors group cursor-pointer"
                            >
                                <LayoutDashboard className="group-hover:text-primary transition-colors" />
                                <span className="font-semibold">Dashboard</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </div>

                {/* 2. SIGURADUHIN NA 'onViewChange' ANG TAWAG NATIN DITO BASE SA NAV-MAIN MO */}
                <NavMain items={data.navMain} onViewChange={onNavigate} />
                <NavProjects projects={data.projects} onViewChange={onNavigate} />
            </SidebarContent>

            <SidebarFooter className="border-t border-border/40 p-4">
                <NavUser user={data.user} />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}