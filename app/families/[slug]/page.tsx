import { notFound } from "next/navigation"
import { getFamilyBySlug } from "@/lib/data-prisma"
import { ArrowLeft, Calendar, GamepadIcon } from "lucide-react"
import GameCardWrapper from "@/components/game-card-wrapper"
import RegionalLink from "@/components/regional-link"

interface FamilyPageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function FamilyPage({ params }: FamilyPageProps) {
  const { slug } = await params
  const family = await getFamilyBySlug(slug)

  if (!family) {
    notFound()
  }

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Breadcrumb */}
        <div className="mb-8">
          <RegionalLink
            href="/families"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux familles
          </RegionalLink>
        </div>

        {/* Family Details */}
        <div className="mb-12 grid gap-8 lg:grid-cols-2">
          {/* Left Column - Info */}
          <div className="space-y-6">
            {/* Header */}
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
                    {family.name}
                  </h1>
                  {family.nameEn && family.nameEn !== family.name && (
                    <p className="text-lg text-gray-600 dark:text-gray-300">
                      {family.nameEn}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <GamepadIcon className="h-4 w-4" />
                      <span>{family.games?.length || 0} {family.games?.length === 1 ? 'jeu' : 'jeux'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Créée le {family.createdAt.toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                </div>
                {family.ssFamilyId && (
                  <span className="rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 text-sm font-medium text-white shadow-lg">
                    Screenscraper
                  </span>
                )}
              </div>
              {family.description && (
                <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300">
                  {family.description}
                </p>
              )}
            </div>
          </div>

          {/* Right Column - Visual */}
          <div className="flex items-center justify-center">
            <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100 shadow-lg dark:from-blue-900/30 dark:to-purple-900/30">
              <GamepadIcon className="h-16 w-16 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        {/* Statistics */}
        {family.games && family.games.length > 0 && (
          <div className="mb-8 rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 p-6 shadow-sm dark:border-gray-800 dark:from-gray-900 dark:to-gray-800">
            <h3 className="mb-6 flex items-center text-lg font-semibold text-gray-900 dark:text-white">
              <GamepadIcon className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
              Statistiques de la famille
            </h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg bg-white p-4 shadow-sm text-center dark:bg-gray-950/50">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {family.games.length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Jeux total
                </p>
              </div>
              <div className="rounded-lg bg-white p-4 shadow-sm text-center dark:bg-gray-950/50">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {new Set(family.games.map(g => g.console?.name).filter(Boolean)).size}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Consoles différentes
                </p>
              </div>
              <div className="rounded-lg bg-white p-4 shadow-sm text-center dark:bg-gray-950/50">
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {family.games.filter(g => g.rating && g.rating > 15).length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Jeux excellents (&gt;15/20)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Jeux de la famille */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Jeux de la famille ({family.games?.length || 0})
          </h2>
          
          {!family.games || family.games.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-12 text-center dark:border-gray-800 dark:bg-gray-900/50">
              <GamepadIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                Aucun jeu dans cette famille
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Les jeux de cette famille seront ajoutés prochainement.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {family.games.map((game) => (
                <GameCardWrapper key={game.id} game={game} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}