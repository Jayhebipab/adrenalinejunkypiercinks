"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Box, AlertTriangle } from "lucide-react"

export default function Inventory() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black italic uppercase tracking-tighter">Inventory Management</h2>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Box className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">452</div>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-red-600">Low Stock Alert</CardTitle>
            <AlertTriangle className="size-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">12 Items</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}