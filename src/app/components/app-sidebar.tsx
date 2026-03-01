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
    useSidebar,
} from "@/components/ui/sidebar"

const data = {
    navMain: [
        {
            title: "Reservation",
            icon: CalendarCheck,
            id: "reservations",
            items: [
                { title: "List", id: "List" },
                { title: "Booking Request", id: "BookingRequest" },
                { title: "Messenger", id: "Messenger" },
            ],
        },
        {
            title: "Shop",
            icon: Store,
            id: "shop",
            items: [
                //{ title: "Product", id: "Product" },
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
                //{ title: "Inventory", id: "Inventory" },
                { title: "Product & Materials", id: "Product&Materials" },
                { title: "Category", id: "Category" },
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
        { name: "Change Password", id: "ChangePassword", icon: KeyRound, accessId: "always", hideForSuperAdmin: true },
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
    const [notifications, setNotifications] = useState({
        bookings: 0,   // pending booking requests
        messages: 0,   // unread chat messages
        sessions: 0,   // approved sessions happening TODAY
        orders: 0,     // pending orders
    })
    const [userData, setUserData] = useState<any>(null)

    const { isMobile, setOpenMobile } = useSidebar()

    useEffect(() => {
        setMounted(true)
        if (userPermissions) {
            setUserData(userPermissions)
        } else {
            const savedUser = localStorage.getItem("user")
            if (savedUser) {
                try { setUserData(JSON.parse(savedUser)) } catch (e) { console.error(e) }
            }
        }

        // ── 1. Pending booking requests ───────────────────────────────────────
        const qBookings = query(collection(db, "bookings"), where("status", "==", "pending"));
        const unsubBookings = onSnapshot(qBookings, (snap) => {
            setNotifications(prev => ({ ...prev, bookings: snap.size }));
        });

        // ── 2. Unread chat messages ───────────────────────────────────────────
        const qMessages = query(collection(db, "chats"), where("isRead", "==", false));
        const unsubMessages = onSnapshot(qMessages, (snap) => {
            setNotifications(prev => ({ ...prev, messages: snap.size }));
        });

        // ── 3. Today's approved sessions (tattoo / piercing) ─────────────────
        // We listen to all "approved" bookings and filter client-side by today's date
        // because Firestore can't do date range queries on string fields easily.
        const qSessions = query(collection(db, "bookings"), where("status", "==", "approved"));
        const unsubSessions = onSnapshot(qSessions, (snap) => {
            const todayStr = new Date().toDateString();
            let todayCount = 0;
            snap.forEach(doc => {
                const data = doc.data();
                const raw = data.preferredDate;
                if (!raw) return;
                // Handle both Firestore Timestamp and plain string
                let d: Date;
                if (raw?.seconds) {
                    d = new Date(raw.seconds * 1000);
                } else {
                    d = new Date(raw);
                }
                if (!isNaN(d.getTime()) && d.toDateString() === todayStr) {
                    todayCount++;
                }
            });
            setNotifications(prev => ({ ...prev, sessions: todayCount }));
        });

        // ── 4. Pending orders ─────────────────────────────────────────────────
        const qOrders = query(collection(db, "orders"), where("status", "==", "Pending"));
        const unsubOrders = onSnapshot(qOrders, (snap) => {
            setNotifications(prev => ({ ...prev, orders: snap.size }));
        });

        return () => {
            unsubBookings();
            unsubMessages();
            unsubSessions();
            unsubOrders();
        }
    }, [userPermissions])

    const handleNavigate = (view: string) => {
        onNavigate(view)
        if (isMobile) setOpenMobile(false)
    }

    // ── Inject badges into nav items ──────────────────────────────────────────
    const filteredNavMain = data.navMain
        .map((group) => {
            if (userData?.role === "Super Admin") return injectBadges(group, notifications);

            const visibleItems = group.items.filter((item) => {
                const permissionValue = userData?.[item.id];
                return permissionValue === "live" || permissionValue === true;
            });

            if (visibleItems.length > 0) {
                return injectBadges({ ...group, items: visibleItems }, notifications);
            }
            return null;
        })
        .filter((group): group is any => group !== null);

    const filteredProjects = data.projects.filter(project => {
        if (project.hideForSuperAdmin && userData?.role === "Super Admin") return false;
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
                            onClick={() => handleNavigate("Dashboard")}
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

                            {/* ── GLOBAL NOTIF DOT on header (collapsed sidebar) ── */}
                            {(notifications.bookings > 0 || notifications.messages > 0 || notifications.sessions > 0 || notifications.orders > 0) && (
                                <span className="absolute top-3 right-3 flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                                </span>
                            )}
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
                                onClick={() => handleNavigate("Dashboard")}
                                className="hover:bg-primary/10 hover:text-primary transition-colors group cursor-pointer h-11"
                            >
                                <LayoutDashboard className="group-hover:text-primary size-5" />
                                <span className="font-bold text-sm uppercase tracking-tight">Dashboard</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </div>
                <NavMain items={filteredNavMain} onViewChange={handleNavigate} />
                <NavProjects projects={filteredProjects} onViewChange={handleNavigate} />
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

// ─── HELPER: inject badges per nav item ──────────────────────────────────────
function injectBadges(
    group: any,
    notifications: { bookings: number; messages: number; sessions: number; orders: number }
) {
    return {
        ...group,
        items: group.items.map((item: any) => {
            if (item.title === "Booking Request")
                return { ...item, badge: notifications.bookings };

            if (item.title === "Messenger")
                return { ...item, badge: notifications.messages };

            // "List" = Active Projects — shows today's session count
            if (item.title === "List")
                return {
                    ...item,
                    badge: notifications.sessions,
                    // custom color hint so NavMain can style it differently (orange = today)
                    badgeVariant: "session",
                };

            // "Checkout" = Orders — shows pending order count
            if (item.title === "Checkout")
                return {
                    ...item,
                    badge: notifications.orders,
                    badgeVariant: "order",
                };

            return item;
        }),
    };
}