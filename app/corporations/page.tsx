import { getAllCorporations } from "@/lib/data-prisma"
import RegionalLink from "@/components/regional-link"
import { Building2Icon } from "lucide-react"

export default async function CorporationsPage() {
  const corporations = await getAllCorporations()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Corporations
          </h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
            Découvrez les entreprises qui ont marqué l'histoire du jeu vidéo
          </p>
        </div>

        {/* Stats */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <div className="flex items-center gap-4">
            <Building2Icon className="h-8 w-8 text-emerald-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {corporations.length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {corporations.length > 1 ? 'corporations' : 'corporation'}
              </p>
            </div>
          </div>
        </div>

        {/* Liste des corporations */}
        {corporations.length === 0 ? (
          <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
            <Building2Icon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              Aucune corporation trouvée
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Les corporations seront ajoutées prochainement.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {corporations.map((corporation) => (
              <RegionalLink
                key={corporation.id}
                href={`/corporations/${corporation.id}`}
                className="group relative overflow-hidden rounded-lg bg-white p-6 shadow transition-all hover:shadow-lg dark:bg-gray-800 dark:hover:bg-gray-750"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-emerald-600 dark:text-white dark:group-hover:text-emerald-400">
                      {corporation.name}
                    </h3>
                    {corporation.headquarters && (
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        📍 {corporation.headquarters}
                      </p>
                    )}
                    {corporation.foundedDate && (
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        📅 Fondée en {corporation.foundedDate.getFullYear()}
                        {corporation.defunctDate && ` - ${corporation.defunctDate.getFullYear()}`}
                      </p>
                    )}
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900">
                      <Building2Icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 flex items-center justify-between text-sm">
                  <div className="flex gap-4">
                    <span className="text-blue-600 dark:text-blue-400">
                      {corporation._count?.developedGames || 0} développés
                    </span>
                    <span className="text-purple-600 dark:text-purple-400">
                      {corporation._count?.publishedGames || 0} publiés
                    </span>
                  </div>
                  {corporation.screenscrapeId && (
                    <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-800 dark:bg-green-900 dark:text-green-300">
                      Screenscraper
                    </span>
                  )}
                </div>
              </RegionalLink>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}