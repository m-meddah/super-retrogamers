import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/auth-server"
import { getUserStats, getUserRecentActivity } from "@/lib/data-prisma"
import { Settings, Star, Trophy, Calendar, Gamepad2, Heart } from "lucide-react"
import Link from "next/link"

export default async function DashboardPage() {
  const session = await getServerSession()
  
  if (!session) {
    redirect("/login")
  }

  const [userStats, recentActivity] = await Promise.all([
    getUserStats(session.user.id),
    getUserRecentActivity(session.user.id)
  ])

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Dashboard
              </h1>
              <p className="mt-1 text-lg text-gray-600 dark:text-gray-400">
                Bienvenue, {session.user.name || session.user.email}
              </p>
            </div>
            <Link
              href="/dashboard/settings"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              <Settings className="h-4 w-4" />
              Paramètres
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/collection"
            className="group rounded-lg border border-gray-200 bg-white p-4 text-center transition-all hover:border-blue-300 hover:shadow-lg dark:border-gray-800 dark:bg-gray-950 dark:hover:border-blue-600"
          >
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 group-hover:bg-blue-200 dark:bg-blue-950/50">
              <Gamepad2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Ma Collection</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Gérer mes jeux et consoles</p>
          </Link>

          <Link
            href="/collection?tab=wishlist"
            className="group rounded-lg border border-gray-200 bg-white p-4 text-center transition-all hover:border-purple-300 hover:shadow-lg dark:border-gray-800 dark:bg-gray-950 dark:hover:border-purple-600"
          >
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 group-hover:bg-purple-200 dark:bg-purple-950/50">
              <Heart className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Wishlist</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Mes envies et recherches</p>
          </Link>

          <Link
            href="/search"
            className="group rounded-lg border border-gray-200 bg-white p-4 text-center transition-all hover:border-green-300 hover:shadow-lg dark:border-gray-800 dark:bg-gray-950 dark:hover:border-green-600"
          >
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 group-hover:bg-green-200 dark:bg-green-950/50">
              <Star className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Recherche</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Découvrir de nouveaux jeux</p>
          </Link>

          <Link
            href="/consoles"
            className="group rounded-lg border border-gray-200 bg-white p-4 text-center transition-all hover:border-orange-300 hover:shadow-lg dark:border-gray-800 dark:bg-gray-950 dark:hover:border-orange-600"
          >
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 group-hover:bg-orange-200 dark:bg-orange-950/50">
              <Trophy className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Consoles</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Explorer toutes les consoles</p>
          </Link>
        </div>

        {/* Stats Overview */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Jeux possédés</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {userStats?.gamesOwned || 0}
                </p>
              </div>
              <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-950/50">
                <Gamepad2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Consoles</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {userStats?.consolesOwned || 0}
                </p>
              </div>
              <div className="rounded-full bg-green-100 p-3 dark:bg-green-950/50">
                <Trophy className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Wishlist</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {userStats?.wishlistCount || 0}
                </p>
              </div>
              <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-950/50">
                <Heart className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Valeur estimée</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {userStats?.collectionValue ? `${userStats.collectionValue}€` : "N/A"}
                </p>
              </div>
              <div className="rounded-full bg-yellow-100 p-3 dark:bg-yellow-950/50">
                <Star className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
          <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Activité récente
            </h2>
          </div>
          <div className="p-6">
            {recentActivity && recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-950/50">
                        <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 dark:text-white">
                        {activity.action}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {activity.date}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                  Aucune activité récente
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Commencez par ajouter des jeux à votre collection !
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}