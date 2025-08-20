"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import Link from "next/link"
import { ArrowLeft, Filter, X, Search, Loader2 } from "lucide-react"
import { Console } from "@prisma/client"
import { GameWithConsole } from "@/lib/data-prisma"
import { ConsoleGamesFilters, loadConsoleGamesStream, countConsoleGamesStream } from "@/lib/actions/console-games-streaming-actions"
import { InfiniteConsoleGamesList, useConsoleGamesFilters, ConsoleGamesStats } from "@/components/console-games/infinite-console-games-list"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

interface ConsoleGamesClientProps {
  console: Console
  initialGames: GameWithConsole[]
  genres: Array<{genreName: string, count: number}>
}

export default function ConsoleGamesClient({ console: gameConsole, initialGames, genres }: ConsoleGamesClientProps) {
  const { filters, updateFilter, clearFilters } = useConsoleGamesFilters()
  const [currentGames, setCurrentGames] = useState<GameWithConsole[]>(initialGames)
  const [totalCount, setTotalCount] = useState(initialGames.length)
  const [loading, setLoading] = useState(false)
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)

  // Derived state for UI
  const hasActiveFilters = useMemo(() => 
    Object.values(filters).some(value => value && value !== 'all' && value.trim() !== ''),
    [filters]
  )

  // Refresh games when filters change
  const refreshGames = useCallback(async (newFilters: Omit<ConsoleGamesFilters, 'consoleSlug'>) => {
    setLoading(true)
    try {
      const [newGames, newTotalCount] = await Promise.all([
        loadConsoleGamesStream(0, 20, {
          consoleSlug: gameConsole.slug,
          ...newFilters
        }),
        countConsoleGamesStream({
          consoleSlug: gameConsole.slug,
          ...newFilters
        })
      ])
      
      setCurrentGames(newGames)
      setTotalCount(newTotalCount)
    } catch (err) {
      console.error('Error refreshing games:', err)
      setCurrentGames([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }, [gameConsole])

  // Handle filter changes with debouncing for search
  useEffect(() => {
    if (filters.searchQuery !== undefined) {
      // Clear existing timeout
      if (searchTimeout) {
        clearTimeout(searchTimeout)
      }

      // Set new timeout for search
      const timeout = setTimeout(() => {
        refreshGames(filters)
      }, 300)

      setSearchTimeout(timeout)

      return () => clearTimeout(timeout)
    } else {
      // Non-search filters trigger immediate refresh
      refreshGames(filters)
    }
  }, [filters, refreshGames, searchTimeout])

  const handleResetFilters = () => {
    clearFilters()
    setCurrentGames(initialGames)
    setTotalCount(initialGames.length)
  }

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Link
            href={`/consoles/${gameConsole.slug}`}
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à {gameConsole.name}
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
            Jeux {gameConsole.name}
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-300">
            Découvrez tous les jeux disponibles pour cette console légendaire avec chargement optimisé.
          </p>
        </div>

        {/* Filters Section */}
        <div className="mb-8 space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filtres et tri</h3>
              <Badge variant="outline" className="ml-2">
                {genres.length} genres disponibles
              </Badge>
              {loading && (
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              )}
            </div>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="flex items-center gap-1"
              >
                <X className="h-3 w-3" />
                Réinitialiser
              </Button>
            )}
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Rechercher un jeu, développeur, éditeur... (streaming)"
              value={filters.searchQuery || ''}
              onChange={(e) => updateFilter('searchQuery', e.target.value || undefined)}
              className="pl-10"
            />
            {filters.searchQuery && (
              <button
                onClick={() => updateFilter('searchQuery', undefined)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Genre Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Genre
              </label>
              <Select 
                value={filters.genreName || 'all'} 
                onValueChange={(value) => updateFilter('genreName', value === 'all' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les genres" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    Tous les genres ({genres.length})
                  </SelectItem>
                  {genres.map((genre) => (
                    <SelectItem key={genre.genreName} value={genre.genreName}>
                      {genre.genreName} ({genre.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Trier par
              </label>
              <Select 
                value={filters.sortBy || 'title'} 
                onValueChange={(value: "title" | "rating" | "releaseYear" | "createdAt") => updateFilter('sortBy', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="title">Titre</SelectItem>
                  <SelectItem value="rating">Note</SelectItem>
                  <SelectItem value="releaseYear">Année de sortie</SelectItem>
                  <SelectItem value="createdAt">Date d&apos;ajout</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ordre
              </label>
              <Select 
                value={filters.sortOrder || 'asc'} 
                onValueChange={(value: "asc" | "desc") => updateFilter('sortOrder', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">
                    {filters.sortBy === "title" ? "A → Z" : "Croissant"}
                  </SelectItem>
                  <SelectItem value="desc">
                    {filters.sortBy === "title" ? "Z → A" : "Décroissant"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200 dark:border-gray-600">
              <span className="text-sm text-gray-500 dark:text-gray-400">Filtres actifs :</span>
              {filters.searchQuery && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Recherche: &quot;{filters.searchQuery}&quot;
                  <button
                    onClick={() => updateFilter('searchQuery', undefined)}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.genreName && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Genre: {filters.genreName}
                  <button
                    onClick={() => updateFilter('genreName', undefined)}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {(filters.sortBy && filters.sortBy !== "title") || (filters.sortOrder && filters.sortOrder !== "asc") && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Tri: {filters.sortBy === "title" ? "Titre" : filters.sortBy === "rating" ? "Note" : filters.sortBy === "releaseYear" ? "Année" : "Date d&apos;ajout"} 
                  (croissant)
                  <button
                    onClick={() => {
                      updateFilter('sortBy', 'title')
                      updateFilter('sortOrder', 'asc')
                    }}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Stats */}
        <ConsoleGamesStats 
          totalGames={genres.reduce((sum, genre) => sum + genre.count, 0)}
          filteredCount={totalCount}
          loading={loading}
        />

        {/* Infinite Scroll Games List */}
        <InfiniteConsoleGamesList 
          initialGames={currentGames}
          consoleSlug={gameConsole.slug}
          filters={filters}
        />
      </div>
    </div>
  )
}