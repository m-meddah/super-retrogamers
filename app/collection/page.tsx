"use client"

import { useEffect } from 'react'
import { redirect } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import CollectionStats from '@/components/collection/collection-stats'
import CollectionGrid from '@/components/collection/collection-grid'
import { Plus, TrendingUp, Heart } from 'lucide-react'
import { useSession } from '@/lib/auth-client'
import { useCollection } from '@/lib/hooks/use-collection'
import { useState } from 'react'

export default function CollectionPage() {
  const { data: session, isPending: authLoading } = useSession()
  const isAuthenticated = !!session?.user
  const {
    consoles,
    games,
    wishlist,
    stats,
    loading,
    removeConsoleFromCollection,
    removeGameFromCollection,
    removeFromWishlist
  } = useCollection(session)
  
  const [activeTab, setActiveTab] = useState('consoles')

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      redirect('/login')
    }
  }, [isAuthenticated, authLoading])

  const handleDeleteItem = async (item: { id: string }, type: 'console' | 'game' | 'wishlist') => {

    try {
      switch (type) {
        case 'console':
          await removeConsoleFromCollection(item.id)
          break
        case 'game':
          await removeGameFromCollection(item.id)
          break
        case 'wishlist':
          await removeFromWishlist(item.id)
          break
      }
    } catch (error) {
      console.error('Error deleting item:', error)
    }
  }

  if (authLoading || loading.consoles) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Chargement de votre collection...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
            Ma Collection
          </h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
            Gérez votre collection de consoles et jeux rétro
          </p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="mb-8">
            <CollectionStats stats={stats} />
          </div>
        )}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="consoles" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Consoles ({consoles.length})
            </TabsTrigger>
            <TabsTrigger value="games" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Jeux ({games.length})
            </TabsTrigger>
            <TabsTrigger value="wishlist" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Wishlist ({wishlist.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="consoles">
            <CollectionGrid 
              items={consoles}
              type="console"
              isLoading={loading.consoles}
              onDelete={(item) => handleDeleteItem(item, 'console')}
            />
          </TabsContent>

          <TabsContent value="games">
            <CollectionGrid 
              items={games}
              type="game"
              isLoading={loading.games}
              onDelete={(item) => handleDeleteItem(item, 'game')}
            />
          </TabsContent>

          <TabsContent value="wishlist">
            <div className="text-center py-12">
              <Heart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Liste de souhaits
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Fonctionnalité bientôt disponible
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}