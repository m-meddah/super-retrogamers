'use client'

import { useEffect, useState } from 'react'
import { Region } from '@prisma/client'
import { getAnniversaryGames } from '@/lib/actions/anniversary-actions'
import { useCurrentRegion } from '@/lib/hooks/use-regional-preferences'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Gift, Gamepad2 } from 'lucide-react'
import Link from 'next/link'
// Helper pour créer le slug composite du jeu

interface AnniversaryGame {
  id: string
  title: string
  slug: string
  console: {
    name: string
    slug: string
  } | null
  releaseDate: Date | null
  releaseRegion: Region | null
  releaseYear: number | null
  yearsAgo: number | null
  anniversary: string
}

export default function AnniversaryGames() {
  const [games, setGames] = useState<AnniversaryGame[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const currentRegion = useCurrentRegion()

  useEffect(() => {
    async function fetchAnniversaryGames() {
      setLoading(true)
      setError(null)

      try {
        const anniversaryGames = await getAnniversaryGames(currentRegion)
        setGames(anniversaryGames)
      } catch (err) {
        console.error('Erreur lors du chargement des jeux anniversaire:', err)
        setError('Impossible de charger les jeux anniversaire')
      } finally {
        setLoading(false)
      }
    }

    fetchAnniversaryGames()
  }, [currentRegion])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-blue-600" />
            <CardTitle>Anniversaires du jour</CardTitle>
          </div>
          <CardDescription>
            Jeux qui fêtent leur anniversaire aujourd'hui
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-red-600" />
            <CardTitle>Anniversaires du jour</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (games.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-gray-400" />
            <CardTitle>Anniversaires du jour</CardTitle>
          </div>
          <CardDescription>
            Aucun jeu ne fête son anniversaire aujourd'hui
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-muted-foreground">
              Revenez demain pour découvrir de nouveaux anniversaires !
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-blue-600" />
          <CardTitle>Anniversaires du jour</CardTitle>
          <Badge variant="secondary">
            {games.length} jeu{games.length > 1 ? 'x' : ''}
          </Badge>
        </div>
        <CardDescription>
          {games.length === 1 
            ? 'Un jeu fête son anniversaire aujourd\'hui' 
            : `${games.length} jeux fêtent leur anniversaire aujourd'hui`
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {games.map((game) => (
            <div key={game.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="space-y-1">
                <h4 className="font-medium">{game.title}</h4>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Gamepad2 className="h-3 w-3" />
                  <span>{game.console?.name || 'Console inconnue'}</span>
                  {game.releaseRegion && (
                    <>
                      <span>•</span>
                      <Badge variant="outline" className="h-5 text-xs">
                        {game.releaseRegion}
                      </Badge>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-3 w-3 text-blue-600" />
                  <span className="font-medium text-blue-600">
                    {game.anniversary}
                  </span>
                  {game.releaseYear && (
                    <span className="text-muted-foreground">
                      (sorti en {game.releaseYear})
                    </span>
                  )}
                </div>
              </div>
              <Link href={`/jeux/${game.slug}`}>
                <Button variant="outline" size="sm">
                  Voir détails
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}