"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Skull } from "lucide-react";
import { SessionProvider } from "next-auth/react";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const [hackerDetected, setHackerDetected] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);

    // 1. SECURITY CHECK: Lockdown check (100-year ban)
    const isBanned = localStorage.getItem("SYSTEM_LOCKDOWN");
    if (isBanned === "TRUE") {
      setHackerDetected(true);
      return;
    }

    // 2. AUTH CHECK: Kapag nasa admin-panel
    const checkAuth = () => {
      const user = localStorage.getItem("user");
      if (pathname.startsWith('/admin-panel') && !user) {
        router.push('/login');
      }
    };

    checkAuth();
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, [pathname, router]);

  // Prevent Hydration Mismatch by returning a consistent basic structure
  if (!mounted) {
    return (
      <html lang="en">
        <body className="bg-black text-white" suppressHydrationWarning>
          {/* Empty or loading state during SSR/Initial hydration */}
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <body 
        className="antialiased" 
        suppressHydrationWarning // Fixes the browser extension (Grammarly) error
      >
        <SessionProvider>
          {hackerDetected ? (
            /* --- BANNED UI --- */
            <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-[9999]">
              <Skull size={120} className="text-red-600 animate-pulse" />
              <h1 className="text-7xl font-black uppercase italic tracking-tighter text-red-600">
                Banned
              </h1>
              <p className="text-zinc-500 font-bold uppercase tracking-[0.5em] text-[10px] mt-4">
                Access Revoked Permanently
              </p>
            </div>
          ) : (
            children
          )}
        </SessionProvider>
      </body>
    </html>
  );
}