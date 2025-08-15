import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import { Region } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { userId, preferredRegion } = body

    // Vérification de sécurité : l'utilisateur ne peut modifier que ses propres préférences
    if (userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      )
    }

    // Validation de la région
    const validRegions: Region[] = ['FR', 'EU', 'WOR', 'JP', 'ASI', 'US']
    if (!validRegions.includes(preferredRegion as Region)) {
      return NextResponse.json(
        { error: 'Région invalide' },
        { status: 400 }
      )
    }

    // Mise à jour en base de données
    await prisma.user.update({
      where: { id: userId },
      data: {
        preferredRegion: preferredRegion as Region
      }
    })

    return NextResponse.json(
      { success: true, message: 'Région mise à jour avec succès' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Erreur lors de la mise à jour de la région:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}