"use client"

import { useState, useActionState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Upload, 
  Download, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  Database,
  Monitor,
  Gamepad2,
  Clock,
  Search,
  Plus,
  Edit3,
  Trash2
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { scrapeSingleConsoleAction, scrapeSingleGameAction, addConsoleManuallyAction, scrapeAllConsolesAction, scrapeLimitedConsolesAction, scrapeConsoleRegionalNamesAction, scrapeGameRegionalTitlesAction } from "@/lib/actions/admin-scraping-actions"
import { rescrapConsoleMediasAction, rescrapGameMediasAction } from "@/lib/actions/scraping-actions"

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
  const [scrapingStats] = useState<ScrapingStats>({
    consolesProcessed: 0,
    gamesProcessed: 0,
    mediaDownloaded: 0,
    errors: 0,
    status: 'idle'
  })
  
  const [isScrapingGames, setIsScrapingGames] = useState(false)
  const [selectedConsoleSlug, setSelectedConsoleSlug] = useState('')
  
  // Server Actions states
  const [consoleScrapingState, consoleScrapingAction, consoleScrapingPending] = useActionState(scrapeSingleConsoleAction, { success: false })
  const [gameScrapingState, gameScrapingAction, gameScrapingPending] = useActionState(scrapeSingleGameAction, { success: false })
  const [addConsoleState, addConsoleAction, addConsolePending] = useActionState(addConsoleManuallyAction, { success: false })
  const [mediaRescrapState, mediaRescrapAction, mediaRescrapPending] = useActionState(rescrapConsoleMediasAction, { success: false })
  const [gameMediaRescrapState, gameMediaRescrapAction, gameMediaRescrapPending] = useActionState(rescrapGameMediasAction, { success: false })
  const [regionalNamesState, regionalNamesAction, regionalNamesPending] = useActionState(scrapeConsoleRegionalNamesAction, { success: false })
  const [regionalTitlesState, regionalTitlesAction, regionalTitlesPending] = useActionState(scrapeGameRegionalTitlesAction, { success: false })
  const [isScrapingAll, setIsScrapingAll] = useState(false)
  const [isScrapingLimited, setIsScrapingLimited] = useState(false)


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

  // Gérer les toasts pour les Server Actions
  if (consoleScrapingState.success && consoleScrapingState.message) {
    toast({
      title: "Scraping terminé",
      description: consoleScrapingState.message,
    })
    consoleScrapingState.success = false
  }
  
  if (consoleScrapingState.error) {
    toast({
      title: "Erreur",
      description: consoleScrapingState.error,
      variant: "destructive",
    })
    consoleScrapingState.error = undefined
  }
  
  if (gameScrapingState.success && gameScrapingState.message) {
    toast({
      title: "Scraping terminé",
      description: gameScrapingState.message,
    })
    gameScrapingState.success = false
  }
  
  if (gameScrapingState.error) {
    toast({
      title: "Erreur",
      description: gameScrapingState.error,
      variant: "destructive",
    })
    gameScrapingState.error = undefined
  }
  
  if (addConsoleState.success && addConsoleState.message) {
    toast({
      title: "Console ajoutée",
      description: addConsoleState.message,
    })
    addConsoleState.success = false
  }
  
  if (addConsoleState.error) {
    toast({
      title: "Erreur",
      description: addConsoleState.error,
      variant: "destructive",
    })
    addConsoleState.error = undefined
  }
  
  if (mediaRescrapState.success && mediaRescrapState.data?.errorDetails?.[0]) {
    toast({
      title: "Re-scraping des médias terminé",
      description: mediaRescrapState.data.errorDetails[0],
    })
    mediaRescrapState.success = false
  }
  
  if (mediaRescrapState.error) {
    toast({
      title: "Erreur",
      description: mediaRescrapState.error,
      variant: "destructive",
    })
    mediaRescrapState.error = undefined
  }
  
  if (gameMediaRescrapState.success && gameMediaRescrapState.data?.errorDetails?.[0]) {
    toast({
      title: "Re-scraping des médias de jeu terminé",
      description: gameMediaRescrapState.data.errorDetails[0],
    })
    gameMediaRescrapState.success = false
  }
  
  if (gameMediaRescrapState.error) {
    toast({
      title: "Erreur",
      description: gameMediaRescrapState.error,
      variant: "destructive",
    })
    gameMediaRescrapState.error = undefined
  }
  
  const handleScrapeAll = async () => {
    setIsScrapingAll(true)
    try {
      const result = await scrapeAllConsolesAction()
      if (result.success && result.message) {
        toast({
          title: "Scraping terminé",
          description: result.message,
        })
      } else if (result.error) {
        toast({
          title: "Erreur",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch {
      toast({
        title: "Erreur",
        description: "Erreur inattendue lors du scraping",
        variant: "destructive",
      })
    } finally {
      setIsScrapingAll(false)
    }
  }

  const handleScrapeLimited = async () => {
    setIsScrapingLimited(true)
    try {
      const result = await scrapeLimitedConsolesAction()
      if (result.success && result.message) {
        toast({
          title: "Scraping terminé",
          description: result.message,
        })
      } else if (result.error) {
        toast({
          title: "Erreur",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch {
      toast({
        title: "Erreur",
        description: "Erreur inattendue lors du scraping",
        variant: "destructive",
      })
    } finally {
      setIsScrapingLimited(false)
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
          Synchronisez le contenu avec l&apos;API Screenscraper.fr et gérez les données
        </p>
      </div>

      <Tabs defaultValue="scraping" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="scraping">Scraping automatique</TabsTrigger>
          <TabsTrigger value="manual">Gestion manuelle</TabsTrigger>
        </TabsList>
        
        <TabsContent value="scraping" className="space-y-6">

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
              onClick={handleScrapeAll}
              disabled={isScrapingAll || scrapingStats.status === 'running'}
              className="flex items-center space-x-2"
            >
              {isScrapingAll ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              <span>Scraper toutes les consoles</span>
            </Button>

            <Button 
              onClick={handleScrapeLimited}
              variant="outline"
              disabled={isScrapingLimited || scrapingStats.status === 'running'}
              className="flex items-center space-x-2"
            >
              {isScrapingLimited ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              <span>Scraping limité (10 consoles)</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Single Console Scraping */}
      <Card>
        <CardHeader>
          <CardTitle>Scraping d&apos;une console spécifique</CardTitle>
          <CardDescription>
            Scraper une console particulière en utilisant son ID Screenscraper
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={consoleScrapingAction} className="flex space-x-4">
            <div className="flex-1">
              <Label htmlFor="consoleId">ID Console Screenscraper</Label>
              <Input
                id="consoleId"
                name="consoleId"
                placeholder="Ex: 1 (Megadrive), 2 (Master System), 57 (PlayStation)"
                type="number"
                required
              />
            </div>
            <div className="flex items-end">
              <Button 
                type="submit"
                disabled={consoleScrapingPending}
                className="flex items-center space-x-2"
              >
                {consoleScrapingPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                <span>Scraper cette console</span>
              </Button>
            </div>
          </form>
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>IDs populaires</AlertTitle>
            <AlertDescription>
              Consoles populaires - Megadrive: 1, Master System: 2, NES: 4, SNES: 3, Game Boy: 9, PlayStation: 57, Nintendo 64: 14, Dreamcast: 23, Neo Geo: 142
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Re-scraping Console Medias */}
      <Card>
        <CardHeader>
          <CardTitle>Re-scraping des médias de console</CardTitle>
          <CardDescription>
            Re-télécharger les médias pour une console existante (utile si certains médias n&apos;ont pas été téléchargés)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={mediaRescrapAction} className="flex space-x-4">
            <div className="flex-1">
              <Label htmlFor="consoleIdForMedias">ID Console (Base de données)</Label>
              <Input
                id="consoleIdForMedias"
                name="consoleId"
                placeholder="Ex: cme8t72pp0000sj4o6n395y5p (Neo Geo)"
                required
              />
            </div>
            <div className="flex items-end">
              <Button 
                type="submit"
                disabled={mediaRescrapPending}
                className="flex items-center space-x-2"
              >
                {mediaRescrapPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span>Re-scraper les médias</span>
              </Button>
            </div>
          </form>
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Test Neo Geo</AlertTitle>
            <AlertDescription>
              ID Neo Geo pour test : <strong>cme8t72pp0000sj4o6n395y5p</strong>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Re-scraping Game Medias */}
      <Card>
        <CardHeader>
          <CardTitle>Re-scraping des médias de jeu</CardTitle>
          <CardDescription>
            Re-télécharger les médias pour un jeu existant (utile si certains médias n&apos;ont pas été téléchargés)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={gameMediaRescrapAction} className="flex space-x-4">
            <div className="flex-1">
              <Label htmlFor="gameIdForMedias">ID Jeu (Base de données)</Label>
              <Input
                id="gameIdForMedias"
                name="gameId"
                placeholder="Ex: cmge8t72pp0000sj4o6n395y5p"
                required
              />
            </div>
            <div className="flex items-end">
              <Button 
                type="submit"
                disabled={gameMediaRescrapPending}
                className="flex items-center space-x-2"
              >
                {gameMediaRescrapPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span>Re-scraper les médias</span>
              </Button>
            </div>
          </form>
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Comment trouver l&apos;ID</AlertTitle>
            <AlertDescription>
              Rendez-vous dans l&apos;onglet &quot;Consoles&quot; ou &quot;Jeux&quot; de l&apos;admin, trouvez votre jeu et copiez son ID unique.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Single Game Scraping */}
      <Card>
        <CardHeader>
          <CardTitle>Scraping d&apos;un jeu spécifique</CardTitle>
          <CardDescription>
            Scraper un jeu particulier en utilisant son ID Screenscraper et l&apos;ID de sa console
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={gameScrapingAction} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="gameConsoleId">ID Console Screenscraper (optionnel)</Label>
                <Input
                  id="gameConsoleId"
                  name="consoleId"
                  placeholder="Ex: 1 (Megadrive), 2 (Master System), 57 (PlayStation)"
                  type="number"
                />
              </div>
              <div>
                <Label htmlFor="gameId">ID Jeu Screenscraper</Label>
                <Input
                  id="gameId"
                  name="gameId"
                  placeholder="Ex: 5 (Sonic the Hedgehog), 7 (Streets of Rage)"
                  type="number"
                  required
                />
              </div>
            </div>
            
            <Button 
              type="submit"
              disabled={gameScrapingPending}
              className="flex items-center space-x-2"
            >
              {gameScrapingPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Gamepad2 className="h-4 w-4" />
              )}
              <span>Scraper ce jeu</span>
            </Button>
          </form>
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Comment trouver les IDs</AlertTitle>
            <AlertDescription>
              Rendez-vous sur screenscraper.fr, recherchez votre jeu et regardez l&apos;URL : 
              .../gameinfos.php?gameid=<strong>123</strong>&amp;platformid=<strong>1</strong>
            </AlertDescription>
          </Alert>
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

      {/* Regional Names Scraping */}
      <Card>
        <CardHeader>
          <CardTitle>Scraping des noms régionaux</CardTitle>
          <CardDescription>
            Synchronise les noms et titres régionaux pour les consoles et jeux existants
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Information</AlertTitle>
            <AlertDescription>
              Ces actions mettent à jour les noms régionaux (Megadrive → Genesis) et les titres de jeux 
              (Resident Evil → Biohazard) pour les données existantes en base.
            </AlertDescription>
          </Alert>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Console Regional Names */}
            <form action={regionalNamesAction} className="space-y-4">
              <div className="flex flex-col space-y-2">
                <h4 className="font-medium">Noms régionaux des consoles</h4>
                <p className="text-sm text-muted-foreground">
                  Met à jour les noms régionaux de toutes les consoles existantes
                </p>
                <Button 
                  type="submit"
                  disabled={regionalNamesPending}
                  className="flex items-center space-x-2"
                >
                  {regionalNamesPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Monitor className="h-4 w-4" />
                  )}
                  <span>Scraper noms consoles</span>
                </Button>
              </div>
            </form>

            {/* Game Regional Titles */}
            <form action={regionalTitlesAction} className="space-y-4">
              <div className="flex flex-col space-y-2">
                <h4 className="font-medium">Titres régionaux des jeux</h4>
                <p className="text-sm text-muted-foreground">
                  Met à jour les titres régionaux de tous les jeux existants
                </p>
                <Button 
                  type="submit"
                  disabled={regionalTitlesPending}
                  className="flex items-center space-x-2"
                >
                  {regionalTitlesPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Gamepad2 className="h-4 w-4" />
                  )}
                  <span>Scraper titres jeux</span>
                </Button>
              </div>
            </form>
          </div>

          {/* Status Messages */}
          {regionalNamesState.success && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Succès</AlertTitle>
              <AlertDescription>{regionalNamesState.message}</AlertDescription>
            </Alert>
          )}
          
          {regionalNamesState.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erreur</AlertTitle>
              <AlertDescription>{regionalNamesState.error}</AlertDescription>
            </Alert>
          )}

          {regionalTitlesState.success && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Succès</AlertTitle>
              <AlertDescription>{regionalTitlesState.message}</AlertDescription>
            </Alert>
          )}
          
          {regionalTitlesState.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erreur</AlertTitle>
              <AlertDescription>{regionalTitlesState.error}</AlertDescription>
            </Alert>
          )}
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
        </TabsContent>
        
        <TabsContent value="manual" className="space-y-6">
          {/* Manual Console Addition */}
          <Card>
            <CardHeader>
              <CardTitle>Ajouter une console manuellement</CardTitle>
              <CardDescription>
                Créez une nouvelle console sans passer par l&apos;API Screenscraper
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form action={addConsoleAction} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nom de la console</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Ex: Nintendo Entertainment System"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Description détaillée de la console..."
                    rows={4}
                  />
                </div>
                
                <Button 
                  type="submit"
                  disabled={addConsolePending}
                  className="flex items-center space-x-2"
                >
                  {addConsolePending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  <span>Ajouter la console</span>
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card>
            <CardHeader>
              <CardTitle>Gestion des données</CardTitle>
              <CardDescription>
                Outils pour modifier et supprimer des données existantes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="editConsole">Console à modifier</Label>
                  <Select value={selectedConsoleSlug} onValueChange={setSelectedConsoleSlug}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une console" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nes">Nintendo Entertainment System</SelectItem>
                      <SelectItem value="snes">Super Nintendo</SelectItem>
                      <SelectItem value="playstation">PlayStation</SelectItem>
                      <SelectItem value="gameboy">Game Boy</SelectItem>
                      <SelectItem value="neo-geo">Neo Geo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2 flex flex-col justify-end">
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline"
                      disabled={!selectedConsoleSlug}
                      className="flex items-center space-x-2"
                    >
                      <Edit3 className="h-4 w-4" />
                      <span>Modifier</span>
                    </Button>
                    
                    <Button 
                      variant="destructive"
                      disabled={!selectedConsoleSlug}
                      className="flex items-center space-x-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Supprimer</span>
                    </Button>
                  </div>
                </div>
              </div>
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Attention</AlertTitle>
                <AlertDescription>
                  La suppression d&apos;une console supprimera également tous ses jeux associés. Cette action est irréversible.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}