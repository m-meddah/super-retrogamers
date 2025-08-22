"use client"

import { useState, useActionState, useEffect } from "react"
import { Plus, Heart, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { useFormStatus } from "react-dom"
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

function SubmitButton({ children, variant = "default", ...props }: { 
  children: React.ReactNode, 
  variant?: "default" | "outline",
  [key: string]: any 
}) {
  const { pending } = useFormStatus()

  return (
    <Button 
      type="submit" 
      variant={variant}
      disabled={pending} 
      className="w-full"
      {...props}
    >
      {pending ? (
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

  // États pour les formulaires
  const [collectionState, collectionAction, collectionPending] = useActionState(addGameToCollectionSimple, { 
    success: false, 
    message: '' 
  })

  const [wishlistState, wishlistAction, wishlistPending] = useActionState(addGameToWishlistSimple, { 
    success: false, 
    message: '' 
  })

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

  if (!session) {
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
          
          <form action={collectionAction} className="space-y-4">
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

            <SubmitButton>
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
          
          <form action={wishlistAction} className="space-y-4">
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

            <SubmitButton variant="outline">
              <Heart className="mr-2 h-4 w-4" />
              Ajouter à ma wishlist
            </SubmitButton>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}