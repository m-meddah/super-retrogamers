'use client'

import { useState } from 'react'
import { testEnhancedScrapingAction, type ScrapingResult } from '@/lib/actions/scraping-actions'

export default function TestScrapingPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<ScrapingResult | null>(null)

  async function testScraping() {
    setIsLoading(true)
    setResults(null)
    
    try {
      console.log('🚀 Démarrage du test de scraping amélioré...')
      const result = await testEnhancedScrapingAction()
      setResults(result)
      console.log('✅ Test terminé:', result)
    } catch (error) {
      console.error('❌ Erreur:', error)
      setResults({ success: false, error: error instanceof Error ? error.message : 'Erreur inconnue' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Test du Scraping Amélioré</h1>
      
      <div className="space-y-4">
        <button
          onClick={testScraping}
          disabled={isLoading}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {isLoading ? 'Test Scraping Amélioré (Megadrive, 3 jeux)' : 'Tester le Scraping Amélioré'}
        </button>
        
        {results && (
          <div className="mt-6 p-4 border rounded">
            <h2 className="text-lg font-semibold mb-3">Résultats du Test:</h2>
            <div className="bg-gray-100 p-4 rounded text-sm">
              {results.success ? (
                <div>
                  <p className="text-green-600 font-semibold mb-2">✅ Test réussi!</p>
                  <p><strong>Total médias:</strong> {results.data?.total ?? 0}</p>
                  <p><strong>Nouveaux médias:</strong> {results.data?.imported ?? 0}</p>
                  <p><strong>Erreurs:</strong> {results.data?.errors ?? 0}</p>
                  
                  {results.data?.errorDetails && (
                    <div className="mt-4">
                      <strong>Détails:</strong>
                      <ul className="list-disc pl-4 mt-2">
                        {results.data.errorDetails.map((detail, i) => (
                          <li key={i} className="mb-1">{detail}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-red-600 font-semibold mb-2">❌ Erreur</p>
                  <p>{results.error}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}