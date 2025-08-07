'use client'

import { useEffect, useCallback } from 'react'
import { useCollectionStore } from '@/lib/stores/collection-store'
import type { Session } from '@/lib/auth'
import { 
  getUserCollectionAction, 
  getUserWishlistAction,
  addConsoleToCollectionAction,
  addGameToCollectionAction,
  removeConsoleFromCollectionAction,
  removeGameFromCollectionAction,
  addToWishlistAction,
  removeFromWishlistAction
} from '@/lib/actions/collection-actions'
import { useAppStore } from '@/lib/stores/app-store'

export function useCollection(session?: Session | null) {
  const isAuthenticated = !!session?.user
  const user = session?.user
  const { addNotification } = useAppStore()
  const {
    consoles,
    games,
    wishlist,
    stats,
    loading,
    errors,
    setConsoles,
    setGames,
    setWishlist,
    setStats,
    addConsole,
    addGame,
    removeConsole,
    removeGame,
    addToWishlist: addToWishlistStore,
    removeFromWishlist: removeFromWishlistStore,
    setLoading,
    setError,
    clearCollection
  } = useCollectionStore()

  const loadCollectionData = useCallback(async () => {
    if (!isAuthenticated) return

    setLoading('consoles', true)
    setLoading('games', true)
    setLoading('stats', true)
    setLoading('wishlist', true)

    try {
      const [collectionResult, wishlistResult] = await Promise.all([
        getUserCollectionAction(),
        getUserWishlistAction()
      ])

      if (collectionResult.success && collectionResult.data) {
        setConsoles(collectionResult.data.consoles.items || [])
        setGames(collectionResult.data.games.items || [])
        setStats(collectionResult.data.stats || null)
        setError('consoles', null)
        setError('games', null)
        setError('stats', null)
      } else {
        setError('consoles', collectionResult.error || 'Erreur lors du chargement')
        setError('games', collectionResult.error || 'Erreur lors du chargement')
        setError('stats', collectionResult.error || 'Erreur lors du chargement')
      }

      if (wishlistResult.success && wishlistResult.data) {
        setWishlist(wishlistResult.data || [])
        setError('wishlist', null)
      } else {
        setError('wishlist', wishlistResult.error || 'Erreur lors du chargement')
      }
    } catch {
      const errorMessage = 'Erreur lors du chargement de la collection'
      setError('consoles', errorMessage)
      setError('games', errorMessage)
      setError('stats', errorMessage)
      setError('wishlist', errorMessage)
    } finally {
      setLoading('consoles', false)
      setLoading('games', false)
      setLoading('stats', false)
      setLoading('wishlist', false)
    }
  }, [isAuthenticated, setLoading, setConsoles, setGames, setWishlist, setStats, setError])

  // Load collection data when user is authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) {
      clearCollection()
      return
    }

    loadCollectionData()
  }, [isAuthenticated, user, clearCollection, loadCollectionData])

  // Console actions
  const addConsoleToCollection = async (data: Parameters<typeof addConsoleToCollectionAction>[0]) => {
    setLoading('consoles', true)
    try {
      const result = await addConsoleToCollectionAction(data)
      if (result.success && result.data) {
        addConsole(result.data)
        addNotification({
          type: 'success',
          title: 'Console ajoutée',
          message: 'La console a été ajoutée à votre collection'
        })
      } else {
        addNotification({
          type: 'error',
          title: 'Erreur',
          message: result.error || 'Impossible d\'ajouter la console'
        })
      }
      return result
    } finally {
      setLoading('consoles', false)
    }
  }

  const removeConsoleFromCollection = async (consoleId: string) => {
    try {
      const result = await removeConsoleFromCollectionAction(consoleId)
      if (result.success) {
        removeConsole(consoleId)
        addNotification({
          type: 'success',
          title: 'Console supprimée',
          message: 'La console a été supprimée de votre collection'
        })
      } else {
        addNotification({
          type: 'error',
          title: 'Erreur',
          message: result.error || 'Impossible de supprimer la console'
        })
      }
      return result
    } catch {
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Une erreur est survenue'
      })
      return { success: false, error: 'Erreur inconnue' }
    }
  }

  // Game actions
  const addGameToCollection = async (data: Parameters<typeof addGameToCollectionAction>[0]) => {
    setLoading('games', true)
    try {
      const result = await addGameToCollectionAction(data)
      if (result.success && result.data) {
        addGame(result.data)
        addNotification({
          type: 'success',
          title: 'Jeu ajouté',
          message: 'Le jeu a été ajouté à votre collection'
        })
      } else {
        addNotification({
          type: 'error',
          title: 'Erreur',
          message: result.error || 'Impossible d\'ajouter le jeu'
        })
      }
      return result
    } finally {
      setLoading('games', false)
    }
  }

  const removeGameFromCollection = async (gameId: string) => {
    try {
      const result = await removeGameFromCollectionAction(gameId)
      if (result.success) {
        removeGame(gameId)
        addNotification({
          type: 'success',
          title: 'Jeu supprimé',
          message: 'Le jeu a été supprimé de votre collection'
        })
      } else {
        addNotification({
          type: 'error',
          title: 'Erreur',
          message: result.error || 'Impossible de supprimer le jeu'
        })
      }
      return result
    } catch {
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Une erreur est survenue'
      })
      return { success: false, error: 'Erreur inconnue' }
    }
  }

  // Wishlist actions
  const addToWishlist = async (data: Parameters<typeof addToWishlistAction>[0]) => {
    setLoading('wishlist', true)
    try {
      const result = await addToWishlistAction(data)
      if (result.success && result.data) {
        addToWishlistStore(result.data)
        addNotification({
          type: 'success',
          title: 'Ajouté à la wishlist',
          message: 'L\'élément a été ajouté à votre liste de souhaits'
        })
      } else {
        addNotification({
          type: 'error',
          title: 'Erreur',
          message: result.error || 'Impossible d\'ajouter à la wishlist'
        })
      }
      return result
    } finally {
      setLoading('wishlist', false)
    }
  }

  const removeFromWishlist = async (wishlistId: string) => {
    try {
      const result = await removeFromWishlistAction(wishlistId)
      if (result.success) {
        removeFromWishlistStore(wishlistId)
        addNotification({
          type: 'success',
          title: 'Supprimé de la wishlist',
          message: 'L\'élément a été supprimé de votre liste de souhaits'
        })
      } else {
        addNotification({
          type: 'error',
          title: 'Erreur',
          message: result.error || 'Impossible de supprimer de la wishlist'
        })
      }
      return result
    } catch {
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Une erreur est survenue'
      })
      return { success: false, error: 'Erreur inconnue' }
    }
  }

  return {
    // Data
    consoles,
    games,
    wishlist,
    stats,
    loading,
    errors,
    
    // Actions
    loadCollectionData,
    addConsoleToCollection,
    removeConsoleFromCollection,
    addGameToCollection,
    removeGameFromCollection,
    addToWishlist,
    removeFromWishlist,
  }
}