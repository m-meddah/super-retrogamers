import { NextRequest, NextResponse } from 'next/server'
import { recordPageView } from '@/lib/analytics-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { path } = body
    
    if (!path || typeof path !== 'string') {
      return NextResponse.json(
        { error: 'Path is required' }, 
        { status: 400 }
      )
    }
    
    // Valider que le path est légitime (éviter les injections)
    if (!path.match(/^\/[a-zA-Z0-9\/_-]*$/)) {
      return NextResponse.json(
        { error: 'Invalid path format' }, 
        { status: 400 }
      )
    }
    
    // Enregistrer la vue
    await recordPageView(path)
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Erreur API tracking:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

// Permettre les requêtes OPTIONS pour CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  })
}