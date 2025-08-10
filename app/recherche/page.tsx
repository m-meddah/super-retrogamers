'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Filter, X } from 'lucide-react'
import GameCard from '@/components/game-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { searchGamesAction, searchGamesWithScreenscraperAction, getSearchMetadataAction, type SearchFilters, type SearchResult } from '@/lib/actions/search-actions'

interface ClientSearchFilters {
  query: string
  console: string
  genre: string
  minRating: number
  maxRating: number
  yearFrom: string
  yearTo: string
  playerCount: string
  isBestVersion: boolean
  isDemo: boolean
  isBeta: boolean
  isTranslated: boolean
  topStaff: boolean
}

const INITIAL_FILTERS: ClientSearchFilters = {
  query: '',
  console: '',
  genre: '',
  minRating: 0,
  maxRating: 20,
  yearFrom: '',
  yearTo: '',
  playerCount: '',
  isBestVersion: false,
  isDemo: false,
  isBeta: false,
  isTranslated: false,
  topStaff: false
}

export default function RecherchePage() {
  const [filters, setFilters] = useState<ClientSearchFilters>(INITIAL_FILTERS)
  const [results, setResults] = useState<SearchResult>({ games: [], totalCount: 0, consoles: [], genres: [] })
  const [loading, setLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const performSearch = useCallback(async () => {
    setLoading(true)
    try {
      // Conversion des filtres client vers le format server action
      const searchFilters: SearchFilters = {
        query: filters.query || undefined,
        console: filters.console || undefined,
        genre: filters.genre || undefined,
        minRating: filters.minRating > 0 ? filters.minRating : undefined,
        maxRating: filters.maxRating < 20 ? filters.maxRating : undefined,
        yearFrom: filters.yearFrom ? parseInt(filters.yearFrom) : undefined,
        yearTo: filters.yearTo ? parseInt(filters.yearTo) : undefined,
        playerCount: filters.playerCount || undefined,
        isBestVersion: filters.isBestVersion || undefined,
        isDemo: filters.isDemo || undefined,
        isBeta: filters.isBeta || undefined,
        isTranslated: filters.isTranslated || undefined,
        topStaff: filters.topStaff || undefined
      }

      // Utiliser la recherche combinée (locale + Screenscraper) si on a une query
      const searchResults = filters.query && filters.query.length >= 3
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
  }, [filters])

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

  const updateFilter = (key: keyof ClientSearchFilters, value: string | number | boolean) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const resetFilters = () => {
    setFilters(INITIAL_FILTERS)
  }

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'query') return false
    return value !== INITIAL_FILTERS[key as keyof ClientSearchFilters]
  })

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
              value={filters.query}
              onChange={(e) => updateFilter('query', e.target.value)}
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
                <Select value={filters.console} onValueChange={(value) => updateFilter('console', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les consoles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Toutes les consoles</SelectItem>
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
                <Select value={filters.genre} onValueChange={(value) => updateFilter('genre', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les genres" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tous les genres</SelectItem>
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
                    value={filters.minRating || ''}
                    onChange={(e) => updateFilter('minRating', parseInt(e.target.value) || 0)}
                    className="w-20"
                  />
                  <span className="text-gray-500">-</span>
                  <Input
                    type="number"
                    min="0"
                    max="20"
                    placeholder="Max"
                    value={filters.maxRating === 20 ? '' : filters.maxRating}
                    onChange={(e) => updateFilter('maxRating', parseInt(e.target.value) || 20)}
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
                    value={filters.yearFrom}
                    onChange={(e) => updateFilter('yearFrom', e.target.value)}
                    className="w-24"
                  />
                  <span className="text-gray-500">-</span>
                  <Input
                    type="number"
                    min="1970"
                    max="2030"
                    placeholder="À"
                    value={filters.yearTo}
                    onChange={(e) => updateFilter('yearTo', e.target.value)}
                    className="w-24"
                  />
                </div>
              </div>

              {/* Nombre de joueurs */}
              <div className="space-y-2">
                <Label>Nombre de joueurs</Label>
                <Select value={filters.playerCount} onValueChange={(value) => updateFilter('playerCount', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tous</SelectItem>
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
                    checked={filters.topStaff}
                    onCheckedChange={(checked) => updateFilter('topStaff', checked)}
                  />
                  <Label htmlFor="topStaff" className="text-sm">TOP Staff Screenscraper</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="bestVersion"
                    checked={filters.isBestVersion}
                    onCheckedChange={(checked) => updateFilter('isBestVersion', checked)}
                  />
                  <Label htmlFor="bestVersion" className="text-sm">Meilleure version</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isDemo"
                    checked={filters.isDemo}
                    onCheckedChange={(checked) => updateFilter('isDemo', checked)}
                  />
                  <Label htmlFor="isDemo" className="text-sm">Démos</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isBeta"
                    checked={filters.isBeta}
                    onCheckedChange={(checked) => updateFilter('isBeta', checked)}
                  />
                  <Label htmlFor="isBeta" className="text-sm">Versions Beta</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isTranslated"
                    checked={filters.isTranslated}
                    onCheckedChange={(checked) => updateFilter('isTranslated', checked)}
                  />
                  <Label htmlFor="isTranslated" className="text-sm">Traduits</Label>
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
            {filters.query && filters.query.length >= 3 && !loading && (
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
              <GameCard key={game.id} game={game} />
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