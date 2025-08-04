import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Cpu, HardDrive, Monitor, ArrowRight, Gamepad2 } from "lucide-react"
import { getConsoleBySlug, getGamesByConsole } from "@/lib/data-prisma"
import GameCard from "@/components/game-card"

interface ConsolePageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function ConsolePage({ params }: ConsolePageProps) {
  const { slug } = await params
  const console = await getConsoleBySlug(slug)

  if (!console) {
    notFound()
  }

  const games = await getGamesByConsole(console.slug)

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
            <div>
              <div className="mb-2 flex items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
                  {console.name}
                </h1>
                {console.releaseYear && (
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                    {console.releaseYear}
                  </span>
                )}
              </div>
              <p className="mb-4 text-lg text-gray-600 dark:text-gray-300">
                {console.manufacturer}
              </p>
              <p className="leading-relaxed text-gray-700 dark:text-gray-300">
                {console.description}
              </p>
            </div>

            {/* Specifications */}
            {(console.cpu || console.memory || console.graphics) && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900">
                <h2 className="mb-4 flex items-center text-lg font-semibold text-gray-900 dark:text-white">
                  <Cpu className="mr-2 h-5 w-5" />
                  Spécifications techniques
                </h2>
                <div className="space-y-3">
                  {console.cpu && (
                    <div className="flex items-center text-sm">
                      <Cpu className="mr-3 h-4 w-4 text-gray-400" />
                      <span className="mr-2 font-medium">Processeur :</span>
                      <span className="text-gray-600 dark:text-gray-300">{console.cpu}</span>
                    </div>
                  )}
                  {console.memory && (
                    <div className="flex items-center text-sm">
                      <HardDrive className="mr-3 h-4 w-4 text-gray-400" />
                      <span className="mr-2 font-medium">Mémoire :</span>
                      <span className="text-gray-600 dark:text-gray-300">{console.memory}</span>
                    </div>
                  )}
                  {console.graphics && (
                    <div className="flex items-center text-sm">
                      <Monitor className="mr-3 h-4 w-4 text-gray-400" />
                      <span className="mr-2 font-medium">Graphiques :</span>
                      <span className="text-gray-600 dark:text-gray-300">{console.graphics}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Image */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative aspect-[4/3] w-full max-w-md overflow-hidden rounded-lg">
              <Image
                src={console.image || "/placeholder.svg"}
                alt={console.name}
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>

        {/* Games Section */}
        <div className="mb-12">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Jeux populaires
            </h2>
            {games.length > 4 && (
              <Link
                href={`/consoles/${console.slug}/jeux`}
                className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Voir tous les jeux
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>

          {games.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {games.slice(0, 4).map((game) => (
                <GameCard key={game.id} game={game} showConsole={false} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-800 dark:bg-gray-900">
              <Gamepad2 className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <p className="text-gray-600 dark:text-gray-300">
                Aucun jeu disponible pour cette console pour le moment.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
