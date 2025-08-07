#!/usr/bin/env tsx

import { getConsoleCount } from "@/lib/data-prisma"

async function main() {
  try {
    const count = await getConsoleCount()
    console.log(`Nombre de consoles en base: ${count}`)
    
    if (count === 0) {
      console.log("Aucune console en base, le scraping est nécessaire")
    } else {
      console.log("Des consoles sont présentes en base")
    }
  } catch (error) {
    console.error("Erreur:", error)
  }
}

main()