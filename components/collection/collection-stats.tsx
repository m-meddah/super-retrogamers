"use client"

import { UserCollectionStats } from '@prisma/client'
import { GamepadIcon, TrophyIcon, StarIcon, EuroIcon } from 'lucide-react'

interface CollectionStatsProps {
  stats: UserCollectionStats | null
}

export default function CollectionStats({ stats }: CollectionStatsProps) {
  if (!stats) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const statCards = [
    {
      title: 'Consoles',
      value: stats.totalConsoles,
      subtitle: `${stats.rareConsoles} rares`,
      icon: GamepadIcon,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20'
    },
    {
      title: 'Jeux',
      value: stats.totalGames,
      subtitle: `${stats.completedGames} terminés`,
      icon: TrophyIcon,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-950/20'
    },
    {
      title: 'Articles rares',
      value: stats.rareConsoles + stats.rareGames,
      subtitle: 'Objets de collection',
      icon: StarIcon,
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-50 dark:bg-yellow-950/20'
    },
    {
      title: 'Valeur totale',
      value: `${Math.round(stats.totalValue)}€`,
      subtitle: 'Estimation',
      icon: EuroIcon,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-950/20'
    }
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {statCards.map((card, index) => {
        const IconComponent = card.icon
        return (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 transition-transform hover:scale-105"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {card.title}
              </h3>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <IconComponent className={`h-4 w-4 ${card.color}`} />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {card.value}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {card.subtitle}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}