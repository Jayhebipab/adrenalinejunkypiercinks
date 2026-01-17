"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import {
    LayoutDashboard,
    CalendarCheck,
    Store,
    FileText,
    Wrench,
    BarChart3,
    KeyRound,
    ShieldCheck,
    ClipboardList,
    UserCircle2,
    ShieldAlert,
    LogOut,
    Sun,
    Moon,
} from "lucide-react"

import { NavMain } from "../components/nav-main"
import { NavProjects } from "../components/nav-projects"
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

const data = {
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
                { title: "Reviews", id: "Reviews" },
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
        { name: "Change Password", id: "Change Password", icon: KeyRound },
        { name: "Privacy Policy", id: "Privacy Policy", icon: ShieldCheck },
        { name: "System Logs", id: "System Logs", icon: ClipboardList },
    ],
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
    onNavigate: (view: string) => void
}

export function AppSidebar({ onNavigate, ...props }: AppSidebarProps) {
    const { theme, setTheme } = useTheme()
    const [userData, setUserData] = useState({
        username: "PABLO",
        role: "Super Admin"
    })

    useEffect(() => {
        const savedUser = localStorage.getItem("user")
        if (savedUser) {
            try {
                const parsedUser = JSON.parse(savedUser)
                setUserData({
                    username: parsedUser.username || parsedUser.name || "User",
                    role: parsedUser.role || "Staff"
                })
            } catch (error) {
                console.error("Error parsing user data:", error)
            }
        }
    }, [])

    const handleLogout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" })
            localStorage.removeItem("user")
            window.location.href = "/login"
        } catch (error) {
            console.error("Logout failed:", error)
        }
    }

    const getRoleIcon = () => {
        if (userData.role === "Super Admin") return <ShieldAlert className="size-5 text-red-500" />
        if (userData.role === "Admin") return <ShieldCheck className="size-5 text-blue-500" />
        return <UserCircle2 className="size-5 text-zinc-400" />
    }

    return (
        <Sidebar collapsible="icon" {...props} className="border-r border-border/50">
            {/* --- HEADER: USERNAME & ROLE --- */}
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            onClick={() => onNavigate("Dashboard")}
                            className="hover:bg-transparent cursor-pointer group py-6"
                        >
                            <div className="flex aspect-square size-9 items-center justify-center rounded-xl bg-zinc-900 text-white transition-all duration-300 group-hover:bg-primary shadow-lg">
                                {getRoleIcon()}
                            </div>

                            <div className="grid flex-1 text-left ml-2 leading-[0.8]">
                                {/* STORE NAME: Mas malaki at dikit-dikit ang letters */}
                                <span className="truncate font-black text-xl italic tracking-tighter uppercase text-black dark:text-black">
                                    Junky Piercinks
                                </span>

                                {/* ROLE PANEL: Sobrang nipis pero malawak ang spacing */}
                                <span className={`truncate text-[9px] font-extrabold tracking-[0.25em] uppercase mt-1 ${userData.role === 'Super Admin' ? 'text-red-600' : 'text-zinc-500'
                                    }`}>
                                    {userData.role} • PANEL
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
                                className="hover:bg-primary/10 hover:text-primary transition-colors group cursor-pointer h-11"
                            >
                                <LayoutDashboard className="group-hover:text-primary size-5" />
                                <span className="font-bold text-sm uppercase tracking-tight">Dashboard</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </div>

                <NavMain items={data.navMain} onViewChange={onNavigate} />
                <NavProjects projects={data.projects} onViewChange={onNavigate} />
            </SidebarContent>

            {/* --- FOOTER: LEFT-ALIGNED ICONS WITH HOVER --- */}
            <SidebarFooter className="border-t border-border/40 p-3">
                <div className="flex items-center justify-start gap-1">
                    {/* Dark Mode Toggle with Hover */}
                    <button
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-all active:scale-90"
                        title="Toggle Theme"
                    >
                        {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
                    </button>

                    {/* Logout with Hover */}
                    <button
                        onClick={handleLogout}
                        className="p-2 rounded-lg text-zinc-500 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 transition-all active:scale-90"
                        title="Logout"
                    >
                        <LogOut className="size-5" />
                    </button>
                </div>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}