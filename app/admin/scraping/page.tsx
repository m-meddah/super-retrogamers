"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { 
  Upload, 
  Download, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  Database,
  Monitor,
  Gamepad2,
  Clock
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ScrapingStats {
  consolesProcessed: number
  gamesProcessed: number
  mediaDownloaded: number
  errors: number
  status: 'idle' | 'running' | 'completed' | 'error'
  startTime?: Date
  estimatedTimeRemaining?: number
}

export default function ScrapingManagement() {
  const { toast } = useToast()
  const [scrapingStats, setScrapingStats] = useState<ScrapingStats>({
    consolesProcessed: 0,
    gamesProcessed: 0,
    mediaDownloaded: 0,
    errors: 0,
    status: 'idle'
  })
  
  const [isScrapingConsoles, setIsScrapingConsoles] = useState(false)
  const [isScrapingGames, setIsScrapingGames] = useState(false)

  const startConsoleScraping = async (limited: boolean = false) => {
    setIsScrapingConsoles(true)
    setScrapingStats(prev => ({ ...prev, status: 'running', startTime: new Date() }))
    
    try {
      const endpoint = limited ? '/api/scraping/consoles-limited' : '/api/scraping/consoles'
      const response = await fetch(endpoint, {
        method: 'POST',
      })
      
      if (!response.ok) {
        throw new Error('Erreur lors du scraping')
      }
      
      const result = await response.json()
      
      toast({
        title: "Scraping terminé",
        description: `${result.consolesProcessed} consoles traitées avec succès`,
      })
      
      setScrapingStats(prev => ({ 
        ...prev, 
        status: 'completed',
        consolesProcessed: result.consolesProcessed,
        mediaDownloaded: result.mediaDownloaded
      }))
      
    } catch {
      toast({
        title: "Erreur",
        description: "Erreur lors du scraping des consoles",
        variant: "destructive",
      })
      setScrapingStats(prev => ({ ...prev, status: 'error' }))
    } finally {
      setIsScrapingConsoles(false)
    }
  }

  const startGameScraping = async (consoleSlug: string) => {
    setIsScrapingGames(true)
    
    try {
      const response = await fetch(`/api/scraping/games/${consoleSlug}`, {
        method: 'POST',
      })
      
      if (!response.ok) {
        throw new Error('Erreur lors du scraping des jeux')
      }
      
      const result = await response.json()
      
      toast({
        title: "Scraping des jeux terminé",
        description: `${result.gamesProcessed} jeux traités pour ${consoleSlug}`,
      })
      
    } catch {
      toast({
        title: "Erreur",
        description: "Erreur lors du scraping des jeux",
        variant: "destructive",
      })
    } finally {
      setIsScrapingGames(false)
    }
  }

  const getStatusIcon = (status: ScrapingStats['status']) => {
    switch (status) {
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Database className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: ScrapingStats['status']) => {
    switch (status) {
      case 'running':
        return <Badge variant="default" className="bg-blue-500">En cours</Badge>
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Terminé</Badge>
      case 'error':
        return <Badge variant="destructive">Erreur</Badge>
      default:
        return <Badge variant="secondary">Inactif</Badge>
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Gestion du scraping</h1>
        <p className="text-muted-foreground">
          Synchronisez le contenu avec l&apos;API Screenscraper.fr
        </p>
      </div>

      {/* Status Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Statut</CardTitle>
            {getStatusIcon(scrapingStats.status)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">
              {getStatusBadge(scrapingStats.status)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consoles traitées</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scrapingStats.consolesProcessed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jeux traités</CardTitle>
            <Gamepad2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scrapingStats.gamesProcessed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Médias téléchargés</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scrapingStats.mediaDownloaded}</div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      {scrapingStats.status === 'running' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Scraping en cours...</span>
            </CardTitle>
            <CardDescription>
              Synchronisation avec l&apos;API Screenscraper
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progression</span>
                <span>{scrapingStats.consolesProcessed} consoles</span>
              </div>
              <Progress value={65} className="w-full" />
              {scrapingStats.estimatedTimeRemaining && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>Temps restant estimé: {scrapingStats.estimatedTimeRemaining}s</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Console Scraping */}
      <Card>
        <CardHeader>
          <CardTitle>Scraping des consoles</CardTitle>
          <CardDescription>
            Synchronise toutes les consoles depuis l&apos;API Screenscraper
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Information</AlertTitle>
            <AlertDescription>
              Le scraping respecte les limites de l&apos;API avec un délai de 1.2s entre chaque requête. 
              Le processus complet peut prendre plusieurs minutes.
            </AlertDescription>
          </Alert>

          <div className="flex space-x-4">
            <Button 
              onClick={() => startConsoleScraping(false)}
              disabled={isScrapingConsoles || scrapingStats.status === 'running'}
              className="flex items-center space-x-2"
            >
              {isScrapingConsoles ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              <span>Scraper toutes les consoles</span>
            </Button>

            <Button 
              variant="outline"
              onClick={() => startConsoleScraping(true)}
              disabled={isScrapingConsoles || scrapingStats.status === 'running'}
              className="flex items-center space-x-2"
            >
              {isScrapingConsoles ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              <span>Scraping limité (10 consoles)</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Game Scraping */}
      <Card>
        <CardHeader>
          <CardTitle>Scraping des jeux</CardTitle>
          <CardDescription>
            Synchronise les jeux pour des consoles spécifiques
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Prérequis</AlertTitle>
            <AlertDescription>
              Les consoles doivent d&apos;abord être scrapées avant de pouvoir synchroniser leurs jeux.
            </AlertDescription>
          </Alert>

          <div className="grid gap-2 md:grid-cols-3">
            {['nes', 'snes', 'playstation', 'neo-geo', 'gameboy'].map((consoleSlug) => (
              <Button 
                key={consoleSlug}
                variant="outline"
                onClick={() => startGameScraping(consoleSlug)}
                disabled={isScrapingGames}
                className="flex items-center space-x-2"
              >
                {isScrapingGames ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Gamepad2 className="h-4 w-4" />
                )}
                <span>{consoleSlug.toUpperCase()}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* API Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration API</CardTitle>
          <CardDescription>
            Paramètres de connexion à Screenscraper.fr
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Dev ID</label>
              <div className="text-sm text-muted-foreground">
                {process.env.SCREENSCRAPER_DEV_ID ? '✓ Configuré' : '✗ Non configuré'}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Utilisateur</label>
              <div className="text-sm text-muted-foreground">
                {process.env.SCREENSCRAPER_USERNAME ? '✓ Configuré' : '✗ Optionnel'}
              </div>
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Limites API</AlertTitle>
            <AlertDescription>
              Sans compte utilisateur: 20 000 requêtes/jour. Avec compte: 100 000 requêtes/jour.
              Rate limiting: 1 requête toutes les 1.2 secondes.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}