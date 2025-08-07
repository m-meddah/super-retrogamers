"use client"

import { useSession } from "@/lib/auth-client"
import { createContext, useContext, type ReactNode } from "react"
import NotificationSystem from "./notification-system"
import type { Session } from "@/lib/auth"

interface AuthContextType {
  user: Session["user"] | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider")
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const { data: session, isPending: isLoading } = useSession()
  const user = session?.user ?? null
  const isAuthenticated = !!session?.user

  return (
    <AuthContext.Provider value={{ user, session, isLoading, isAuthenticated }}>
      {children}
      <NotificationSystem />
    </AuthContext.Provider>
  )
}