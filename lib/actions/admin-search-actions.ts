'use server'

import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

/**
 * Interface pour les résultats de recherche Screenscraper admin
 */
interface AdminScreenscraperSearchResult {
  id: number
  nom?: string
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
  medias?: Array<{
    type: string
    parent?: string
    url: string
    region?: string
    crc?: string
    md5?: string
    sha1?: string
    size?: string
    format?: string
  }>
}

export interface AdminSearchResult {
  id: number
  title: string
  systemId: number
  systemName: string
  rating: number | null
  releaseYear: number | null
  genre: string | null
  playerCount: string | null
  imageUrl: string | null
  developer: string | null
  publisher: string | null
}

/**
 * Server Action pour rechercher dans Screenscraper (admin seulement)
 */
export async function searchScreenscraperAdminAction(
  query: string,
  preferredRegion: string = 'fr'
): Promise<{ success: boolean; results: AdminSearchResult[]; error?: string }> {
  try {
    // Vérifier que l'utilisateur est admin
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user || session.user.role !== 'admin') {
      return { success: false, results: [], error: 'Accès non autorisé' }
    }

    if (!query || query.length < 3) {
      return { success: false, results: [], error: 'La recherche doit contenir au moins 3 caractères' }
    }

    // Recherche sur Screenscraper
    const screencraperResults = await searchScreenscraperAPI(query)
    
    // Convertir les résultats pour l'admin
    const results = screencraperResults.map(ssGame => convertToAdminResult(ssGame, preferredRegion))
    
    return { success: true, results }

  } catch (error) {
    console.error('Erreur recherche admin Screenscraper:', error)
    return { success: false, results: [], error: 'Erreur lors de la recherche' }
  }
}

/**
 * Recherche dans l'API Screenscraper (pour admin)
 */
async function searchScreenscraperAPI(query: string): Promise<AdminScreenscraperSearchResult[]> {
  const devId = process.env.SCREENSCRAPER_DEV_ID
  const devPassword = process.env.SCREENSCRAPER_DEV_PASSWORD
  
  if (!devId || !devPassword) {
    throw new Error('Identifiants Screenscraper manquants')
  }
  
  const url = `https://api.screenscraper.fr/api2/jeuRecherche.php?devid=${devId}&devpassword=${devPassword}&softname=super-retrogamers&output=json&recherche=${encodeURIComponent(query)}`
  
  console.log(`🔍 Recherche admin Screenscraper: "${query}"`)

  // Rate limiting : attendre 1.2s
  await new Promise(resolve => setTimeout(resolve, 1200))
  
  const response = await fetch(url, { 
    signal: AbortSignal.timeout(30000) // 30s timeout
  })
  
  if (!response.ok) {
    throw new Error(`Erreur API Screenscraper: ${response.status}`)
  }
  
  const data = await response.json()
  
  if (!data.response || !data.response.jeux) {
    console.log('Aucun résultat Screenscraper pour:', query)
    return []
  }
  
  const jeux = Array.isArray(data.response.jeux) ? data.response.jeux : [data.response.jeux]
  
  console.log(`📋 ${jeux.length} résultats trouvés sur Screenscraper`)
  
  return jeux.slice(0, 30) // Limiter à 30 résultats
}

/**
 * Convertir un résultat Screenscraper vers le format admin
 */
function convertToAdminResult(ssGame: AdminScreenscraperSearchResult, preferredRegion: string): AdminSearchResult {
  // Extraction du titre selon région préférée
  const title = getGameTitle(ssGame, preferredRegion)
  
  // Extraction de l'année
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
  
  // Extraction du genre
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
  
  // Extraction du nombre de joueurs
  let playerCount: string | null = null
  if (ssGame.joueurs) {
    if (typeof ssGame.joueurs === 'string') {
      playerCount = ssGame.joueurs
    } else if (typeof ssGame.joueurs === 'object' && 'text' in ssGame.joueurs) {
      playerCount = ssGame.joueurs.text || null
    }
  }
  
  // Extraction des développeur/éditeur
  let developer: string | null = null
  if (ssGame.developpeur) {
    if (typeof ssGame.developpeur === 'string') {
      developer = ssGame.developpeur
    } else if (typeof ssGame.developpeur === 'object' && 'text' in ssGame.developpeur) {
      developer = ssGame.developpeur.text || null
    }
  }
  
  let publisher: string | null = null
  if (ssGame.editeur) {
    if (typeof ssGame.editeur === 'string') {
      publisher = ssGame.editeur
    } else if (typeof ssGame.editeur === 'object' && 'text' in ssGame.editeur) {
      publisher = ssGame.editeur.text || null
    }
  }
  
  // Extraction de l'URL de l'image (simple, pas de fallback complexe)
  const imageUrl = getSimpleImageUrl(ssGame, preferredRegion)
  
  return {
    id: ssGame.id,
    title,
    systemId: ssGame.systeme?.id || 0,
    systemName: ssGame.systeme?.nom || ssGame.systeme?.text || 'Console inconnue',
    rating,
    releaseYear,
    genre,
    playerCount,
    imageUrl,
    developer,
    publisher
  }
}

/**
 * Extraire le titre selon la région préférée
 */
function getGameTitle(game: AdminScreenscraperSearchResult, preferredRegion: string = 'fr'): string {
  if (!game.noms || !Array.isArray(game.noms)) {
    if (game.nom && game.nom.trim()) return game.nom.trim()
    return `Jeu inconnu (${game.id})`
  }
  
  const regionPriority = getRegionPriority(preferredRegion)
  
  for (const region of regionPriority) {
    const nomEntry = game.noms.find(n => n.region === region)
    if (nomEntry?.text && nomEntry.text.trim()) {
      return nomEntry.text.trim()
    }
  }
  
  if (game.noms.length > 0 && game.noms[0].text) {
    return game.noms[0].text.trim()
  }
  
  if (game.nom && game.nom.trim()) return game.nom.trim()
  
  return `Jeu inconnu (${game.id})`
}

/**
 * Définir l'ordre de priorité des régions
 */
function getRegionPriority(preferredRegion: string): string[] {
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
 * Extraire une URL d'image simple (pour éviter les timeouts Next.js)
 */
function getSimpleImageUrl(game: AdminScreenscraperSearchResult, preferredRegion: string = 'fr'): string | null {
  if (!game.medias || !Array.isArray(game.medias)) {
    return null
  }
  
  const imageTypes = ['box-2D', 'box-3D', 'wheel']
  const regionPriority = getRegionPriority(preferredRegion)
  
  for (const imageType of imageTypes) {
    for (const region of regionPriority) {
      const mediaEntry = game.medias.find(m => 
        m.type === imageType && 
        m.region === region &&
        m.url
      )
      if (mediaEntry?.url) {
        return mediaEntry.url
      }
    }
  }
  
  return null
}