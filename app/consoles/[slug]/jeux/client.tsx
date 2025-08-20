"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { ArrowLeft, Gamepad2, Filter, X, SortAsc, SortDesc, Hash, Search } from "lucide-react"
import { Console } from "@prisma/client"
import { GameWithConsole } from "@/lib/data-prisma"
import GameCardRegionalWrapper from "@/components/game-card-regional-wrapper"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

interface ConsoleGamesClientProps {
  console: Console
  initialGames: GameWithConsole[]
  genres: Array<{genreName: string, count: number}>
}

export default function ConsoleGamesClient({ console, initialGames, genres }: ConsoleGamesClientProps) {
  const [selectedGenre, setSelectedGenre] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"title" | "rating" | "releaseYear">("title")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [searchQuery, setSearchQuery] = useState<string>("")

  // Filter and sort games based on selected criteria
  const filteredAndSortedGames = useMemo(() => {
    let filtered = initialGames

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(game => 
        game.title.toLowerCase().includes(query) ||
        game.corporationDev?.name?.toLowerCase().includes(query) ||
        game.corporationPub?.name?.toLowerCase().includes(query) ||
        game.genre?.name?.toLowerCase().includes(query) ||
        game.genres?.some(g => g.genreName.toLowerCase().includes(query))
      )
    }

    // Filter by genre
    if (selectedGenre !== "all") {
      filtered = filtered.filter(game => 
        game.genre?.name === selectedGenre ||
        game.genres?.some(g => g.genreName === selectedGenre)
      )
    }

    // Sort games
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case "title":
          comparison = a.title.localeCompare(b.title)
          break
        case "rating":
          const ratingA = a.rating || 0
          const ratingB = b.rating || 0
          comparison = ratingA - ratingB
          break
        case "releaseYear":
          const yearA = a.releaseYear || 0
          const yearB = b.releaseYear || 0
          comparison = yearA - yearB
          break
        default:
          comparison = 0
      }
      
      return sortOrder === "asc" ? comparison : -comparison
    })

    return sorted
  }, [initialGames, selectedGenre, sortBy, sortOrder, searchQuery])

  const resetFilters = () => {
    setSelectedGenre("all")
    setSortBy("title")
    setSortOrder("asc")
    setSearchQuery("")
  }

  const hasActiveFilters = selectedGenre !== "all" || sortBy !== "title" || sortOrder !== "asc" || searchQuery.trim() !== ""

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Link
            href={`/consoles/${console.slug}`}
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à {console.name}
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
            Jeux {console.name}
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-300">
            Découvrez tous les jeux disponibles pour cette console légendaire.
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
            </div>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
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
              placeholder="Rechercher un jeu, développeur, éditeur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
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
              <Select value={selectedGenre} onValueChange={setSelectedGenre}>
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
              <Select value={sortBy} onValueChange={(value: "title" | "rating" | "releaseYear") => setSortBy(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="title">Titre</SelectItem>
                  <SelectItem value="rating">Note</SelectItem>
                  <SelectItem value="releaseYear">Année de sortie</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ordre
              </label>
              <Select value={sortOrder} onValueChange={(value: "asc" | "desc") => setSortOrder(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">
                    {sortBy === "title" ? "A → Z" : "Croissant"}
                  </SelectItem>
                  <SelectItem value="desc">
                    {sortBy === "title" ? "Z → A" : "Décroissant"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200 dark:border-gray-600">
              <span className="text-sm text-gray-500 dark:text-gray-400">Filtres actifs :</span>
              {searchQuery.trim() && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Recherche: &quot;{searchQuery}&quot;
                  <button
                    onClick={() => setSearchQuery("")}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {selectedGenre !== "all" && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Genre: {selectedGenre}
                  <button
                    onClick={() => setSelectedGenre("all")}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {(sortBy !== "title" || sortOrder !== "asc") && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Tri: {sortBy === "title" ? "Titre" : sortBy === "rating" ? "Note" : "Année"} 
                  ({sortOrder === "asc" ? "croissant" : "décroissant"})
                  <button
                    onClick={() => {
                      setSortBy("title")
                      setSortOrder("asc")
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
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {filteredAndSortedGames.length} jeu{filteredAndSortedGames.length > 1 ? 'x' : ''}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  sur {initialGames.length} total
                </span>
              </div>
              {selectedGenre !== "all" && (
                <Badge variant="default" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {selectedGenre}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              {sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              <span>
                Trié par {sortBy === "title" ? "titre" : sortBy === "rating" ? "note" : "année"}
              </span>
            </div>
          </div>
        </div>

        {/* Games Grid */}
        {filteredAndSortedGames.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredAndSortedGames.map((game) => (
              <GameCardRegionalWrapper key={game.id} game={game} showConsole={false} />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <Gamepad2 className="mx-auto mb-4 h-16 w-16 text-gray-400" />
            <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
              {searchQuery.trim() ? 
                `Aucun jeu trouvé pour &quot;${searchQuery}&quot;` :
                selectedGenre !== "all" ? 
                  `Aucun jeu trouvé pour le genre &quot;${selectedGenre}&quot;` : 
                  "Aucun jeu disponible"
              }
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchQuery.trim() || selectedGenre !== "all" ? 
                "Essayez de modifier vos critères de recherche ou de réinitialiser les filtres." :
                "Les jeux pour cette console seront bientôt ajoutés."
              }
            </p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={resetFilters}
                className="mt-4"
              >
                Réinitialiser les filtres
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}