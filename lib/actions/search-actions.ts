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
  isBestVersion?: boolean
  isDemo?: boolean
  isBeta?: boolean
  isTranslated?: boolean
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
    isBestVersion: boolean
    isDemo: boolean
    isBeta: boolean
    isTranslated: boolean
    image: string | null
    console: {
      name: string
      slug: string
    } | null
    medias: Array<{
      mediaType: string
      region: string
      localPath: string | null
    }>
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
        { developer: { contains: filters.query, mode: 'insensitive' } },
        { publisher: { contains: filters.query, mode: 'insensitive' } },
        { description: { contains: filters.query, mode: 'insensitive' } }
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
        contains: filters.genre,
        mode: 'insensitive'
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

    // Filtres ROM (flags booléens)
    if (filters.topStaff) {
      whereConditions.topStaff = true
    }
    if (filters.isBestVersion) {
      whereConditions.isBestVersion = true
    }
    if (filters.isDemo) {
      whereConditions.isDemo = true
    }
    if (filters.isBeta) {
      whereConditions.isBeta = true
    }
    if (filters.isTranslated) {
      whereConditions.isTranslated = true
    }

    // Exécution de la requête principale
    const games = await prisma.game.findMany({
      where: whereConditions,
      include: {
        console: {
          select: {
            name: true,
            slug: true
          }
        },
        medias: {
          select: {
            mediaType: true,
            region: true,
            localPath: true
          },
          orderBy: [
            { mediaType: 'asc' },
            { region: 'asc' }
          ]
        }
      },
      orderBy: [
        { topStaff: 'desc' },
        { rating: 'desc' },
        { title: 'asc' }
      ],
      take: 100 // Limite raisonnable pour éviter les problèmes de performance
    })

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

    // Récupération des genres uniques
    const genresResult = await prisma.game.findMany({
      where: {
        genre: {
          not: null
        }
      },
      select: {
        genre: true
      },
      distinct: ['genre']
    })

    const genres = genresResult
      .map(g => g.genre)
      .filter((genre): genre is string => Boolean(genre))
      .sort()

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
          { developer: { contains: query, mode: 'insensitive' } },
          { publisher: { contains: query, mode: 'insensitive' } }
        ]
      },
      select: {
        title: true,
        developer: true,
        publisher: true
      },
      take: 10
    })

    const suggestions = new Set<string>()
    
    games.forEach(game => {
      if (game.title.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(game.title)
      }
      if (game.developer?.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(game.developer)
      }
      if (game.publisher?.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(game.publisher)
      }
    })

    return Array.from(suggestions).slice(0, 8)

  } catch (error) {
    console.error('Erreur lors de la récupération des suggestions:', error)
    return []
  }
}

/**
 * Interface pour les résultats de recherche Screenscraper
 */
interface ScreenscraperSearchResult {
  id: number
  nom: string
  noms?: {
    nom_fr?: string
    nom_eu?: string
    nom_us?: string
    noms_commun?: string
  }
  systeme?: {
    id: number
    nom?: string
  }
  editeur?: string | { text?: string }
  developpeur?: string | { text?: string }
  note?: number | string | { text?: string }
  joueurs?: string | { text?: string }
  synopsis?: {
    synopsis_fr?: string
    synopsis_eu?: string
    synopsis_us?: string
  }
  dates?: {
    date_eu?: string
    date_fr?: string
    date_us?: string
    date_jp?: string
    date_wor?: string
  }
  genres?: {
    genres_fr?: string[]
    genres_eu?: string[]
    genres_us?: string[]
  }
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
        screencraperResults.forEach(ssGame => {
          const title = getGameTitle(ssGame).toLowerCase()
          if (!localTitles.has(title)) {
            allGames.push(convertScreenscraperToGameResult(ssGame))
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
  
  // Rate limiting: attendre 1.2s
  await new Promise(resolve => setTimeout(resolve, 1200))
  
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
 * Extraire le titre d'un jeu Screenscraper
 */
function getGameTitle(game: ScreenscraperSearchResult): string {
  return game.noms?.nom_fr || game.noms?.nom_eu || game.noms?.nom_us || game.noms?.noms_commun || game.nom || `Jeu ${game.id}`
}

/**
 * Convertir un résultat Screenscraper vers le format GameResult
 */
function convertScreenscraperToGameResult(ssGame: ScreenscraperSearchResult): SearchResult['games'][0] {
  const title = getGameTitle(ssGame)
  
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
  
  // Extraction de l'année
  let releaseYear: number | null = null
  if (ssGame.dates) {
    const dateStr = ssGame.dates.date_eu || ssGame.dates.date_fr || ssGame.dates.date_us || ssGame.dates.date_wor || ssGame.dates.date_jp
    if (dateStr) {
      const year = parseInt(dateStr.split('-')[0])
      releaseYear = (year > 1970 && year < 2030) ? year : null
    }
  }
  
  // Extraction du genre
  const genre = ssGame.genres?.genres_fr?.[0] || ssGame.genres?.genres_eu?.[0] || ssGame.genres?.genres_us?.[0] || null
  
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
    isBestVersion: false,
    isDemo: false,
    isBeta: false,
    isTranslated: false,
    image: null, // Pas d'image dans l'API de recherche
    console: ssGame.systeme ? {
      name: ssGame.systeme.nom || 'Console inconnue',
      slug: `system-${ssGame.systeme.id}`
    } : null,
    medias: [] // Pas de médias dans l'API de recherche
  }
}