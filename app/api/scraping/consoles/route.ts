import { NextResponse } from 'next/server'
import { scrapeConsolesFromScreenscraper } from '@/lib/screenscraper-service'

export async function POST() {
  try {
    console.log('Démarrage du scraping des consoles...')
    
    const result = await scrapeConsolesFromScreenscraper()
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        consolesAdded: result.consolesAdded
      }, { status: 200 })
    } else {
      return NextResponse.json({
        success: false,
        message: result.message,
        consolesAdded: result.consolesAdded
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Erreur dans la route de scraping:', error)
    return NextResponse.json({
      success: false,
      message: 'Erreur serveur lors du scraping',
      consolesAdded: 0
    }, { status: 500 })
  }
}