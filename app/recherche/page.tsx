'use client'

import { useEffect, useCallback, Suspense } from 'react'
import { Search, Filter, X } from 'lucide-react'
import GameCardRegionalWrapper from '@/components/game-card-regional-wrapper'
import { GameWithConsole } from '@/lib/data-prisma'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { searchGamesAction, searchGamesWithScreenscraperAction, getSearchMetadataAction, type SearchFilters, type SearchResult } from '@/lib/actions/search-actions'
import { useQueryState, parseAsInteger, parseAsBoolean } from 'nuqs'
import { useState } from 'react'


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

      // Utiliser la recherche combinée (locale + Screenscraper) si on a une query
      const searchResults = query && query.length >= 3
        ? await searchGamesWithScreenscraperAction(searchFilters)
        : await searchGamesAction(searchFilters)
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
                Recherche dans la base locale et sur Screenscraper
              </p>
            )}
          </div>
        </div>

        {/* Grille des jeux */}
        {results.games.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {results.games.map((game) => (
              <GameCardRegionalWrapper key={game.id} game={game as unknown as GameWithConsole} />
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