'use client'

import { useEffect, useCallback, Suspense } from 'react'
import { Search, Filter, X } from 'lucide-react'
import { useCurrentRegion } from '@/lib/hooks/use-persistent-region'
import { GameWithConsole } from '@/lib/data-prisma'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { searchGamesAction, getSearchMetadataAction, type SearchFilters, type SearchResult } from '@/lib/actions/search-actions'
import { useQueryState, parseAsInteger, parseAsBoolean } from 'nuqs'
import { useState } from 'react'

// Simple GameCard component for search results
function SimpleSearchGameCard({ game }: { game: GameWithConsole }) {
  const currentRegion = useCurrentRegion()
  
  const gameSlug = game.console?.slug ? 
    `${game.slug}-console-${game.console.slug}` : 
    game.slug

  return (
    <div className="group relative">
      <article className="overflow-hidden rounded-lg border border-gray-200 bg-white transition-all duration-200 hover:border-gray-300 hover:shadow-sm dark:border-gray-800 dark:bg-gray-950 dark:hover:border-gray-700">
        <div className="relative aspect-[3/4] overflow-hidden bg-gray-100 dark:bg-gray-800">
          <div className="flex h-full items-center justify-center text-gray-400 dark:text-gray-600">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>
        
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-base font-medium text-gray-900 dark:text-white line-clamp-2 leading-tight">
              <a 
                href={`/games/${gameSlug}?region=${currentRegion}`}
                className="hover:text-blue-600 dark:hover:text-blue-400"
              >
                {game.title}
              </a>
            </h3>
            {game.rating && (
              <div className="flex items-center gap-1 shrink-0">
                <svg className="h-3 w-3 fill-amber-400 text-amber-400" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  {game.rating}/20
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500 mb-2">
            {game.genre?.name && <span>{game.genre.name}</span>}
            {game.genre?.name && game.releaseYear && <span>•</span>}
            {game.releaseYear && <span>{game.releaseYear}</span>}
          </div>
          
          {game.console?.name && (
            <div className="flex flex-wrap items-center gap-1">
              <span className="inline-block rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                {game.console.name}
              </span>
            </div>
          )}
        </div>
      </article>
    </div>
  )
}

function SearchContent() {
  // URL query state management with nuqs
  const [query, setQuery] = useQueryState('q', { defaultValue: '', shallow: false })
  const [consoleFilter, setConsoleFilter] = useQueryState('console', { defaultValue: 'all', shallow: false })
  const [genreFilter, setGenreFilter] = useQueryState('genre', { defaultValue: 'all', shallow: false })
  const [minRating, setMinRating] = useQueryState('minRating', parseAsInteger.withDefault(0))
  const [maxRating, setMaxRating] = useQueryState('maxRating', parseAsInteger.withDefault(20))
  const [yearFrom, setYearFrom] = useQueryState('yearFrom', { defaultValue: '', shallow: false })
  const [yearTo, setYearTo] = useQueryState('yearTo', { defaultValue: '', shallow: false })
  const [playerCount, setPlayerCount] = useQueryState('playerCount', { defaultValue: 'all', shallow: false })
  const [topStaff, setTopStaff] = useQueryState('topStaff', parseAsBoolean.withDefault(false))
  const [showFilters, setShowFilters] = useQueryState('filters', parseAsBoolean.withDefault(false))
  
  const [results, setResults] = useState<SearchResult>({ games: [], totalCount: 0, consoles: [], genres: [] })
  const [loading, setLoading] = useState(false)

  const performSearch = useCallback(async () => {
    setLoading(true)
    try {
      // Conversion des filtres client vers le format server action
      const searchFilters: SearchFilters = {
        query: query || undefined,
        console: (consoleFilter && consoleFilter !== 'all') ? consoleFilter : undefined,
        genre: (genreFilter && genreFilter !== 'all') ? genreFilter : undefined,
        minRating: minRating > 0 ? minRating : undefined,
        maxRating: maxRating < 20 ? maxRating : undefined,
        yearFrom: yearFrom ? parseInt(yearFrom) : undefined,
        yearTo: yearTo ? parseInt(yearTo) : undefined,
        playerCount: (playerCount && playerCount !== 'all') ? playerCount : undefined,
        topStaff: topStaff || undefined
      }

      // Utiliser uniquement la recherche locale (Screenscraper réservé aux admins)
      const searchResults = await searchGamesAction(searchFilters)
      setResults(prev => ({ 
        ...searchResults, 
        consoles: prev.consoles, 
        genres: prev.genres 
      }))
    } catch (error) {
      console.error('Erreur lors de la recherche:', error)
    } finally {
      setLoading(false)
    }
  }, [query, consoleFilter, genreFilter, minRating, maxRating, yearFrom, yearTo, playerCount, topStaff])

  const loadMetadata = async () => {
    try {
      const metadata = await getSearchMetadataAction()
      setResults(prev => ({ 
        ...prev, 
        consoles: metadata.consoles, 
        genres: metadata.genres 
      }))
    } catch (error) {
      console.error('Erreur lors du chargement des métadonnées:', error)
    }
  }

  // Chargement initial des métadonnées
  useEffect(() => {
    loadMetadata()
  }, [])

  // Recherche avec debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch()
    }, 300)

    return () => clearTimeout(timer)
  }, [performSearch])

  const resetFilters = async () => {
    await Promise.all([
      setConsoleFilter('all'),
      setGenreFilter('all'),
      setMinRating(0),
      setMaxRating(20),
      setYearFrom(''),
      setYearTo(''),
      setPlayerCount('all'),
      setTopStaff(false)
    ])
  }

  const hasActiveFilters = consoleFilter !== 'all' || 
                         genreFilter !== 'all' || 
                         minRating > 0 || 
                         maxRating < 20 || 
                         yearFrom !== '' || 
                         yearTo !== '' || 
                         playerCount !== 'all' || 
                         topStaff

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
            Recherche avancée
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Trouvez vos jeux rétro préférés avec des filtres avancés
          </p>
        </div>

        {/* Barre de recherche principale */}
        <div className="mb-6 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Rechercher par titre, développeur, éditeur..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filtres
            {hasActiveFilters && (
              <span className="rounded-full bg-blue-600 px-2 py-1 text-xs text-white">
                Actifs
              </span>
            )}
          </Button>
        </div>

        {/* Panneau de filtres */}
        {showFilters && (
          <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Filtres avancés
              </h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={resetFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Réinitialiser
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowFilters(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Console */}
              <div className="space-y-2">
                <Label>Console</Label>
                <Select value={consoleFilter} onValueChange={setConsoleFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les consoles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les consoles</SelectItem>
                    {results.consoles.map((console) => (
                      <SelectItem key={console.slug} value={console.slug}>
                        {console.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Genre */}
              <div className="space-y-2">
                <Label>Genre</Label>
                <Select value={genreFilter} onValueChange={setGenreFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les genres" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les genres</SelectItem>
                    {results.genres.map((genre) => (
                      <SelectItem key={genre} value={genre}>
                        {genre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Note */}
              <div className="space-y-2">
                <Label>Note Screenscraper</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    max="20"
                    placeholder="Min"
                    value={minRating || ''}
                    onChange={(e) => setMinRating(parseInt(e.target.value) || 0)}
                    className="w-20"
                  />
                  <span className="text-gray-500">-</span>
                  <Input
                    type="number"
                    min="0"
                    max="20"
                    placeholder="Max"
                    value={maxRating === 20 ? '' : maxRating}
                    onChange={(e) => setMaxRating(parseInt(e.target.value) || 20)}
                    className="w-20"
                  />
                </div>
              </div>

              {/* Année */}
              <div className="space-y-2">
                <Label>Année de sortie</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1970"
                    max="2030"
                    placeholder="De"
                    value={yearFrom}
                    onChange={(e) => setYearFrom(e.target.value)}
                    className="w-24"
                  />
                  <span className="text-gray-500">-</span>
                  <Input
                    type="number"
                    min="1970"
                    max="2030"
                    placeholder="À"
                    value={yearTo}
                    onChange={(e) => setYearTo(e.target.value)}
                    className="w-24"
                  />
                </div>
              </div>

              {/* Nombre de joueurs */}
              <div className="space-y-2">
                <Label>Nombre de joueurs</Label>
                <Select value={playerCount} onValueChange={setPlayerCount}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="1">1 joueur</SelectItem>
                    <SelectItem value="2">2 joueurs</SelectItem>
                    <SelectItem value="multijoueur">Multijoueur (3+)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Checkboxes pour les drapeaux ROM */}
            <div className="mt-6 border-t border-gray-200 pt-6 dark:border-gray-700">
              <Label className="mb-3 block text-sm font-medium">Types de versions</Label>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="topStaff"
                    checked={topStaff}
                    onCheckedChange={(checked) => setTopStaff(checked === true)}
                  />
                  <Label htmlFor="topStaff" className="text-sm">TOP Staff Screenscraper</Label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Résultats */}
        <div className="mb-6 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-gray-600 dark:text-gray-400">
              {loading ? 'Recherche en cours...' : `${results.totalCount} jeu${results.totalCount > 1 ? 'x' : ''} trouvé${results.totalCount > 1 ? 's' : ''}`}
            </p>
            {query && query.length >= 3 && !loading && (
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Recherche dans la base de données locale
              </p>
            )}
          </div>
        </div>

        {/* Grille des jeux */}
        {results.games.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {results.games.map((game) => (
              <SimpleSearchGameCard key={game.id} game={game as unknown as GameWithConsole} />
            ))}
          </div>
        ) : !loading && (
          <div className="py-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              Aucun jeu ne correspond à vos critères de recherche.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function RecherchePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}