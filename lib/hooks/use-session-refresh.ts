"use client"

import { useCallback } from 'react'
import { useSession, forceRefreshSession } from '@/lib/auth-client'

/**
 * Custom hook for managing session refresh after database updates
 */
export const useSessionRefresh = () => {
  const { data: session, isPending, error, refetch } = useSession()

  const refreshSessionFromDatabase = useCallback(async () => {
    try {
      // Force refresh from database (bypassing cookie cache)
      await forceRefreshSession()
      // Refetch the session in the current component
      await refetch()
      return true
    } catch (error) {
      console.error('Failed to refresh session:', error)
      return false
    }
  }, [refetch])

  const refreshSession = useCallback(async () => {
    try {
      // Just refetch the session (uses cookie cache if available)
      await refetch()
      return true
    } catch (error) {
      console.error('Failed to refresh session:', error)
      return false
    }
  }, [refetch])

  return {
    session,
    isPending,
    error,
    refreshSession,
    refreshSessionFromDatabase
  }
}