'use client'

import { startTransition } from 'react'
import { Globe } from 'lucide-react'
import { RegionFlag } from '@/components/ui/region-flag'
import { updatePreferredRegionAction } from '@/lib/actions/settings-actions'

interface SimpleRegionalPreferenceProps {
  currentRegion: string
}

const REGIONS = [
  { code: 'FR', name: 'France' },
  { code: 'EU', name: 'Europe' },
  { code: 'WOR', name: 'Monde' },
  { code: 'US', name: 'États-Unis' },
  { code: 'JP', name: 'Japon' },
  { code: 'ASI', name: 'Asie' }
] as const

async function updateUserRegion(region: string) {
  try {
    const formData = new FormData()
    formData.set('preferredRegion', region)
    
    const result = await updatePreferredRegionAction({ success: false }, formData)
    
    if (!result.success) {
      throw new Error(result.message || 'Erreur lors de la mise à jour')
    }
    
    // La redirection est gérée par l'action
  } catch (error) {
    console.error('Erreur:', error)
    alert('Erreur lors de la mise à jour de la région')
  }
}

export function SimpleRegionalPreference({ currentRegion }: SimpleRegionalPreferenceProps) {
  const handleRegionChange = (region: string) => {
    if (region === currentRegion) return
    
    startTransition(() => {
      updateUserRegion(region)
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Région préférée
        </label>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Cette préférence détermine quels noms de consoles, titres de jeux et images sont affichés en priorité.
        </p>
        
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {REGIONS.map((region) => (
            <button
              key={region.code}
              onClick={() => handleRegionChange(region.code)}
              className={`relative flex items-center gap-3 rounded-lg border p-3 transition-all ${
                currentRegion === region.code
                  ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20'
                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
              }`}
            >
              <RegionFlag region={region.code} className="w-6 h-4 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {region.name}
              </span>
              {currentRegion === region.code && (
                <Globe className="h-4 w-4 text-blue-500 ml-auto" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}