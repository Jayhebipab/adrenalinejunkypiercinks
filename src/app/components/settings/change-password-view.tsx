"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function ChangePasswordView() {
    return (
        <div className="flex flex-col gap-6 p-8 max-w-2xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-2xl font-black uppercase italic">Security Settings</h1>
                <p className="text-muted-foreground text-sm">Update your administrator password frequently.</p>
            </div>
            
            <div className="space-y-4 border p-6 rounded-2xl bg-card">
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase">Current Password</label>
                    <Input type="password" placeholder="••••••••" className="bg-background" />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase">New Password</label>
                    <Input type="password" placeholder="••••••••" className="bg-background" />
                </div>
                <Button className="w-full font-bold uppercase">Update Password</Button>
            </div>
        </div>
    )
}