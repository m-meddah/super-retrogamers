"use client"

import { useState, useMemo } from "react"
import { Search, X } from "lucide-react"
import ConsoleCard from "@/components/console-card"
import type { Console } from "@prisma/client"

interface ConsoleSearchProps {
  consoles: Console[]
}

export default function ConsoleSearch({ consoles }: ConsoleSearchProps) {
  const [searchQuery, setSearchQuery] = useState("")

  // Filtrer les consoles basé sur la recherche
  const filteredConsoles = useMemo(() => {
    if (!searchQuery.trim()) {
      return consoles
    }

    const query = searchQuery.toLowerCase().trim()
    return consoles.filter(console => 
      console.name.toLowerCase().includes(query) ||
      console.manufacturer.toLowerCase().includes(query)
    )
  }, [consoles, searchQuery])

  const clearSearch = () => {
    setSearchQuery("")
  }

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="mx-auto max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une console..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white pl-10 pr-10 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:placeholder-gray-400"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Results Count */}
      <div className="text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {searchQuery ? (
            <>
              {filteredConsoles.length} résultat{filteredConsoles.length > 1 ? 's' : ''} pour &ldquo;{searchQuery}&rdquo;
            </>
          ) : (
            <>
              {consoles.length} console{consoles.length > 1 ? 's' : ''} disponible{consoles.length > 1 ? 's' : ''}
            </>
          )}
        </p>
      </div>

      {/* Console Grid */}
      {filteredConsoles.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredConsoles.map((console) => (
            <ConsoleCard key={console.id} console={console} />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <Search className="h-8 w-8 text-gray-400" />
          </div>
          {searchQuery ? (
            <>
              <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                Aucun résultat trouvé
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Aucune console ne correspond à votre recherche &ldquo;{searchQuery}&rdquo;.
              </p>
              <button
                onClick={clearSearch}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                <X className="h-4 w-4" />
                Effacer la recherche
              </button>
            </>
          ) : (
            <>
              <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                Aucune console disponible
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Les consoles seront bientôt ajoutées à notre collection.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}