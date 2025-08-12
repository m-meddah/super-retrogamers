"use client"

import { useState, Suspense } from 'react'
import CollectionItem from './collection-item'
import { Search, Filter, Grid, List } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useQueryState, parseAsBoolean } from 'nuqs'
import type { UserConsoleCollection, UserGameCollection } from '@prisma/client'

type CollectionItemType = UserConsoleCollection | UserGameCollection

interface CollectionGridProps {
  items: CollectionItemType[]
  type: 'console' | 'game'
  isLoading?: boolean
  onSearch?: (query: string) => void
  onEdit?: (item: CollectionItemType) => void
  onDelete?: (item: CollectionItemType) => void
}

function CollectionGridContent({ 
  items, 
  type, 
  isLoading = false,
  onSearch,
  onEdit,
  onDelete 
}: CollectionGridProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useQueryState('filters', parseAsBoolean.withDefault(false))
  const [conditionFilter, setConditionFilter] = useQueryState('condition', { defaultValue: 'all' })
  const [statusFilter, setStatusFilter] = useQueryState('status', { defaultValue: 'all' })
  const [priceFilter, setPriceFilter] = useQueryState('price', { defaultValue: 'all' })

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    onSearch?.(query)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Search skeleton */}
        <div className="flex gap-4">
          <div className="flex-1 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
          <div className="h-10 w-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
        </div>
        
        {/* Grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="aspect-[4/3] bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3 animate-pulse"></div>
                <div className="flex gap-2">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search and Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder={`Rechercher dans vos ${type === 'console' ? 'consoles' : 'jeux'}...`}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              showFilters
                ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/20 dark:border-blue-800 dark:text-blue-400'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filtres</span>
          </button>
          
          <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                État
              </label>
              <Select value={conditionFilter} onValueChange={setConditionFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Tous les états" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les états</SelectItem>
                  <SelectItem value="SEALED">Neuf sous blister</SelectItem>
                  <SelectItem value="MINT">Parfait état</SelectItem>
                  <SelectItem value="CIB">Complete In Box</SelectItem>
                  <SelectItem value="LOOSE">Sans boîte</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Statut
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="OWNED">Possédé</SelectItem>
                  <SelectItem value="WANTED">Recherché</SelectItem>
                  <SelectItem value="FOR_SALE">À vendre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Prix
              </label>
              <Select value={priceFilter} onValueChange={setPriceFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Toutes les gammes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les gammes</SelectItem>
                  <SelectItem value="0-50">0 - 50€</SelectItem>
                  <SelectItem value="50-100">50 - 100€</SelectItem>
                  <SelectItem value="100-200">100 - 200€</SelectItem>
                  <SelectItem value="200+">200€+</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Items Grid/List */}
      {items.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-24 w-24 text-gray-300 dark:text-gray-600 mb-4">
            {type === 'console' ? (
              <svg fill="currentColor" viewBox="0 0 24 24">
                <path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4-3c-.83 0-1.5-.67-1.5-1.5S18.67 9 19.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
              </svg>
            ) : (
              <svg fill="currentColor" viewBox="0 0 24 24">
                <path d="M18 4H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM6 6h5v5H6V6zm0 7h5v5H6v-5zm7-7h5v5h-5V6zm0 7h5v5h-5v-5z"/>
              </svg>
            )}
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Aucun {type === 'console' ? 'console' : 'jeu'} dans votre collection
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Commencez à construire votre collection en ajoutant vos premiers éléments.
          </p>
        </div>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            : "space-y-4"
        }>
          {items.map((item) => (
            <CollectionItem
              key={item.id}
              item={item}
              type={type}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

      {/* Load More */}
      {items.length > 0 && items.length % 20 === 0 && (
        <div className="text-center">
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Charger plus
          </button>
        </div>
      )}
    </div>
  )
}

export default function CollectionGrid(props: CollectionGridProps) {
  return (
    <Suspense fallback={<div className="text-center py-8">Chargement...</div>}>
      <CollectionGridContent {...props} />
    </Suspense>
  )
}