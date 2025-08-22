'use server'

import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export interface SearchFilters {
  query?: string
  console?: string
  genre?: string
  minRating?: number
  maxRating?: number
  yearFrom?: number
  yearTo?: number
  playerCount?: string
  topStaff?: boolean
}

export interface SearchResult {
  games: Array<{
    id: string
    slug: string
    title: string
    rating: number | null
    releaseYear: number | null
    genre: string | null
    playerCount: string | null
    topStaff: boolean
    console: {
      name: string
      slug: string
    } | null
  }>
  totalCount: number
  consoles: Array<{ name: string; slug: string }>
  genres: string[]
}

/**
 * Server Action pour rechercher des jeux avec filtres avancés
 */
export async function searchGamesAction(filters: SearchFilters): Promise<SearchResult> {
  try {
    // Construction des conditions WHERE
    const whereConditions: Prisma.GameWhereInput = {}

    // Recherche textuelle
    if (filters.query && filters.query.trim()) {
      whereConditions.OR = [
        { title: { contains: filters.query, mode: 'insensitive' } },
        { description: { contains: filters.query, mode: 'insensitive' } },
        { corporationDev: { name: { contains: filters.query, mode: 'insensitive' } } },
        { corporationPub: { name: { contains: filters.query, mode: 'insensitive' } } }
      ]
    }

    // Filtre par console
    if (filters.console) {
      whereConditions.console = {
        slug: filters.console
      }
    }

    // Filtre par genre
    if (filters.genre) {
      whereConditions.genre = {
        name: {
          contains: filters.genre,
          mode: 'insensitive'
        }
      }
    }

    // Filtre par note
    if (filters.minRating !== undefined && filters.minRating > 0 && filters.maxRating !== undefined && filters.maxRating < 20) {
      whereConditions.rating = { 
        gte: filters.minRating,
        lte: filters.maxRating
      }
    } else if (filters.minRating !== undefined && filters.minRating > 0) {
      whereConditions.rating = { 
        gte: filters.minRating 
      }
    } else if (filters.maxRating !== undefined && filters.maxRating < 20) {
      whereConditions.rating = { 
        lte: filters.maxRating 
      }
    }

    // Filtre par année
    if (filters.yearFrom && filters.yearTo) {
      whereConditions.releaseYear = { 
        gte: filters.yearFrom,
        lte: filters.yearTo
      }
    } else if (filters.yearFrom) {
      whereConditions.releaseYear = { 
        gte: filters.yearFrom 
      }
    } else if (filters.yearTo) {
      whereConditions.releaseYear = { 
        lte: filters.yearTo 
      }
    }

    // Filtre par nombre de joueurs
    if (filters.playerCount) {
      if (filters.playerCount === '1') {
        whereConditions.playerCount = { 
          in: ['1', '1 joueur', '1-1'] 
        }
      } else if (filters.playerCount === '2') {
        whereConditions.OR = [
          ...(whereConditions.OR || []),
          { playerCount: { contains: '2' } },
          { playerCount: { contains: '1-2' } }
        ]
      } else if (filters.playerCount === 'multijoueur') {
        whereConditions.OR = [
          ...(whereConditions.OR || []),
          { playerCount: { contains: '3' } },
          { playerCount: { contains: '4' } },
          { playerCount: { contains: '5' } },
          { playerCount: { contains: '6' } },
          { playerCount: { contains: '1-4' } },
          { playerCount: { contains: '2-4' } },
          { playerCount: { contains: '1-8' } }
        ]
      }
    }

    // Filtres de jeu
    if (filters.topStaff) {
      whereConditions.topStaff = true
    }

    // Exécution de la requête principale
    const gamesRaw = await prisma.game.findMany({
      where: whereConditions,
      include: {
        console: {
          select: {
            name: true,
            slug: true
          }
        },
        genre: {
          select: {
            name: true
          }
        },
        corporationDev: {
          select: { name: true }
        },
        corporationPub: {
          select: { name: true }
        }
      },
      orderBy: [
        { topStaff: 'desc' },
        { rating: 'desc' },
        { title: 'asc' }
      ],
      take: 100 // Limite raisonnable pour éviter les problèmes de performance
    })

    // Mapper les résultats pour correspondre à l'interface SearchGameResult
    const games = gamesRaw.map(game => ({
      id: game.id,
      slug: game.slug,
      title: game.title,
      rating: game.rating,
      releaseYear: game.releaseYear,
      genre: game.genre?.name || null,
      playerCount: game.playerCount,
      topStaff: game.topStaff,
      console: game.console
    }))

    return {
      games,
      totalCount: games.length,
      consoles: [],
      genres: []
    }

  } catch (error) {
    console.error('Erreur lors de la recherche:', error)
    return {
      games: [],
      totalCount: 0,
      consoles: [],
      genres: []
    }
  }
}

/**
 * Server Action pour récupérer les métadonnées de recherche (consoles et genres)
 */
export async function getSearchMetadataAction(): Promise<{
  consoles: Array<{ name: string; slug: string }>
  genres: string[]
}> {
  try {
    // Récupération des consoles
    const consoles = await prisma.console.findMany({
      select: {
        name: true,
        slug: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Récupération des genres uniques depuis la table Genre
    const genresResult = await prisma.genre.findMany({
      select: {
        name: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    const genres = genresResult.map(g => g.name)

    return {
      consoles,
      genres
    }

  } catch (error) {
    console.error('Erreur lors de la récupération des métadonnées:', error)
    return {
      consoles: [],
      genres: []
    }
  }
}

/**
 * Server Action pour obtenir des suggestions de recherche rapide
 */
export async function getQuickSearchSuggestionsAction(query: string): Promise<string[]> {
  if (!query || query.length < 2) return []

  try {
    // Recherche dans les titres de jeux
    const games = await prisma.game.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { corporationDev: { name: { contains: query, mode: 'insensitive' } } },
          { corporationPub: { name: { contains: query, mode: 'insensitive' } } }
        ]
      },
      select: {
        title: true,
        corporationDev: {
          select: { name: true }
        },
        corporationPub: {
          select: { name: true }
        }
      },
      take: 10
    })

    const suggestions = new Set<string>()
    
    games.forEach(game => {
      if (game.title.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(game.title)
      }
      if (game.corporationDev?.name?.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(game.corporationDev.name)
      }
      if (game.corporationPub?.name?.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(game.corporationPub.name)
      }
    })

    return Array.from(suggestions).slice(0, 8)

  } catch (error) {
    console.error('Erreur lors de la récupération des suggestions:', error)
    return []
  }
}

/**
 * Interface pour les résultats de recherche Screenscraper (vraie structure API)
 */
interface ScreenscraperSearchResult {
  id: number
  nom?: string
  // Structure réelle de l'API : array d'objets {region, text}
  noms?: Array<{ region: string; text: string }>
  systeme?: {
    id: number
    nom?: string
    text?: string
  }
  editeur?: string | { text?: string }
  developpeur?: string | { text?: string }
  note?: number | string | { text?: string }
  joueurs?: string | { text?: string }
  synopsis?: Array<{ region: string; text: string }>
  dates?: Array<{ region: string; text: string }>
  genres?: Array<{ region: string; text: string }>
}

/**
 * Server Action pour rechercher dans Screenscraper ET dans la base locale
 */
export async function searchGamesWithScreenscraperAction(filters: SearchFilters): Promise<SearchResult> {
  try {
    // 1. Recherche locale d'abord
    const localResults = await searchGamesAction(filters)
    
    // 2. Si on a une query et peu de résultats locaux, chercher aussi sur Screenscraper
    if (filters.query && filters.query.length >= 3 && localResults.games.length < 10) {
      try {
        const screencraperResults = await searchScreenscraperAPI(filters.query)
        
        // Combiner les résultats en évitant les doublons
        const allGames = [...localResults.games]
        const localTitles = new Set(localResults.games.map(g => g.title.toLowerCase()))
        
        // Ajouter les jeux Screenscraper qui ne sont pas déjà localement
        const preferredRegion = 'fr' // TODO: récupérer depuis les préférences utilisateur
        screencraperResults.forEach(ssGame => {
          const title = getGameTitle(ssGame, preferredRegion).toLowerCase()
          if (!localTitles.has(title)) {
            allGames.push(convertScreenscraperToGameResult(ssGame, preferredRegion))
          }
        })
        
        return {
          ...localResults,
          games: allGames,
          totalCount: allGames.length
        }
      } catch (error) {
        console.error('Erreur recherche Screenscraper, utilisation des résultats locaux:', error)
        return localResults
      }
    }
    
    return localResults
    
  } catch (error) {
    console.error('Erreur lors de la recherche combinée:', error)
    return {
      games: [],
      totalCount: 0,
      consoles: [],
      genres: []
    }
  }
}

/**
 * Recherche dans l'API Screenscraper
 */
async function searchScreenscraperAPI(query: string): Promise<ScreenscraperSearchResult[]> {
  const devId = process.env.SCREENSCRAPER_DEV_ID
  const devPassword = process.env.SCREENSCRAPER_DEV_PASSWORD
  
  if (!devId || !devPassword) {
    throw new Error('Identifiants Screenscraper manquants')
  }
  
  // URL de l'API jeuRecherche
  const url = `https://api.screenscraper.fr/api2/jeuRecherche.php?devid=${devId}&devpassword=${devPassword}&softname=super-retrogamers&output=json&recherche=${encodeURIComponent(query)}`
  
  console.log(`🔍 Recherche Screenscraper: "${query}"`)

  // Attendre 15s
  await new Promise(resolve => setTimeout(resolve, 15000))
  
  const response = await fetch(url)
  
  if (!response.ok) {
    throw new Error(`Erreur API Screenscraper: ${response.status}`)
  }
  
  const data = await response.json()
  
  if (!data.response || !data.response.jeux) {
    console.log('Aucun résultat Screenscraper pour:', query)
    return []
  }
  
  // L'API peut retourner un objet unique ou un tableau
  const jeux = Array.isArray(data.response.jeux) ? data.response.jeux : [data.response.jeux]
  
  console.log(`📋 ${jeux.length} résultats trouvés sur Screenscraper`)
  
  return jeux.slice(0, 20) // Limiter à 20 résultats pour éviter la surcharge
}

/**
 * Extraire le titre d'un jeu Screenscraper selon la région préférée
 */
function getGameTitle(game: ScreenscraperSearchResult, preferredRegion: string = 'fr'): string {
  if (!game.noms || !Array.isArray(game.noms)) {
    // Fallback sur le nom général si disponible
    if (game.nom && game.nom.trim()) return game.nom.trim()
    return `Jeu inconnu (${game.id})`
  }
  
  // Ordre de priorité des régions basé sur la région préférée
  const regionPriority = getRegionPriority(preferredRegion)
  
  // Chercher le titre dans l'ordre de priorité
  for (const region of regionPriority) {
    const nomEntry = game.noms.find(n => n.region === region)
    if (nomEntry?.text && nomEntry.text.trim()) {
      return nomEntry.text.trim()
    }
  }
  
  // Si aucune région préférée trouvée, prendre le premier disponible
  if (game.noms.length > 0 && game.noms[0].text) {
    return game.noms[0].text.trim()
  }
  
  // Fallback sur le nom général si disponible
  if (game.nom && game.nom.trim()) return game.nom.trim()
  
  // Dernière tentative : utiliser l'ID comme nom d'affichage
  return `Jeu inconnu (${game.id})`
}

/**
 * Définir l'ordre de priorité des régions selon la région préférée
 */
function getRegionPriority(preferredRegion: string): string[] {
  // Mapping des régions vers les codes Screenscraper
  const regionMappings: Record<string, string[]> = {
    'FR': ['fr', 'eu', 'wor', 'ss', 'us', 'jp'],
    'EU': ['eu', 'fr', 'wor', 'ss', 'us', 'jp'],
    'US': ['us', 'wor', 'ss', 'eu', 'fr', 'jp'],
    'JP': ['jp', 'wor', 'ss', 'us', 'eu', 'fr'],
    'WOR': ['wor', 'ss', 'eu', 'fr', 'us', 'jp'],
    'ASI': ['jp', 'wor', 'ss', 'us', 'eu', 'fr']
  }
  
  const upperRegion = preferredRegion.toUpperCase()
  return regionMappings[upperRegion] || regionMappings['FR']
}

/**
 * Convertir un résultat Screenscraper vers le format GameResult
 */
function convertScreenscraperToGameResult(ssGame: ScreenscraperSearchResult, preferredRegion: string = 'fr'): SearchResult['games'][0] {
  const title = getGameTitle(ssGame, preferredRegion)
  
  // Extraction du rating
  let rating: number | null = null
  if (ssGame.note) {
    if (typeof ssGame.note === 'number') {
      rating = ssGame.note
    } else if (typeof ssGame.note === 'string') {
      const parsed = parseFloat(ssGame.note)
      rating = isNaN(parsed) ? null : parsed
    } else if (typeof ssGame.note === 'object' && 'text' in ssGame.note) {
      const parsed = parseFloat(ssGame.note.text || '')
      rating = isNaN(parsed) ? null : parsed
    }
  }
  
  // Extraction de l'année selon la région préférée
  let releaseYear: number | null = null
  if (ssGame.dates && Array.isArray(ssGame.dates)) {
    const regionPriority = getRegionPriority(preferredRegion)
    
    for (const region of regionPriority) {
      const dateEntry = ssGame.dates.find(d => d.region === region)
      if (dateEntry?.text) {
        const year = parseInt(dateEntry.text.split('-')[0])
        if (year > 1970 && year < 2030) {
          releaseYear = year
          break
        }
      }
    }
  }
  
  // Extraction du genre selon la région préférée
  let genre: string | null = null
  if (ssGame.genres && Array.isArray(ssGame.genres)) {
    const regionPriority = getRegionPriority(preferredRegion)
    
    for (const region of regionPriority) {
      const genreEntry = ssGame.genres.find(g => g.region === region)
      if (genreEntry?.text && genreEntry.text.trim()) {
        genre = genreEntry.text.trim()
        break
      }
    }
  }
  
  // Extraction du nombre de joueurs
  let playerCount: string | null = null
  if (ssGame.joueurs) {
    if (typeof ssGame.joueurs === 'string') {
      playerCount = ssGame.joueurs
    } else if (typeof ssGame.joueurs === 'object' && 'text' in ssGame.joueurs) {
      playerCount = ssGame.joueurs.text || null
    }
  }
  
  return {
    id: `screenscraper-${ssGame.id}`,
    slug: `screenscraper-${ssGame.id}`, // Slug temporaire pour les résultats Screenscraper
    title,
    rating,
    releaseYear,
    genre,
    playerCount,
    topStaff: false, // Pas d'info TOP Staff dans l'API de recherche
    console: ssGame.systeme ? {
      name: ssGame.systeme.nom || ssGame.systeme.text || 'Console inconnue',
      slug: `system-${ssGame.systeme.id}`
    } : null
  }
}