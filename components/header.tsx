"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Gamepad2, Menu, X, User, LogOut, BarChart3 } from "lucide-react"
import { useState } from "react"
import { useSession, signOut } from "@/lib/auth-client"
import { ThemeToggle } from "@/components/theme-toggle"
import { CompactRegionSelector } from "@/components/region-selector"
import RegionalLink from "@/components/regional-link"

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const isAdmin = session?.user?.role === "admin"

  const navigation = [
    { name: "Accueil", href: "/", useRegional: true },
    { name: "Consoles", href: "/consoles", useRegional: true },
    { name: "Recherche", href: "/recherche", useRegional: true },
    { name: "Collection", href: "/collection", useRegional: false },
    ...(isAdmin ? [{ name: "Admin", href: "/admin", useRegional: false }] : []),
  ]

  const isActive = (href: string) => {
    return pathname === href || (href !== "/" && pathname.startsWith(href))
  }

  const handleSignOut = async () => {
    await signOut()
    setIsUserMenuOpen(false)
    router.push('/')
  }

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-950/95">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <RegionalLink href="/" className="flex items-center gap-2">
            <Gamepad2 className="h-5 w-5 text-blue-600" />
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              <span className="hidden sm:inline">Super Retrogamers</span>
              <span className="sm:hidden">SR</span>
            </span>
          </RegionalLink>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navigation.map((item) => {
              const linkClassName = `text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              }`
              
              return item.useRegional ? (
                <RegionalLink
                  key={item.name}
                  href={item.href}
                  className={linkClassName}
                >
                  {item.name}
                </RegionalLink>
              ) : (
                <Link
                  key={item.name}
                  href={item.href}
                  className={linkClassName}
                >
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Desktop Auth Section */}
          <div className="hidden md:flex items-center gap-3">
            <CompactRegionSelector />
            <ThemeToggle />
            {isPending ? (
              <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
            ) : session?.user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <User className="h-4 w-4" />
                  <span>{session.user.name || session.user.email}</span>
                </button>
                
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900">
                    <Link
                      href="/dashboard"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      <BarChart3 className="h-4 w-4" />
                      Mon dashboard
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      <LogOut className="h-4 w-4" />
                      Se déconnecter
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                Se connecter
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-800">
            <nav className="py-4 space-y-2">
              {navigation.map((item) => {
                const mobileLinkClassName = `block px-4 py-2 text-base font-medium transition-colors ${
                  isActive(item.href)
                    ? "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/20"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800"
                }`
                
                return item.useRegional ? (
                  <RegionalLink
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={mobileLinkClassName}
                  >
                    {item.name}
                  </RegionalLink>
                ) : (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={mobileLinkClassName}
                  >
                    {item.name}
                  </Link>
                )
              })}
              
              {/* Mobile Auth Section */}
              <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
                {/* Region selector for mobile */}
                <div className="px-4 pb-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Région
                      </span>
                      <CompactRegionSelector />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Thème
                      </span>
                      <ThemeToggle />
                    </div>
                  </div>
                </div>
                
                {isPending ? (
                  <div className="mx-4 h-10 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
                ) : session?.user ? (
                  <div className="px-4 space-y-2">
                    <div className="flex items-center gap-2 py-2 text-sm text-gray-600 dark:text-gray-400">
                      <User className="h-4 w-4" />
                      <span>{session.user.name || session.user.email}</span>
                    </div>
                    <Link
                      href="/dashboard"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex w-full items-center gap-2 rounded-lg bg-blue-100 px-3 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:hover:bg-blue-900/50"
                    >
                      <BarChart3 className="h-4 w-4" />
                      Mon dashboard
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <LogOut className="h-4 w-4" />
                      Se déconnecter
                    </button>
                  </div>
                ) : (
                  <div className="px-4">
                    <Link
                      href="/login"
                      onClick={() => setIsMenuOpen(false)}
                      className="block w-full rounded-lg bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-blue-700"
                    >
                      Se connecter
                    </Link>
                  </div>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
