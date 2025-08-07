"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Crown, Gamepad2, Monitor } from "lucide-react"

interface TopCollectorsProps {
  collectors: Array<{
    id: string
    name: string | null
    email: string | null
    consoleCount: number
    gameCount: number
  }>
}

export function TopCollectors({ collectors }: TopCollectorsProps) {
  const getInitials = (name: string | null, email: string | null) => {
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

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="h-4 w-4 text-yellow-500" />
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Top Collectionneurs</CardTitle>
        <CardDescription>Les utilisateurs avec les plus grandes collections</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {collectors.map((collector, index) => (
          <div key={collector.id} className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              {getRankIcon(index)}
              <span className="text-sm font-medium text-muted-foreground">
                #{index + 1}
              </span>
            </div>
            
            <Avatar className="h-9 w-9">
              <AvatarFallback className="text-xs">
                {getInitials(collector.name, collector.email)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {collector.name || 'Utilisateur anonyme'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {collector.email}
              </p>
            </div>
            
            <div className="flex space-x-2">
              <Badge variant="secondary" className="text-xs flex items-center space-x-1">
                <Monitor className="h-3 w-3" />
                <span>{collector.consoleCount}</span>
              </Badge>
              <Badge variant="outline" className="text-xs flex items-center space-x-1">
                <Gamepad2 className="h-3 w-3" />
                <span>{collector.gameCount}</span>
              </Badge>
            </div>
          </div>
        ))}
        
        {collectors.length === 0 && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              Aucun collectionneur pour le moment
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}