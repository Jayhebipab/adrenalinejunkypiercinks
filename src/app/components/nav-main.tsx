"use client"

import { ChevronRight, type LucideIcon } from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

// Updated interface — added groupBadge and badgeVariant
interface NavItem {
  title: string
  icon?: LucideIcon
  isActive?: boolean
  groupBadge?: number // Total count shown on group header (bookings + messages + sessions, etc.)
  items?: {
    title: string
    id: string
    badge?: number
    badgeVariant?: string // "session" | "order" | undefined (default = red)
  }[]
}

export function NavMain({
  items,
  onViewChange,
}: {
  items: NavItem[]
  onViewChange: (id: string) => void
}) {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible key={item.title} asChild defaultOpen={item.isActive} className="group/collapsible">
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip={item.title} className="relative">
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>

                  {/* ── GROUP BADGE ─────────────────────────────────────────────
                      Collapsed sidebar → pulsing dot sa icon corner
                      Expanded sidebar  → number pill bago ang chevron
                  ──────────────────────────────────────────────────────────── */}
                  {item.groupBadge && item.groupBadge > 0 && (
                    isCollapsed ? (
                      <span className="absolute top-1.5 right-1.5 flex h-2 w-2 pointer-events-none">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                      </span>
                    ) : (
                      <span className="ml-auto mr-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-black text-white shadow-sm shrink-0">
                        {item.groupBadge > 99 ? "99+" : item.groupBadge}
                      </span>
                    )
                  )}

                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.items?.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.title}>
                      <SidebarMenuSubButton asChild>
                        <button
                          onClick={() => onViewChange(subItem.id)}
                          className="cursor-pointer flex items-center justify-between w-full group/item"
                        >
                          <span className="truncate">{subItem.title}</span>

                          {/* ── PER-ITEM BADGE — color varies by type ── */}
                          {subItem.badge !== undefined && subItem.badge > 0 && (
                            <span className={cn(
                              "flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-black shadow-sm animate-pulse shrink-0",
                              subItem.badgeVariant === "session"
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : subItem.badgeVariant === "order"
                                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                  : "bg-red-600 text-white"
                            )}>
                              {subItem.badge > 99 ? "99+" : subItem.badge}
                            </span>
                          )}
                        </button>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}