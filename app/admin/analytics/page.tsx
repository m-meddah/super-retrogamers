'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart3, TrendingUp, Users, GamepadIcon, Eye, RefreshCw } from 'lucide-react'
import { getAnalyticsDataAction, type AnalyticsData } from '@/lib/actions/analytics-actions'

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const analyticsData = await getAnalyticsDataAction()
        setData(analyticsData)
        
      } catch (err) {
        console.error('Erreur lors du chargement des analytics:', err)
        setError('Erreur lors du chargement des données')
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  const handleRefresh = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const analyticsData = await getAnalyticsDataAction()
      setData(analyticsData)
      
    } catch (err) {
      console.error('Erreur lors du rafraîchissement des analytics:', err)
      setError('Erreur lors du rafraîchissement des données')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Statistiques et métriques de performance du site
          </p>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Chargement des analytics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Statistiques et métriques de performance du site
          </p>
        </div>
        <Card className="p-6">
          <div className="text-center text-red-600 dark:text-red-400">
            <p className="text-lg font-medium">{error}</p>
            <p className="mt-2 text-sm">Veuillez réessayer plus tard.</p>
          </div>
        </Card>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="container mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Statistiques et métriques de performance du site
          </p>
        </div>
        <Card className="p-6">
          <p className="text-center text-gray-600 dark:text-gray-400">
            Aucune donnée disponible
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Statistiques et métriques de performance du site
          </p>
        </div>
        <Button 
          onClick={handleRefresh} 
          variant="outline"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <GamepadIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Jeux</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{data?.totalGames.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BarChart3 className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Consoles</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{data?.totalConsoles}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Utilisateurs</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{data?.totalUsers}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Eye className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Vues (30j)</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{data?.recentViews.toLocaleString()}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Consoles populaires */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Consoles Populaires
          </h2>
          <div className="space-y-4">
            {data?.popularConsoles.map((console, index) => (
              <div key={console.name} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-6">
                    #{index + 1}
                  </span>
                  <span className="ml-3 text-sm text-gray-900 dark:text-white">
                    {console.name}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {console.gameCount} jeux
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Jeux populaires */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Jeux les Plus Consultés
          </h2>
          <div className="space-y-4">
            {data?.popularGames.map((game, index) => (
              <div key={game.title} className="flex items-center justify-between">
                <div className="flex items-center flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-6">
                    #{index + 1}
                  </span>
                  <div className="ml-3 min-w-0 flex-1">
                    <div className="text-sm text-gray-900 dark:text-white font-medium truncate">
                      {game.title}
                    </div>
                    {game.consoleName && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {game.consoleName}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center ml-4">
                  <Eye className="h-4 w-4 text-gray-400 mr-1" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    {game.viewCount.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Section pour futurs graphiques */}
      <Card className="p-6 mt-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Évolution du Trafic
        </h2>
        <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-center">
            <TrendingUp className="h-12 w-12 mx-auto mb-4" />
            <p>Graphiques à venir</p>
            <p className="text-sm mt-2">Intégration prévue avec des outils d&apos;analytics</p>
          </div>
        </div>
      </Card>
    </div>
  )
}