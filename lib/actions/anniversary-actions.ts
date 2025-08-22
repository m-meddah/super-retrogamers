'use server'

import { prisma } from '@/lib/prisma'
import { Region } from '@prisma/client'

/**
 * Récupère les jeux qui ont leur anniversaire aujourd'hui (même jour et mois, peu importe l'année)
 * Priorise la région préférée et évite les doublons par ssGameId
 * @param preferredRegion - Région préférée de l'utilisateur
 * @returns Liste des jeux avec leur date de sortie et nombre d'années d'anniversaire
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

    // Filtrer par jour et mois actuels, éviter les doublons par ssGameId
    const seenGameIds = new Set<number>()
    const anniversaryGames = gamesWithAnniversary.filter(game => {
      // Éviter les doublons par ssGameId
      if (!game.ssGameId || seenGameIds.has(game.ssGameId)) {
        return false
      }
      
      // Trouver toutes les dates qui correspondent au jour/mois actuel
      const matchingDates = game.regionalDates.filter(rd => {
        if (!rd.releaseDate) return false
        const releaseDate = new Date(rd.releaseDate)
        return (
          releaseDate.getDate() === currentDay &&
          releaseDate.getMonth() + 1 === currentMonth
        )
      })
      
      if (matchingDates.length === 0) return false
      
      // Ajouter le ssGameId aux vus pour éviter les doublons
      seenGameIds.add(game.ssGameId)
      return true
    }).map(game => {
      // Trouver la meilleure date pour l'anniversaire (prioriser région préférée pour les dates du jour)
      const todayDates = game.regionalDates.filter(rd => {
        if (!rd.releaseDate) return false
        const releaseDate = new Date(rd.releaseDate)
        return (
          releaseDate.getDate() === currentDay &&
          releaseDate.getMonth() + 1 === currentMonth
        )
      })
      
      // Prioriser la région préférée parmi les dates d'aujourd'hui
      let bestTodayDate = todayDates.find(rd => rd.region === preferredRegion)
      if (!bestTodayDate) {
        bestTodayDate = todayDates[0] // Prendre la première si région préférée pas trouvée
      }
      
      const releaseYear = bestTodayDate ? new Date(bestTodayDate.releaseDate!).getFullYear() : null
      const yearsAgo = releaseYear ? today.getFullYear() - releaseYear : null

      return {
        id: game.id,
        title: game.title,
        slug: game.slug,
        console: game.console,
        releaseDate: bestTodayDate?.releaseDate || null,
        releaseRegion: bestTodayDate?.region || null,
        releaseYear,
        yearsAgo,
        anniversary: yearsAgo ? `${yearsAgo}e anniversaire` : 'Anniversaire'
      }
    })

    // Trier par anniversaires les plus significatifs (plus d'années) en premier
    anniversaryGames.sort((a, b) => {
      if (a.yearsAgo && b.yearsAgo) {
        return b.yearsAgo - a.yearsAgo // Plus d'années en premier
      }
      return a.title.localeCompare(b.title) // Fallback alphabétique
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