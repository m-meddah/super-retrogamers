import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { createVariantsForAllConsoles, createConsoleVariants } from '@/lib/console-variants-service'

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    // Vérifier que l'utilisateur est admin
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { action, consoleSlug } = body

    if (action === 'createAll') {
      // Créer les variants pour toutes les consoles
      const result = await createVariantsForAllConsoles()
      return NextResponse.json({
        success: true,
        message: `${result.totalCreated} variants créés au total`,
        details: result.results
      })
    } else if (action === 'createForConsole' && consoleSlug) {
      // Créer les variants pour une console spécifique
      const result = await createConsoleVariants(consoleSlug)
      return NextResponse.json({
        success: true,
        message: `${result.created} variants créés pour ${consoleSlug}`,
        variants: result.variants
      })
    } else {
      return NextResponse.json({ error: 'Action invalide' }, { status: 400 })
    }

  } catch (error) {
    console.error('Error managing console variants:', error)
    return NextResponse.json({ 
      error: 'Erreur lors de la gestion des variants',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    // Vérifier que l'utilisateur est admin
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Retourner des statistiques sur les variants
    const { prisma } = await import('@/lib/prisma')
    
    const [totalConsoles, totalVariants, consoleStats] = await Promise.all([
      prisma.console.count(),
      prisma.consoleVariant.count(),
      prisma.console.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          _count: {
            select: {
              variants: true
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      })
    ])

    return NextResponse.json({
      totalConsoles,
      totalVariants,
      averageVariantsPerConsole: totalConsoles > 0 ? Math.round((totalVariants / totalConsoles) * 100) / 100 : 0,
      consoles: consoleStats.map(console => ({
        ...console,
        variantsCount: console._count.variants
      }))
    })

  } catch (error) {
    console.error('Error fetching console variants stats:', error)
    return NextResponse.json({ 
      error: 'Erreur lors de la récupération des statistiques'
    }, { status: 500 })
  }
}