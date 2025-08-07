import { NextResponse } from 'next/server'
import { scrapeConsolesFromScreenscraper } from '@/lib/screenscraper-service'

export async function POST() {
  try {
    const result = await scrapeConsolesFromScreenscraper(10) // Limiter à 10 consoles
    return NextResponse.json(result)
  } catch (error) {
    console.error('Erreur lors du scraping:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Erreur lors du scraping',
        consolesAdded: 0 
      },
      { status: 500 }
    )
  }
}