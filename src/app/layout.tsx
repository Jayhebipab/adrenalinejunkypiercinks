"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Skull } from "lucide-react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes"; // <--- Add this
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

    const isBanned = localStorage.getItem("SYSTEM_LOCKDOWN");
    if (isBanned === "TRUE") {
      setHackerDetected(true);
      return;
    }

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

  if (!mounted) {
    return (
      <html lang="en" suppressHydrationWarning>
        <body className="bg-background text-foreground" />
      </html>
    );
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground transition-colors duration-300">
        <SessionProvider>
          {/* Dito nakasalalay ang Dark Mode toggle mo */}
          <ThemeProvider 
            attribute="class" 
            defaultTheme="system" 
            enableSystem
            disableTransitionOnChange
          >
            {hackerDetected ? (
              /* --- BANNED UI --- */
              /* In-apply ko na yung v4 fix dito: z-9999 instead of z-[9999] */
              <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-9999">
                <Skull size={120} className="text-red-600 animate-pulse" />
                <h1 className="text-7xl font-black uppercase italic tracking-tighter text-red-600">
                  Banned
                </h1>
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-4">
                  Access Revoked Permanently
                </p>
              </div>
            ) : (
              children
            )}
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}