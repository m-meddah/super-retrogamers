import Link from "next/link"
import { ArrowRight, Gamepad2, Calendar, Trophy } from "lucide-react"
import ConsoleCard from "@/components/console-card"
import { getHomepageFeaturedConsoles, getStatsForHomepage } from "@/lib/data-prisma"

export default async function HomePage() {
  const [featuredConsoles, stats] = await Promise.all([
    getHomepageFeaturedConsoles(),
    getStatsForHomepage()
  ])

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
              <Gamepad2 className="h-4 w-4" />
              Retro Gaming
            </div>
          </div>
          
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl lg:text-6xl">
            Super Retrogamers
          </h1>
          
          <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-600 dark:text-gray-300 sm:text-xl">
            Découvrez l&apos;histoire des consoles légendaires et des jeux qui ont marqué l&apos;âge d&apos;or du jeu vidéo.
          </p>
          
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/consoles"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-blue-700"
            >
              Explorer les consoles
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="#consoles"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 text-base font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              En savoir plus
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/50">
                <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                Histoire
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Explorez l&apos;évolution des consoles depuis les années 80.
              </p>
            </div>
            
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/50">
                <Trophy className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                Classiques
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Découvrez les jeux qui ont défini les genres.
              </p>
            </div>
            
            <div className="text-center sm:col-span-2 lg:col-span-1">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/50">
                <Gamepad2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                Innovation
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Comprenez l&apos;impact sur le gaming moderne.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Consoles */}
      <section id="consoles" className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
              Consoles emblématiques
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-300">
              Les machines qui ont révolutionné l&apos;industrie du jeu vidéo.
            </p>
          </div>
          
          <div className="mb-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredConsoles.map((console) => (
              <ConsoleCard key={console.id} console={console} />
            ))}
          </div>
          
          <div className="text-center">
            <Link
              href="/consoles"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-blue-700"
            >
              Voir toutes les consoles
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gray-50 px-4 py-16 dark:bg-gray-900/50 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 text-center sm:grid-cols-3">
            <div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">{stats.consoleCount}</div>
              <div className="mt-1 text-gray-600 dark:text-gray-400">Console{stats.consoleCount > 1 ? 's' : ''}</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">{stats.gameCount}</div>
              <div className="mt-1 text-gray-600 dark:text-gray-400">Jeu{stats.gameCount > 1 ? 'x' : ''}</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">{stats.oldestConsoleYear || 'N/A'}</div>
              <div className="mt-1 text-gray-600 dark:text-gray-400">Première console</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 px-4 py-16 dark:bg-blue-700 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
            Prêt à explorer l&apos;histoire du gaming ?
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-blue-100">
            Découvrez notre collection complète de consoles rétro et plongez dans l&apos;âge d&apos;or du jeu vidéo.
          </p>
          <Link
            href="/consoles"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-base font-medium text-blue-600 transition-colors hover:bg-blue-50"
          >
            Commencer l&apos;exploration
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}
