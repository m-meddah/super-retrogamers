/**
 * Service pour récupérer les logos des corporations depuis l'API Screenscraper
 * Utilise l'endpoint mediaCompagnie.php pour récupérer les logos wheel
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Configuration de l'API Screenscraper
const SCREENSCRAPER_BASE_URL = 'https://api.screenscraper.fr/api2'
const THROTTLE_DELAY = 1200 // 1.2s entre les requêtes

interface CorporationLogoResult {
  success: boolean
  logoUrl?: string
  error?: string
}

/**
 * Récupère l'URL du logo d'une corporation depuis Screenscraper
 */
export async function getCorporationLogoFromScreenscraper(
  ssCorporationId: number
): Promise<CorporationLogoResult> {
  try {
    const devId = process.env.SCREENSCRAPER_DEV_ID
    const devPassword = process.env.SCREENSCRAPER_DEV_PASSWORD
    const username = process.env.SCREENSCRAPER_USERNAME
    const password = process.env.SCREENSCRAPER_PASSWORD

    if (!devId || !devPassword) {
      return {
        success: false,
        error: 'Credentials Screenscraper manquants (SCREENSCRAPER_DEV_ID, SCREENSCRAPER_DEV_PASSWORD)'
      }
    }

    // Construire l'URL de l'API avec credentials optionnels
    let apiUrl = `${SCREENSCRAPER_BASE_URL}/mediaCompagnie.php` +
      `?devid=${encodeURIComponent(devId)}` +
      `&devpassword=${encodeURIComponent(devPassword)}` +
      `&companyid=${ssCorporationId}` +
      `&media=wheel`

    // Ajouter les credentials utilisateur si disponibles
    if (username && password) {
      apiUrl += `&ssid=${encodeURIComponent(username)}&sspassword=${encodeURIComponent(password)}`
    }

    console.log(`🔄 Récupération du logo pour corporation ID: ${ssCorporationId}`)

    // Faire la requête API
    const response = await fetch(apiUrl)
    
    if (!response.ok) {
      return {
        success: false,
        error: `Erreur HTTP ${response.status}: ${response.statusText}`
      }
    }

    // L'API peut retourner du JSON, HTML ou directement l'URL de l'image
    const contentType = response.headers.get('content-type')
    
    if (contentType?.includes('application/json')) {
      // Réponse JSON (probablement une erreur)
      try {
        const jsonData = await response.json()
        return {
          success: false,
          error: `Erreur API: ${JSON.stringify(jsonData)}`
        }
      } catch (e) {
        return {
          success: false,
          error: 'Réponse JSON invalide'
        }
      }
    } else if (contentType?.includes('image/')) {
      // Réponse directe d'image - l'URL de la requête est l'URL de l'image
      return {
        success: true,
        logoUrl: apiUrl
      }
    } else if (contentType?.includes('text/html')) {
      // Réponse HTML - peut contenir des informations d'erreur
      try {
        const htmlContent = await response.text()
        
        // Rechercher des patterns d'erreur courants
        if (htmlContent.includes('API fermé')) {
          return {
            success: false,
            error: 'API Screenscraper fermée ou inaccessible'
          }
        }
        
        if (htmlContent.includes('identification')) {
          return {
            success: false,
            error: 'Erreur d\'identification - vérifiez vos credentials'
          }
        }
        
        if (htmlContent.includes('quota')) {
          return {
            success: false,
            error: 'Quota API dépassé'
          }
        }

        if (htmlContent.includes('not found') || htmlContent.includes('introuvable')) {
          return {
            success: false,
            error: `Corporation ${ssCorporationId} introuvable ou sans logo`
          }
        }
        
        // Essayer d'extraire une URL d'image du HTML si présente
        const imgMatch = htmlContent.match(/src=["']([^"']*\.(jpg|jpeg|png|gif|webp))['"]/i)
        if (imgMatch && imgMatch[1]) {
          const imageUrl = imgMatch[1].startsWith('http') ? imgMatch[1] : `https://screenscraper.fr${imgMatch[1]}`
          return {
            success: true,
            logoUrl: imageUrl
          }
        }
        
        return {
          success: false,
          error: `Réponse HTML inattendue (${htmlContent.substring(0, 100)}...)`
        }
      } catch (e) {
        return {
          success: false,
          error: 'Erreur lors du parsing HTML'
        }
      }
    } else {
      // Vérifier si c'est une redirection vers une image
      const finalUrl = response.url
      if (finalUrl !== apiUrl && finalUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        return {
          success: true,
          logoUrl: finalUrl
        }
      }
      
      return {
        success: false,
        error: `Type de contenu inattendu: ${contentType}`
      }
    }

  } catch (error) {
    return {
      success: false,
      error: `Erreur lors de la récupération: ${error}`
    }
  }
}

/**
 * Met à jour le logo d'une corporation dans la base de données
 */
export async function updateCorporationLogo(
  corporationId: string,
  ssCorporationId: number
): Promise<CorporationLogoResult> {
  try {
    // Récupérer l'URL du logo
    const logoResult = await getCorporationLogoFromScreenscraper(ssCorporationId)
    
    if (!logoResult.success || !logoResult.logoUrl) {
      return logoResult
    }

    // Mettre à jour la corporation dans la base
    await prisma.corporation.update({
      where: { id: corporationId },
      data: { logoUrl: logoResult.logoUrl }
    })

    console.log(`✅ Logo mis à jour pour corporation ${corporationId}`)
    
    return {
      success: true,
      logoUrl: logoResult.logoUrl
    }

  } catch (error) {
    return {
      success: false,
      error: `Erreur lors de la mise à jour: ${error}`
    }
  }
}

/**
 * Met à jour les logos de toutes les corporations qui ont un ssCorporationId
 */
export async function updateAllCorporationLogos(): Promise<{
  success: boolean
  processed: number
  updated: number
  errors: number
  details: Array<{ name: string; success: boolean; error?: string }>
}> {
  try {
    console.log('🏢 Début de la mise à jour des logos des corporations')

    // Récupérer toutes les corporations avec ssCorporationId
    const corporations = await prisma.corporation.findMany({
      where: {
        ssCorporationId: { not: null }
      },
      select: {
        id: true,
        name: true,
        ssCorporationId: true,
        logoUrl: true
      }
    })

    console.log(`📊 ${corporations.length} corporations à traiter`)

    let processed = 0
    let updated = 0
    let errors = 0
    const details: Array<{ name: string; success: boolean; error?: string }> = []

    for (const corporation of corporations) {
      try {
        processed++
        
        console.log(`\n[${processed}/${corporations.length}] ${corporation.name}`)
        
        // Vérifier si un logo existe déjà
        if (corporation.logoUrl) {
          console.log(`   ⏭️  Logo déjà présent: ${corporation.logoUrl}`)
          details.push({ name: corporation.name, success: true })
          continue
        }

        // Récupérer et mettre à jour le logo
        const result = await updateCorporationLogo(
          corporation.id,
          corporation.ssCorporationId!
        )

        if (result.success) {
          console.log(`   ✅ Logo récupéré: ${result.logoUrl}`)
          updated++
          details.push({ name: corporation.name, success: true })
        } else {
          console.log(`   ❌ Échec: ${result.error}`)
          errors++
          details.push({ name: corporation.name, success: false, error: result.error })
        }

        // Throttling pour respecter les limites API
        if (processed < corporations.length) {
          console.log(`   ⏸️  Pause de ${THROTTLE_DELAY}ms...`)
          await new Promise(resolve => setTimeout(resolve, THROTTLE_DELAY))
        }

      } catch (error) {
        errors++
        console.error(`   💥 Erreur inattendue pour ${corporation.name}:`, error)
        details.push({ 
          name: corporation.name, 
          success: false, 
          error: `Erreur inattendue: ${error}` 
        })
      }
    }

    console.log('\n📈 === RÉSUMÉ ===')
    console.log(`   Traitées: ${processed}`)
    console.log(`   Mises à jour: ${updated}`)
    console.log(`   Erreurs: ${errors}`)
    console.log(`   Taux de succès: ${processed > 0 ? Math.round(((processed - errors) / processed) * 100) : 0}%`)

    return {
      success: true,
      processed,
      updated,
      errors,
      details
    }

  } catch (error) {
    console.error('💥 Erreur fatale lors de la mise à jour des logos:', error)
    return {
      success: false,
      processed: 0,
      updated: 0,
      errors: 1,
      details: [{ name: 'FATAL', success: false, error: `${error}` }]
    }
  }
}

/**
 * Récupère les corporations sans logo pour diagnostic
 */
export async function getCorporationsWithoutLogo() {
  return await prisma.corporation.findMany({
    where: {
      AND: [
        { ssCorporationId: { not: null } },
        { 
          OR: [
            { logoUrl: null },
            { logoUrl: '' }
          ]
        }
      ]
    },
    select: {
      id: true,
      name: true,
      ssCorporationId: true,
      _count: {
        select: {
          developedGames: true, // Compter les jeux développés
          publishedGames: true, // Compter les jeux édités
          roles: true // Compter les rôles
        }
      }
    },
    orderBy: { name: 'asc' }
  })
}

/**
 * Test de l'API sur une corporation spécifique
 */
export async function testCorporationLogo(ssCorporationId: number) {
  console.log(`🧪 Test de récupération de logo pour corporation ID: ${ssCorporationId}`)
  
  const result = await getCorporationLogoFromScreenscraper(ssCorporationId)
  
  if (result.success) {
    console.log(`✅ Succès: ${result.logoUrl}`)
  } else {
    console.log(`❌ Échec: ${result.error}`)
  }
  
  return result
}