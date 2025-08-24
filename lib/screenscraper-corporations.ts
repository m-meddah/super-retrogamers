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

    // Faire la requête API avec headers de navigateur
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'max-age=0',
        'Connection': 'keep-alive',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1'
      }
    })
    
    if (!response.ok) {
      return {
        success: false,
        error: `Erreur HTTP ${response.status}: ${response.statusText}`
      }
    }

    // L'API peut retourner du JSON, HTML ou directement l'image
    const contentType = response.headers.get('content-type')
    
    // Si l'API retourne directement une image, l'URL de la requête est l'URL du logo
    if (contentType?.includes('image/')) {
      console.log(`   ✅ Logo trouvé (${contentType})`)
      return {
        success: true,
        logoUrl: apiUrl
      }
    }
    
    // Vérifier si c'est une redirection vers une image
    const finalUrl = response.url
    if (finalUrl !== apiUrl && finalUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      console.log(`   ✅ Logo trouvé via redirection`)
      return {
        success: true,
        logoUrl: finalUrl
      }
    }
    
    // Vérifier si l'URL répond avec une image même si le content-type n'est pas correct
    if (response.status === 200) {
      // Lire les premiers octets pour détecter une signature d'image
      const buffer = await response.arrayBuffer()
      const firstBytes = new Uint8Array(buffer.slice(0, 12))
      
      // Signatures d'images communes
      const isJPEG = firstBytes[0] === 0xFF && firstBytes[1] === 0xD8
      const isPNG = firstBytes[0] === 0x89 && firstBytes[1] === 0x50 && firstBytes[2] === 0x4E && firstBytes[3] === 0x47
      const isGIF = firstBytes[0] === 0x47 && firstBytes[1] === 0x49 && firstBytes[2] === 0x46
      const isWebP = firstBytes[0] === 0x52 && firstBytes[1] === 0x49 && firstBytes[2] === 0x46 && firstBytes[3] === 0x46 && 
                    firstBytes[8] === 0x57 && firstBytes[9] === 0x45 && firstBytes[10] === 0x42 && firstBytes[11] === 0x50
      
      if (isJPEG || isPNG || isGIF || isWebP) {
        console.log(`   ✅ Logo trouvé par signature (${isJPEG ? 'JPEG' : isPNG ? 'PNG' : isGIF ? 'GIF' : 'WebP'})`)
        return {
          success: true,
          logoUrl: apiUrl
        }
      }
      
      // Si ce n'est pas une image, convertir en texte pour analyser
      const textContent = new TextDecoder().decode(buffer)
      
      // Rechercher des patterns d'erreur dans le contenu
      if (textContent.includes('API fermé')) {
        return {
          success: false,
          error: 'API Screenscraper fermée ou inaccessible'
        }
      }
      
      if (textContent.includes('identification') || textContent.includes('Erreur de login')) {
        return {
          success: false,
          error: 'Erreur d\'identification - vérifiez vos credentials'
        }
      }
      
      if (textContent.includes('quota')) {
        return {
          success: false,
          error: 'Quota API dépassé'
        }
      }

      if (textContent.includes('not found') || textContent.includes('introuvable')) {
        return {
          success: false,
          error: `Corporation ${ssCorporationId} introuvable ou sans logo`
        }
      }
      
      // Essayer d'extraire une URL d'image du contenu HTML si présente
      const imgMatch = textContent.match(/src=["']([^"']*\.(jpg|jpeg|png|gif|webp))['"]/i)
      if (imgMatch && imgMatch[1]) {
        const imageUrl = imgMatch[1].startsWith('http') ? imgMatch[1] : `https://screenscraper.fr${imgMatch[1]}`
        return {
          success: true,
          logoUrl: imageUrl
        }
      }
      
      return {
        success: false,
        error: `Contenu inattendu (${textContent.substring(0, 100)}...)`
      }
    }
    
    return {
      success: false,
      error: `Erreur inattendue: response.status = ${response.status}`
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