"use client"

import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import { CollectionStatus, ItemCondition } from '@prisma/client'

interface CollectionData {
  status: CollectionStatus
  condition?: ItemCondition
  purchaseDate?: string
  purchasePrice?: number
  notes?: string
  isComplete?: boolean
  hasBox?: boolean
  hasManual?: boolean
}

interface AddToCollectionModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (data: CollectionData) => void
  type: 'console' | 'game'
  item?: {
    id: string
    name?: string
    title?: string
    [key: string]: unknown
  }
}

const conditionOptions = [
  { value: 'SEALED', label: 'Neuf sous blister' },
  { value: 'MINT', label: 'Parfait état' },
  { value: 'NEAR_MINT', label: 'Quasi parfait' },
  { value: 'VERY_GOOD', label: 'Très bon état' },
  { value: 'GOOD', label: 'Bon état' },
  { value: 'FAIR', label: 'État moyen' },
  { value: 'POOR', label: 'Mauvais état' },
  { value: 'LOOSE', label: 'Sans boîte' },
  { value: 'CIB', label: 'Complete In Box' },
  { value: 'CART_ONLY', label: 'Cartouche seule' },
  { value: 'DISC_ONLY', label: 'Disque seul' }
]

const statusOptions = [
  { value: 'OWNED', label: 'Possédé' },
  { value: 'WANTED', label: 'Recherché' },
  { value: 'FOR_SALE', label: 'À vendre' },
  { value: 'LOANED', label: 'Prêté' }
]

export default function AddToCollectionModal({ 
  isOpen, 
  onClose, 
  onAdd, 
  type
}: AddToCollectionModalProps) {
  const [formData, setFormData] = useState({
    status: 'OWNED' as CollectionStatus,
    condition: '' as ItemCondition | '',
    purchaseDate: '',
    purchasePrice: '',
    currentValue: '',
    notes: '',
    isComplete: false,
    hasBox: false,
    hasManual: false,
    hasCables: type === 'console',
    hasControllers: type === 'console',
    controllersCount: 0,
    hasMap: type === 'game',
    isCompleted: type === 'game',
    hoursPlayed: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const data = {
      ...formData,
      purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : undefined,
      currentValue: formData.currentValue ? parseFloat(formData.currentValue) : undefined,
      purchaseDate: formData.purchaseDate || undefined,
      hoursPlayed: formData.hoursPlayed ? parseInt(formData.hoursPlayed) : undefined,
      condition: formData.condition || undefined
    }

    onAdd(data)
    onClose()
    
    // Reset form
    setFormData({
      status: 'OWNED',
      condition: '',
      purchaseDate: '',
      purchasePrice: '',
      currentValue: '',
      notes: '',
      isComplete: false,
      hasBox: false,
      hasManual: false,
      hasCables: type === 'console',
      hasControllers: type === 'console',
      controllersCount: 0,
      hasMap: type === 'game',
      isCompleted: type === 'game',
      hoursPlayed: ''
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Ajouter à ma collection
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Statut
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as CollectionStatus })}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                required
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                État
              </label>
              <select
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value as ItemCondition })}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">Choisir un état</option>
                {conditionOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Purchase Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date d&apos;achat
              </label>
              <input
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Prix payé (€)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.purchasePrice}
                onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Valeur actuelle (€)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.currentValue}
                onChange={(e) => setFormData({ ...formData, currentValue: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Physical Details */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Éléments possédés
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.hasBox}
                  onChange={(e) => setFormData({ ...formData, hasBox: e.target.checked })}
                  className="rounded border-gray-300 dark:border-gray-600 mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Boîte</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.hasManual}
                  onChange={(e) => setFormData({ ...formData, hasManual: e.target.checked })}
                  className="rounded border-gray-300 dark:border-gray-600 mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Manuel</span>
              </label>

              {type === 'console' && (
                <>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.hasCables}
                      onChange={(e) => setFormData({ ...formData, hasCables: e.target.checked })}
                      className="rounded border-gray-300 dark:border-gray-600 mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Câbles</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.hasControllers}
                      onChange={(e) => setFormData({ ...formData, hasControllers: e.target.checked })}
                      className="rounded border-gray-300 dark:border-gray-600 mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Manettes</span>
                  </label>
                </>
              )}

              {type === 'game' && (
                <>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.hasMap}
                      onChange={(e) => setFormData({ ...formData, hasMap: e.target.checked })}
                      className="rounded border-gray-300 dark:border-gray-600 mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Carte/Guide</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isCompleted}
                      onChange={(e) => setFormData({ ...formData, isCompleted: e.target.checked })}
                      className="rounded border-gray-300 dark:border-gray-600 mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Terminé</span>
                  </label>
                </>
              )}

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isComplete}
                  onChange={(e) => setFormData({ ...formData, isComplete: e.target.checked })}
                  className="rounded border-gray-300 dark:border-gray-600 mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Complet (CIB)</span>
              </label>
            </div>
          </div>

          {/* Game-specific fields */}
          {type === 'game' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Heures jouées
              </label>
              <input
                type="number"
                value={formData.hoursPlayed}
                onChange={(e) => setFormData({ ...formData, hoursPlayed: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="0"
              />
            </div>
          )}

          {/* Console-specific fields */}
          {type === 'console' && formData.hasControllers && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre de manettes
              </label>
              <input
                type="number"
                min="0"
                value={formData.controllersCount}
                onChange={(e) => setFormData({ ...formData, controllersCount: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="1"
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes personnelles
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="Notes, observations, état spécifique..."
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Ajouter à ma collection
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}