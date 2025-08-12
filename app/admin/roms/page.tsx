"use client"

import { useState, useActionState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { 
  Search,
  Plus,
  Trash2,
  ExternalLink,
  AlertCircle,
  Loader2,
  Gamepad2
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { addRomAction, searchGamesForRomAction, getRomsByGameAction, deleteRomAction } from "@/lib/actions/rom-actions"

interface GameResult {
  id: string
  title: string
  console: {
    name: string
  } | null
}

interface Rom {
  id: string
  region: string
  version: string | null
  language: string | null
  isBestVersion: boolean
  isBeta: boolean
  isDemo: boolean
  isHacked: boolean
  isTranslated: boolean
  isUnlicensed: boolean
  isAlternative: boolean
  archiveOrgUrl: string | null
  myrientUrl: string | null
  fileName: string | null
  quality: string | null
  priority: number
  createdAt: Date
  verifiedAt: Date | null
  game: {
    title: string
  }
}

export default function RomManagement() {
  const { toast } = useToast()
  
  // États pour la recherche de jeux
  const [gameQuery, setGameQuery] = useState('')
  const [searchResults, setSearchResults] = useState<GameResult[]>([])
  const [selectedGame, setSelectedGame] = useState<GameResult | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  
  // États pour les ROMs du jeu sélectionné
  const [gameRoms, setGameRoms] = useState<Rom[]>([])
  const [isLoadingRoms, setIsLoadingRoms] = useState(false)
  
  // États pour le formulaire
  const [selectedRegion, setSelectedRegion] = useState<string>('')
  
  // Server Actions states
  const [addRomState, addRomActionHandler, addRomPending] = useActionState(addRomAction, { success: false })
  const [deleteRomState, deleteRomActionHandler, deleteRomPending] = useActionState(deleteRomAction, { success: false })

  const searchGames = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const result = await searchGamesForRomAction(query)
      if (result.success) {
        setSearchResults(result.data as GameResult[])
      }
    } catch (error) {
      console.error('Erreur recherche:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const selectGame = async (game: GameResult) => {
    setSelectedGame(game)
    setGameQuery(game.title)
    setSearchResults([])
    
    // Charger les ROMs pour ce jeu
    await loadGameRoms(game.id)
  }

  const loadGameRoms = async (gameId: string) => {
    setIsLoadingRoms(true)
    try {
      const result = await getRomsByGameAction(gameId)
      if (result.success) {
        setGameRoms(result.data as Rom[])
      }
    } catch (error) {
      console.error('Erreur chargement ROMs:', error)
    } finally {
      setIsLoadingRoms(false)
    }
  }

  // Gérer les toasts pour les Server Actions
  if (addRomState.success && addRomState.message) {
    toast({
      title: "ROM ajoutée",
      description: addRomState.message,
    })
    addRomState.success = false
    // Recharger les ROMs après ajout
    if (selectedGame) {
      loadGameRoms(selectedGame.id)
    }
  }
  
  if (addRomState.error) {
    toast({
      title: "Erreur",
      description: addRomState.error,
      variant: "destructive",
    })
    addRomState.error = undefined
  }

  if (deleteRomState.success && deleteRomState.message) {
    toast({
      title: "ROM supprimée",
      description: deleteRomState.message,
    })
    deleteRomState.success = false
    // Recharger les ROMs après suppression
    if (selectedGame) {
      loadGameRoms(selectedGame.id)
    }
  }
  
  if (deleteRomState.error) {
    toast({
      title: "Erreur",
      description: deleteRomState.error,
      variant: "destructive",
    })
    deleteRomState.error = undefined
  }

  const getQualityBadgeColor = (quality: string | null) => {
    switch (quality) {
      case 'HIGH': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'LOW': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const getRomTypeBadges = (rom: Rom) => {
    const badges = []
    if (rom.isBestVersion) badges.push({ label: 'Best', color: 'bg-green-100 text-green-800' })
    if (rom.isDemo) badges.push({ label: 'Demo', color: 'bg-blue-100 text-blue-800' })
    if (rom.isBeta) badges.push({ label: 'Beta', color: 'bg-purple-100 text-purple-800' })
    if (rom.isTranslated) badges.push({ label: 'Trad', color: 'bg-orange-100 text-orange-800' })
    if (rom.isHacked) badges.push({ label: 'Hack', color: 'bg-red-100 text-red-800' })
    if (rom.isUnlicensed) badges.push({ label: 'Unl', color: 'bg-gray-100 text-gray-800' })
    if (rom.isAlternative) badges.push({ label: 'Alt', color: 'bg-indigo-100 text-indigo-800' })
    return badges
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Gestion des ROMs</h1>
        <p className="text-muted-foreground">
          Ajoutez et gérez les liens vers les ROMs pour les jeux de la base
        </p>
      </div>

      {/* Recherche de jeu */}
      <Card>
        <CardHeader>
          <CardTitle>Sélectionner un jeu</CardTitle>
          <CardDescription>
            Recherchez et sélectionnez un jeu pour gérer ses ROMs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Rechercher un jeu par titre..."
              value={gameQuery}
              onChange={(e) => {
                setGameQuery(e.target.value)
                searchGames(e.target.value)
              }}
              className="pl-10"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin" />
            )}
          </div>

          {/* Résultats de recherche */}
          {searchResults.length > 0 && (
            <div className="border rounded-md max-h-48 overflow-y-auto">
              {searchResults.map((game) => (
                <div
                  key={game.id}
                  className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                  onClick={() => selectGame(game)}
                >
                  <div className="font-medium">{game.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {game.console?.name || 'Console inconnue'}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Jeu sélectionné */}
          {selectedGame && (
            <div className="p-3 bg-muted rounded-md">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{selectedGame.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedGame.console?.name || 'Console inconnue'}
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setSelectedGame(null)}>
                  Changer
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Formulaire d'ajout de ROM */}
      {selectedGame && (
        <Card>
          <CardHeader>
            <CardTitle>Ajouter une ROM</CardTitle>
            <CardDescription>
              Ajoutez un lien ROM pour &ldquo;{selectedGame.title}&rdquo;
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={addRomActionHandler} className="space-y-4">
              <input type="hidden" name="gameId" value={selectedGame.id} />
              
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="region">Région *</Label>
                  <Select name="region" value={selectedRegion} onValueChange={setSelectedRegion} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une région" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FR">France</SelectItem>
                      <SelectItem value="EU">Europe</SelectItem>
                      <SelectItem value="US">États-Unis</SelectItem>
                      <SelectItem value="JP">Japon</SelectItem>
                      <SelectItem value="WOR">Monde</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="version">Version</Label>
                  <Input
                    id="version"
                    name="version"
                    placeholder="v1.0, Rev A, etc."
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="language">Langue</Label>
                  <Input
                    id="language"
                    name="language"
                    placeholder="French, English, Multi, etc."
                  />
                </div>

                <div>
                  <Label htmlFor="quality">Qualité</Label>
                  <Select name="quality">
                    <SelectTrigger>
                      <SelectValue placeholder="Qualité de la ROM" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HIGH">Haute</SelectItem>
                      <SelectItem value="MEDIUM">Moyenne</SelectItem>
                      <SelectItem value="LOW">Basse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Liens de téléchargement</Label>
                <div>
                  <Label htmlFor="archiveOrgUrl">Archive.org URL</Label>
                  <Input
                    id="archiveOrgUrl"
                    name="archiveOrgUrl"
                    placeholder="https://archive.org/details/..."
                    type="url"
                  />
                </div>
                <div>
                  <Label htmlFor="myrientUrl">Myrient URL</Label>
                  <Input
                    id="myrientUrl"
                    name="myrientUrl"
                    placeholder="https://myrient.erista.me/..."
                    type="url"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="fileName">Nom du fichier</Label>
                <Input
                  id="fileName"
                  name="fileName"
                  placeholder="game.zip, game.rom, etc."
                />
              </div>

              <div className="space-y-3">
                <Label>Type de ROM</Label>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="isBestVersion" name="isBestVersion" />
                    <Label htmlFor="isBestVersion" className="text-sm">Meilleure version</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="isDemo" name="isDemo" />
                    <Label htmlFor="isDemo" className="text-sm">Démo</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="isBeta" name="isBeta" />
                    <Label htmlFor="isBeta" className="text-sm">Beta</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="isTranslated" name="isTranslated" />
                    <Label htmlFor="isTranslated" className="text-sm">Traduit</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="isHacked" name="isHacked" />
                    <Label htmlFor="isHacked" className="text-sm">Hacké</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="isUnlicensed" name="isUnlicensed" />
                    <Label htmlFor="isUnlicensed" className="text-sm">Non licencié</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="isAlternative" name="isAlternative" />
                    <Label htmlFor="isAlternative" className="text-sm">Alternative</Label>
                  </div>
                </div>
              </div>

              <Button 
                type="submit"
                disabled={addRomPending || !selectedRegion}
                className="flex items-center space-x-2"
              >
                {addRomPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                <span>Ajouter la ROM</span>
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Liste des ROMs existantes */}
      {selectedGame && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Gamepad2 className="h-5 w-5" />
              <span>ROMs disponibles pour &ldquo;{selectedGame.title}&rdquo;</span>
            </CardTitle>
            <CardDescription>
              {gameRoms.length} ROM{gameRoms.length > 1 ? 's' : ''} trouvée{gameRoms.length > 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingRoms ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Chargement des ROMs...</span>
              </div>
            ) : gameRoms.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucune ROM trouvée pour ce jeu
              </div>
            ) : (
              <div className="space-y-4">
                {gameRoms.map((rom) => (
                  <div key={rom.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge variant="outline">{rom.region}</Badge>
                          {rom.version && (
                            <Badge variant="secondary">{rom.version}</Badge>
                          )}
                          {rom.quality && (
                            <Badge className={getQualityBadgeColor(rom.quality)}>
                              {rom.quality}
                            </Badge>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-1 mb-2">
                          {getRomTypeBadges(rom).map((badge, index) => (
                            <Badge key={index} className={badge.color}>
                              {badge.label}
                            </Badge>
                          ))}
                        </div>

                        {rom.language && (
                          <div className="text-sm text-muted-foreground mb-2">
                            Langue: {rom.language}
                          </div>
                        )}

                        {rom.fileName && (
                          <div className="text-sm text-muted-foreground mb-2">
                            Fichier: {rom.fileName}
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2">
                          {rom.archiveOrgUrl && (
                            <a
                              href={rom.archiveOrgUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
                            >
                              <ExternalLink className="h-3 w-3" />
                              <span>Archive.org</span>
                            </a>
                          )}
                          {rom.myrientUrl && (
                            <a
                              href={rom.myrientUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
                            >
                              <ExternalLink className="h-3 w-3" />
                              <span>Myrient</span>
                            </a>
                          )}
                        </div>
                      </div>

                      <form action={deleteRomActionHandler}>
                        <input type="hidden" name="romId" value={rom.id} />
                        <Button 
                          type="submit"
                          variant="destructive" 
                          size="sm"
                          disabled={deleteRomPending}
                        >
                          {deleteRomPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Information</AlertTitle>
        <AlertDescription>
          Les ROMs ne sont pas hébergées sur ce site. Seuls les liens vers des archives légales 
          (Archive.org, Myrient) sont stockés. Assurez-vous de respecter les droits d&apos;auteur.
        </AlertDescription>
      </Alert>
    </div>
  )
}