'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { CollectionService } from '@/lib/collection-service'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { ItemCondition, Region } from '@prisma/client'
import { createConsoleVariants } from '@/lib/console-variants-service'
import type { 
  AddConsoleToCollectionData, 
  AddGameToCollectionData 
} from '@/lib/collection-service'
import type { 
  UserConsoleCollection,
  UserGameCollection,
  UserCollectionStats,
  UserWishlist
} from '@prisma/client'

export interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

async function getCurrentUserId(): Promise<string | null> {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })
    return session?.user?.id ?? null
  } catch {
    return null
  }
}

// Console Collection Actions
export async function addConsoleToCollectionAction(
  data: Omit<AddConsoleToCollectionData, 'userId'>
): Promise<ActionResult<UserConsoleCollection>> {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return { success: false, error: 'Vous devez être connecté' }
    }

    const result = await CollectionService.addConsoleToCollection({
      ...data,
      userId})

    revalidatePath('/collection')
    return { success: true, data: result }
  } catch (error) {
    console.error('Add console to collection error:', error)
    return { 
      success: false, 
      error: 'Erreur lors de l\'ajout de la console à la collection' 
    }
  }
}

export async function removeConsoleFromCollectionAction(
  consoleCollectionId: string
): Promise<ActionResult> {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return { success: false, error: 'Vous devez être connecté' }
    }

    const success = await CollectionService.removeConsoleFromCollection(
      consoleCollectionId,
      userId
    )

    if (success) {
      revalidatePath('/collection')
      return { success: true }
    }

    return { success: false, error: 'Console non trouvée ou non autorisée' }
  } catch (error) {
    console.error('Remove console from collection error:', error)
    return { 
      success: false, 
      error: 'Erreur lors de la suppression de la console' 
    }
  }
}

// Game Collection Actions
export async function addGameToCollectionAction(
  data: Omit<AddGameToCollectionData, 'userId'>
): Promise<ActionResult<UserGameCollection>> {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return { success: false, error: 'Vous devez être connecté' }
    }

    const result = await CollectionService.addGameToCollection({
      ...data,
      userId})

    revalidatePath('/collection')
    return { success: true, data: result }
  } catch (error) {
    console.error('Add game to collection error:', error)
    return { 
      success: false, 
      error: 'Erreur lors de l\'ajout du jeu à la collection' 
    }
  }
}

export async function removeGameFromCollectionAction(
  gameCollectionId: string
): Promise<ActionResult> {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return { success: false, error: 'Vous devez être connecté' }
    }

    const success = await CollectionService.removeGameFromCollection(
      gameCollectionId,
      userId
    )

    if (success) {
      revalidatePath('/collection')
      return { success: true }
    }

    return { success: false, error: 'Jeu non trouvé ou non autorisé' }
  } catch (error) {
    console.error('Remove game from collection error:', error)
    return { 
      success: false, 
      error: 'Erreur lors de la suppression du jeu' 
    }
  }
}

// User Collection Data Actions
export async function getUserCollectionAction(): Promise<ActionResult<{
  consoles: { items: UserConsoleCollection[], total: number, pages: number, currentPage: number },
  games: { items: UserGameCollection[], total: number, pages: number, currentPage: number },
  stats: UserCollectionStats | null
}>> {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return { success: false, error: 'Vous devez être connecté' }
    }

    const [consoles, games, stats] = await Promise.all([
      CollectionService.getUserConsoleCollection(userId),
      CollectionService.getUserGameCollection(userId),
      CollectionService.getUserStats(userId)
    ])

    return { 
      success: true, 
      data: {
        consoles: consoles,
        games: games,
        stats: stats
      }
    }
  } catch (error) {
    console.error('Get user collection error:', error)
    return { 
      success: false, 
      error: 'Erreur lors du chargement de la collection' 
    }
  }
}

// Wishlist Actions
export async function addToWishlistAction(
  data: { itemType: 'console' | 'game', itemId: string, notes?: string }
): Promise<ActionResult<UserWishlist>> {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return { success: false, error: 'Vous devez être connecté' }
    }

    const result = await CollectionService.addToWishlist(userId, data)

    revalidatePath('/collection')
    return { success: true, data: result }
  } catch (error) {
    console.error('Add to wishlist error:', error)
    return { 
      success: false, 
      error: 'Erreur lors de l\'ajout à la liste de souhaits' 
    }
  }
}

export async function removeFromWishlistAction(
  wishlistId: string
): Promise<ActionResult> {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return { success: false, error: 'Vous devez être connecté' }
    }

    const success = await CollectionService.removeFromWishlist(wishlistId, userId)

    if (success) {
      revalidatePath('/collection')
      return { success: true }
    }

    return { success: false, error: 'Élément non trouvé ou non autorisé' }
  } catch (error) {
    console.error('Remove from wishlist error:', error)
    return { 
      success: false, 
      error: 'Erreur lors de la suppression de la liste de souhaits' 
    }
  }
}

export async function getUserWishlistAction(): Promise<ActionResult<UserWishlist[]>> {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return { success: false, error: 'Vous devez être connecté' }
    }

    const wishlist = await CollectionService.getUserWishlist(userId)

    return { success: true, data: wishlist }
  } catch (error) {
    console.error('Get user wishlist error:', error)
    return { 
      success: false, 
      error: 'Erreur lors du chargement de la liste de souhaits' 
    }
  }
}

// New simplified actions for console page
export async function addConsoleToCollectionSimple(
  prevState: { success: boolean; message?: string; error?: string } | null, 
  formData: FormData
) {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session?.user?.id) {
    return { success: false, error: 'Vous devez être connecté' }
  }

  const consoleId = formData.get("consoleId") as string
  const region = formData.get("region") as string
  const condition = formData.get("condition") as string

  if (!consoleId || !region || !condition) {
    return { success: false, error: 'Champs obligatoires manquants' }
  }

  try {
    // Check if console exists
    const console = await prisma.console.findUnique({
      where: { id: consoleId },
      include: { variants: true }
    })

    if (!console) {
      return { success: false, error: 'Console non trouvée' }
    }

    // Créer les variants si ils n'existent pas
    await createConsoleVariants(console.slug)

    // Trouver ou créer le variant pour la région spécifiée
    let variant = await prisma.consoleVariant.findFirst({
      where: {
        consoleId: console.id,
        region: region as Region
      }
    })

    if (!variant) {
      // Créer le variant manquant
      variant = await prisma.consoleVariant.create({
        data: {
          consoleId: console.id,
          name: `${console.name} (${region})`,
          region: region as Region,
          releaseDate: console.releaseYear ? new Date(console.releaseYear, 0, 1) : null
        }
      })
    }

    // Check if user already has this console variant in collection with same condition
    const existingItem = await prisma.userConsoleCollection.findFirst({
      where: {
        userId: session.user.id,
        consoleVariantId: variant.id,
        condition: condition as ItemCondition
      }
    })

    if (existingItem) {
      return { success: false, error: 'Console déjà présente dans votre collection avec cette région et cet état' }
    }

    // Add to collection using variant
    await prisma.userConsoleCollection.create({
      data: {
        userId: session.user.id,
        consoleVariantId: variant.id,
        condition: condition as ItemCondition,
        status: 'OWNED'
      }
    })

    revalidatePath("/collection")
    revalidatePath(`/consoles/${console.slug}`)
    return { success: true, message: "Console ajoutée à votre collection !" }

  } catch (error) {
    console.error("Error adding console to collection:", error)
    return { success: false, error: "Erreur lors de l'ajout à la collection" }
  }
}

export async function addToWishlistSimple(
  prevState: { success: boolean; message?: string; error?: string } | null, 
  formData: FormData
) {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session?.user?.id) {
    return { success: false, error: 'Vous devez être connecté' }
  }

  const consoleId = formData.get("consoleId") as string
  const region = formData.get("region") as string

  if (!consoleId || !region) {
    return { success: false, error: 'Champs obligatoires manquants' }
  }

  try {
    // Check if console exists
    const console = await prisma.console.findUnique({
      where: { id: consoleId }
    })
    if (!console) {
      return { success: false, error: 'Console non trouvée' }
    }

    // Créer les variants si ils n'existent pas
    await createConsoleVariants(console.slug)

    // Trouver ou créer le variant pour la région spécifiée
    let variant = await prisma.consoleVariant.findFirst({
      where: {
        consoleId: console.id,
        region: region as Region
      }
    })

    if (!variant) {
      // Créer le variant manquant
      variant = await prisma.consoleVariant.create({
        data: {
          consoleId: console.id,
          name: `${console.name} (${region})`,
          region: region as Region,
          releaseDate: console.releaseYear ? new Date(console.releaseYear, 0, 1) : null
        }
      })
    }

    // Check if item already in wishlist for this specific variant
    const existingItem = await prisma.userWishlist.findFirst({
      where: {
        userId: session.user.id,
        consoleVariantId: variant.id
      }
    })

    if (existingItem) {
      return { success: false, error: 'Console déjà présente dans votre wishlist pour cette région' }
    }

    // Add to wishlist using variant
    await prisma.userWishlist.create({
      data: {
        userId: session.user.id,
        consoleId,
        consoleVariantId: variant.id
      }
    })

    revalidatePath("/collection")
    revalidatePath(`/consoles/${console.slug}`)
    return { success: true, message: "Ajouté à votre wishlist !" }

  } catch (error) {
    console.error("Error adding item to wishlist:", error)
    return { success: false, error: "Erreur lors de l'ajout à la wishlist" }
  }
}

// === Actions pour les jeux ===

interface SimpleActionState {
  success: boolean
  message: string
}

export async function addGameToCollectionSimple(
  prevState: SimpleActionState,
  formData: FormData
): Promise<SimpleActionState> {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user?.id) {
      return { success: false, message: "Vous devez être connecté pour ajouter des jeux à votre collection" }
    }

    const gameId = formData.get('gameId') as string
    const region = formData.get('region') as string
    const condition = formData.get('condition') as string

    if (!gameId || !region) {
      return { success: false, message: "Jeu et région requis" }
    }

    // Récupérer le jeu pour validation
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { id: true, title: true, slug: true }
    })

    if (!game) {
      return { success: false, message: "Jeu non trouvé" }
    }

    // Trouver ou créer le variant pour la région spécifiée
    let variant = await prisma.gameVariant.findFirst({
      where: {
        gameId: game.id,
        region: region as Region
      }
    })

    if (!variant) {
      // Créer le variant manquant
      variant = await prisma.gameVariant.create({
        data: {
          gameId: game.id,
          name: `${game.title} (${region})`,
          region: region as Region
        }
      })
    }

    // Check if item already in collection for this specific variant
    const existingItem = await prisma.userGameCollection.findFirst({
      where: {
        userId: session.user.id,
        gameVariantId: variant.id
      }
    })

    if (existingItem) {
      return { success: false, message: 'Jeu déjà présent dans votre collection pour cette région' }
    }

    // Add to collection using variant
    await prisma.userGameCollection.create({
      data: {
        userId: session.user.id,
        gameId: game.id,
        gameVariantId: variant.id,
        condition: condition ? (condition as ItemCondition) : null
      }
    })

    revalidatePath("/collection")
    revalidatePath(`/jeux/${game.slug}`)
    return { success: true, message: "Ajouté à votre collection !" }

  } catch (error) {
    console.error("Error adding game to collection:", error)
    return { success: false, message: "Erreur lors de l'ajout à la collection" }
  }
}

export async function addGameToWishlistSimple(
  prevState: SimpleActionState,
  formData: FormData
): Promise<SimpleActionState> {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user?.id) {
      return { success: false, message: "Vous devez être connecté pour ajouter des jeux à votre wishlist" }
    }

    const gameId = formData.get('gameId') as string
    const region = formData.get('region') as string

    if (!gameId || !region) {
      return { success: false, message: "Jeu et région requis" }
    }

    // Récupérer le jeu pour validation
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { id: true, title: true, slug: true }
    })

    if (!game) {
      return { success: false, message: "Jeu non trouvé" }
    }

    // Trouver ou créer le variant pour la région spécifiée
    let variant = await prisma.gameVariant.findFirst({
      where: {
        gameId: game.id,
        region: region as Region
      }
    })

    if (!variant) {
      // Créer le variant manquant
      variant = await prisma.gameVariant.create({
        data: {
          gameId: game.id,
          name: `${game.title} (${region})`,
          region: region as Region
        }
      })
    }

    // Check if item already in wishlist for this specific variant
    const existingItem = await prisma.userWishlist.findFirst({
      where: {
        userId: session.user.id,
        gameVariantId: variant.id
      }
    })

    if (existingItem) {
      return { success: false, message: 'Jeu déjà présent dans votre wishlist pour cette région' }
    }

    // Add to wishlist using variant
    await prisma.userWishlist.create({
      data: {
        userId: session.user.id,
        gameId: game.id,
        gameVariantId: variant.id
      }
    })

    revalidatePath("/collection")
    revalidatePath(`/jeux/${game.slug}`)
    return { success: true, message: "Ajouté à votre wishlist !" }

  } catch (error) {
    console.error("Error adding game to wishlist:", error)
    return { success: false, message: "Erreur lors de l'ajout à la wishlist" }
  }
}

// === Récupération des régions disponibles ===

export async function getAvailableRegionsForGame(gameId: string): Promise<string[]> {
  try {
    // Récupérer les régions disponibles basées sur les médias box-2D en cache
    const cachedMedias = await prisma.mediaUrlCache.findMany({
      where: {
        entityType: 'game',
        entityId: gameId,
        mediaType: 'box-2D',
        isValid: true,
        url: {
          not: ''
        }
      },
      select: {
        region: true
      },
      distinct: ['region']
    })

    // Convertir en format approprié et normaliser les régions
    const availableRegions = cachedMedias
      .map(media => media.region.toUpperCase())
      .filter(region => ['FR', 'EU', 'WOR', 'JP', 'US', 'ASI'].includes(region))

    // Si aucune région spécifique trouvée, retourner toutes les régions par défaut
    if (availableRegions.length === 0) {
      return ['FR', 'EU', 'WOR', 'JP', 'US', 'ASI']
    }

    return availableRegions

  } catch (error) {
    console.error('Erreur récupération régions disponibles:', error)
    // En cas d'erreur, retourner toutes les régions
    return ['FR', 'EU', 'WOR', 'JP', 'US', 'ASI']
  }
}