import { notFound } from "next/navigation"
import { Suspense } from "react"
import type { Metadata } from "next"
import RegionalLink from "@/components/regional-link"
import Image from "next/image"
import AdaptiveGameImage from "@/components/adaptive-game-image"
import GameWheelLogo from "@/components/game-wheel-logo"
import { Calendar, Star, Gamepad2, Building, Users, Award } from "lucide-react"
import { getGameBySlug } from "@/lib/data-prisma"
import { getGameFaviconUrl, generateFaviconMetadata, getAbsoluteFaviconUrl } from "@/lib/favicon-utils"

interface GamePageProps {
  params: Promise<{
    slug: string
  }>
}

// Génération des métadonnées dynamiques avec favicon personnalisé pour les jeux
export async function generateMetadata({ params }: GamePageProps): Promise<Metadata> {
  const { slug } = await params
  const game = await getGameBySlug(slug)

  if (!game) {
    return {
      title: 'Jeu non trouvé - Super Retrogamers'
    }
  }

  // Récupérer le favicon du jeu ou de sa console
  const faviconUrl = getGameFaviconUrl(game)
  const absoluteFaviconUrl = faviconUrl ? getAbsoluteFaviconUrl(faviconUrl) : null

  // Générer les métadonnées avec favicon personnalisé
  const metadata = generateFaviconMetadata(
    absoluteFaviconUrl,
    `${game.title} - ${game.console?.name || 'Jeu rétro'} - Super Retrogamers`
  )

  return {
    ...metadata,
    description: game.description || `Découvrez ${game.title}, jeu ${game.console?.name ? `sur ${game.console.name}` : 'rétro'}. ${game.developer ? `Développé par ${game.developer}` : ''} ${game.releaseYear ? `en ${game.releaseYear}` : ''}.`,
    openGraph: {
      title: `${game.title} - ${game.console?.name || 'Jeu rétro'}`,
      description: game.description || `Jeu ${game.title}${game.console?.name ? ` sur ${game.console.name}` : ''}`,
      type: 'website',
      ...(absoluteFaviconUrl && { images: [absoluteFaviconUrl] })
    },
    twitter: {
      card: 'summary',
      title: `${game.title} - ${game.console?.name || 'Jeu rétro'}`,
      description: game.description || `Jeu ${game.title}${game.console?.name ? ` sur ${game.console.name}` : ''}`,
      ...(absoluteFaviconUrl && { images: [absoluteFaviconUrl] })
    }
  }
}

export default async function GamePage({ params }: GamePageProps) {
  const { slug } = await params
  const game = await getGameBySlug(slug)

  if (!game) {
    notFound()
  }

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Breadcrumb */}
        <div className="mb-8 flex items-center gap-2 text-sm">
          <RegionalLink
            href="/consoles"
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            Consoles
          </RegionalLink>
          <span className="text-gray-400">/</span>
          <RegionalLink
            href={`/consoles/${game.console?.slug}`}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            {game.console?.name}
          </RegionalLink>
          <span className="text-gray-400">/</span>
          <RegionalLink
            href={`/consoles/${game.console?.slug}/jeux`}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            Jeux
          </RegionalLink>
          <span className="text-gray-400">/</span>
          <span className="text-gray-900 dark:text-white font-medium">{game.title}</span>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Game Header */}
            <div>
              {/* Logo wheel du jeu si disponible */}
              <div className="mb-4">
                <GameWheelLogo 
                  game={game}
                  size="lg"
                  showTitle={false}
                  className="mb-2"
                />
              </div>
              
              <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
                    {game.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    {game.releaseYear && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {game.releaseYear}
                      </span>
                    )}
                    {game.playerCount && (
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {game.playerCount} joueur{game.playerCount.includes('-') || parseInt(game.playerCount) > 1 ? 's' : ''}
                      </span>
                    )}
                    {game.genre && (
                      <span className="flex items-center gap-1">
                        <Gamepad2 className="h-4 w-4" />
                        {game.genre}
                      </span>
                    )}
                    {game.topStaff && (
                      <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                        <Award className="h-4 w-4" />
                        TOP Staff
                      </span>
                    )}
                  </div>
                </div>
                {game.rating && (
                  <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 dark:bg-amber-950/50">
                    <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                    <span className="font-bold text-lg text-amber-700 dark:text-amber-300">
                      {game.rating}
                    </span>
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className="mb-6 flex flex-wrap gap-2">
                <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                  {game.console?.name}
                </span>
                {game.genre && (
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    {game.genre}
                  </span>
                )}
                
              </div>

              {/* Description */}
              {game.description && (
                <p className="leading-relaxed text-gray-700 dark:text-gray-300">
                  {game.description}
                </p>
              )}
            </div>

            {/* Game Info */}
            <div>
              <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
                Informations
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {game.developer && (
                  <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                      <Building className="h-4 w-4" />
                      Développeur
                    </div>
                    <p className="text-gray-600 dark:text-gray-300">{game.developer}</p>
                  </div>
                )}
                {game.publisher && (
                  <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                      <Users className="h-4 w-4" />
                      Éditeur
                    </div>
                    <p className="text-gray-600 dark:text-gray-300">{game.publisher}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Screenshots */}
            {game.screenshots && game.screenshots.length > 0 && (
              <div>
                <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
                  Captures d&apos;écran
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {game.screenshots.map((screenshot, index) => (
                    <div key={index} className="aspect-video overflow-hidden rounded-lg">
                      <Image
                        src={screenshot || "/placeholder.svg"}
                        alt={`${game.title} screenshot ${index + 1}`}
                        width={400}
                        height={225}
                        className="h-full w-full object-cover transition-transform hover:scale-105"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Game Cover avec affichage adaptatif */}
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
              <div className="overflow-hidden bg-gray-100 dark:bg-gray-800">
                <Suspense fallback={
                  <div className="aspect-[3/4] bg-gray-200 dark:bg-gray-700 animate-pulse" />
                }>
                  <AdaptiveGameImage 
                    game={game}
                    alt={game.title}
                    className="w-full"
                    priority={true}
                  />
                </Suspense>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">{game.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {game.console?.name} • {game.releaseYear}
                </p>
                
                {/* Affichage du wheel logo si disponible dans le sidebar */}
                <div className="mt-3">
                  <GameWheelLogo 
                    game={game}
                    size="md"
                    showTitle={false}
                    className="opacity-70"
                  />
                </div>
              </div>
            </div>

            {/* Console Link */}
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
              <h3 className="mb-3 font-semibold text-gray-900 dark:text-white">Console</h3>
              <RegionalLink
                href={`/consoles/${game.console?.slug}`}
                className="inline-flex w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Voir {game.console?.name}
              </RegionalLink>
            </div>

            {/* More Games Link */}
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
              <h3 className="mb-3 font-semibold text-gray-900 dark:text-white">Plus de jeux</h3>
              <RegionalLink
                href={`/consoles/${game.console?.slug}/jeux`}
                className="inline-flex w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Autres jeux {game.console?.name}
              </RegionalLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
