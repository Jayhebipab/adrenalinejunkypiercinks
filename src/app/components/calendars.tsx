import * as React from "react"
import { Check, ChevronRight } from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"

// In-update ang Interface para tanggapin ang filter props
export function Calendars({
  calendars,
  activeFilter,
  onFilterChange,
}: {
  calendars: {
    name: string
    items: string[]
  }[]
  activeFilter: string;
  onFilterChange: (item: string) => void;
}) {
  return (
    <>
      {calendars.map((calendar, index) => (
        <React.Fragment key={calendar.name}>
          <SidebarGroup className="py-0">
         

<Collapsible
  defaultOpen={index === 0}
  className="group/collapsible"
>
  <SidebarGroupLabel
    asChild
    className="group/label text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground w-full text-sm"
  >
    <CollapsibleTrigger>
      {calendar.name}{" "}
      <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
    </CollapsibleTrigger>
  </SidebarGroupLabel>
  
  {/* DITO YUNG MALI KO, DAPAT COLLAPSIBLECONTENT ITO: */}
  <CollapsibleContent> 
    <SidebarGroupContent>
      <SidebarMenu>
        {calendar.items.map((item) => (
          <SidebarMenuItem key={item}>
            <SidebarMenuButton onClick={() => onFilterChange(item)}>
              <div
                data-active={activeFilter === item}
                className="group/calendar-item border-sidebar-border text-sidebar-primary-foreground data-[active=true]:border-sidebar-primary data-[active=true]:bg-sidebar-primary flex aspect-square size-4 shrink-0 items-center justify-center rounded-sm border"
              >
                <Check className="hidden size-3 group-data-[active=true]/calendar-item:block" />
              </div>
              <span className={activeFilter === item ? "font-bold" : ""}>
                {item}
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroupContent>
  </CollapsibleContent>
</Collapsible>
          </SidebarGroup>
          <SidebarSeparator className="mx-0" />
        </React.Fragment>
      ))}
    </>
  )
}