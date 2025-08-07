import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { 
  UserConsoleCollection, 
  UserGameCollection, 
  UserCollectionStats,
  UserWishlist 
} from '@prisma/client'

interface CollectionState {
  // Collections
  consoles: UserConsoleCollection[]
  games: UserGameCollection[]
  wishlist: UserWishlist[]
  stats: UserCollectionStats | null
  
  // Loading states
  loading: {
    consoles: boolean
    games: boolean
    wishlist: boolean
    stats: boolean
  }
  
  // Error states
  errors: {
    consoles: string | null
    games: string | null
    wishlist: string | null
    stats: string | null
  }
}

interface CollectionActions {
  // Set data
  setConsoles: (consoles: UserConsoleCollection[]) => void
  setGames: (games: UserGameCollection[]) => void
  setWishlist: (wishlist: UserWishlist[]) => void
  setStats: (stats: UserCollectionStats | null) => void
  
  // Add items
  addConsole: (console: UserConsoleCollection) => void
  addGame: (game: UserGameCollection) => void
  addToWishlist: (item: UserWishlist) => void
  
  // Remove items
  removeConsole: (consoleId: string) => void
  removeGame: (gameId: string) => void
  removeFromWishlist: (itemId: string) => void
  
  // Update items
  updateConsole: (consoleId: string, updates: Partial<UserConsoleCollection>) => void
  updateGame: (gameId: string, updates: Partial<UserGameCollection>) => void
  
  // Loading states
  setLoading: (key: keyof CollectionState['loading'], loading: boolean) => void
  
  // Error states
  setError: (key: keyof CollectionState['errors'], error: string | null) => void
  
  // Clear all data
  clearCollection: () => void
}

export type CollectionStore = CollectionState & CollectionActions

const initialState: CollectionState = {
  consoles: [],
  games: [],
  wishlist: [],
  stats: null,
  loading: {
    consoles: false,
    games: false,
    wishlist: false,
    stats: false,
  },
  errors: {
    consoles: null,
    games: null,
    wishlist: null,
    stats: null,
  },
}

export const useCollectionStore = create<CollectionStore>()(
  devtools(
    (set) => ({
      ...initialState,

      // Set data actions
      setConsoles: (consoles) =>
        set(
          (state) => ({ ...state, consoles }),
          false,
          'collection/setConsoles'
        ),

      setGames: (games) =>
        set(
          (state) => ({ ...state, games }),
          false,
          'collection/setGames'
        ),

      setWishlist: (wishlist) =>
        set(
          (state) => ({ ...state, wishlist }),
          false,
          'collection/setWishlist'
        ),

      setStats: (stats) =>
        set(
          (state) => ({ ...state, stats }),
          false,
          'collection/setStats'
        ),

      // Add items actions
      addConsole: (console) =>
        set(
          (state) => ({
            ...state,
            consoles: [...state.consoles, console],
          }),
          false,
          'collection/addConsole'
        ),

      addGame: (game) =>
        set(
          (state) => ({
            ...state,
            games: [...state.games, game],
          }),
          false,
          'collection/addGame'
        ),

      addToWishlist: (item) =>
        set(
          (state) => ({
            ...state,
            wishlist: [...state.wishlist, item],
          }),
          false,
          'collection/addToWishlist'
        ),

      // Remove items actions
      removeConsole: (consoleId) =>
        set(
          (state) => ({
            ...state,
            consoles: state.consoles.filter((c) => c.id !== consoleId),
          }),
          false,
          'collection/removeConsole'
        ),

      removeGame: (gameId) =>
        set(
          (state) => ({
            ...state,
            games: state.games.filter((g) => g.id !== gameId),
          }),
          false,
          'collection/removeGame'
        ),

      removeFromWishlist: (itemId) =>
        set(
          (state) => ({
            ...state,
            wishlist: state.wishlist.filter((w) => w.id !== itemId),
          }),
          false,
          'collection/removeFromWishlist'
        ),

      // Update items actions
      updateConsole: (consoleId, updates) =>
        set(
          (state) => ({
            ...state,
            consoles: state.consoles.map((c) =>
              c.id === consoleId ? { ...c, ...updates } : c
            ),
          }),
          false,
          'collection/updateConsole'
        ),

      updateGame: (gameId, updates) =>
        set(
          (state) => ({
            ...state,
            games: state.games.map((g) =>
              g.id === gameId ? { ...g, ...updates } : g
            ),
          }),
          false,
          'collection/updateGame'
        ),

      // Loading states
      setLoading: (key, loading) =>
        set(
          (state) => ({
            ...state,
            loading: { ...state.loading, [key]: loading },
          }),
          false,
          `collection/setLoading/${key}`
        ),

      // Error states
      setError: (key, error) =>
        set(
          (state) => ({
            ...state,
            errors: { ...state.errors, [key]: error },
          }),
          false,
          `collection/setError/${key}`
        ),

      // Clear all data
      clearCollection: () =>
        set(
          initialState,
          false,
          'collection/clearCollection'
        ),
    }),
    {
      name: 'collection-store',
    }
  )
)

// Selectors pour optimiser les re-renders
export const useConsoles = () => useCollectionStore((state) => state.consoles)
export const useGames = () => useCollectionStore((state) => state.games)
export const useWishlist = () => useCollectionStore((state) => state.wishlist)
export const useCollectionStats = () => useCollectionStore((state) => state.stats)
export const useCollectionLoading = () => useCollectionStore((state) => state.loading)
export const useCollectionErrors = () => useCollectionStore((state) => state.errors)