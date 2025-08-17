import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Suspense } from "react"
import "./globals.css"
import Header from "@/components/header"
import AuthProvider from "@/components/auth-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import RegionInitializer from "@/components/region-initializer"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Super Retrogamers - スーパーレトロゲーマー",
  description: "Découvrez l'histoire des consoles rétro et leurs jeux légendaires. Votre portail vers les classiques du jeu vidéo.",
  keywords: ["retrogaming", "console", "jeux vidéo", "rétro", "gaming", "super retrogamers"],
  authors: [{ name: "Super Retrogamers" }],
  creator: "Super Retrogamers",
  publisher: "Super Retrogamers",
  robots: "index, follow",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" }
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180" }
    ],
  },
  openGraph: {
    title: "Super Retrogamers - スーパーレトロゲーマー",
    description: "Découvrez l'histoire des consoles rétro et leurs jeux légendaires",
    type: "website",
    locale: "fr_FR",
    siteName: "Super Retrogamers",
  },
  twitter: {
    card: "summary_large_image",
    title: "Super Retrogamers - スーパーレトロゲーマー",
    description: "Découvrez l'histoire des consoles rétro et leurs jeux légendaires",
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          defaultTheme="system"
          storageKey="super-retrogamers-theme"
        >
          <NuqsAdapter>
            <AuthProvider>
              <RegionInitializer />
              <Suspense fallback={<div className="h-14 bg-white dark:bg-gray-950" />}>
                <Header />
              </Suspense>
              <main>{children}</main>
              <Toaster />
            </AuthProvider>
          </NuqsAdapter>
        </ThemeProvider>
      </body>
    </html>
  )
}
