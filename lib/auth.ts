import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { nextCookies } from "better-auth/next-js"
import { prisma } from "@/lib/prisma"

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  
  // Email & Password Authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Désactivé pour le développement
  },
  
  // Configuration des sessions
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 jours
    updateAge: 60 * 60 * 24, // 1 jour
  },
  
  // Configuration avancée
  advanced: {
    cookiePrefix: "super-retrogamers",
  },
  
  // Extensions du schéma utilisateur
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "user",
        input: false,
        returned: true,
      },
    },
  },
  
  // Plugins
  plugins: [
    nextCookies() // Pour le support des Server Actions
  ],
})

// Export des types pour TypeScript
export type Session = typeof auth.$Infer.Session