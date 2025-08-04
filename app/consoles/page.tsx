import { getAllConsoles } from "@/lib/data-prisma"
import ConsoleSearch from "@/components/console-search"

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

        {/* Search and Console Grid */}
        <ConsoleSearch consoles={consoles} />
      </div>
    </div>
  )
}
