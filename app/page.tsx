import Link from "next/link"
import { ArrowRight, Calendar, Trophy, Star, Users, BookOpen, BarChart3 } from "lucide-react"
import ConsoleCardWrapper from "@/components/console-card-wrapper"
import { getHomepageFeaturedConsoles, getStatsForHomepage } from "@/lib/data-prisma"
import { getServerSession } from "@/lib/auth-server"

export default async function HomePage() {
  const [featuredConsoles, stats, session] = await Promise.all([
    getHomepageFeaturedConsoles(),
    getStatsForHomepage(),
    getServerSession()
  ])

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm dark:bg-gradient-to-r dark:from-blue-950/50 dark:to-purple-950/50 dark:text-blue-300">
              <Star className="h-4 w-4" />
              La référence du retrogaming français
            </div>
          </div>
          
          <h1 className="mb-6 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent dark:from-white dark:to-gray-300 sm:text-5xl lg:text-7xl">
            Super Retrogamers
          </h1>
          
          <p className="mx-auto mb-6 max-w-3xl text-xl leading-relaxed text-gray-600 dark:text-gray-300 sm:text-2xl">
            Plongez au cœur de l&apos;âge d&apos;or du jeu vidéo et redécouvrez les consoles mythiques qui ont façonné l&apos;industrie du gaming moderne.
          </p>
          
          <p className="mx-auto mb-10 max-w-2xl text-base text-gray-500 dark:text-gray-400">
            Explorez notre collection exhaustive, gérez votre ludothèque personnelle et revivez la magie des pixels d&apos;antan.
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
            <div className="group cursor-pointer rounded-xl border border-gray-200 bg-white p-6 text-center transition-all hover:border-blue-300 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg group-hover:scale-105 group-hover:shadow-xl">
                <Calendar className="h-7 w-7 text-white" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">
                Histoire authentique
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Revivez 40 ans d&apos;évolution technologique, des pionniers Atari aux géants PlayStation et Nintendo.
              </p>
            </div>
            
            <div className="group cursor-pointer rounded-xl border border-gray-200 bg-white p-6 text-center transition-all hover:border-purple-300 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:hover:border-purple-600">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg group-hover:scale-105 group-hover:shadow-xl">
                <Trophy className="h-7 w-7 text-white" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">
                Chefs-d&apos;œuvre intemporels
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Des légendes qui ont défini des genres entiers : Mario, Zelda, Final Fantasy, Street Fighter...
              </p>
            </div>
            
            <div className="group cursor-pointer rounded-xl border border-gray-200 bg-white p-6 text-center transition-all hover:border-green-300 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:hover:border-green-600 sm:col-span-2 lg:col-span-1">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg group-hover:scale-105 group-hover:shadow-xl">
                <Users className="h-7 w-7 text-white" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">
                Communauté passionnée
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Rejoignez les collectionneurs et nostalgiques qui préservent la mémoire du jeu vidéo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Consoles */}
      <section id="consoles" className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="mb-6 text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl">
              Les légendes du gaming
            </h2>
            <p className="mx-auto mb-4 max-w-3xl text-xl text-gray-600 dark:text-gray-300">
              Chaque console raconte une époque, chaque jeu marque une génération.
            </p>
            <p className="mx-auto max-w-2xl text-base text-gray-500 dark:text-gray-400">
              Découvrez les machines iconiques qui ont révolutionné notre façon de jouer et créé des souvenirs inoubliables.
            </p>
          </div>
          
          <div className="mb-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredConsoles.map((console) => (
              <ConsoleCardWrapper key={console.id} console={console} />
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

      {/* Why Choose Us Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="mb-6 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
              Pourquoi Super Retrogamers ?
            </h2>
            <p className="mx-auto max-w-3xl text-lg text-gray-600 dark:text-gray-300">
              La plateforme de référence pour tous les passionnés de retrogaming en France
            </p>
          </div>
          
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/50">
                    <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                    Documentation exhaustive
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Fiches techniques détaillées, historique complet et anecdotes pour chaque console et jeu référencé.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-950/50">
                    <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                    Gestion de collection
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Organisez votre ludothèque, suivez vos acquisitions et partagez vos trouvailles avec la communauté.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-950/50">
                    <Star className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                    Contenu de qualité
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Articles d&apos;experts, analyses approfondies et découvertes de pépites oubliées du jeu vidéo rétro.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="lg:pl-8">
              <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 p-8 dark:from-blue-950/20 dark:to-purple-950/20">
                <h3 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
                  Notre collection en chiffres
                </h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Consoles référencées</span>
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.consoleCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Jeux documentés</span>
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.gameCount}+</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Depuis</span>
                    <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.oldestConsoleYear}</span>
                  </div>
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                      Et ce n&apos;est que le début de l&apos;aventure !
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 px-4 py-20 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative mx-auto max-w-4xl text-center">
          <h2 className="mb-6 text-4xl font-bold text-white sm:text-5xl">
            L&apos;aventure commence maintenant
          </h2>
          <p className="mx-auto mb-4 max-w-3xl text-xl text-white/90">
            Plongez dans l&apos;univers fascinant du retrogaming et redécouvrez les trésors qui ont façonné notre passion.
          </p>
          <p className="mx-auto mb-10 max-w-2xl text-base text-white/70">
            Rejoignez une communauté de passionnés et constituez votre collection de rêve.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/consoles"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-lg font-semibold text-blue-600 shadow-xl transition-all hover:scale-105 hover:bg-blue-50 hover:shadow-2xl"
            >
              Explorer les consoles
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            {session ? (
              <Link
                href="/dashboard"
                className="group inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/30 bg-white/10 px-8 py-4 text-lg font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
              >
                Mon dashboard
                <BarChart3 className="h-5 w-5" />
              </Link>
            ) : (
              <Link
                href="/register"
                className="group inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/30 bg-white/10 px-8 py-4 text-lg font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
              >
                Créer mon compte
                <Users className="h-5 w-5" />
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
