"use client";

import * as React from "react"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
// 1. IMPORT FIREBASE TOOLS
import { db } from "@/lib/firebase" 
import { collection, query, where, onSnapshot } from "firebase/firestore"
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
            items: [
                { title: "List", id: "List" },
                { title: "Booking Request", id: "Booking Request" },
                { title: "Messenger", id: "Messenger" },
            ],
        },
        {
            title: "Shop",
            icon: Store,
            items: [
                { title: "Product", id: "Product" },
                { title: "Checkout", id: "Checkout" },
                { title: "Qr Settings", id: "Qr Settings" },
            ],
        },
        {
            title: "Promo",
            icon: CalendarCheck,
            items: [
                { title: "Promo List", id: "Promo List" },
            ],
        },
        {
            title: "Pages",
            icon: FileText,
            items: [
                { title: "Artist", id: "Artist" },
                { title: "Tattoo Gallery", id: "Tattoo Gallery" },
                { title: "Piercing Gallery", id: "Piercing Gallery" },
                { title: "Reviews", id: "Reviews" },
                { title: "Blogs", id: "Blogs" },
                { title: "FAQ", id: "FAQ" },
            ],
        },
        {
            title: "Maintenance",
            icon: Wrench,
            items: [
                { title: "Inventory", id: "Inventory" },
                { title: "Product & Materials", id: "Product Management" },
                { title: "Category", id: "Category" },
                { title: "Supplier", id: "Supplier" },
                { title: "Vat Management", id: "Vat" },
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
    const [mounted, setMounted] = useState(false)
    
    // 2. STATE PARA SA NOTIFICATIONS
    const [notifications, setNotifications] = useState({
        bookings: 0,
        messages: 0
    })

    const [userData, setUserData] = useState({
        username: "PABLO",
        role: "Super Admin"
    })

    useEffect(() => {
        setMounted(true)
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

        // 3. REAL-TIME FIREBASE LISTENERS
        // Para sa Booking Request (Pending)
        const qBookings = query(
            collection(db, "bookings"), 
            where("status", "==", "pending") 
        );
        const unsubBookings = onSnapshot(qBookings, (snapshot) => {
            setNotifications(prev => ({ ...prev, bookings: snapshot.size }));
        });

        // Para sa Messenger (Unread)
        const qMessages = query(
            collection(db, "chats"), 
            where("isRead", "==", false)
        );
        const unsubMessages = onSnapshot(qMessages, (snapshot) => {
            setNotifications(prev => ({ ...prev, messages: snapshot.size }));
        });

        // CLEANUP Listeners
        return () => {
            unsubBookings();
            unsubMessages();
        }
    }, [])

    // 4. LOGIC: Inject badges into the data mapping
    const navMainWithBadges = data.navMain.map((group) => {
        if (group.title === "Reservation") {
            return {
                ...group,
                items: group.items.map((item) => {
                    if (item.title === "Booking Request") return { ...item, badge: notifications.bookings }
                    if (item.title === "Messenger") return { ...item, badge: notifications.messages }
                    return item
                }),
            }
        }
        return group
    })

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

    if (!mounted) return null

    return (
        <Sidebar collapsible="icon" {...props} className="border-r border-border/50 font-mono">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            onClick={() => onNavigate("Dashboard")}
                            className="hover:bg-transparent cursor-pointer group py-6"
                        >
                            <div className="flex aspect-square size-9 items-center justify-center rounded-xl bg-zinc-900 text-white transition-all duration-300 group-hover:bg-primary shadow-lg dark:bg-zinc-800">
                                {getRoleIcon()}
                            </div>

                            <div className="grid flex-1 text-left ml-2 leading-[0.8]">
                                <span className="truncate font-black text-xl italic tracking-tighter uppercase text-foreground">
                                    Junky Piercinks
                                </span>

                                <span className={`truncate text-[10px] font-bold tracking-[0.2em] uppercase mt-1 ${
                                    userData.role === 'Super Admin' ? 'text-red-600' : 'text-muted-foreground'
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

                {/* Ginamit natin ang 'navMainWithBadges' na may realtime data */}
                <NavMain items={navMainWithBadges} onViewChange={onNavigate} />
                <NavProjects projects={data.projects} onViewChange={onNavigate} />
            </SidebarContent>

            <SidebarFooter className="border-t border-border/40 p-3">
                <div className="flex items-center justify-start gap-1">
                    <button
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        className="p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all active:scale-90"
                        title="Toggle Theme"
                    >
                        {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
                    </button>

                    <button
                        onClick={handleLogout}
                        className="p-2 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all active:scale-90"
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