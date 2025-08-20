"use client"

import { createAuthClient } from "better-auth/react"
import { inferAdditionalFields } from "better-auth/client/plugins"
import type { auth } from "@/lib/auth"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
  plugins: [
    inferAdditionalFields<typeof auth>(),
  ]})

export const { 
  signIn, 
  signUp, 
  signOut, 
  useSession,
  getSession} = authClient

// Helper function to force refresh session from database
export const forceRefreshSession = async () => {
  return await authClient.getSession({ 
    query: { disableCookieCache: true }
  })
}