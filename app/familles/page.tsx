import { getAllFamilies } from "@/lib/data-prisma"
import Link from "next/link"
import { GamepadIcon } from "lucide-react"

export default async function FamiliesPage() {
  const families = await getAllFamilies()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Familles de Jeux
          </h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
            Découvrez les grandes séries et franchises du jeu vidéo rétro
          </p>
        </div>

        {/* Stats */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <div className="flex items-center gap-4">
            <GamepadIcon className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {families.length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {families.length > 1 ? 'familles de jeux' : 'famille de jeux'}
              </p>
            </div>
          </div>
        </div>

        {/* Liste des familles */}
        {families.length === 0 ? (
          <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
            <GamepadIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              Aucune famille trouvée
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Les familles de jeux seront ajoutées prochainement.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {families.map((family) => (
              <Link
                key={family.id}
                href={`/familles/${family.id}`}
                className="group relative overflow-hidden rounded-lg bg-white p-6 shadow transition-all hover:shadow-lg dark:bg-gray-800 dark:hover:bg-gray-750"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                      {family.name}
                    </h3>
                    {family.nameEn && family.nameEn !== family.name && (
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {family.nameEn}
                      </p>
                    )}
                    {family.description && (
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                        {family.description}
                      </p>
                    )}
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                      <GamepadIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    {family._count?.games || 0} {family._count?.games === 1 ? 'jeu' : 'jeux'}
                  </span>
                  {family.ssFamilyId && (
                    <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-800 dark:bg-green-900 dark:text-green-300">
                      Screenscraper
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}