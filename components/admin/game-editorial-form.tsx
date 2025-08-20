"use client"

import { useState, useTransition } from 'react'
import { Save, Eye, EyeOff, Plus, Trash2, ExternalLink } from 'lucide-react'
import type { Game, Console } from '@prisma/client'
import { updateGameAction } from '@/lib/actions/game-actions'
import { useActionState } from 'react'

interface GameEditorialFormProps {
  game: Game & { 
    console: Console
    corporationDev?: { name: string } | null
    corporationPub?: { name: string } | null
  }
}

export function GameEditorialForm({ game }: GameEditorialFormProps) {
  const [isPending, startTransition] = useTransition()
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [screenshots, setScreenshots] = useState<string[]>(game.screenshots || [])
  const [state, formAction] = useActionState(updateGameAction, { success: false, message: '' } as { success: boolean; message: string })
  
  const [formData, setFormData] = useState({
    title: game.title || '',
    description: game.description || '',
    developer: game.corporationDev?.name || '',
    publisher: game.corporationPub?.name || '',
    genre: '', // Deprecated field - genre now managed via genreId relation
    releaseYear: game.releaseYear || '',
    playerCount: game.playerCount || '',
    resolution: game.resolution || '',
    rotation: game.rotation || '',
    rating: game.rating || '',
    topStaff: game.topStaff || false,
    aiEnhancedDescription: game.aiEnhancedDescription || '',
    gameplayAnalysis: game.gameplayAnalysis || '',
    historicalSignificance: game.historicalSignificance || '',
    developmentStory: game.developmentStory || '',
    legacyImpact: game.legacyImpact || ''})

  const handleSubmit = async (formData: FormData) => {
    // Ajouter les screenshots à FormData
    screenshots.forEach((screenshot, index) => {
      formData.append(`screenshot_${index}`, screenshot)
    })
    formData.append('screenshots_count', screenshots.length.toString())
    formData.append('gameId', game.id)
    
    startTransition(() => {
      formAction(formData)
    })
  }

  const handleChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addScreenshot = () => {
    setScreenshots(prev => [...prev, ''])
  }

  const updateScreenshot = (index: number, value: string) => {
    setScreenshots(prev => prev.map((screenshot, i) => i === index ? value : screenshot))
  }

  const removeScreenshot = (index: number) => {
    setScreenshots(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6">
      {/* Message de statut */}
      {state.message && (
        <div className={`rounded-lg p-4 ${state.success ? 'bg-green-50 border border-green-200 text-green-800 dark:bg-green-950/20 dark:border-green-800 dark:text-green-300' : 'bg-red-50 border border-red-200 text-red-800 dark:bg-red-950/20 dark:border-red-800 dark:text-red-300'}`}>
          {state.message}
        </div>
      )}

      {/* Toggle Preview */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsPreviewMode(!isPreviewMode)}
          className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          {isPreviewMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {isPreviewMode ? 'Masquer l&apos;aperçu' : 'Aperçu'}
        </button>
      </div>

      {isPreviewMode ? (
        /* Mode Aperçu */
        <div className="space-y-6">
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950/20">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              ⚠️ Aperçu du jeu (non sauvegardé)
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
            <h2 className="text-2xl font-bold mb-4">{formData.title}</h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div><strong>Console:</strong> {game.console.name}</div>
              <div><strong>Développeur:</strong> {formData.developer}</div>
              <div><strong>Éditeur:</strong> {formData.publisher}</div>
              <div><strong>Genre:</strong> {formData.genre}</div>
              <div><strong>Année:</strong> {formData.releaseYear}</div>
              <div><strong>Note:</strong> {formData.rating}/20</div>
            </div>
            {formData.description && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-gray-700 dark:text-gray-300">{formData.description}</p>
              </div>
            )}
            {formData.aiEnhancedDescription && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Description enrichie par IA</h3>
                <p className="text-gray-700 dark:text-gray-300">{formData.aiEnhancedDescription}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Mode Édition */
        <form action={handleSubmit} className="space-y-6">
          {/* Informations de base */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
            <h3 className="text-lg font-semibold mb-4">Informations de base</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-900 dark:text-white">
                  Titre du jeu
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
                />
              </div>

              <div>
                <label htmlFor="developer" className="block text-sm font-medium text-gray-900 dark:text-white">
                  Développeur
                </label>
                <input
                  type="text"
                  id="developer"
                  name="developer"
                  value={formData.developer}
                  onChange={(e) => handleChange('developer', e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
                />
              </div>

              <div>
                <label htmlFor="publisher" className="block text-sm font-medium text-gray-900 dark:text-white">
                  Éditeur
                </label>
                <input
                  type="text"
                  id="publisher"
                  name="publisher"
                  value={formData.publisher}
                  onChange={(e) => handleChange('publisher', e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
                />
              </div>

              <div>
                <label htmlFor="genre" className="block text-sm font-medium text-gray-900 dark:text-white">
                  Genre
                </label>
                <input
                  type="text"
                  id="genre"
                  name="genre"
                  value={formData.genre}
                  onChange={(e) => handleChange('genre', e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
                />
              </div>

              <div>
                <label htmlFor="releaseYear" className="block text-sm font-medium text-gray-900 dark:text-white">
                  Année de sortie
                </label>
                <input
                  type="number"
                  id="releaseYear"
                  name="releaseYear"
                  value={formData.releaseYear}
                  onChange={(e) => handleChange('releaseYear', parseInt(e.target.value) || '')}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
                />
              </div>

              <div>
                <label htmlFor="rating" className="block text-sm font-medium text-gray-900 dark:text-white">
                  Note (/20)
                </label>
                <input
                  type="number"
                  id="rating"
                  name="rating"
                  min="0"
                  max="20"
                  step="0.1"
                  value={formData.rating}
                  onChange={(e) => handleChange('rating', parseFloat(e.target.value) || '')}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
                />
              </div>

              <div>
                <label htmlFor="playerCount" className="block text-sm font-medium text-gray-900 dark:text-white">
                  Nombre de joueurs
                </label>
                <input
                  type="text"
                  id="playerCount"
                  name="playerCount"
                  value={formData.playerCount}
                  onChange={(e) => handleChange('playerCount', e.target.value)}
                  placeholder="Ex: 1-2 joueurs"
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="topStaff"
                  name="topStaff"
                  checked={formData.topStaff}
                  onChange={(e) => handleChange('topStaff', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="topStaff" className="ml-2 block text-sm text-gray-900 dark:text-white">
                  Recommandation staff (Top Staff)
                </label>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
            <label htmlFor="description" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
              placeholder="Description du jeu..."
            />
          </div>

          {/* Contenu éditorial enrichi */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
            <h3 className="text-lg font-semibold mb-4">Contenu éditorial enrichi</h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="aiEnhancedDescription" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Description enrichie par IA
                </label>
                <textarea
                  id="aiEnhancedDescription"
                  name="aiEnhancedDescription"
                  rows={4}
                  value={formData.aiEnhancedDescription}
                  onChange={(e) => handleChange('aiEnhancedDescription', e.target.value)}
                  className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
                  placeholder="Description enrichie et détaillée du jeu..."
                />
              </div>

              <div>
                <label htmlFor="gameplayAnalysis" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Analyse du gameplay
                </label>
                <textarea
                  id="gameplayAnalysis"
                  name="gameplayAnalysis"
                  rows={4}
                  value={formData.gameplayAnalysis}
                  onChange={(e) => handleChange('gameplayAnalysis', e.target.value)}
                  className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
                  placeholder="Analyse détaillée du gameplay et des mécaniques..."
                />
              </div>

              <div>
                <label htmlFor="historicalSignificance" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Signification historique
                </label>
                <textarea
                  id="historicalSignificance"
                  name="historicalSignificance"
                  rows={4}
                  value={formData.historicalSignificance}
                  onChange={(e) => handleChange('historicalSignificance', e.target.value)}
                  className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
                  placeholder="Importance du jeu dans l'histoire du jeu vidéo..."
                />
              </div>

              <div>
                <label htmlFor="developmentStory" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Histoire du développement
                </label>
                <textarea
                  id="developmentStory"
                  name="developmentStory"
                  rows={4}
                  value={formData.developmentStory}
                  onChange={(e) => handleChange('developmentStory', e.target.value)}
                  className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
                  placeholder="Histoire du développement, anecdotes, défis..."
                />
              </div>

              <div>
                <label htmlFor="legacyImpact" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Impact et héritage
                </label>
                <textarea
                  id="legacyImpact"
                  name="legacyImpact"
                  rows={4}
                  value={formData.legacyImpact}
                  onChange={(e) => handleChange('legacyImpact', e.target.value)}
                  className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
                  placeholder="Impact du jeu sur l'industrie, influence sur d'autres jeux..."
                />
              </div>
            </div>
          </div>

          {/* Screenshots */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Screenshots</h3>
              <button
                type="button"
                onClick={addScreenshot}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Ajouter
              </button>
            </div>
            
            <div className="space-y-3">
              {screenshots.map((screenshot, index) => (
                <div key={index} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={screenshot}
                    onChange={(e) => updateScreenshot(index, e.target.value)}
                    placeholder="URL de la capture d'écran"
                    className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
                  />
                  {screenshot && (
                    <a
                      href={screenshot}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => removeScreenshot(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {screenshots.length === 0 && (
                <p className="text-sm text-gray-500">Aucune capture d&apos;écran ajoutée</p>
              )}
            </div>
          </div>

          {/* Spécifications techniques */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
            <h3 className="text-lg font-semibold mb-4">Spécifications techniques</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="resolution" className="block text-sm font-medium text-gray-900 dark:text-white">
                  Résolution
                </label>
                <input
                  type="text"
                  id="resolution"
                  name="resolution"
                  value={formData.resolution}
                  onChange={(e) => handleChange('resolution', e.target.value)}
                  placeholder="Ex: 320x224"
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
                />
              </div>

              <div>
                <label htmlFor="rotation" className="block text-sm font-medium text-gray-900 dark:text-white">
                  Rotation écran
                </label>
                <select
                  id="rotation"
                  name="rotation"
                  value={formData.rotation}
                  onChange={(e) => handleChange('rotation', e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Sélectionner...</option>
                  <option value="0">0° (horizontal)</option>
                  <option value="90">90° (vertical)</option>
                  <option value="180">180°</option>
                  <option value="270">270°</option>
                </select>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsPreviewMode(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <Eye className="h-4 w-4" />
              Aperçu
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {isPending ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}