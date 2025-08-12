import Link from "next/link"
import Image from "next/image"
import type { Console, ConsoleMedia } from "@prisma/client"
import { getRegionPriorityLowercase } from "@/lib/regional-preferences"

interface ConsoleWithMedias extends Console {
  medias?: ConsoleMedia[]
}

interface ConsoleCardProps {
  console: ConsoleWithMedias
  preferredRegion?: string
}

// Function to get the best available image for the console card
function getBestConsoleImage(console: ConsoleWithMedias, preferredRegion: string = 'fr'): string {
  // Si une image principale existe déjà, la prioriser
  if (console.image) return console.image

  if (!console.medias || console.medias.length === 0) {
    return "/placeholder.svg"
  }
  
  // Types d'images par ordre de priorité pour les consoles
  const imageTypePriority = ['logo-svg', 'wheel', 'photo', 'illustration']
  // Use centralized regional preferences (with 'ss' last)
  const regionPriority = getRegionPriorityLowercase(preferredRegion)
  
  for (const imageType of imageTypePriority) {
    // Filtrer par type de média
    const mediasOfType = console.medias.filter(m => m.type === imageType)
    
    if (mediasOfType.length === 0) continue
    
    // Try each priority region for this type
    for (const region of regionPriority) {
      const media = mediasOfType.find(m => 
        m.region.toLowerCase() === region && 
        m.localPath
      )
      if (media?.localPath) {
        return media.localPath
      }
    }
    
    // If no priority region found, take first available for this type
    const media = mediasOfType.find(m => m.localPath)
    if (media?.localPath) {
      return media.localPath
    }
  }
  
  // Fallback to first available media or placeholder
  const firstMedia = console.medias.find(m => m.localPath)
  return firstMedia?.localPath || "/placeholder.svg"
}

export default function ConsoleCard({ console, preferredRegion = 'fr' }: ConsoleCardProps) {
  const imageUrl = getBestConsoleImage(console, preferredRegion)
  
  return (
    <Link href={`/consoles/${console.slug}`} className="group block">
      <article className="overflow-hidden rounded-lg border border-gray-200 bg-white transition-all duration-200 hover:border-gray-300 hover:shadow-sm dark:border-gray-800 dark:bg-gray-950 dark:hover:border-gray-700">
        {/* Image */}
        <div className="aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-gray-800">
          <Image 
            src={imageUrl} 
            alt={console.name}
            width={400}
            height={300}
            className="h-full w-full object-contain transition-transform duration-200 group-hover:scale-105"
          />
        </div>
        
        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-medium text-gray-900 dark:text-white line-clamp-2 leading-tight">
              {console.name}
            </h3>
            {console.releaseYear && (
              <span className="shrink-0 rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                {console.releaseYear}
              </span>
            )}
          </div>
          
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {console.manufacturer}
          </p>
          
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-500 line-clamp-2 leading-relaxed">
            {console.description}
          </p>
        </div>
      </article>
    </Link>
  )
}
