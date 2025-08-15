import Link from "next/link"
import { ArrowRight, Calendar, Trophy, Star, Users, BookOpen, BarChart3, Shield, CheckCircle, Clock, TrendingUp } from "lucide-react"
import ConsoleCardRegionalWrapper from "@/components/console-card-regional-wrapper"
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
        <div className="mx-auto max-w-5xl">
          {/* Trust indicators */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm dark:bg-gradient-to-r dark:from-blue-950/50 dark:to-purple-950/50 dark:text-blue-300">
              <Star className="h-4 w-4" />
              La référence du retrogaming français
            </div>
          </div>
          
          <div className="text-center">
            <h1 className="mb-6 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent dark:from-white dark:to-gray-300 sm:text-5xl lg:text-7xl">
              Super Retrogamers
            </h1>
            
            <p className="mx-auto mb-4 max-w-4xl text-xl leading-relaxed text-gray-600 dark:text-gray-300 sm:text-2xl">
              <span className="font-semibold text-blue-600 dark:text-blue-400">Transformez votre passion du retrogaming</span> en collection organisée et documentée
            </p>
            
            <p className="mx-auto mb-8 max-w-3xl text-lg text-gray-500 dark:text-gray-400">
              Rejoignez {stats.consoleCount > 0 ? 'des milliers de collectionneurs' : 'la communauté'} qui utilisent notre plateforme pour gérer et explorer l&apos;univers du jeu vidéo rétro
            </p>

            {/* Social proof */}
            <div className="mb-10 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>{stats.consoleCount}+ consoles documentées</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>{stats.gameCount}+ jeux référencés</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-500" />
                <span>100% gratuit</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/consoles"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl hover:from-blue-700 hover:to-blue-800"
              >
                Commencer maintenant
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              {!session && (
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-blue-200 bg-blue-50 px-8 py-4 text-lg font-semibold text-blue-700 transition-all hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300 dark:hover:bg-blue-900/50"
                >
                  Créer mon compte
                  <Users className="h-5 w-5" />
                </Link>
              )}
            </div>

            {/* Urgency element */}
            <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
              <Clock className="mr-1 inline h-4 w-4" />
              Nouveaux jeux ajoutés chaque semaine
            </p>
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

      {/* Testimonials Section */}
      <section className="bg-gray-50 px-4 py-16 dark:bg-gray-900/50 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
              Ce que disent les collectionneurs
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-300">
              Découvrez pourquoi Super Retrogamers est devenu la référence française du retrogaming
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800">
              <div className="mb-4 flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="mb-4 text-gray-700 dark:text-gray-300">
                "Enfin une plateforme qui comprend les collectionneurs ! La gestion de ma ludothèque n'a jamais été aussi simple."
              </p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Marc D.</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Collectionneur depuis 15 ans</p>
                </div>
              </div>
            </div>
            
            <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800">
              <div className="mb-4 flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="mb-4 text-gray-700 dark:text-gray-300">
                "Les fiches techniques sont d'une précision remarquable. C'est ma référence pour toute recherche retrogaming."
              </p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-green-500 to-teal-500"></div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Sarah L.</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Passionnée de rétro</p>
                </div>
              </div>
            </div>
            
            <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800">
              <div className="mb-4 flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="mb-4 text-gray-700 dark:text-gray-300">
                "Une communauté bienveillante et des contenus de qualité. Exactement ce que je cherchais !"
              </p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-orange-500 to-red-500"></div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Thomas K.</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Nostalgique des 90s</p>
                </div>
              </div>
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
              <ConsoleCardRegionalWrapper key={console.id} console={console} />
            ))}
          </div>
          
          <div className="text-center">
            <Link
              href="/consoles"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
            >
              Voir toutes les consoles
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
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
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 p-8 dark:from-blue-950/20 dark:to-purple-950/20">
                <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-blue-200/50 dark:bg-blue-800/30"></div>
                <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-purple-200/50 dark:bg-purple-800/30"></div>
                
                <div className="relative">
                  <h3 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
                    Notre collection en chiffres
                  </h3>
                  <div className="space-y-6">
                    <div className="group cursor-pointer rounded-xl bg-white/70 p-4 transition-all hover:bg-white hover:shadow-lg dark:bg-gray-800/70 dark:hover:bg-gray-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/50">
                            <Trophy className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Consoles référencées</span>
                        </div>
                        <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.consoleCount}</span>
                      </div>
                    </div>
                    
                    <div className="group cursor-pointer rounded-xl bg-white/70 p-4 transition-all hover:bg-white hover:shadow-lg dark:bg-gray-800/70 dark:hover:bg-gray-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900/50">
                            <Star className="h-5 w-5 text-green-600 dark:text-green-400" />
                          </div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Jeux documentés</span>
                        </div>
                        <span className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.gameCount}+</span>
                      </div>
                    </div>
                    
                    <div className="group cursor-pointer rounded-xl bg-white/70 p-4 transition-all hover:bg-white hover:shadow-lg dark:bg-gray-800/70 dark:hover:bg-gray-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900/50">
                            <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                          </div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Depuis</span>
                        </div>
                        <span className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.oldestConsoleYear}</span>
                      </div>
                    </div>
                    
                    <div className="group cursor-pointer rounded-xl bg-white/70 p-4 transition-all hover:bg-white hover:shadow-lg dark:bg-gray-800/70 dark:hover:bg-gray-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-orange-100 p-2 dark:bg-orange-900/50">
                            <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                          </div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Croissance</span>
                        </div>
                        <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">+15%</span>
                      </div>
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Nouveaux contenus par mois</p>
                    </div>
                  </div>
                  
                  <div className="mt-8 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-center">
                    <p className="text-sm font-medium text-white">
                      🚀 Rejoignez une communauté de {stats.consoleCount > 10 ? '10,000+' : '1,000+'} collectionneurs passionnés
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
        
        {/* Floating elements for visual appeal */}
        <div className="absolute left-1/4 top-10 h-20 w-20 animate-pulse rounded-full bg-white/10"></div>
        <div className="absolute right-1/3 top-1/4 h-16 w-16 animate-pulse rounded-full bg-white/5 delay-1000"></div>
        <div className="absolute bottom-20 left-1/3 h-12 w-12 animate-pulse rounded-full bg-white/10 delay-500"></div>
        
        <div className="relative mx-auto max-w-5xl text-center">
          {/* Urgency indicator */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
            <div className="h-2 w-2 animate-pulse rounded-full bg-green-400"></div>
            Plus de {stats.gameCount > 100 ? '500' : stats.gameCount} nouveaux jeux ajoutés ce mois
          </div>
          
          <h2 className="mb-6 text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
            Rejoignez la révolution du<br />
            <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">retrogaming français</span>
          </h2>
          
          <p className="mx-auto mb-4 max-w-4xl text-xl text-white/90 sm:text-2xl">
            <strong>Transformez votre passion</strong> en collection organisée et partagez vos découvertes avec une communauté de vrais connaisseurs
          </p>
          
          <p className="mx-auto mb-8 max-w-3xl text-lg text-white/80">
            Accès gratuit et immédiat à toute notre base de données • Plus de {stats.consoleCount} consoles documentées • Communauté active
          </p>

          {/* Benefits list */}
          <div className="mb-10 grid gap-4 sm:grid-cols-3">
            <div className="flex items-center justify-center gap-2 text-white/90">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span>Gestion de collection</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-white/90">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span>Fiches techniques détaillées</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-white/90">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span>100% gratuit</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/consoles"
              className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-white px-8 py-4 text-lg font-bold text-blue-600 shadow-2xl transition-all hover:scale-105 hover:shadow-3xl"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-purple-50 opacity-0 transition-opacity group-hover:opacity-100"></div>
              <span className="relative">Commencer gratuitement</span>
              <ArrowRight className="relative h-5 w-5 transition-transform group-hover:translate-x-1" />
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
                Créer mon compte gratuit
                <Users className="h-5 w-5" />
              </Link>
            )}
          </div>

          {/* Final trust signal */}
          <p className="mt-8 text-sm text-white/60">
            ✨ Aucune carte de crédit requise • Installation instantanée • Communauté française
          </p>
        </div>
      </section>
    </div>
  )
}
