import Link from "next/link"
import Image from "next/image"
import type { Console, ConsoleMedia } from "@prisma/client"

interface ConsoleWithMedias extends Console {
  medias?: ConsoleMedia[]
}

interface ConsoleCardProps {
  console: ConsoleWithMedias
}

export default function ConsoleCard({ console }: ConsoleCardProps) {
  return (
    <Link href={`/consoles/${console.slug}`} className="group block">
      <article className="overflow-hidden rounded-lg border border-gray-200 bg-white transition-all duration-200 hover:border-gray-300 hover:shadow-sm dark:border-gray-800 dark:bg-gray-950 dark:hover:border-gray-700">
        {/* Image */}
        <div className="aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-gray-800">
          <Image 
            src={console.image || "/placeholder.svg"} 
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
