'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Search, Download, Loader2, Package, Calendar, Star, Users, Building, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCurrentRegion } from '@/lib/hooks/use-persistent-region'
import { searchScreenscraperAdminAction, type AdminSearchResult } from '@/lib/actions/admin-search-actions'
import { createGameFromScreenscraperAction } from '@/lib/actions/admin-scraping-actions'

export default function ScreenscraperSearchPage() {
  const currentRegion = useCurrentRegion()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<AdminSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scrapingStates, setScrapingStates] = useState<Record<number, 'idle' | 'loading' | 'success' | 'error'>>({})

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!query.trim() || query.length < 3) {
      setError('La recherche doit contenir au moins 3 caractères')
      return
    }

    setLoading(true)
    setError(null)
    setResults([])

    try {
      const response = await searchScreenscraperAdminAction(query.trim(), currentRegion.toLowerCase())
      
      if (response.success) {
        setResults(response.results)
        if (response.results.length === 0) {
          setError('Aucun résultat trouvé')
        }
      } else {
        setError(response.error || 'Erreur lors de la recherche')
      }
    } catch (err) {
      setError('Erreur lors de la recherche')
      console.error('Search error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleScrapeGame = async (gameId: number, systemId: number) => {
    setScrapingStates(prev => ({ ...prev, [gameId]: 'loading' }))

    try {
      const result = await createGameFromScreenscraperAction(gameId, systemId)
      
      if (result.success) {
        setScrapingStates(prev => ({ ...prev, [gameId]: 'success' }))
        // Reset after 3 seconds
        setTimeout(() => {
          setScrapingStates(prev => ({ ...prev, [gameId]: 'idle' }))
        }, 3000)
      } else {
        setScrapingStates(prev => ({ ...prev, [gameId]: 'error' }))
        setTimeout(() => {
          setScrapingStates(prev => ({ ...prev, [gameId]: 'idle' }))
        }, 3000)
      }
    } catch (error) {
      console.error('Scraping error:', error)
      setScrapingStates(prev => ({ ...prev, [gameId]: 'error' }))
      setTimeout(() => {
        setScrapingStates(prev => ({ ...prev, [gameId]: 'idle' }))
      }, 3000)
    }
  }

  const getScrapingButtonContent = (gameId: number) => {
    const state = scrapingStates[gameId] || 'idle'
    
    switch (state) {
      case 'loading':
        return (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Scraping...
          </>
        )
      case 'success':
        return (
          <>
            <Package className="h-4 w-4" />
            Ajouté !
          </>
        )
      case 'error':
        return (
          <>
            <Package className="h-4 w-4" />
            Erreur
          </>
        )
      default:
        return (
          <>
            <Download className="h-4 w-4" />
            Scraper ce jeu
          </>
        )
    }
  }

  const getScrapingButtonVariant = (gameId: number) => {
    const state = scrapingStates[gameId] || 'idle'
    
    switch (state) {
      case 'success':
        return 'default'
      case 'error':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
            Recherche Screenscraper
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Recherchez et ajoutez des jeux depuis la base de données Screenscraper (Admin uniquement)
          </p>
        </div>

        {/* Search Form */}
        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="md:col-span-2">
                <Label htmlFor="query">Recherche</Label>
                <Input
                  id="query"
                  placeholder="Nom du jeu (ex: Samurai Shodown)"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Région préférée</Label>
                <Select value={currentRegion} disabled>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FR">France</SelectItem>
                    <SelectItem value="EU">Europe</SelectItem>
                    <SelectItem value="US">États-Unis</SelectItem>
                    <SelectItem value="JP">Japon</SelectItem>
                    <SelectItem value="WOR">Monde</SelectItem>
                    <SelectItem value="ASI">Asie</SelectItem>
                  </SelectContent>
                </Select>
                <p className="mt-1 text-xs text-gray-500">
                  Utilisez le sélecteur de région global pour changer
                </p>
              </div>
            </div>
            
            <Button type="submit" disabled={loading || !query.trim()}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Recherche en cours...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Rechercher sur Screenscraper
                </>
              )}
            </Button>
          </form>

          {error && (
            <div className="mt-4 rounded-md bg-red-50 p-4 dark:bg-red-900/20">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {results.length} résultat{results.length > 1 ? 's' : ''} trouvé{results.length > 1 ? 's' : ''}
            </h2>
            
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((game) => (
                <div
                  key={game.id}
                  className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950"
                >
                  {/* Image */}
                  <div className="aspect-[3/4] relative bg-gray-100 dark:bg-gray-800">
                    {game.imageUrl ? (
                      <Image
                        src={game.imageUrl}
                        alt={game.title}
                        fill
                        className="object-contain p-2"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-400">
                        <Package className="h-12 w-12" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="mb-3">
                      <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2">
                        {game.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {game.systemName}
                      </p>
                    </div>

                    {/* Game info */}
                    <div className="mb-4 space-y-1 text-xs text-gray-500 dark:text-gray-400">
                      {game.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          <span>{game.rating}/20</span>
                        </div>
                      )}
                      
                      {game.releaseYear && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{game.releaseYear}</span>
                        </div>
                      )}
                      
                      {game.genre && (
                        <div className="flex items-center gap-1">
                          <span>{game.genre}</span>
                        </div>
                      )}
                      
                      {game.playerCount && (
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>{game.playerCount}</span>
                        </div>
                      )}
                      
                      {game.developer && (
                        <div className="flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          <span className="truncate">{game.developer}</span>
                        </div>
                      )}
                      
                      {game.publisher && (
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          <span className="truncate">{game.publisher}</span>
                        </div>
                      )}
                    </div>

                    {/* Scraping button */}
                    <Button
                      onClick={() => handleScrapeGame(game.id, game.systemId)}
                      disabled={scrapingStates[game.id] === 'loading'}
                      variant={getScrapingButtonVariant(game.id)}
                      className="w-full flex items-center gap-2"
                    >
                      {getScrapingButtonContent(game.id)}
                    </Button>

                    {/* Game ID for reference */}
                    <p className="mt-2 text-xs text-gray-400">
                      ID: {game.id} | Système: {game.systemId}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}