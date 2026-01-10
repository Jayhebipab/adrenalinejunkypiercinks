"use client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default function BookingRequest() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-black italic uppercase tracking-tighter">New Booking Requests</h2>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Preferred Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Juan Dela Cruz</TableCell>
              <TableCell>Full Back Tattoo</TableCell>
              <TableCell>Jan 25, 2026</TableCell>
              <TableCell><Badge variant="secondary">Pending</Badge></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  )
}