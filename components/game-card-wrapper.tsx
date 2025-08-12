'use client'

import { Suspense } from 'react'
import GameCard from './game-card'
import type { Game } from "@prisma/client"

interface GameWithConsole extends Game {
  console?: {
    name: string
    slug: string
  }
  medias?: Array<{
    mediaType: string
    region: string
    localPath: string | null
  }>
}

interface SearchGameResult {
  id: string
  slug: string
  title: string
  rating: number | null
  releaseYear: number | null
  genre: string | null
  playerCount: string | null
  topStaff: boolean
  image: string | null
  console: {
    name: string
    slug: string
  } | null
  medias: Array<{
    mediaType: string
    region: string
    localPath: string | null
  }>
}

interface GameCardWrapperProps {
  game: GameWithConsole | SearchGameResult
  showConsole?: boolean
}

export default function GameCardWrapper({ game, showConsole = true }: GameCardWrapperProps) {
  return (
    <Suspense fallback={
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
        <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-800 animate-pulse" />
        <div className="p-4 space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
        </div>
      </div>
    }>
      <GameCard game={game} showConsole={showConsole} />
    </Suspense>
  )
}