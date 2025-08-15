'use client'

import { useActionState, startTransition, useState, useEffect } from 'react'
import { Lock, User, CheckCircle, AlertCircle, Globe } from 'lucide-react'
import { ActionState } from '@/lib/actions/settings-actions'
import { useSessionRefresh } from '@/lib/hooks/use-session-refresh'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface SettingsFormProps {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>
  user: {
    name?: string | null
    email?: string | null
    preferredRegion?: string | null
  }
  type: 'profile' | 'password' | 'region'
}

const initialState: ActionState = {
  success: undefined,
  message: '',
  errors: {}
}

export function SettingsForm({ action, user, type }: SettingsFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState)
  const { refreshSessionFromDatabase } = useSessionRefresh()
  const [selectedRegion, setSelectedRegion] = useState(user.preferredRegion || 'FR')

  const handleSubmit = (formData: FormData) => {
    startTransition(() => {
      formAction(formData)
    })
  }

  // Rafraîchir la session quand l'action réussit avec shouldRefresh
  useEffect(() => {
    if (state.success && state.shouldRefresh) {
      // Forcer le refresh de la session depuis la base de données
      refreshSessionFromDatabase().then((success) => {
        if (!success) {
          // Fallback: recharger la page si le refresh échoue
          setTimeout(() => {
            window.location.reload()
          }, 100) // Petit délai pour s'assurer que la session est à jour
        }
      })
    }
  }, [state.success, state.shouldRefresh, refreshSessionFromDatabase])

  if (type === 'profile') {
    return (
      <form action={handleSubmit} className="space-y-4">
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
        
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Nom d&apos;utilisateur
            </label>
            <input
              type="text"
              id="name"
              name="name"
              defaultValue={user.name || ""}
              disabled={isPending}
              className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:outline-none focus:ring-1 dark:text-white dark:placeholder-gray-500 ${
                state.errors?.name
                  ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500 dark:border-red-600 dark:bg-red-900/20'
                  : 'border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700'
              } ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
            {state.errors?.name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {state.errors.name}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Adresse email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              defaultValue={user.email || ""}
              disabled={isPending}
              className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:outline-none focus:ring-1 dark:text-white dark:placeholder-gray-500 ${
                state.errors?.email
                  ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500 dark:border-red-600 dark:bg-red-900/20'
                  : 'border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700'
              } ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
            {state.errors?.email && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {state.errors.email}
              </p>
            )}
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <User className="h-4 w-4" />
            {isPending ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </form>
    )
  }

  if (type === 'password') {
    return (
      <div className="mt-4 space-y-3">
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
        
        <form action={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Mot de passe actuel
            </label>
            <input
              type="password"
              id="currentPassword"
              name="currentPassword"
              disabled={isPending}
              className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:outline-none focus:ring-1 dark:text-white ${
                state.errors?.currentPassword
                  ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500 dark:border-red-600 dark:bg-red-900/20'
                  : 'border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700'
              } ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
            {state.errors?.currentPassword && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {state.errors.currentPassword}
              </p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nouveau mot de passe
              </label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                disabled={isPending}
                className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:outline-none focus:ring-1 dark:text-white ${
                  state.errors?.newPassword
                    ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500 dark:border-red-600 dark:bg-red-900/20'
                    : 'border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700'
                } ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
              {state.errors?.newPassword && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {state.errors.newPassword}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Confirmer le mot de passe
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                disabled={isPending}
                className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:outline-none focus:ring-1 dark:text-white ${
                  state.errors?.confirmPassword
                    ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500 dark:border-red-600 dark:bg-red-900/20'
                    : 'border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700'
                } ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
              {state.errors?.confirmPassword && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {state.errors.confirmPassword}
                </p>
              )}
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Lock className="h-4 w-4" />
              {isPending ? 'Changement...' : 'Changer le mot de passe'}
            </button>
          </div>
        </form>
      </div>
    )
  }

  if (type === 'region') {
    const regions = [
      { code: 'FR', label: 'France' },
      { code: 'EU', label: 'Europe' },
      { code: 'WOR', label: 'Monde' },
      { code: 'JP', label: 'Japon' },
      { code: 'ASI', label: 'Asie' },
      { code: 'US', label: 'États-Unis' }
    ]


    const handleFormSubmit = (formData: FormData) => {
      // Ajouter la région sélectionnée au FormData
      formData.set('preferredRegion', selectedRegion)
      handleSubmit(formData)
    }

    return (
      <div className="space-y-4">
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Région préférée
          </label>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Cette région sera utilisée par défaut pour afficher les noms de consoles et jeux.
            Vous pourrez toujours naviguer temporairement dans d&apos;autres régions.
          </p>
          <div className="mt-2">
            <Select
              value={selectedRegion}
              onValueChange={setSelectedRegion}
              disabled={isPending}
            >
              <SelectTrigger className={`w-full ${
                state.errors?.preferredRegion
                  ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500 dark:border-red-600 dark:bg-red-900/20'
                  : ''
              } ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <SelectValue placeholder="Choisir une région">
                  {regions.find(r => r.code === selectedRegion)?.label} ({selectedRegion})
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {regions.map((region) => (
                  <SelectItem key={region.code} value={region.code}>
                    {region.label} ({region.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {state.errors?.preferredRegion && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {state.errors.preferredRegion}
            </p>
          )}
        </div>

        <div className="flex justify-end">
          <form action={handleFormSubmit}>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Globe className="h-4 w-4" />
              {isPending ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return null
}