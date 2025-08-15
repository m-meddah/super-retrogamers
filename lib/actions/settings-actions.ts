'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/auth-server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { z } from 'zod'

export interface ActionState {
  success?: boolean
  message?: string
  errors?: Record<string, string>
  shouldRefresh?: boolean
}

// Schémas de validation
const updateProfileSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(100, 'Le nom est trop long'),
  email: z.string().email('Email invalide')
})

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Le mot de passe actuel est requis'),
  newPassword: z.string().min(6, 'Le nouveau mot de passe doit contenir au moins 6 caractères'),
  confirmPassword: z.string().min(1, 'La confirmation est requise')
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"]
})

const updatePreferredRegionSchema = z.object({
  preferredRegion: z.enum(['FR', 'EU', 'WOR', 'JP', 'ASI', 'US'], {
    errorMap: () => ({ message: 'Région invalide' })
  })
})

export async function updateProfileAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return {
        success: false,
        message: 'Vous devez être connecté pour modifier votre profil'
      }
    }

    // Validation des données
    const result = updateProfileSchema.safeParse({
      name: formData.get('name'),
      email: formData.get('email')
    })

    if (!result.success) {
      const errors: Record<string, string> = {}
      result.error.issues.forEach(issue => {
        if (issue.path[0]) {
          errors[issue.path[0] as string] = issue.message
        }
      })
      return {
        success: false,
        message: 'Erreurs de validation',
        errors
      }
    }

    const { name, email } = result.data

    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    if (email !== session.user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email }
      })

      if (existingUser && existingUser.id !== session.user.id) {
        return {
          success: false,
          message: 'Cette adresse email est déjà utilisée',
          errors: { email: 'Cette adresse email est déjà utilisée' }
        }
      }
    }

    // Mettre à jour l'utilisateur
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        email
      }
    })

    revalidatePath('/dashboard/settings')

    return {
      success: true,
      message: 'Profil mis à jour avec succès'
    }

  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error)
    return {
      success: false,
      message: 'Une erreur est survenue lors de la mise à jour'
    }
  }
}

export async function updatePasswordAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    // Validation des données
    const result = updatePasswordSchema.safeParse({
      currentPassword: formData.get('currentPassword'),
      newPassword: formData.get('newPassword'),
      confirmPassword: formData.get('confirmPassword')
    })

    if (!result.success) {
      const errors: Record<string, string> = {}
      result.error.issues.forEach(issue => {
        if (issue.path[0]) {
          errors[issue.path[0] as string] = issue.message
        }
      })
      return {
        success: false,
        message: 'Erreurs de validation',
        errors
      }
    }

    const { currentPassword, newPassword } = result.data

    // Utiliser l'API Better Auth pour changer le mot de passe
    try {
      await auth.api.changePassword({
        body: {
          currentPassword,
          newPassword,
          revokeOtherSessions: false
        },
        headers: await headers()
      })

      revalidatePath('/dashboard/settings')

      return {
        success: true,
        message: 'Mot de passe changé avec succès'
      }
    } catch (authError) {
      console.error('Better Auth error:', authError)
      return {
        success: false,
        message: 'Mot de passe actuel incorrect ou erreur lors du changement',
        errors: { currentPassword: 'Mot de passe actuel incorrect' }
      }
    }

  } catch (error) {
    console.error('Erreur lors du changement de mot de passe:', error)
    return {
      success: false,
      message: 'Une erreur est survenue lors du changement de mot de passe'
    }
  }
}

export async function updatePreferredRegionAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return {
        success: false,
        message: 'Vous devez être connecté pour modifier vos préférences'
      }
    }

    // Validation des données
    const result = updatePreferredRegionSchema.safeParse({
      preferredRegion: formData.get('preferredRegion')
    })

    if (!result.success) {
      const errors: Record<string, string> = {}
      result.error.issues.forEach(issue => {
        if (issue.path[0]) {
          errors[issue.path[0] as string] = issue.message
        }
      })
      return {
        success: false,
        message: 'Erreurs de validation',
        errors
      }
    }

    const { preferredRegion } = result.data

    // Mettre à jour la région préférée de l'utilisateur
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        preferredRegion: preferredRegion
      }
    })

    // Utiliser Better Auth pour synchroniser la session
    try {
      await auth.api.updateUser({
        body: {
          preferredRegion: preferredRegion
        },
        headers: await headers()
      })
    } catch (authError) {
      // Continue même si la mise à jour Better Auth échoue car la DB a été mise à jour
      console.warn('Better Auth update failed:', authError)
    }

    revalidatePath('/dashboard/settings')
    revalidatePath('/')

    // Rediriger vers la page d'accueil avec la région préférée mise à jour
    redirect(`/?region=${preferredRegion}`)

    return {
      success: true,
      message: 'Région préférée mise à jour avec succès',
      shouldRefresh: true // Indique au client de rafraîchir la session
    }

  } catch (error) {
    // Le redirect lance une exception NEXT_REDIRECT qui est normale
    if (error && typeof error === 'object' && 'digest' in error && 
        typeof error.digest === 'string' && error.digest.includes('NEXT_REDIRECT')) {
      throw error // Re-lancer l'exception redirect
    }
    
    console.error('Erreur lors de la mise à jour de la région préférée:', error)
    return {
      success: false,
      message: 'Une erreur est survenue lors de la mise à jour'
    }
  }
}

export async function getUserPreferredRegionAction(): Promise<string> {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return 'FR'
    }

    // Récupérer l'utilisateur avec sa région préférée
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { preferredRegion: true }
    })

    return user?.preferredRegion || 'FR'
  } catch (error) {
    console.error('Error fetching user preferred region:', error)
    return 'FR'
  }
}