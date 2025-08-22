"use client"

import ConsoleImageByRegion from './console-image-by-region'
import GameImageByRegion from './game-image-by-region'
import { 
  UserConsoleCollection, 
  UserGameCollection, 
  Console, 
  Game, 
  ConsoleVariant, 
  GameVariant,
  ItemCondition,
  CollectionStatus 
} from '@prisma/client'
import { 
  Calendar, 
  Euro, 
  Package, 
  BookOpen, 
  Settings, 
  Star,
  Trash2,
  Edit3
} from 'lucide-react'

type ConsoleCollectionItem = UserConsoleCollection & {
  console?: Console
  variant?: ConsoleVariant & {
    console: Console
  }
}

type GameCollectionItem = UserGameCollection & {
  game?: Game & {
    console: Console
  }
  variant?: GameVariant & {
    game: Game & {
      console: Console
    }
  }
}

interface CollectionItemProps {
  item: ConsoleCollectionItem | GameCollectionItem
  type: 'console' | 'game'
  onEdit?: (item: ConsoleCollectionItem | GameCollectionItem) => void
  onDelete?: (item: ConsoleCollectionItem | GameCollectionItem) => void
}

const conditionLabels: Record<ItemCondition, string> = {
  SEALED: 'Neuf sous blister',
  MINT: 'Parfait état',
  NEAR_MINT: 'Quasi parfait',
  VERY_GOOD: 'Très bon état',
  GOOD: 'Bon état',
  FAIR: 'État moyen',
  POOR: 'Mauvais état',
  LOOSE: 'Sans boîte',
  CIB: 'Complete In Box',
  BOXED: 'Avec boîte',
  MANUAL_ONLY: 'Manuel seul',
  CART_ONLY: 'Cartouche seule',
  DISC_ONLY: 'Disque seul'
}

const statusLabels: Record<CollectionStatus, string> = {
  OWNED: 'Possédé',
  WANTED: 'Recherché',
  SOLD: 'Vendu',
  LOANED: 'Prêté',
  FOR_SALE: 'À vendre'
}

const conditionColors: Record<ItemCondition, string> = {
  SEALED: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  MINT: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  NEAR_MINT: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  VERY_GOOD: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  GOOD: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  FAIR: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
  POOR: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  LOOSE: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
  CIB: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
  BOXED: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
  MANUAL_ONLY: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
  CART_ONLY: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
  DISC_ONLY: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
}

export default function CollectionItem({ item, type, onEdit, onDelete }: CollectionItemProps) {
  const getDisplayName = () => {
    if (type === 'console') {
      const consoleItem = item as ConsoleCollectionItem
      return consoleItem.variant?.name || consoleItem.console?.name || 'Console inconnue'
    } else {
      const gameItem = item as GameCollectionItem
      return gameItem.variant?.name || gameItem.game?.title || 'Jeu inconnu'
    }
  }


  const getConsoleName = () => {
    if (type === 'console') {
      const consoleItem = item as ConsoleCollectionItem
      return consoleItem.variant?.console?.name || consoleItem.console?.name
    } else {
      const gameItem = item as GameCollectionItem
      return gameItem.variant?.game?.console?.name || gameItem.game?.console?.name
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-transform hover:scale-[1.02]">
      <div className="aspect-[4/3] relative bg-gray-100 dark:bg-gray-700">
        {type === 'console' ? (
          <ConsoleImageByRegion
            console={(item as ConsoleCollectionItem).console}
            variant={(item as ConsoleCollectionItem).variant}
            alt={getDisplayName()}
            className="object-contain p-2"
          />
        ) : (
          <GameImageByRegion
            game={(item as GameCollectionItem).game}
            variant={(item as GameCollectionItem).variant}
            alt={getDisplayName()}
            className="object-cover"
          />
        )}
        <div className="absolute top-2 left-2">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            item.condition ? conditionColors[item.condition] : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
          }`}>
            {item.condition ? conditionLabels[item.condition] : 'Non spécifié'}
          </span>
        </div>
        {item.status !== 'OWNED' && (
          <div className="absolute top-2 right-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
              {statusLabels[item.status]}
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
              {getDisplayName()}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {getConsoleName()}
            </p>
          </div>
          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={() => onEdit?.(item)}
              className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Edit3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete?.(item)}
              className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {/* Physical details */}
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            {item.hasBox && (
              <div className="flex items-center gap-1">
                <Package className="h-3 w-3" />
                <span>Boîte</span>
              </div>
            )}
            {item.hasManual && (
              <div className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                <span>Manuel</span>
              </div>
            )}
            {type === 'console' && (item as ConsoleCollectionItem).hasCables && (
              <div className="flex items-center gap-1">
                <Settings className="h-3 w-3" />
                <span>Câbles</span>
              </div>
            )}
            {type === 'game' && (item as GameCollectionItem).isCompleted && (
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3" />
                <span>Terminé</span>
              </div>
            )}
          </div>

          {/* Price info */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              {item.purchasePrice && (
                <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                  <Euro className="h-3 w-3" />
                  <span>{item.purchasePrice}€ payé</span>
                </div>
              )}
              {item.purchaseDate && (
                <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(item.purchaseDate).toLocaleDateString('fr-FR')}</span>
                </div>
              )}
            </div>
            {item.currentValue && (
              <div className="text-right">
                <span className="font-semibold text-gray-900 dark:text-white">
                  {item.currentValue}€
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 block">
                  valeur actuelle
                </span>
              </div>
            )}
          </div>

          {/* Notes */}
          {item.notes && (
            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
              {item.notes}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}