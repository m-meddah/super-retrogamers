"use client"

import { useState, useActionState } from "react"
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
import { addConsoleToCollectionSimple, addToWishlistSimple } from "@/lib/actions/collection-actions"

interface Console {
  id: string
  name: string
  slug: string
}

interface ConsoleCollectionActionsProps {
  console: Console
}

const REGIONS = [
  { value: 'FR', label: 'France' },
  { value: 'EU', label: 'Europe' },
  { value: 'WOR', label: 'Monde' },
  { value: 'JP', label: 'Japon' },
  { value: 'US', label: 'États-Unis' },
]

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
]

function SubmitButton({ children, disabled: additionalDisabled = false }: { children: React.ReactNode, disabled?: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button 
      type="submit"
      disabled={pending || additionalDisabled}
      className="flex-1"
    >
      {pending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </Button>
  )
}

export function ConsoleCollectionActions({ console }: ConsoleCollectionActionsProps) {
  const { data: session } = useSession()
  const router = useRouter()
  
  const [collectionState, collectionAction] = useActionState(addConsoleToCollectionSimple, null)
  const [wishlistState, wishlistAction] = useActionState(addToWishlistSimple, null)
  
  const [selectedRegion, setSelectedRegion] = useState<string>("")
  const [selectedCondition, setSelectedCondition] = useState<string>("")
  const [collectionDialogOpen, setCollectionDialogOpen] = useState(false)
  const [wishlistDialogOpen, setWishlistDialogOpen] = useState(false)

  if (!session?.user) {
    return (
      <div className="flex flex-col sm:flex-row gap-3 p-4 bg-gray-50 rounded-lg border dark:bg-gray-900 dark:border-gray-800">
        <p className="text-sm text-gray-600 dark:text-gray-400 flex-1">
          Connectez-vous pour ajouter cette console à votre collection ou wishlist
        </p>
        <Button 
          onClick={() => router.push('/login')} 
          variant="outline" 
          size="sm"
        >
          Se connecter
        </Button>
      </div>
    )
  }

  // Reset dialog states when actions succeed
  if (collectionState?.success && collectionDialogOpen) {
    setCollectionDialogOpen(false)
    setSelectedRegion("")
    setSelectedCondition("")
  }
  
  if (wishlistState?.success && wishlistDialogOpen) {
    setWishlistDialogOpen(false)
    setSelectedRegion("")
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 dark:from-blue-950/20 dark:to-purple-950/20 dark:border-blue-800/30">
      <div className="flex-1">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
          Ajouter à ma collection
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Suivez vos consoles par région et état
        </p>
      </div>
      
      <div className="flex gap-2">
        <Dialog open={collectionDialogOpen} onOpenChange={setCollectionDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Ma collection
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Ajouter à ma collection</DialogTitle>
              <DialogDescription>
                Choisissez la région et l&apos;état de votre console {console.name}
              </DialogDescription>
            </DialogHeader>
            <form action={collectionAction} className="space-y-4">
              <input type="hidden" name="consoleId" value={console.id} />
              
              {collectionState?.success && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg dark:bg-green-950/20 dark:border-green-800">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-700 dark:text-green-300">{collectionState.message}</span>
                </div>
              )}
              
              {collectionState?.error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg dark:bg-red-950/20 dark:border-red-800">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-red-700 dark:text-red-300">{collectionState.error}</span>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="region">Région</Label>
                <Select name="region" value={selectedRegion} onValueChange={setSelectedRegion}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une région" />
                  </SelectTrigger>
                  <SelectContent>
                    {REGIONS.map((region) => (
                      <SelectItem key={region.value} value={region.value}>
                        <div className="flex items-center gap-2">
                          <RegionFlag region={region.value} className="w-5 h-3" />
                          {region.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="condition">État</Label>
                <Select name="condition" value={selectedCondition} onValueChange={setSelectedCondition}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un état" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONDITIONS.map((condition) => (
                      <SelectItem key={condition.value} value={condition.value}>
                        {condition.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => setCollectionDialogOpen(false)}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <SubmitButton disabled={!selectedRegion || !selectedCondition}>
                  Ajouter
                </SubmitButton>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={wishlistDialogOpen} onOpenChange={setWishlistDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Wishlist
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Ajouter à ma wishlist</DialogTitle>
              <DialogDescription>
                Choisissez la région recherchée pour {console.name}
              </DialogDescription>
            </DialogHeader>
            <form action={wishlistAction} className="space-y-4">
              <input type="hidden" name="consoleId" value={console.id} />
              
              {wishlistState?.success && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg dark:bg-green-950/20 dark:border-green-800">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-700 dark:text-green-300">{wishlistState.message}</span>
                </div>
              )}
              
              {wishlistState?.error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg dark:bg-red-950/20 dark:border-red-800">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-red-700 dark:text-red-300">{wishlistState.error}</span>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="wishlist-region">Région</Label>
                <Select name="region" value={selectedRegion} onValueChange={setSelectedRegion}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une région" />
                  </SelectTrigger>
                  <SelectContent>
                    {REGIONS.map((region) => (
                      <SelectItem key={region.value} value={region.value}>
                        <div className="flex items-center gap-2">
                          <RegionFlag region={region.value} className="w-5 h-3" />
                          {region.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => setWishlistDialogOpen(false)}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <SubmitButton disabled={!selectedRegion}>
                  Ajouter à la wishlist
                </SubmitButton>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}