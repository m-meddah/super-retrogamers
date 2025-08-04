import { getAllConsoles } from "@/lib/data-prisma"
import ConsoleCard from "@/components/console-card"

export default async function ConsolesPage() {
  const consoles = await getAllConsoles()
  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
            Consoles rétro
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-300">
            Découvrez les machines légendaires qui ont marqué l&apos;histoire du jeu vidéo.
          </p>
        </div>

        {/* Stats */}
        <div className="mb-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {consoles.length} console{consoles.length > 1 ? 's' : ''} disponible{consoles.length > 1 ? 's' : ''}
          </p>
        </div>

        {/* Console Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {consoles.map((console) => (
            <ConsoleCard key={console.id} console={console} />
          ))}
        </div>

        {/* Empty State (if no consoles) */}
        {consoles.length === 0 && (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 h-24 w-24 rounded-full bg-gray-100 dark:bg-gray-800" />
            <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
              Aucune console disponible
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Les consoles seront bientôt ajoutées à notre collection.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
