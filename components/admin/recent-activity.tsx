"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"

interface RecentActivityProps {
  recentUsers: Array<{
    id: string
    name: string | null
    email: string | null
    createdAt: Date
  }>
  recentConsoles: Array<{
    id: string
    name: string
    manufacturer: string | null
    createdAt: Date
  }>
  recentGames: Array<{
    id: string
    title: string
    console: { name: string } | null
    createdAt: Date
  }>
  recentReviews: Array<{
    id: string
    rating: number
    user: { name: string | null } | null
    game: { title: string } | null
    createdAt: Date
  }>
}

export function RecentActivity({ recentUsers, recentConsoles, recentGames, recentReviews }: RecentActivityProps) {
  const getInitials = (name: string | null, email?: string | null) => {
    if (name) {
      return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    if (email) {
      return email.slice(0, 2).toUpperCase()
    }
    return 'U'
  }

  const formatDate = (date: Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr })
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Nouveaux utilisateurs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Nouveaux utilisateurs</CardTitle>
          <CardDescription>Derniers inscrits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentUsers.map((user) => (
            <div key={user.id} className="flex items-center space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {getInitials(user.name, user.email)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user.name || 'Utilisateur anonyme'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(user.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Nouvelles consoles */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Nouvelles consoles</CardTitle>
          <CardDescription>Récemment ajoutées</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentConsoles.map((console) => (
            <div key={console.id} className="space-y-1">
              <p className="text-sm font-medium">{console.name}</p>
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs">
                  {console.manufacturer || 'N/A'}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDate(console.createdAt)}
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Nouveaux jeux */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Nouveaux jeux</CardTitle>
          <CardDescription>Récemment ajoutés</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentGames.map((game) => (
            <div key={game.id} className="space-y-1">
              <p className="text-sm font-medium">{game.title}</p>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs">
                  {game.console?.name || 'N/A'}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDate(game.createdAt)}
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Dernières évaluations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Dernières évaluations</CardTitle>
          <CardDescription>Notes récentes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentReviews.map((review) => (
            <div key={review.id} className="space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  {review.game?.title || 'Jeu inconnu'}
                </p>
                <Badge variant="default" className="text-xs">
                  {review.rating}/10
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  par {review.user?.name || 'Anonyme'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(review.createdAt)}
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}