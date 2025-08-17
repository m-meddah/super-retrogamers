'use client'

import { useActionState } from 'react'
import { Globe, CheckCircle, AlertCircle } from 'lucide-react'
import { ActionState, updatePreferredRegionAction } from '@/lib/actions/settings-actions'
import { RegionFlag } from '@/components/ui/region-flag'

interface RegionalPreferenceFormProps {
  currentRegion: string
}

const initialState: ActionState = {
  success: undefined,
  message: '',
  errors: {}
}

const REGIONS = [
  { code: 'FR', name: 'France' },
  { code: 'EU', name: 'Europe' },
  { code: 'WOR', name: 'Monde' },
  { code: 'US', name: 'États-Unis' },
  { code: 'JP', name: 'Japon' },
  { code: 'ASI', name: 'Asie' }
] as const

export function RegionalPreferenceForm({ currentRegion }: RegionalPreferenceFormProps) {
  const [state, formAction, isPending] = useActionState(updatePreferredRegionAction, initialState)

  return (
    <form action={formAction} className="space-y-4">
      {state.message && (
        <div className={`flex items-center gap-2 rounded-md p-3 text-sm ${
          state.success 
            ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
            : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400'
        }`}>
          {state.success ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          {state.message}
        </div>
      )}
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Région préférée
        </label>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Cette préférence détermine quels noms de consoles, titres de jeux et images sont affichés en priorité.
        </p>
        
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {REGIONS.map((region) => (
            <label
              key={region.code}
              className={`relative flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all ${
                currentRegion === region.code
                  ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20'
                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
              } ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input
                type="radio"
                name="preferredRegion"
                value={region.code}
                defaultChecked={currentRegion === region.code}
                disabled={isPending}
                className="sr-only"
              />
              <RegionFlag region={region.code} className="w-6 h-4 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {region.name}
              </span>
              {currentRegion === region.code && (
                <CheckCircle className="h-4 w-4 text-blue-500 ml-auto" />
              )}
            </label>
          ))}
        </div>
        
        {state.errors?.preferredRegion && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {state.errors.preferredRegion}
          </p>
        )}
      </div>
      
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Globe className="h-4 w-4" />
          {isPending ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>
    </form>
  )
}