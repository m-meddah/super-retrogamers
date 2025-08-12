import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth-server"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession()
    
    // Vérification des permissions admin
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { slug } = await params
    const body = await request.json()
    
    const { editorialTitle, editorialAuthor, editorialContent, editorialPublishedAt } = body

    // Vérifier que la console existe
    const console = await prisma.console.findUnique({
      where: { slug }
    })

    if (!console) {
      return NextResponse.json({ error: 'Console non trouvée' }, { status: 404 })
    }

    // Mettre à jour le contenu éditorial
    const updatedConsole = await prisma.console.update({
      where: { slug },
      data: {
        editorialTitle: editorialTitle || null,
        editorialAuthor: editorialAuthor || null,
        editorialContent: editorialContent || null,
        editorialPublishedAt: editorialPublishedAt ? new Date(editorialPublishedAt) : null,
        updatedAt: new Date(),
      }
    })

    return NextResponse.json(updatedConsole)
  } catch (error) {
    console.error('Erreur lors de la mise à jour du contenu éditorial:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}