import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Gamepad2 } from "lucide-react"
import { getConsoleBySlug, getGamesByConsole } from "@/lib/data-prisma"
import GameCard from "@/components/game-card"

interface ConsoleGamesPageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function ConsoleGamesPage({ params }: ConsoleGamesPageProps) {
  const { slug } = await params
  const console = await getConsoleBySlug(slug)

  if (!console) {
    notFound()
  }

  const games = await getGamesByConsole(console.id)

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

        {/* Stats */}
        <div className="mb-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {games.length} jeu{games.length > 1 ? 'x' : ''} disponible{games.length > 1 ? 's' : ''}
          </p>
        </div>

        {/* Games Grid */}
        {games.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {games.map((game) => (
              <GameCard key={game.id} game={game} showConsole={false} />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <Gamepad2 className="mx-auto mb-4 h-16 w-16 text-gray-400" />
            <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
              Aucun jeu disponible
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Les jeux pour cette console seront bientôt ajoutés.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
