import { Calendar } from "@/components/ui/calendar"
import {
  SidebarGroup,
  SidebarGroupContent,
} from "@/components/ui/sidebar"

// Idinagdag natin itong interface para hindi na mag-error ang TypeScript sa main page
interface DatePickerProps {
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
}

export function DatePicker({ selected, onSelect }: DatePickerProps) {
  return (
    <SidebarGroup className="px-0">
      <SidebarGroupContent>
        <Calendar 
          mode="single" // Kailangan ito para gumana ang selection
          selected={selected} 
          onSelect={onSelect}
          className="[&_[role=gridcell].bg-accent]:bg-sidebar-primary [&_[role=gridcell].bg-accent]:text-sidebar-primary-foreground [&_[role=gridcell]]:w-[33px]" 
        />
      </SidebarGroupContent>
    </SidebarGroup>
  )
}