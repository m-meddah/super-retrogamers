import { Suspense } from "react"
import { 
  AlertCircle
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard } from "@/components/admin/stat-card"
import { RecentActivity } from "@/components/admin/recent-activity"
import { TopCollectors } from "@/components/admin/top-collectors"
import { getAdminDashboardStats, getRecentActivity } from "@/lib/data-prisma"
import { getServerSession } from "@/lib/auth-server"
import { redirect } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"

async function DashboardContent() {
  const [stats, activity] = await Promise.all([
    getAdminDashboardStats(),
    getRecentActivity()
  ])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatLastScraping = (date: Date | null) => {
    if (!date) return "Jamais"
    return formatDistanceToNow(date, { addSuffix: true, locale: fr })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard Admin</h1>
        <p className="text-muted-foreground">
          Vue d&apos;ensemble de votre plateforme Super Retrogamers
        </p>
      </div>

      {/* KPI Cards - Row 1: Users & Content */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Utilisateurs totaux"
          value={stats.users.total.toLocaleString()}
          icon="Users"
          description="Utilisateurs inscrits"
          trend={{
            value: stats.users.newThisWeek,
            label: "cette semaine",
            positive: stats.users.newThisWeek >= 0
          }}
        />
        
        <StatCard
          title="Consoles"
          value={stats.content.totalConsoles.toLocaleString()}
          icon="Monitor"
          description="Consoles dans la base"
          trend={{
            value: stats.content.consolesAddedThisWeek,
            label: "cette semaine",
            positive: true
          }}
        />
        
        <StatCard
          title="Jeux"
          value={stats.content.totalGames.toLocaleString()}
          icon="Gamepad2"
          description="Jeux référencés"
          trend={{
            value: stats.content.gamesAddedThisWeek,
            label: "cette semaine",
            positive: true
          }}
        />
        
        <StatCard
          title="Utilisateurs actifs"
          value={stats.users.activeThisMonth.toLocaleString()}
          icon="Activity"
          description="Ce mois-ci"
          trend={{
            value: Math.round((stats.users.activeThisMonth / stats.users.total) * 100),
            label: "% du total",
            positive: true
          }}
        />
      </div>

      {/* KPI Cards - Row 2: Collections & Activity */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Collections"
          value={stats.collections.totalUserConsoles.toLocaleString()}
          icon="TrendingUp"
          description="Consoles collectionnées"
        />
        
        <StatCard
          title="Valeur totale"
          value={formatCurrency(stats.collections.totalCollectionValue)}
          icon="TrendingUp"
          description="Collections estimées"
        />
        
        <StatCard
          title="Évaluations"
          value={stats.activity.totalReviews.toLocaleString()}
          icon="Star"
          description={`Moyenne: ${stats.activity.averageRating.toFixed(1)}/5`}
          trend={{
            value: stats.activity.reviewsThisWeek,
            label: "cette semaine",
            positive: true
          }}
        />
        
        <StatCard
          title="Listes de souhaits"
          value={stats.activity.wishlistItems.toLocaleString()}
          icon="Heart"
          description="Articles souhaités"
        />
      </div>

      {/* System Health */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Santé du système"
          value={stats.systemHealth.databaseSize.toLocaleString()}
          icon="Database"
          description="Entrées en base"
        />
        
        <StatCard
          title="Fichiers média"
          value={stats.systemHealth.mediaFilesCount.toLocaleString()}
          icon="Database"
          description="Images et médias"
        />
        
        <StatCard
          title="Dernier scraping"
          value={formatLastScraping(stats.systemHealth.lastScrapingDate)}
          icon="Calendar"
          description="Synchronisation Screenscraper"
        />
      </div>

      {/* Analytics Section */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Top Collectors */}
        <TopCollectors collectors={stats.users.topCollectors} />

        {/* Popular Content */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Contenu populaire</CardTitle>
            <CardDescription>Les plus collectionnés</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Console la plus populaire</h4>
              <p className="text-lg font-semibold">
                {stats.collections.mostCollectedConsole || "Aucune"}
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">Jeu le plus collectionné</h4>
              <p className="text-lg font-semibold">
                {stats.collections.mostCollectedGame || "Aucun"}
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">Statistiques de contenu</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Moyenne jeux/console</span>
                  <span className="text-sm font-medium">{stats.content.averageGamesPerConsole}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Consoles sans jeux</span>
                  <span className="text-sm font-medium">{stats.content.consolesWithoutGames}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Alertes système</CardTitle>
            <CardDescription>Statut et notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.content.consolesWithoutGames > 0 && (
              <div className="flex items-center space-x-2 p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded-md">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium">Consoles sans jeux</p>
                  <p className="text-xs text-muted-foreground">
                    {stats.content.consolesWithoutGames} consoles n&apos;ont aucun jeu associé
                  </p>
                </div>
              </div>
            )}
            
            {!stats.systemHealth.lastScrapingDate && (
              <div className="flex items-center space-x-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded-md">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Scraping jamais exécuté</p>
                  <p className="text-xs text-muted-foreground">
                    Lancez une synchronisation avec Screenscraper
                  </p>
                </div>
              </div>
            )}
            
            {stats.users.total === 0 && (
              <div className="flex items-center space-x-2 p-2 bg-green-50 dark:bg-green-950/20 rounded-md">
                <AlertCircle className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Nouvelle installation</p>
                  <p className="text-xs text-muted-foreground">
                    Votre plateforme est prête à accueillir des utilisateurs
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Activité récente</h2>
        <RecentActivity
          recentUsers={activity.recentUsers}
          recentConsoles={activity.recentConsoles}
          recentGames={activity.recentGames}
          recentReviews={activity.recentReviews}
        />
      </div>
    </div>
  )
}

export default async function AdminDashboard() {
  const session = await getServerSession()
  
  // Vérification des permissions admin
  if (!session?.user || session.user.role !== 'admin') {
    redirect('/login')
  }

  return (
    <div className="container mx-auto p-6">
      <Suspense fallback={
        <div className="space-y-6">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-6">
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                  <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-32 bg-muted animate-pulse rounded" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      }>
        <DashboardContent />
      </Suspense>
    </div>
  )
}