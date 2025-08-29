"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { Menu, X, User, LogOut, BarChart3 } from "lucide-react"
import { useState } from "react"
import { signOut } from "@/lib/auth-client"
import { ThemeToggle } from "@/components/theme-toggle"
import { CompactRegionSelector } from "@/components/region-selector"
import RegionalLink from "@/components/regional-link"

interface HeaderClientProps {
  session: any
}

export default function HeaderClient({ session }: HeaderClientProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  
  const isAdmin = session?.user?.role === "admin"

  const navigation = [
    { name: "Accueil", href: "/", useRegional: true },
    { name: "Consoles", href: "/consoles", useRegional: true },
    { name: "Recherche", href: "/search", useRegional: true },
    { name: "Collection", href: "/collection", useRegional: true },
    ...(isAdmin ? [{ name: "Admin", href: "/admin", useRegional: true }] : []),
  ]

  const isActive = (href: string) => {
    return pathname === href || (href !== "/" && pathname.startsWith(href))
  }

  const handleSignOut = async () => {
    await signOut()
    setIsUserMenuOpen(false)
    // Forcer un rechargement complet pour mettre à jour le header serveur
    window.location.href = '/'
  }

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-950/95">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <RegionalLink href="/" className="flex items-center gap-2">
            <div className="flex items-center">
              {/* Logo complet sur desktop */}
              <div className="hidden sm:block">
                <Image
                  src="/logo-simple.svg"
                  alt="Super Retrogamers - スーパーレトロゲーマー"
                  width={200}
                  height={50}
                  className="h-8 w-auto"
                />
              </div>
              {/* Logo compact sur mobile */}
              <div className="sm:hidden">
                <Image
                  src="/logo-compact.svg"
                  alt="SR"
                  width={40}
                  height={40}
                  className="h-8 w-8"
                />
              </div>
            </div>
          </RegionalLink>

          {/* Desktop Navigation */}
          <nav className="hidden md:block">
            <div className="flex items-center gap-1">
              {navigation.map((item) => {
                const LinkComponent = item.useRegional ? RegionalLink : Link
                return (
                  <LinkComponent
                    key={item.name}
                    href={item.href}
                    className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? "bg-gray-200 text-gray-900 dark:bg-gray-800 dark:text-white"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                    }`}
                  >
                    {item.name}
                  </LinkComponent>
                )
              })}
            </div>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Region Selector */}
            <CompactRegionSelector />
            
            {/* Theme toggle */}
            <ThemeToggle />
            
            {/* User menu */}
            {session ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                >
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {isAdmin ? "Administrateur" : session.user?.name || session.user?.email}
                  </span>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-950">
                    <div className="p-2">
                      <p className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                        Connecté en tant que
                      </p>
                      <p className="px-3 py-1 text-sm font-medium text-gray-900 dark:text-white truncate">
                        {session.user?.email}
                      </p>
                      <div className="my-1 border-t border-gray-200 dark:border-gray-800" />
                      
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <User className="h-4 w-4" />
                        Tableau de bord
                      </Link>
                      
                      <div className="my-1 border-t border-gray-200 dark:border-gray-800" />
                      <button
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                      >
                        <LogOut className="h-4 w-4" />
                        Se déconnecter
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
              >
                Se connecter
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="rounded-md p-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white md:hidden"
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="border-t border-gray-200 pb-3 pt-2 dark:border-gray-800 md:hidden">
            <div className="space-y-1">
              {navigation.map((item) => {
                const LinkComponent = item.useRegional ? RegionalLink : Link
                return (
                  <LinkComponent
                    key={item.name}
                    href={item.href}
                    className={`block rounded-md px-3 py-2 text-base font-medium ${
                      isActive(item.href)
                        ? "bg-gray-200 text-gray-900 dark:bg-gray-800 dark:text-white"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </LinkComponent>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}