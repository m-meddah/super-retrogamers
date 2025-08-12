import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/auth-server"
import { getUserStats, getUserRecentActivity } from "@/lib/data-prisma"
import { Star, Trophy, Calendar, Gamepad2, Heart, ArrowLeft, Crown, Users } from "lucide-react"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Badge } from "@/components/ui/badge"

interface UserDashboardPageProps {
  params: Promise<{ userId: string }>
}

export default async function UserDashboardPage({ params }: UserDashboardPageProps) {
  const { userId } = await params
  const session = await getServerSession()
  
  if (!session) {
    redirect("/login")
  }

  // Vérifier les permissions admin pour voir le dashboard d'un autre utilisateur
  if (session.user.role !== 'admin') {
    redirect("/dashboard")
  }
  
  // Récupérer les informations de l'utilisateur cible
  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true
    }
  })
  
  if (!targetUser) {
    redirect("/admin/users")
  }

  const [userStats, recentActivity] = await Promise.all([
    getUserStats(userId),
    getUserRecentActivity(userId)
  ])

  const getRoleIcon = (role: string) => {
    if (role === 'admin') return <Crown className="h-4 w-4 text-yellow-500" />
    return <Users className="h-4 w-4 text-gray-500" />
  }

  const getRoleBadge = (role: string) => {
    if (role === 'admin') {
      return <Badge variant="default" className="bg-yellow-500 text-white">Admin</Badge>
    }
    return <Badge variant="secondary">Utilisateur</Badge>
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-4 mb-2">
                <Link
                  href="/admin/users"
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Retour à la gestion des utilisateurs
                </Link>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Dashboard utilisateur
              </h1>
              <div className="mt-2 flex items-center space-x-3">
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  {targetUser.name || targetUser.email}
                </p>
                <div className="flex items-center space-x-2">
                  {getRoleIcon(targetUser.role)}
                  {getRoleBadge(targetUser.role)}
                </div>
              </div>
              {targetUser.email && targetUser.name && (
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  {targetUser.email}
                </p>
              )}
            </div>
          </div>
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
                  Cet utilisateur n&apos;a pas encore d&apos;activité dans sa collection.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}