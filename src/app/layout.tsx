"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Skull } from "lucide-react"
import { SessionProvider } from "next-auth/react" // Import ito
import "./globals.css"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mounted, setMounted] = useState(false)
  const [hackerDetected, setHackerDetected] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)

    // 1. SECURITY CHECK: Lockdown check (100-year ban)
    const isBanned = localStorage.getItem("SYSTEM_LOCKDOWN")
    if (isBanned === "TRUE") {
      setHackerDetected(true)
      return
    }

    // 2. AUTH CHECK: Kapag nasa admin-panel (Existing localStorage check)
    // Note: Sa future, pwede na nating gamitin dito ang 'session' mula sa NextAuth
    const checkAuth = () => {
      const user = localStorage.getItem("user")
      if (pathname.startsWith('/admin-panel') && !user) {
        router.push('/login')
      }
    }

    checkAuth()
    window.addEventListener('storage', checkAuth)
    return () => window.removeEventListener('storage', checkAuth)

  }, [pathname, router])

  if (!mounted) {
    return (
      <html lang="en">
        <body className="bg-black"></body>
      </html>
    )
  }

  return (
    <html lang="en">
      <body className="antialiased">
        {/* I-wrap natin lahat sa SessionProvider para gumana ang Google Sign-in */}
        <SessionProvider>
          {hackerDetected ? (
            /* --- BANNED UI --- */
            <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-[9999]">
              <Skull size={120} className="text-red-600 animate-pulse" />
              <h1 className="text-7xl font-black uppercase italic tracking-tighter text-red-600">Banned</h1>
              <p className="text-zinc-500 font-bold uppercase tracking-[0.5em] text-[10px] mt-4">Access Revoked Permanently</p>
            </div>
          ) : (
            children
          )}
        </SessionProvider>
      </body>
    </html>
  )
}