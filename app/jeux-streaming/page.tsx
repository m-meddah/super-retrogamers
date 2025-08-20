import { Suspense } from 'react'
import { InfiniteGameList } from '@/components/streaming/infinite-game-list'
import { GameCardSkeleton } from '@/components/game-card-skeleton'
import { loadGamesStream } from '@/lib/actions/streaming-actions'

interface JeuxStreamingPageProps {
  searchParams: { 
    console?: string
    genre?: string
    search?: string
    sort?: 'title' | 'rating' | 'releaseYear' | 'createdAt'
    order?: 'asc' | 'desc'
  }
}

// Force dynamic pour permettre le streaming
export const dynamic = 'force-dynamic'

export default async function JeuxStreamingPage({ 
  searchParams 
}: JeuxStreamingPageProps) {
  // Chargement initial des premiers jeux (serveur)
  const initialGames = await loadGamesStream(0, 20, {
    consoleSlug: searchParams.console,
    genreName: searchParams.genre,
    searchQuery: searchParams.search,
    sortBy: searchParams.sort,
    sortOrder: searchParams.order
  })

  // Action pour charger plus de jeux (client)
  const loadMoreGames = async (offset: number, limit: number) => {
    'use server'
    return loadGamesStream(offset, limit, {
      consoleSlug: searchParams.console,
      genreName: searchParams.genre,
      searchQuery: searchParams.search,
      sortBy: searchParams.sort,
      sortOrder: searchParams.order
    })
  }

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Catalogue de Jeux (Streaming)
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Chargement optimisé au scroll avec cache d&apos;URLs externes
          </p>
        </div>

        {/* Filtres rapides */}
        <div className="mb-8 flex flex-wrap gap-4">
          <SearchFilters currentParams={searchParams} />
        </div>

        {/* Liste infinie avec Suspense */}
        <Suspense fallback={<GameListSkeleton />}>
          <InfiniteGameList
            initialGames={initialGames}
            consoleSlug={searchParams.console}
            genreFilter={searchParams.genre}
            searchQuery={searchParams.search}
            loadMoreAction={loadMoreGames}
          />
        </Suspense>

        {/* Statistiques de performance */}
        <Suspense fallback={null}>
          <StreamingStats />
        </Suspense>
      </div>
    </div>
  )
}

// Composant pour les filtres de recherche
function SearchFilters({ currentParams }: { currentParams: Record<string, string | undefined> }) {
  return (
    <div className="flex flex-wrap gap-4">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Console:
        </label>
        <select 
          name="console" 
          defaultValue={currentParams.console || ''}
          className="rounded-md border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-800"
        >
          <option value="">Toutes</option>
          <option value="nes">NES</option>
          <option value="snes">Super Nintendo</option>
          <option value="psx">PlayStation</option>
          <option value="n64">Nintendo 64</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Tri:
        </label>
        <select 
          name="sort" 
          defaultValue={currentParams.sort || 'createdAt'}
          className="rounded-md border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-800"
        >
          <option value="createdAt">Plus récents</option>
          <option value="rating">Mieux notés</option>
          <option value="title">Alphabétique</option>
          <option value="releaseYear">Année de sortie</option>
        </select>
      </div>
    </div>
  )
}

// Skeleton de chargement
function GameListSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {Array.from({ length: 20 }).map((_, i) => (
        <GameCardSkeleton key={i} />
      ))}
    </div>
  )
}

// Statistiques en temps réel
async function StreamingStats() {
  const { getStreamingStats } = await import('@/lib/actions/streaming-actions')
  const stats = await getStreamingStats()

  return (
    <div className="mt-16 border-t border-gray-200 dark:border-gray-800 pt-8">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
        Statistiques du Streaming
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
          <div className="font-medium text-gray-900 dark:text-white">
            {stats.totalGames.toLocaleString('fr-FR')}
          </div>
          <div className="text-gray-600 dark:text-gray-400">
            Jeux totaux
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
          <div className="font-medium text-gray-900 dark:text-white">
            {stats.totalConsoles}
          </div>
          <div className="text-gray-600 dark:text-gray-400">
            Consoles
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
          <div className="font-medium text-gray-900 dark:text-white">
            {stats.averageGamesPerConsole}
          </div>
          <div className="text-gray-600 dark:text-gray-400">
            Jeux/Console (moy.)
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
          <div className="font-medium text-gray-900 dark:text-white">
            {(stats.cacheStats.game || 0).toLocaleString('fr-FR')}
          </div>
          <div className="text-gray-600 dark:text-gray-400">
            URLs en cache
          </div>
        </div>
      </div>
    </div>
  )
}