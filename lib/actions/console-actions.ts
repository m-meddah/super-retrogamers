"use server"

import { prisma } from "@/lib/prisma"
import { getServerSession } from "@/lib/auth-server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

export interface ActionState {
  success: boolean
  message: string
}

export async function updateConsoleEnhancedAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const session = await getServerSession()
    
    // Vérification des permissions admin
    if (!session?.user || session.user.role !== 'admin') {
      redirect('/login')
    }

    const consoleId = formData.get('consoleId') as string
    if (!consoleId) {
      return {
        success: false,
        message: "ID de la console manquant"
      }
    }

    // Récupération des données du formulaire - champs de base
    const name = formData.get('name') as string
    const manufacturer = formData.get('manufacturer') as string
    const releaseYear = formData.get('releaseYear') as string
    const description = formData.get('description') as string
    const cpu = formData.get('cpu') as string
    const memory = formData.get('memory') as string
    const graphics = formData.get('graphics') as string
    
    // Nouveaux champs
    const generationId = formData.get('generationId') as string
    const unitsSold = formData.get('unitsSold') as string
    const bestSellingGameId = formData.get('bestSellingGameId') as string
    const dimensions = formData.get('dimensions') as string
    const media = formData.get('media') as string
    const coProcessor = formData.get('coProcessor') as string
    const audioChip = formData.get('audioChip') as string

    // Champs éditoriaux
    const aiEnhancedDescription = formData.get('aiEnhancedDescription') as string
    const historicalContext = formData.get('historicalContext') as string
    const technicalAnalysis = formData.get('technicalAnalysis') as string
    const culturalImpact = formData.get('culturalImpact') as string
    const editorialContent = formData.get('editorialContent') as string
    const editorialTitle = formData.get('editorialTitle') as string
    const editorialAuthor = formData.get('editorialAuthor') as string

    // Validation des données requises
    if (!name.trim()) {
      return {
        success: false,
        message: "Le nom de la console est requis"
      }
    }

    // Vérification que la console existe
    const existingConsole = await prisma.console.findUnique({
      where: { id: consoleId }
    })

    if (!existingConsole) {
      return {
        success: false,
        message: "Console non trouvée"
      }
    }

    // Préparation des données de mise à jour
    const updateData: any = {
      name: name.trim(),
      manufacturer: manufacturer.trim() || null,
      releaseYear: releaseYear ? parseInt(releaseYear) : null,
      description: description.trim() || null,
      cpu: cpu.trim() || null,
      memory: memory.trim() || null,
      graphics: graphics.trim() || null,
      unitsSold: unitsSold ? parseInt(unitsSold) : null,
      dimensions: dimensions.trim() || null,
      media: media.trim() || null,
      coProcessor: coProcessor.trim() || null,
      audioChip: audioChip.trim() || null,
      aiEnhancedDescription: aiEnhancedDescription.trim() || null,
      historicalContext: historicalContext.trim() || null,
      technicalAnalysis: technicalAnalysis.trim() || null,
      culturalImpact: culturalImpact.trim() || null,
      editorialContent: editorialContent.trim() || null,
      editorialTitle: editorialTitle.trim() || null,
      editorialAuthor: editorialAuthor.trim() || null,
      updatedAt: new Date()
    }

    // Ajout des nouvelles relations si spécifiées
    if (generationId) {
      updateData.generationId = generationId
    }
    if (bestSellingGameId) {
      updateData.bestSellingGameId = bestSellingGameId
    }

    // Mise à jour de la console
    await prisma.console.update({
      where: { id: consoleId },
      data: updateData
    })

    // Revalidation des pages concernées
    revalidatePath(`/consoles/${existingConsole.slug}`)
    revalidatePath(`/admin/content`)
    revalidatePath(`/admin/consoles/${existingConsole.slug}/edit`)

    return {
      success: true,
      message: "Console mise à jour avec succès avec les nouvelles relations"
    }

  } catch (error) {
    console.error('Erreur lors de la mise à jour de la console:', error)
    return {
      success: false,
      message: "Erreur lors de la mise à jour de la console"
    }
  }
}

export async function deleteConsoleAction(consoleId: string): Promise<ActionState> {
  try {
    const session = await getServerSession()
    
    // Vérification des permissions admin
    if (!session?.user || session.user.role !== 'admin') {
      redirect('/login')
    }

    // Vérification que la console existe
    const existingConsole = await prisma.console.findUnique({
      where: { id: consoleId }
    })

    if (!existingConsole) {
      return {
        success: false,
        message: "Console non trouvée"
      }
    }

    // Suppression de la console (les relations seront supprimées en cascade)
    await prisma.console.delete({
      where: { id: consoleId }
    })

    // Revalidation des pages
    revalidatePath(`/admin/content`)
    revalidatePath(`/consoles`)

    return {
      success: true,
      message: "Console supprimée avec succès"
    }

  } catch (error) {
    console.error('Erreur lors de la suppression de la console:', error)
    return {
      success: false,
      message: "Erreur lors de la suppression de la console"
    }
  }
}