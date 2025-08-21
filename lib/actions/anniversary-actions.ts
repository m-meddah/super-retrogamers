'use server'

import { prisma } from '@/lib/prisma'
import { Region } from '@prisma/client'

/**
 * Récupère les jeux qui ont leur anniversaire aujourd'hui pour une région donnée
 * @param preferredRegion - Région préférée de l'utilisateur
 * @returns Liste des jeux avec leur date de sortie
 */
export async function getAnniversaryGames(preferredRegion: Region = 'FR') {
  const today = new Date()
  const currentDay = today.getDate()
  const currentMonth = today.getMonth() + 1 // getMonth() retourne 0-11, on veut 1-12

  try {
    // Récupérer tous les jeux avec leurs dates régionales
    // On filtre côté application pour plus de flexibilité
    const gamesWithAnniversary = await prisma.game.findMany({
      where: {
        regionalDates: {
          some: {
            releaseDate: { not: null }
          }
        }
      },
      include: {
        console: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        regionalDates: {
          where: {
            releaseDate: { not: null }
          },
          orderBy: [
            // Priorité à la région préférée
            { region: preferredRegion === 'FR' ? 'asc' : 'desc' },
            // Puis ordre standard
            { region: 'asc' }
          ]
        }
      },
      orderBy: {
        title: 'asc'
      }
    })

    // Filtrer et traiter les résultats côté application pour plus de contrôle
    const anniversaryGames = gamesWithAnniversary.filter(game => {
      // Chercher la meilleure date de sortie selon la région préférée
      const bestDate = getBestRegionalDate(game.regionalDates, preferredRegion)
      
      if (!bestDate) return false

      const releaseDate = new Date(bestDate.releaseDate!)
      return (
        releaseDate.getDate() === currentDay &&
        releaseDate.getMonth() + 1 === currentMonth
      )
    }).map(game => {
      const bestDate = getBestRegionalDate(game.regionalDates, preferredRegion)
      const releaseYear = bestDate ? new Date(bestDate.releaseDate!).getFullYear() : null
      const yearsAgo = releaseYear ? today.getFullYear() - releaseYear : null

      return {
        id: game.id,
        title: game.title,
        slug: game.slug,
        console: game.console,
        releaseDate: bestDate?.releaseDate || null,
        releaseRegion: bestDate?.region || null,
        releaseYear,
        yearsAgo,
        anniversary: yearsAgo ? `${yearsAgo}e anniversaire` : 'Anniversaire'
      }
    })

    return anniversaryGames

  } catch (error) {
    console.error('Erreur lors de la récupération des jeux anniversaire:', error)
    return []
  }
}

/**
 * Trouve la meilleure date régionale selon les priorités
 */
function getBestRegionalDate(
  regionalDates: Array<{ region: Region; releaseDate: Date | null }>,
  preferredRegion: Region
) {
  if (regionalDates.length === 0) return null

  // 1. Chercher la région préférée
  const preferredDate = regionalDates.find(
    rd => rd.region === preferredRegion && rd.releaseDate
  )
  if (preferredDate) return preferredDate

  // 2. Ordre de priorité des régions si la préférée n'existe pas
  const fallbackOrder: Region[] = ['WOR', 'EU', 'US', 'JP', 'ASI', 'FR']
  
  for (const region of fallbackOrder) {
    if (region === preferredRegion) continue // Déjà testé
    
    const fallbackDate = regionalDates.find(
      rd => rd.region === region && rd.releaseDate
    )
    if (fallbackDate) return fallbackDate
  }

  // 3. Prendre n'importe quelle date disponible
  return regionalDates.find(rd => rd.releaseDate) || null
}


/**
 * Récupère le nombre de jeux ayant leur anniversaire aujourd'hui
 */
export async function getAnniversaryGamesCount(preferredRegion: Region = 'FR'): Promise<number> {
  const games = await getAnniversaryGames(preferredRegion)
  return games.length
}