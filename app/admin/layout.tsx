"use client"

import { Suspense } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  BarChart3,
  ArrowLeft,
  Database,
  Upload,
  Search
} from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  {
    title: "Vue d'ensemble",
    href: "/admin",
    icon: LayoutDashboard
  },
  {
    title: "Utilisateurs",
    href: "/admin/users",
    icon: Users
  },
  {
    title: "Contenu",
    href: "/admin/content",
    icon: Database
  },
  {
    title: "Scraping",
    href: "/admin/scraping",
    icon: Upload
  },
  {
    title: "Recherche Screenscraper",
    href: "/admin/screenscraper-search",
    icon: Search
  },
  {
    title: "Statistiques",
    href: "/admin/analytics",
    icon: BarChart3
  },
  {
    title: "Paramètres",
    href: "/admin/settings",
    icon: Settings
  }
]

function AdminNavigation() {
  const pathname = usePathname()
  return (
    <div className="w-64 min-h-screen bg-background border-r">
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-6">
          <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg" />
          <div>
            <h2 className="font-semibold">Admin Panel</h2>
            <p className="text-sm text-muted-foreground">Super Retrogamers</p>
          </div>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href}>
                <Button 
                  variant={isActive ? "default" : "ghost"} 
                  className={cn(
                    "w-full justify-start",
                    "hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {item.title}
                </Button>
              </Link>
            )
          })}
        </nav>

        <div className="mt-8 pt-4 border-t">
          <Link href="/">
            <Button variant="outline" className="w-full justify-start">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour au site
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function AdminLayout({
  children}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <AdminNavigation />
        <main className="flex-1">
          <Suspense fallback={
            <div className="p-6">
              <div className="space-y-6">
                <div className="h-8 w-64 bg-muted animate-pulse rounded" />
                <div className="h-4 w-96 bg-muted animate-pulse rounded" />
                <div className="grid gap-4 md:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i} className="p-6">
                      <div className="space-y-2">
                        <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                        <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          }>
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  )
}