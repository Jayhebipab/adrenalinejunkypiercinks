"use client";

import * as React from "react"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
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
            id: "reservations",
            items: [
                { title: "List", id: "List" }, // Tugma sa screenshot mo
                { title: "Booking Request", id: "BookingRequest" },
                { title: "Messenger", id: "Messenger" },
            ],
        },
        {
            title: "Shop",
            icon: Store,
            id: "shop",
            items: [
                { title: "Product", id: "Product" },
                { title: "Checkout", id: "Checkout" },
                { title: "Qr Settings", id: "QrSettings" },
            ],
        },
        {
            title: "Promo",
            icon: CalendarCheck,
            id: "promo",
            items: [
                { title: "Promo List", id: "PromoList" },
            ],
        },
        {
            title: "Pages",
            icon: FileText,
            id: "content",
            items: [

                { title: "Artist", id: "Artist" },
                { title: "Tattoo Gallery", id: "TattooGallery" },
                { title: "Piercing Gallery", id: "PiercingGallery" },
                { title: "Reviews", id: "Reviews" },
                { title: "Blogs", id: "Blogs" },
                { title: "Waiver", id: "Waiver" },
                { title: "FAQ", id: "FAQ" },
                { title: "Announcement", id: "Announcement" },
            ],
        },
        {
            title: "Maintenance",
            icon: Wrench,
            id: "maintenance",
            items: [
                { title: "Inventory", id: "Inventory" }, // Tugma sa screenshot: "inventory": "live"
                { title: "Product & Materials", id: "Product&Materials" },
                { title: "Category", id: "Category" }, // Ito ang hinahanap mo
                { title: "Supplier", id: "Supplier" },
                { title: "Vat Management", id: "VatManagement" },
                { title: "User Management", id: "UserManagement" },
            ],
        },
        {
            title: "Reports",
            icon: BarChart3,
            id: "reports",
            items: [
                { title: "Sales Reports", id: "SalesReports" },
                { title: "Delivery Reports", id: "DeliveryReports" },
                { title: "Stock Reports", id: "StockReports" },
                { title: "Audit Trail", id: "AuditTrail" },
            ],
        },
    ],
    projects: [
        { name: "Change Password", id: "ChangePassword", icon: KeyRound, accessId: "always" },
        { name: "Access Control", id: "AccessControl", icon: ShieldCheck, accessId: "settings" },
        { name: "Activity Logs", id: "ActivityLogs", icon: ClipboardList, accessId: "settings" },
    ],
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
    onNavigate: (view: string) => void;
    userPermissions?: any; 
}

export function AppSidebar({ onNavigate, userPermissions, ...props }: AppSidebarProps) {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)
    const [notifications, setNotifications] = useState({ bookings: 0, messages: 0 })
    const [userData, setUserData] = useState<any>(null)

    useEffect(() => {
        setMounted(true)
        if (userPermissions) {
            setUserData(userPermissions)
        } else {
            const savedUser = localStorage.getItem("user")
            if (savedUser) {
                try {
                    setUserData(JSON.parse(savedUser))
                } catch (e) { console.error(e) }
            }
        }

        const qBookings = query(collection(db, "bookings"), where("status", "==", "pending"));
        const unsubBookings = onSnapshot(qBookings, (snapshot) => {
            setNotifications(prev => ({ ...prev, bookings: snapshot.size }));
        });

        const qMessages = query(collection(db, "chats"), where("isRead", "==", false));
        const unsubMessages = onSnapshot(qMessages, (snapshot) => {
            setNotifications(prev => ({ ...prev, messages: snapshot.size }));
        });

        return () => {
            unsubBookings();
            unsubMessages();
        }
    }, [userPermissions])

    // --- MAIN FILTERING LOGIC ---
    const filteredNavMain = data.navMain
        .map((group) => {
            // 1. Kung Super Admin, lahat kita.
            if (userData?.role === "Super Admin") return group;

            // 2. I-filter ang mga sub-items (Category, Inventory, etc.)
            const visibleItems = group.items.filter((item) => {
                const permissionValue = userData?.[item.id];
                // Ipakita kung "live" o boolean true (base sa screenshots mo)
                return permissionValue === "live" || permissionValue === true;
            });

            // 3. I-return lang ang group kung may kahit isang item na visible
            if (visibleItems.length > 0) {
                return {
                    ...group,
                    items: visibleItems.map((item) => {
                        // Idagdag ang badges para sa notification items
                        if (item.title === "Booking Request") return { ...item, badge: notifications.bookings }
                        if (item.title === "Messenger") return { ...item, badge: notifications.messages }
                        return item;
                    }),
                }
            }
            return null;
        })
        .filter((group): group is any => group !== null);

    const filteredProjects = data.projects.filter(project => {
        if (userData?.role === "Super Admin") return true;
        if (project.accessId === "always") return true;
        return userData?.[project.accessId] === "live" || userData?.[project.accessId] === true;
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
        if (userData?.role === "Super Admin") return <ShieldAlert className="size-5 text-red-500" />
        if (userData?.role === "Admin") return <ShieldCheck className="size-5 text-blue-500" />
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
                                    userData?.role === 'Super Admin' ? 'text-red-600' : 'text-muted-foreground'
                                }`}>
                                    {userData?.role || 'STAFF'} • PANEL
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
                <NavMain items={filteredNavMain} onViewChange={onNavigate} />
                <NavProjects projects={filteredProjects} onViewChange={onNavigate} />
            </SidebarContent>

            <SidebarFooter className="border-t border-border/40 p-3">
                <div className="flex items-center justify-start gap-1">
                    <button
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        className="p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all active:scale-90"
                    >
                        {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
                    </button>
                    <button
                        onClick={handleLogout}
                        className="p-2 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all active:scale-90"
                    >
                        <LogOut className="size-5" />
                    </button>
                </div>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}