"use client"

import { useState, useTransition } from 'react'
import { Save, Eye, EyeOff } from 'lucide-react'
import type { Console, Generation, Game } from '@prisma/client'
import { updateConsoleEnhancedAction } from '@/lib/actions/console-actions'
import { useActionState } from 'react'

interface EnhancedConsoleEditorialFormProps {
  console: Console & { 
    generation?: Generation | null
    bestSellingGame?: Game | null
    games?: Game[]
  }
  generations: Generation[]
  games: Game[]
}

export function EnhancedConsoleEditorialForm({ 
  console: consoleData, 
  generations,
  games
}: EnhancedConsoleEditorialFormProps) {
  const [isPending, startTransition] = useTransition()
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [state, formAction] = useActionState(updateConsoleEnhancedAction, { success: false, message: '' } as { success: boolean; message: string })
  
  const [formData, setFormData] = useState({
    name: consoleData.name || '',
    manufacturer: consoleData.manufacturer || '',
    releaseYear: consoleData.releaseYear || '',
    description: consoleData.description || '',
    cpu: consoleData.cpu || '',
    memory: consoleData.memory || '',
    graphics: consoleData.graphics || '',
    aiEnhancedDescription: consoleData.aiEnhancedDescription || '',
    historicalContext: consoleData.historicalContext || '',
    technicalAnalysis: consoleData.technicalAnalysis || '',
    culturalImpact: consoleData.culturalImpact || '',
    editorialContent: consoleData.editorialContent || '',
    editorialTitle: consoleData.editorialTitle || '',
    editorialAuthor: consoleData.editorialAuthor || '',
    // Nouveaux champs
    generationId: consoleData.generationId || '',
    unitsSold: consoleData.unitsSold || '',
    bestSellingGameId: consoleData.bestSellingGameId || '',
    dimensions: consoleData.dimensions || '',
    media: consoleData.media || '',
    coProcessor: consoleData.coProcessor || '',
    audioChip: consoleData.audioChip || ''})

  const handleSubmit = async (formDataSubmit: FormData) => {
    formDataSubmit.append('consoleId', consoleData.id)
    
    startTransition(() => {
      formAction(formDataSubmit)
    })
  }

  const handleChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const selectedGeneration = generations.find(g => g.id === formData.generationId)
  const selectedBestSellingGame = games.find(g => g.id === formData.bestSellingGameId)

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
              ⚠️ Aperçu de la console (non sauvegardé)
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
            <h2 className="text-2xl font-bold mb-4">{formData.name}</h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div><strong>Fabricant:</strong> {formData.manufacturer}</div>
              <div><strong>Année:</strong> {formData.releaseYear}</div>
              <div><strong>Génération:</strong> {selectedGeneration?.name || 'Aucune'}</div>
              <div><strong>Unités vendues:</strong> {formData.unitsSold ? formData.unitsSold.toLocaleString() : 'N/A'}</div>
              <div><strong>Meilleur jeu:</strong> {selectedBestSellingGame?.title || 'Aucun'}</div>
              <div><strong>Support:</strong> {formData.media || 'N/A'}</div>
            </div>
            {formData.description && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-gray-700 dark:text-gray-300">{formData.description}</p>
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
                <label htmlFor="name" className="block text-sm font-medium text-gray-900 dark:text-white">
                  Nom de la console
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
                />
              </div>

              <div>
                <label htmlFor="manufacturer" className="block text-sm font-medium text-gray-900 dark:text-white">
                  Fabricant
                </label>
                <input
                  type="text"
                  id="manufacturer"
                  name="manufacturer"
                  value={formData.manufacturer}
                  onChange={(e) => handleChange('manufacturer', e.target.value)}
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
                <label htmlFor="unitsSold" className="block text-sm font-medium text-gray-900 dark:text-white">
                  Unités vendues
                </label>
                <input
                  type="number"
                  id="unitsSold"
                  name="unitsSold"
                  value={formData.unitsSold}
                  onChange={(e) => handleChange('unitsSold', parseInt(e.target.value) || '')}
                  placeholder="Ex: 62000000"
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
                />
              </div>

              <div>
                <label htmlFor="media" className="block text-sm font-medium text-gray-900 dark:text-white">
                  Type de support
                </label>
                <input
                  type="text"
                  id="media"
                  name="media"
                  value={formData.media}
                  onChange={(e) => handleChange('media', e.target.value)}
                  placeholder="Ex: Cartridge, CD-ROM, DVD"
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
                />
              </div>

              <div>
                <label htmlFor="dimensions" className="block text-sm font-medium text-gray-900 dark:text-white">
                  Dimensions
                </label>
                <input
                  type="text"
                  id="dimensions"
                  name="dimensions"
                  value={formData.dimensions}
                  onChange={(e) => handleChange('dimensions', e.target.value)}
                  placeholder="Ex: 25.6cm × 21.6cm × 7.9cm"
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
                />
              </div>
            </div>
          </div>

          {/* Relations et Classifications */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
            <h3 className="text-lg font-semibold mb-4">Relations et Classifications</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Génération */}
              <div>
                <label htmlFor="generationId" className="block text-sm font-medium text-gray-900 dark:text-white">
                  Génération de console
                </label>
                <select
                  id="generationId"
                  name="generationId"
                  value={formData.generationId}
                  onChange={(e) => handleChange('generationId', e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Sélectionner une génération...</option>
                  {generations.map((generation) => (
                    <option key={generation.id} value={generation.id}>
                      {generation.name} ({generation.startYear}-{generation.endYear || 'présent'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Meilleur jeu */}
              <div>
                <label htmlFor="bestSellingGameId" className="block text-sm font-medium text-gray-900 dark:text-white">
                  Meilleur jeu de la console
                </label>
                <select
                  id="bestSellingGameId"
                  name="bestSellingGameId"
                  value={formData.bestSellingGameId}
                  onChange={(e) => handleChange('bestSellingGameId', e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Sélectionner un jeu...</option>
                  {games.map((game) => (
                    <option key={game.id} value={game.id}>
                      {game.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Spécifications techniques */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
            <h3 className="text-lg font-semibold mb-4">Spécifications techniques</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="cpu" className="block text-sm font-medium text-gray-900 dark:text-white">
                  Processeur (CPU)
                </label>
                <input
                  type="text"
                  id="cpu"
                  name="cpu"
                  value={formData.cpu}
                  onChange={(e) => handleChange('cpu', e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
                />
              </div>

              <div>
                <label htmlFor="coProcessor" className="block text-sm font-medium text-gray-900 dark:text-white">
                  Co-processeur
                </label>
                <input
                  type="text"
                  id="coProcessor"
                  name="coProcessor"
                  value={formData.coProcessor}
                  onChange={(e) => handleChange('coProcessor', e.target.value)}
                  placeholder="Ex: PPU, DSP"
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
                />
              </div>

              <div>
                <label htmlFor="memory" className="block text-sm font-medium text-gray-900 dark:text-white">
                  Mémoire (RAM)
                </label>
                <input
                  type="text"
                  id="memory"
                  name="memory"
                  value={formData.memory}
                  onChange={(e) => handleChange('memory', e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
                />
              </div>

              <div>
                <label htmlFor="graphics" className="block text-sm font-medium text-gray-900 dark:text-white">
                  Puce graphique (GPU)
                </label>
                <input
                  type="text"
                  id="graphics"
                  name="graphics"
                  value={formData.graphics}
                  onChange={(e) => handleChange('graphics', e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
                />
              </div>

              <div>
                <label htmlFor="audioChip" className="block text-sm font-medium text-gray-900 dark:text-white">
                  Puce audio
                </label>
                <input
                  type="text"
                  id="audioChip"
                  name="audioChip"
                  value={formData.audioChip}
                  onChange={(e) => handleChange('audioChip', e.target.value)}
                  placeholder="Ex: AY-3-8910, YM2612"
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
                />
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
              placeholder="Description de la console..."
            />
          </div>

          {/* Contenu éditorial enrichi */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
            <h3 className="text-lg font-semibold mb-4">Contenu éditorial enrichi</h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="editorialTitle" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Titre éditorial
                </label>
                <input
                  type="text"
                  id="editorialTitle"
                  name="editorialTitle"
                  value={formData.editorialTitle}
                  onChange={(e) => handleChange('editorialTitle', e.target.value)}
                  className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
                  placeholder="Titre de l'article éditorial..."
                />
              </div>

              <div>
                <label htmlFor="editorialAuthor" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Auteur éditorial
                </label>
                <input
                  type="text"
                  id="editorialAuthor"
                  name="editorialAuthor"
                  value={formData.editorialAuthor}
                  onChange={(e) => handleChange('editorialAuthor', e.target.value)}
                  className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
                  placeholder="Nom de l'auteur..."
                />
              </div>

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
                  placeholder="Description enrichie et détaillée de la console..."
                />
              </div>

              <div>
                <label htmlFor="historicalContext" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Contexte historique
                </label>
                <textarea
                  id="historicalContext"
                  name="historicalContext"
                  rows={4}
                  value={formData.historicalContext}
                  onChange={(e) => handleChange('historicalContext', e.target.value)}
                  className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
                  placeholder="Contexte historique et époque de sortie..."
                />
              </div>

              <div>
                <label htmlFor="technicalAnalysis" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Analyse technique
                </label>
                <textarea
                  id="technicalAnalysis"
                  name="technicalAnalysis"
                  rows={4}
                  value={formData.technicalAnalysis}
                  onChange={(e) => handleChange('technicalAnalysis', e.target.value)}
                  className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
                  placeholder="Analyse des spécifications techniques..."
                />
              </div>

              <div>
                <label htmlFor="culturalImpact" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Impact culturel
                </label>
                <textarea
                  id="culturalImpact"
                  name="culturalImpact"
                  rows={4}
                  value={formData.culturalImpact}
                  onChange={(e) => handleChange('culturalImpact', e.target.value)}
                  className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
                  placeholder="Impact de la console sur la culture gaming..."
                />
              </div>

              <div>
                <label htmlFor="editorialContent" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Contenu éditorial complet
                </label>
                <textarea
                  id="editorialContent"
                  name="editorialContent"
                  rows={6}
                  value={formData.editorialContent}
                  onChange={(e) => handleChange('editorialContent', e.target.value)}
                  className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
                  placeholder="Contenu éditorial complet (article de fond)..."
                />
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