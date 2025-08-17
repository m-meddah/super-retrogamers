"use server"

import { prisma } from "@/lib/prisma"
import { getServerSession } from "@/lib/auth-server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

export interface ActionState {
  success: boolean
  message: string
}

export async function updateGameAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const session = await getServerSession()
    
    // Vérification des permissions admin
    if (!session?.user || session.user.role !== 'admin') {
      redirect('/login')
    }

    const gameId = formData.get('gameId') as string
    if (!gameId) {
      return {
        success: false,
        message: "ID du jeu manquant"
      }
    }

    // Récupération des données du formulaire
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const developer = formData.get('developer') as string
    const publisher = formData.get('publisher') as string
    const genre = formData.get('genre') as string
    const releaseYear = formData.get('releaseYear') as string
    const playerCount = formData.get('playerCount') as string
    const resolution = formData.get('resolution') as string
    const rotation = formData.get('rotation') as string
    const rating = formData.get('rating') as string
    const topStaff = formData.get('topStaff') === 'on'
    const aiEnhancedDescription = formData.get('aiEnhancedDescription') as string
    const gameplayAnalysis = formData.get('gameplayAnalysis') as string
    const historicalSignificance = formData.get('historicalSignificance') as string
    const developmentStory = formData.get('developmentStory') as string
    const legacyImpact = formData.get('legacyImpact') as string

    // Récupération des screenshots
    const screenshotsCount = parseInt(formData.get('screenshots_count') as string || '0')
    const screenshots: string[] = []
    
    for (let i = 0; i < screenshotsCount; i++) {
      const screenshot = formData.get(`screenshot_${i}`) as string
      if (screenshot && screenshot.trim()) {
        screenshots.push(screenshot.trim())
      }
    }

    // Validation des données requises
    if (!title.trim()) {
      return {
        success: false,
        message: "Le titre du jeu est requis"
      }
    }

    // Vérification que le jeu existe
    const existingGame = await prisma.game.findUnique({
      where: { id: gameId }
    })

    if (!existingGame) {
      return {
        success: false,
        message: "Jeu non trouvé"
      }
    }

    // Mise à jour du jeu
    await prisma.game.update({
      where: { id: gameId },
      data: {
        title: title.trim(),
        description: description.trim() || null,
        developer: developer.trim() || null,
        publisher: publisher.trim() || null,
        genre: genre.trim() || null,
        releaseYear: releaseYear ? parseInt(releaseYear) : null,
        playerCount: playerCount.trim() || null,
        resolution: resolution.trim() || null,
        rotation: rotation.trim() || null,
        rating: rating ? parseFloat(rating) : null,
        topStaff: topStaff,
        aiEnhancedDescription: aiEnhancedDescription.trim() || null,
        gameplayAnalysis: gameplayAnalysis.trim() || null,
        historicalSignificance: historicalSignificance.trim() || null,
        developmentStory: developmentStory.trim() || null,
        legacyImpact: legacyImpact.trim() || null,
        screenshots: screenshots,
        updatedAt: new Date()
      }
    })

    // Revalidation des pages concernées
    revalidatePath(`/jeux/${existingGame.slug}`)
    revalidatePath(`/admin/content`)
    revalidatePath(`/admin/content/jeux/${existingGame.slug}/edit`)

    return {
      success: true,
      message: "Jeu mis à jour avec succès"
    }

  } catch (error) {
    console.error('Erreur lors de la mise à jour du jeu:', error)
    return {
      success: false,
      message: "Erreur lors de la mise à jour du jeu"
    }
  }
}

export async function updateGameEnhancedAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const session = await getServerSession()
    
    // Vérification des permissions admin
    if (!session?.user || session.user.role !== 'admin') {
      redirect('/login')
    }

    const gameId = formData.get('gameId') as string
    if (!gameId) {
      return {
        success: false,
        message: "ID du jeu manquant"
      }
    }

    // Récupération des données du formulaire - champs de base
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const developer = formData.get('developer') as string
    const publisher = formData.get('publisher') as string
    const genre = formData.get('genre') as string
    const releaseYear = formData.get('releaseYear') as string
    const playerCount = formData.get('playerCount') as string
    const resolution = formData.get('resolution') as string
    const rotation = formData.get('rotation') as string
    const rating = formData.get('rating') as string
    const topStaff = formData.get('topStaff') === 'on'
    const onlinePlay = formData.get('onlinePlay') === 'on'
    
    // Nouveaux champs
    const corporationDevId = formData.get('corporationDevId') as string
    const corporationPubId = formData.get('corporationPubId') as string
    const familyId = formData.get('familyId') as string
    const sizeMB = formData.get('sizeMB') as string
    const cloneOf = formData.get('cloneOf') as string

    // Champs éditoriaux
    const aiEnhancedDescription = formData.get('aiEnhancedDescription') as string
    const gameplayAnalysis = formData.get('gameplayAnalysis') as string
    const historicalSignificance = formData.get('historicalSignificance') as string
    const developmentStory = formData.get('developmentStory') as string
    const legacyImpact = formData.get('legacyImpact') as string

    // Récupération des screenshots
    const screenshotsCount = parseInt(formData.get('screenshots_count') as string || '0')
    const screenshots: string[] = []
    
    for (let i = 0; i < screenshotsCount; i++) {
      const screenshot = formData.get(`screenshot_${i}`) as string
      if (screenshot && screenshot.trim()) {
        screenshots.push(screenshot.trim())
      }
    }

    // Validation des données requises
    if (!title.trim()) {
      return {
        success: false,
        message: "Le titre du jeu est requis"
      }
    }

    // Vérification que le jeu existe
    const existingGame = await prisma.game.findUnique({
      where: { id: gameId }
    })

    if (!existingGame) {
      return {
        success: false,
        message: "Jeu non trouvé"
      }
    }

    // Préparation des données de mise à jour
    const updateData: any = {
      title: title.trim(),
      description: description.trim() || null,
      developer: developer.trim() || null,
      publisher: publisher.trim() || null,
      genre: genre.trim() || null,
      releaseYear: releaseYear ? parseInt(releaseYear) : null,
      playerCount: playerCount.trim() || null,
      resolution: resolution.trim() || null,
      rotation: rotation.trim() || null,
      rating: rating ? parseFloat(rating) : null,
      topStaff: topStaff,
      onlinePlay: onlinePlay,
      sizeMB: sizeMB ? parseFloat(sizeMB) : null,
      cloneOf: cloneOf.trim() || null,
      aiEnhancedDescription: aiEnhancedDescription.trim() || null,
      gameplayAnalysis: gameplayAnalysis.trim() || null,
      historicalSignificance: historicalSignificance.trim() || null,
      developmentStory: developmentStory.trim() || null,
      legacyImpact: legacyImpact.trim() || null,
      screenshots: screenshots,
      updatedAt: new Date()
    }

    // Ajout des nouvelles relations si spécifiées
    if (corporationDevId) {
      updateData.corporationDevId = corporationDevId
    }
    if (corporationPubId) {
      updateData.corporationPubId = corporationPubId
    }
    if (familyId) {
      updateData.familyId = familyId
    }

    // Mise à jour du jeu
    await prisma.game.update({
      where: { id: gameId },
      data: updateData
    })

    // Revalidation des pages concernées
    revalidatePath(`/jeux/${existingGame.slug}`)
    revalidatePath(`/admin/content`)
    revalidatePath(`/admin/content/jeux/${existingGame.slug}/edit`)

    return {
      success: true,
      message: "Jeu mis à jour avec succès avec les nouvelles relations"
    }

  } catch (error) {
    console.error('Erreur lors de la mise à jour du jeu:', error)
    return {
      success: false,
      message: "Erreur lors de la mise à jour du jeu"
    }
  }
}

export async function deleteGameAction(gameId: string): Promise<ActionState> {
  try {
    const session = await getServerSession()
    
    // Vérification des permissions admin
    if (!session?.user || session.user.role !== 'admin') {
      redirect('/login')
    }

    // Vérification que le jeu existe
    const existingGame = await prisma.game.findUnique({
      where: { id: gameId }
    })

    if (!existingGame) {
      return {
        success: false,
        message: "Jeu non trouvé"
      }
    }

    // Suppression du jeu (les relations seront supprimées en cascade)
    await prisma.game.delete({
      where: { id: gameId }
    })

    // Revalidation des pages
    revalidatePath(`/admin/content`)
    revalidatePath(`/consoles/${existingGame.consoleId}`)

    return {
      success: true,
      message: "Jeu supprimé avec succès"
    }

  } catch (error) {
    console.error('Erreur lors de la suppression du jeu:', error)
    return {
      success: false,
      message: "Erreur lors de la suppression du jeu"
    }
  }
}