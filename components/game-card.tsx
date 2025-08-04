import Link from "next/link"
import Image from "next/image"
import { Star } from "lucide-react"
import type { Game } from "@prisma/client"

interface GameWithConsole extends Game {
  console?: {
    name: string
  }
}

interface GameCardProps {
  game: GameWithConsole
  showConsole?: boolean
}

export default function GameCard({ game, showConsole = true }: GameCardProps) {
  return (
    <Link href={`/jeux/${game.slug}`} className="group block">
      <article className="overflow-hidden rounded-lg border border-gray-200 bg-white transition-all duration-200 hover:border-gray-300 hover:shadow-sm dark:border-gray-800 dark:bg-gray-950 dark:hover:border-gray-700">
        {/* Image */}
        <div className="aspect-[3/4] overflow-hidden bg-gray-100 dark:bg-gray-800">
          <Image 
            src={game.image || "/placeholder.svg"} 
            alt={game.title}
            width={300}
            height={400}
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
        </div>
        
        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-base font-medium text-gray-900 dark:text-white line-clamp-2 leading-tight">
              {game.title}
            </h3>
            {game.rating && (
              <div className="flex items-center gap-1 shrink-0">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  {game.rating}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500 mb-2">
            {game.genre && <span>{game.genre}</span>}
            {game.genre && game.releaseYear && <span>•</span>}
            {game.releaseYear && <span>{game.releaseYear}</span>}
          </div>
          
          {showConsole && game.console?.name && (
            <span className="inline-block rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300 mb-2">
              {game.console.name}
            </span>
          )}
          
          {game.description && (
            <p className="text-sm text-gray-500 dark:text-gray-500 line-clamp-2 leading-relaxed">
              {game.description}
            </p>
          )}
        </div>
      </article>
    </Link>
  )
}
