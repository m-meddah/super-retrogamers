import { notFound } from "next/navigation"
import { getFamilyById } from "@/lib/data-prisma"
import { ArrowLeft, Calendar, GamepadIcon } from "lucide-react"
import GameCardWrapper from "@/components/game-card-wrapper"
import RegionalLink from "@/components/regional-link"

interface FamilyPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function FamilyPage({ params }: FamilyPageProps) {
  const { id } = await params
  const family = await getFamilyById(id)

  if (!family) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <RegionalLink
            href="/familles"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux familles
          </RegionalLink>
        </div>

        {/* Header */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <div className="flex items-start gap-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
              <GamepadIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {family.name}
              </h1>
              {family.nameEn && family.nameEn !== family.name && (
                <p className="mt-1 text-lg text-gray-600 dark:text-gray-300">
                  {family.nameEn}
                </p>
              )}
              {family.description && (
                <p className="mt-3 text-gray-700 dark:text-gray-300">
                  {family.description}
                </p>
              )}
              
              <div className="mt-4 flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <GamepadIcon className="h-4 w-4" />
                  {family.games?.length || 0} {family.games?.length === 1 ? 'jeu' : 'jeux'}
                </span>
                {family.ssFamilyId && (
                  <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-800 dark:bg-green-900 dark:text-green-300">
                    Screenscraper ID: {family.ssFamilyId}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Créé le {family.createdAt.toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Jeux de la famille */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Jeux de la famille
          </h2>
          
          {!family.games || family.games.length === 0 ? (
            <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
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

        {/* Statistiques */}
        {family.games && family.games.length > 0 && (
          <div className="mt-8 rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Statistiques de la famille
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {family.games.length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Jeux total
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {new Set(family.games.map(g => g.console?.name).filter(Boolean)).size}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Consoles différentes
                </p>
              </div>
              <div className="text-center">
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
      </div>
    </div>
  )
}