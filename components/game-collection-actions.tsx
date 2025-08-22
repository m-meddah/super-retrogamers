"use client"

import { useState, useEffect } from "react"
import { Plus, Heart, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useSession } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { RegionFlag } from "@/components/ui/region-flag"
import { addGameToCollectionSimple, addGameToWishlistSimple, getAvailableRegionsForGame } from "@/lib/actions/collection-actions"

interface Game {
  id: string
  title: string
  slug: string
  console?: {
    slug: string
  }
}

interface GameCollectionActionsProps {
  game: Game
  availableRegions?: string[] // Régions disponibles pour ce jeu (optionnel, sera calculé automatiquement)
}

const CONDITIONS = [
  { value: 'SEALED', label: 'Neuf sous blister' },
  { value: 'MINT', label: 'Parfait état' },
  { value: 'NEAR_MINT', label: 'Quasi parfait' },
  { value: 'VERY_GOOD', label: 'Très bon état' },
  { value: 'GOOD', label: 'Bon état' },
  { value: 'FAIR', label: 'État moyen' },
  { value: 'POOR', label: 'Mauvais état' },
  { value: 'LOOSE', label: 'Sans boîte' },
  { value: 'CIB', label: 'Complete In Box' },
  { value: 'BOXED', label: 'Avec boîte' },
  { value: 'CART_ONLY', label: 'Cartouche seule' },
  { value: 'DISC_ONLY', label: 'Disque seul' }
]

const ALL_REGIONS = [
  { value: 'FR', label: 'France' },
  { value: 'EU', label: 'Europe' },
  { value: 'WOR', label: 'Monde' },
  { value: 'JP', label: 'Japon' },
  { value: 'US', label: 'États-Unis' },
  { value: 'ASI', label: 'Asie' },
]

function SubmitButton({ children, variant = "default", isSubmitting = false, ...props }: { 
  children: React.ReactNode, 
  variant?: "default" | "outline",
  isSubmitting?: boolean,
  [key: string]: any 
}) {
  return (
    <Button 
      type="submit" 
      variant={variant}
      disabled={isSubmitting} 
      className="w-full"
      {...props}
    >
      {isSubmitting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {variant === "outline" ? "Ajout wishlist..." : "Ajout collection..."}
        </>
      ) : (
        children
      )}
    </Button>
  )
}

export default function GameCollectionActions({ game, availableRegions }: GameCollectionActionsProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [isCollectionOpen, setIsCollectionOpen] = useState(false)
  const [isWishlistOpen, setIsWishlistOpen] = useState(false)
  const [detectedRegions, setDetectedRegions] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // États pour les formulaires - utilisons directement les actions Server sans useActionState pour debug
  const [collectionState, setCollectionState] = useState({ success: false, message: '' })
  const [wishlistState, setWishlistState] = useState({ success: false, message: '' })

  // Handlers pour les formulaires
  const handleCollectionSubmit = async (formData: FormData) => {
    setIsSubmitting(true)
    try {
      const result = await addGameToCollectionSimple(collectionState, formData)
      setCollectionState(result)
      if (result.success) {
        setIsCollectionOpen(false)
        // Rafraîchir la page pour forcer le rechargement des données
        router.refresh()
      }
    } catch (error) {
      setCollectionState({ success: false, message: 'Erreur lors de l\'ajout' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleWishlistSubmit = async (formData: FormData) => {
    setIsSubmitting(true)
    try {
      const result = await addGameToWishlistSimple(wishlistState, formData)
      setWishlistState(result)
      if (result.success) {
        setIsWishlistOpen(false)
      }
    } catch (error) {
      setWishlistState({ success: false, message: 'Erreur lors de l\'ajout' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Détecter les régions disponibles via les médias en cache
  useEffect(() => {
    async function detectAvailableRegions() {
      if (availableRegions) {
        setDetectedRegions(availableRegions)
        return
      }

      try {
        // Utiliser le Server Action pour récupérer les régions disponibles depuis les médias box-2D
        const regions = await getAvailableRegionsForGame(game.id)
        setDetectedRegions(regions)
      } catch (error) {
        console.error('Erreur détection régions:', error)
        // Fallback: toutes les régions
        setDetectedRegions(['FR', 'EU', 'WOR', 'JP', 'US', 'ASI'])
      }
    }

    detectAvailableRegions()
  }, [game.id, availableRegions])

  // Filtrer les régions selon celles détectées
  const regions = ALL_REGIONS.filter(region => detectedRegions.includes(region.value))

  // Fermer les modales en cas de succès
  useEffect(() => {
    if (collectionState.success) {
      setIsCollectionOpen(false)
    }
  }, [collectionState.success])

  useEffect(() => {
    if (wishlistState.success) {
      setIsWishlistOpen(false)
    }
  }, [wishlistState.success])

  // Éviter l'erreur d'hydration en affichant le même contenu côté serveur et client
  const isLoggedIn = !!session?.user

  if (!isLoggedIn) {
    return (
      <div className="space-y-3">
        <Button 
          variant="default" 
          className="w-full"
          onClick={() => router.push('/login')}
        >
          <Plus className="mr-2 h-4 w-4" />
          Se connecter pour collectionner
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Bouton Collection */}
      <Dialog open={isCollectionOpen} onOpenChange={setIsCollectionOpen}>
        <DialogTrigger asChild>
          <Button variant="default" className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Ajouter à ma collection
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter à ma collection</DialogTitle>
            <DialogDescription>
              Ajouter {game.title} à votre collection de jeux
            </DialogDescription>
          </DialogHeader>
          
          <form action={handleCollectionSubmit} className="space-y-4">
            <input type="hidden" name="gameId" value={game.id} />
            
            <div>
              <Label htmlFor="region">Région *</Label>
              <Select name="region" required>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une région" />
                </SelectTrigger>
                <SelectContent>
                  {regions.map(region => (
                    <SelectItem key={region.value} value={region.value}>
                      <div className="flex items-center gap-2">
                        <RegionFlag region={region.value as any} />
                        {region.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="condition">État</Label>
              <Select name="condition">
                <SelectTrigger>
                  <SelectValue placeholder="État du jeu (optionnel)" />
                </SelectTrigger>
                <SelectContent>
                  {CONDITIONS.map(condition => (
                    <SelectItem key={condition.value} value={condition.value}>
                      {condition.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {collectionState.message && (
              <div className={`flex items-center gap-2 text-sm ${
                collectionState.success 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {collectionState.success ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                {collectionState.message}
              </div>
            )}

            <SubmitButton isSubmitting={isSubmitting}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter à ma collection
            </SubmitButton>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bouton Wishlist */}
      <Dialog open={isWishlistOpen} onOpenChange={setIsWishlistOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full">
            <Heart className="mr-2 h-4 w-4" />
            Ajouter à ma wishlist
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter à ma wishlist</DialogTitle>
            <DialogDescription>
              Ajouter {game.title} à votre liste de souhaits
            </DialogDescription>
          </DialogHeader>
          
          <form action={handleWishlistSubmit} className="space-y-4">
            <input type="hidden" name="gameId" value={game.id} />
            
            <div>
              <Label htmlFor="region">Région *</Label>
              <Select name="region" required>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une région" />
                </SelectTrigger>
                <SelectContent>
                  {regions.map(region => (
                    <SelectItem key={region.value} value={region.value}>
                      <div className="flex items-center gap-2">
                        <RegionFlag region={region.value as any} />
                        {region.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {wishlistState.message && (
              <div className={`flex items-center gap-2 text-sm ${
                wishlistState.success 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {wishlistState.success ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                {wishlistState.message}
              </div>
            )}

            <SubmitButton variant="outline" isSubmitting={isSubmitting}>
              <Heart className="mr-2 h-4 w-4" />
              Ajouter à ma wishlist
            </SubmitButton>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}