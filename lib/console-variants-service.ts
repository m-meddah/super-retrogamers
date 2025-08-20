'use server'

import { prisma } from '@/lib/prisma'
import type { Region } from '@prisma/client'

// Régions principales pour les consoles rétro
const MAIN_REGIONS: { region: Region; name: string }[] = [
  { region: 'FR', name: 'France' },
  { region: 'EU', name: 'Europe' },
  { region: 'WOR', name: 'Monde' },
  { region: 'JP', name: 'Japon' },
  { region: 'US', name: 'États-Unis' },
]

// Mappings spécifiques par console pour les régions les plus courantes
const CONSOLE_REGION_MAPPINGS: Record<string, Region[]> = {
  // Nintendo
  'nintendo-entertainment-system': ['US', 'EU', 'JP'],
  'super-nintendo': ['US', 'EU', 'JP', 'FR'],
  'nintendo-64': ['US', 'EU', 'JP'],
  'game-boy': ['WOR', 'JP', 'EU', 'US'],
  'game-boy-color': ['WOR', 'JP', 'EU', 'US'],
  'game-boy-advance': ['WOR', 'JP', 'EU', 'US'],
  'nintendo-gamecube': ['US', 'EU', 'JP'],
  
  // Sega
  'sega-master-system': ['EU', 'US', 'JP'],
  'sega-genesis': ['US', 'EU', 'JP'],
  'sega-saturn': ['JP', 'US', 'EU'],
  'sega-dreamcast': ['US', 'EU', 'JP'],
  
  // Sony
  'sony-playstation': ['US', 'EU', 'JP', 'FR'],
  'sony-playstation-2': ['US', 'EU', 'JP', 'FR'],
  
  // Autres
  'atari-2600': ['US', 'EU'],
  'neo-geo': ['JP', 'US', 'EU']}

export async function createConsoleVariants(consoleSlug: string) {
  try {
    // Récupérer la console
    const console = await prisma.console.findUnique({
      where: { slug: consoleSlug },
      include: { variants: true }
    })

    if (!console) {
      throw new Error(`Console not found: ${consoleSlug}`)
    }

    // Déterminer les régions pour cette console
    const regions = CONSOLE_REGION_MAPPINGS[consoleSlug] || ['EU', 'US', 'JP']
    
    // Créer les variants manquants
    const existingRegions = console.variants.map(v => v.region)
    const missingRegions = regions.filter(region => !existingRegions.includes(region))

    const createdVariants = []
    
    for (const region of missingRegions) {
      const regionData = MAIN_REGIONS.find(r => r.region === region)
      const regionName = regionData?.name || region

      const variant = await prisma.consoleVariant.create({
        data: {
          consoleId: console.id,
          name: `${console.name} (${regionName})`,
          region: region,
          releaseDate: console.releaseYear ? new Date(console.releaseYear, 0, 1) : null
        }
      })
      
      createdVariants.push(variant)
    }

    return {
      success: true,
      created: createdVariants.length,
      variants: createdVariants
    }
  } catch (error) {
    console.error('Error creating console variants:', error)
    throw error
  }
}

export async function createVariantsForAllConsoles() {
  try {
    const consoles = await prisma.console.findMany({
      select: { slug: true, name: true }
    })

    let totalCreated = 0
    const results = []

    for (const consoleItem of consoles) {
      try {
        const result = await createConsoleVariants(consoleItem.slug)
        totalCreated += result.created
        results.push({
          console: consoleItem.name,
          created: result.created
        })
      } catch (error) {
        console.error(`Error creating variants for ${consoleItem.slug}:`, error)
        results.push({
          console: consoleItem.name,
          created: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return {
      success: true,
      totalCreated,
      results
    }
  } catch (error) {
    console.error('Error creating variants for all consoles:', error)
    throw error
  }
}

export async function getConsoleWithVariants(consoleSlug: string) {
  return await prisma.console.findUnique({
    where: { slug: consoleSlug },
    include: {
      variants: {
        orderBy: [
          { region: 'asc' }
        ]
      }
    }
  })
}