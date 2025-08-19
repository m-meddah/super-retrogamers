import { notFound } from "next/navigation"
import { getCorporationById } from "@/lib/data-prisma"
import RegionalLink from "@/components/regional-link"
import { ArrowLeft, Calendar, Building2Icon, MapPin, Users, Globe } from "lucide-react"
import GameCardWrapper from "@/components/game-card-wrapper"

interface CorporationPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function CorporationPage({ params }: CorporationPageProps) {
  const { id } = await params
  const corporation = await getCorporationById(id)

  if (!corporation) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <RegionalLink
            href="/corporations"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux corporations
          </RegionalLink>
        </div>

        {/* Header */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <div className="flex items-start gap-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900">
              <Building2Icon className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {corporation.name}
              </h1>
              
              {/* Informations de base */}
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {corporation.foundedDate && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {corporation.foundedDate.getFullYear()}
                      {corporation.defunctDate && ` - ${corporation.defunctDate.getFullYear()}`}
                    </span>
                  </div>
                )}
                {corporation.headquarters && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <MapPin className="h-4 w-4" />
                    <span>{corporation.headquarters}</span>
                  </div>
                )}
                {corporation.employees && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <Users className="h-4 w-4" />
                    <span>{corporation.employees.toLocaleString()} employés</span>
                  </div>
                )}
                {corporation.website && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <Globe className="h-4 w-4" />
                    <a 
                      href={corporation.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-emerald-600 dark:hover:text-emerald-400"
                    >
                      Site web
                    </a>
                  </div>
                )}
              </div>

              {/* Statistiques */}
              <div className="mt-6 flex items-center gap-6 text-sm">
                <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                  <Building2Icon className="h-4 w-4" />
                  {corporation.developedGames?.length || 0} jeux développés
                </span>
                <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                  <Building2Icon className="h-4 w-4" />
                  {corporation.publishedGames?.length || 0} jeux publiés
                </span>
                {corporation.ssCorporationId && (
                  <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-800 dark:bg-green-900 dark:text-green-300">
                    Screenscraper ID: {corporation.ssCorporationId}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Description et informations détaillées */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Description principale */}
          <div className="lg:col-span-2">
            <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                À propos
              </h2>
              {corporation.description && typeof corporation.description === 'object' && 
                Object.keys(corporation.description).length > 0 ? (
                <div className="prose dark:prose-invert">
                  {Object.entries(corporation.description as Record<string, string>).map(([lang, desc]) => (
                    <div key={lang}>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">
                        {lang}
                      </h4>
                      <p className="text-gray-700 dark:text-gray-300 mb-4">{desc}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 italic">
                  Aucune description disponible pour le moment.
                </p>
              )}

              {/* Destin de l'entreprise */}
              {corporation.fate && (
                <div className="mt-6 rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Évolution
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">{corporation.fate}</p>
                </div>
              )}
            </div>
          </div>

          {/* Anecdotes */}
          <div>
            <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Anecdotes
              </h2>
              {corporation.anecdotes && corporation.anecdotes.length > 0 ? (
                <ul className="space-y-3">
                  {corporation.anecdotes.map((anecdote, index) => (
                    <li key={index} className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="text-emerald-600 dark:text-emerald-400">•</span> {anecdote}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 italic text-sm">
                  Aucune anecdote disponible.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Jeux développés */}
        {corporation.developedGames && corporation.developedGames.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Jeux développés ({corporation.developedGames.length})
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {corporation.developedGames.map((game) => (
                <GameCardWrapper key={`dev-${game.id}`} game={game} />
              ))}
            </div>
          </div>
        )}

        {/* Jeux publiés */}
        {corporation.publishedGames && corporation.publishedGames.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Jeux publiés ({corporation.publishedGames.length})
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {corporation.publishedGames.map((game) => (
                <GameCardWrapper key={`pub-${game.id}`} game={game} />
              ))}
            </div>
          </div>
        )}

        {/* Rôles historiques */}
        {corporation.roles && corporation.roles.length > 0 && (
          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Rôles historiques
            </h2>
            <div className="space-y-3">
              {corporation.roles.map((role) => (
                <div key={role.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {role.role}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {role.startDate?.getFullYear()} - {role.endDate?.getFullYear() || 'présent'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}