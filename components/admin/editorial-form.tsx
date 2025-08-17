"use client"

import { useState, useTransition, useActionState } from 'react'
import { Save, Eye, EyeOff } from 'lucide-react'
import { EditorialArticle } from '@/components/editorial-article'
import { updateConsoleEditorialAction } from '@/lib/actions/admin-scraping-actions'
import type { Console } from '@prisma/client'

interface EditorialFormProps {
  console: Console
}

export function EditorialForm({ console }: EditorialFormProps) {
  const [isPending, startTransition] = useTransition()
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [formData, setFormData] = useState({
    editorialTitle: console.editorialTitle || '',
    editorialAuthor: console.editorialAuthor || '',
    editorialContent: console.editorialContent || '',
  })
  
  const [editorialState, editorialAction] = useActionState(updateConsoleEditorialAction, { success: false })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const formDataObj = new FormData()
    formDataObj.set('slug', console.slug)
    formDataObj.set('editorialTitle', formData.editorialTitle)
    formDataObj.set('editorialAuthor', formData.editorialAuthor)
    formDataObj.set('editorialContent', formData.editorialContent)
    if (formData.editorialContent) {
      formDataObj.set('editorialPublishedAt', new Date().toISOString())
    }
    
    startTransition(() => {
      editorialAction(formDataObj)
    })
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const previewConsole = {
    ...console,
    ...formData,
    editorialPublishedAt: new Date(),
  }

  return (
    <div className="space-y-6">
      {/* Messages de feedback */}
      {editorialState.success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/20">
          <p className="text-sm text-green-800 dark:text-green-300">
            ✅ {editorialState.message}
          </p>
        </div>
      )}
      
      {editorialState.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/20">
          <p className="text-sm text-red-800 dark:text-red-300">
            ❌ {editorialState.error}
          </p>
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
          {isPreviewMode ? 'Masquer l\'aperçu' : 'Aperçu'}
        </button>
      </div>

      {isPreviewMode ? (
        /* Mode Aperçu */
        <div className="space-y-6">
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950/20">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              ⚠️ Aperçu de l&apos;article (non sauvegardé)
            </p>
          </div>
          <EditorialArticle console={previewConsole} />
        </div>
      ) : (
        /* Mode Édition */
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Titre de l'article */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
            <label htmlFor="editorialTitle" className="block text-sm font-medium text-gray-900 dark:text-white">
              Titre de l&apos;article
            </label>
            <input
              type="text"
              id="editorialTitle"
              value={formData.editorialTitle}
              onChange={(e) => handleChange('editorialTitle', e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
              placeholder="Ex: 🌟 La Neo Geo AES : La Rolls-Royce des Consoles de Jeu"
            />
          </div>

          {/* Auteur */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
            <label htmlFor="editorialAuthor" className="block text-sm font-medium text-gray-900 dark:text-white">
              Auteur
            </label>
            <input
              type="text"
              id="editorialAuthor"
              value={formData.editorialAuthor}
              onChange={(e) => handleChange('editorialAuthor', e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
              placeholder="Nom de l'auteur"
            />
          </div>

          {/* Contenu */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
            <label htmlFor="editorialContent" className="block text-sm font-medium text-gray-900 dark:text-white">
              Contenu de l&apos;article (Markdown)
            </label>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Vous pouvez utiliser Markdown pour formater votre texte : **gras**, *italique*, # Titre, etc.
            </p>
            <textarea
              id="editorialContent"
              rows={20}
              value={formData.editorialContent}
              onChange={(e) => handleChange('editorialContent', e.target.value)}
              className="mt-2 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
              placeholder="Rédigez votre article en Markdown..."
            />
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