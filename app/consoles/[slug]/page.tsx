import { notFound } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import { ArrowLeft, Cpu, HardDrive, Monitor, ArrowRight, Gamepad2, Calendar, Factory } from "lucide-react"
import { getConsoleBySlug, getGamesByConsoleWithConsoleInfo, getPopularGamesByConsoleSlug } from "@/lib/data-prisma"
import GameCardRegionalWrapper from "@/components/game-card-regional-wrapper"
import { ConsoleCollectionActions } from "@/components/console-collection-actions"
import { EditorialArticle } from "@/components/editorial-article"
import ConsoleImageRegional from "@/components/console-image-regional"
import ConsoleNameRegional from "@/components/console-name-regional"

interface ConsolePageProps {
  params: Promise<{
    slug: string
  }>
}

// Génération des métadonnées dynamiques
export async function generateMetadata({ params }: ConsolePageProps): Promise<Metadata> {
  const { slug } = await params
  const console = await getConsoleBySlug(slug)

  if (!console) {
    return {
      title: 'Console non trouvée - Super Retrogamers'
    }
  }

  return {
    title: `${console.name} - Console retro - Super Retrogamers`,
    description: console.description || `Découvrez la ${console.name}, console mythique de ${console.manufacturer}. Explorez son histoire, ses spécifications techniques et sa ludothèque exceptionnelle.`,
    openGraph: {
      title: `${console.name} - Console retro`,
      description: console.description || `Console ${console.name} par ${console.manufacturer}`,
      type: 'website'
    },
    twitter: {
      card: 'summary',
      title: `${console.name} - Console retro`,
      description: console.description || `Console ${console.name} par ${console.manufacturer}`
    }
  }
}

export default async function ConsolePage({ params }: ConsolePageProps) {
  const { slug } = await params
  const console = await getConsoleBySlug(slug)

  if (!console) {
    notFound()
  }

  const games = await getGamesByConsoleWithConsoleInfo(console.slug)
  const popularGames = await getPopularGamesByConsoleSlug(console.slug)

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Link
            href="/consoles"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux consoles
          </Link>
        </div>

        {/* Console Details */}
        <div className="mb-12 grid gap-8 lg:grid-cols-2">
          {/* Left Column - Info */}
          <div className="space-y-6">
            {/* Header */}
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
                    <ConsoleNameRegional 
                      consoleId={console.id}
                      fallbackName={console.name}
                    />
                  </h1>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <Factory className="h-4 w-4" />
                      <span>{console.manufacturer}</span>
                    </div>
                    {console.releaseYear && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{console.releaseYear}</span>
                      </div>
                    )}
                  </div>
                </div>
                {console.releaseYear && (
                  <span className="rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 text-sm font-medium text-white shadow-lg">
                    {console.releaseYear}
                  </span>
                )}
              </div>
              <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300">
                {console.description}
              </p>
            </div>

            {/* Specifications */}
            {(console.cpu || console.memory || console.graphics) && (
              <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 p-6 shadow-sm dark:border-gray-800 dark:from-gray-900 dark:to-gray-800">
                <h2 className="mb-6 flex items-center text-lg font-semibold text-gray-900 dark:text-white">
                  <Cpu className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Spécifications techniques
                </h2>
                <div className="grid gap-4 sm:grid-cols-1">
                  {console.cpu && (
                    <div className="flex items-start gap-3 rounded-lg bg-white p-4 shadow-sm dark:bg-gray-950/50">
                      <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900/50">
                        <Cpu className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <span className="block text-sm font-medium text-gray-900 dark:text-white">Processeur</span>
                        <span className="text-sm text-gray-600 dark:text-gray-300">{console.cpu}</span>
                      </div>
                    </div>
                  )}
                  {console.memory && (
                    <div className="flex items-start gap-3 rounded-lg bg-white p-4 shadow-sm dark:bg-gray-950/50">
                      <div className="rounded-full bg-green-100 p-2 dark:bg-green-900/50">
                        <HardDrive className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1">
                        <span className="block text-sm font-medium text-gray-900 dark:text-white">Mémoire</span>
                        <span className="text-sm text-gray-600 dark:text-gray-300">{console.memory}</span>
                      </div>
                    </div>
                  )}
                  {console.graphics && (
                    <div className="flex items-start gap-3 rounded-lg bg-white p-4 shadow-sm dark:bg-gray-950/50">
                      <div className="rounded-full bg-purple-100 p-2 dark:bg-purple-900/50">
                        <Monitor className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <span className="block text-sm font-medium text-gray-900 dark:text-white">Graphiques</span>
                        <span className="text-sm text-gray-600 dark:text-gray-300">{console.graphics}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Image */}
          <div className="flex flex-col space-y-6">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 shadow-lg dark:from-gray-800 dark:to-gray-900">
              <ConsoleImageRegional console={console} />
            </div>
          </div>
        </div>

        {/* Collection Actions */}
        <div className="mb-12">
          <ConsoleCollectionActions console={console} />
        </div>

        {/* Editorial Article */}
        {console.editorialContent && (
          <div className="mb-12">
            <EditorialArticle console={console} />
          </div>
        )}

        {/* Games Section */}
        <div className="mb-12">
          <div className="mb-8 flex items-center justify-between">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Jeux populaires
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Découvrez les meilleurs titres de cette console
              </p>
            </div>
            {games.length > 4 && (
              <Link
                href={`/consoles/${console.slug}/games`}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                Voir tous les jeux
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>

          {popularGames.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {popularGames.map((game) => (
                <GameCardRegionalWrapper key={game.id} game={game} showConsole={false} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 p-12 text-center shadow-sm dark:border-gray-800 dark:from-gray-900 dark:to-gray-800">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
                <Gamepad2 className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                Aucun jeu disponible
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Les jeux pour cette console seront ajoutés prochainement.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
