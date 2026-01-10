// LoginForm.tsx
"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field"

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      toast.error("All fields are required")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/itlogin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Email: email, Password: password }),
      })

      const result = await res.json()
      console.log("Login API result:", result)

      if (res.ok && result.success) {
        // Block "enduser" role
        if (result.Role?.toLowerCase() === "enduser") {
          toast.error("End users cannot log in here")
          return
        }

        // Save info for allowed roles
        if (result.ReferenceID) {
          localStorage.setItem("refID", result.ReferenceID)
          localStorage.setItem("currentUser", JSON.stringify(result))
        }

        toast.success(result.message)
        setTimeout(() => router.push("/dashboard"), 1000)
      } else {
        toast.error(result.message || "Login failed")
      }
    } catch (err) {
      console.error(err)
      toast.error("Server error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn("w-full max-w-md mx-auto", className)} {...props}>
      <div className="bg-card border border-border rounded-xl shadow-lg p-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2">Welcome back</h1>
          <p className="text-muted-foreground text-sm">Sign in to your account to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <FieldGroup>
            <Field>
              <FieldLabel className="text-sm font-medium text-foreground">Email address</FieldLabel>
              <Input
                type="email"
                placeholder="you@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5"
              />
            </Field>

            <Field>
              <FieldLabel className="text-sm font-medium text-foreground">Password</FieldLabel>
              <Input
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5"
              />
            </Field>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white font-medium h-11 mt-2"
            >
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </FieldGroup>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <a
              href="/signup"
              className="font-medium text-[#16a34a] hover:text-[#15803d] hover:underline transition-colors"
            >
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}