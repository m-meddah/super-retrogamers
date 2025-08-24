#!/usr/bin/env tsx

/**
 * Script pour remplir la table generations avec les données historiques
 * des générations de consoles de jeux vidéo
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Données des générations de consoles basées sur la recherche historique
const CONSOLE_GENERATIONS = [
  {
    name: "1ère génération",
    nameEn: "1st generation", 
    startYear: 1972,
    endYear: 1983,
    description: "Première génération de consoles avec la Magnavox Odyssey (1972). Consoles très basiques avec des jeux simples intégrés."
  },
  {
    name: "2ème génération", 
    nameEn: "2nd generation",
    startYear: 1976,
    endYear: 1985,
    description: "Introduction des cartouches de jeu avec la Fairchild Channel F (1976). Atari 2600 domine cette génération."
  },
  {
    name: "3ème génération",
    nameEn: "3rd generation", 
    startYear: 1983,
    endYear: 1990,
    description: "Ère 8-bit dominée par la Nintendo Entertainment System (NES/Famicom). Révolution du jeu vidéo après le crash de 1983."
  },
  {
    name: "4ème génération",
    nameEn: "4th generation",
    startYear: 1987, 
    endYear: 1996,
    description: "Ère 16-bit avec la guerre des consoles entre Sega Genesis/Mega Drive et Super Nintendo (SNES). PC Engine/TurboGrafx-16."
  },
  {
    name: "5ème génération",
    nameEn: "5th generation",
    startYear: 1993,
    endYear: 2002, 
    description: "Transition vers la 3D avec PlayStation (1994), Nintendo 64 et Sega Saturn. Abandon des cartouches pour les CD-ROM."
  },
  {
    name: "6ème génération",
    nameEn: "6th generation",
    startYear: 1998,
    endYear: 2005,
    description: "Ère 128-bit avec PlayStation 2, GameCube, Xbox et Dreamcast. DVD et graphismes 3D avancés."
  },
  {
    name: "7ème génération", 
    nameEn: "7th generation",
    startYear: 2005,
    endYear: 2013,
    description: "Ère HD avec PlayStation 3, Xbox 360 et Nintendo Wii. Introduction du mouvement et des services en ligne."
  },
  {
    name: "8ème génération",
    nameEn: "8th generation", 
    startYear: 2012,
    endYear: 2020,
    description: "PlayStation 4, Xbox One et Nintendo Switch. 4K, réalité virtuelle et jeu nomade/salon hybride."
  },
  {
    name: "9ème génération",
    nameEn: "9th generation",
    startYear: 2020,
    endYear: null, // Génération actuelle
    description: "PlayStation 5 et Xbox Series X/S. Ray tracing, SSD ultra-rapides et rétrocompatibilité avancée."
  }
]

async function populateGenerations() {
  console.log('🎮 Début du remplissage de la table generations...\n')

  let createdCount = 0
  let updatedCount = 0
  let skippedCount = 0

  for (const genData of CONSOLE_GENERATIONS) {
    try {
      console.log(`📅 Traitement: ${genData.name} (${genData.startYear}-${genData.endYear || 'présent'})`)

      // Vérifier si la génération existe déjà
      const existingGeneration = await prisma.generation.findUnique({
        where: { name: genData.name }
      })

      if (existingGeneration) {
        // Mettre à jour si nécessaire
        const updated = await prisma.generation.update({
          where: { name: genData.name },
          data: {
            nameEn: genData.nameEn,
            startYear: genData.startYear,
            endYear: genData.endYear
          }
        })
        console.log(`   ✅ Mise à jour: ${updated.name}`)
        updatedCount++
      } else {
        // Créer nouvelle génération
        const created = await prisma.generation.create({
          data: {
            name: genData.name,
            nameEn: genData.nameEn,
            startYear: genData.startYear,
            endYear: genData.endYear
          }
        })
        console.log(`   🆕 Créée: ${created.name}`)
        createdCount++
      }

    } catch (error) {
      console.error(`   ❌ Erreur pour ${genData.name}:`, error)
      skippedCount++
    }
  }

  console.log('\n📊 Résumé:')
  console.log(`   - Générations créées: ${createdCount}`)
  console.log(`   - Générations mises à jour: ${updatedCount}`) 
  console.log(`   - Erreurs/ignorées: ${skippedCount}`)
  console.log(`   - Total traité: ${CONSOLE_GENERATIONS.length}`)

  // Afficher le contenu final de la table
  console.log('\n🎯 Contenu final de la table generations:')
  const allGenerations = await prisma.generation.findMany({
    orderBy: { startYear: 'asc' }
  })

  allGenerations.forEach((gen, index) => {
    const period = gen.endYear ? `${gen.startYear}-${gen.endYear}` : `${gen.startYear}-présent`
    console.log(`   ${index + 1}. ${gen.name} (${period})`)
  })

  console.log('\n✅ Remplissage de la table generations terminé!')
}

async function main() {
  try {
    await populateGenerations()
  } catch (error) {
    console.error('❌ Erreur fatale:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécution du script
if (require.main === module) {
  main()
}

export { populateGenerations, CONSOLE_GENERATIONS }