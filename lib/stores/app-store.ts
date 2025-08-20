import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}

interface AppState {
  // UI State
  theme: 'light' | 'dark' | 'system'
  sidebarOpen: boolean
  
  // Notifications
  notifications: Notification[]
  
  // Loading states
  globalLoading: boolean
  
  // Search
  searchQuery: string
  searchResults: unknown[]
  searchLoading: boolean
}

interface AppActions {
  // Theme
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  
  // Sidebar
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  
  // Notifications
  addNotification: (notification: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
  
  // Global loading
  setGlobalLoading: (loading: boolean) => void
  
  // Search
  setSearchQuery: (query: string) => void
  setSearchResults: (results: unknown[]) => void
  setSearchLoading: (loading: boolean) => void
  clearSearch: () => void
}

export type AppStore = AppState & AppActions

const initialState: AppState = {
  theme: 'system',
  sidebarOpen: false,
  notifications: [],
  globalLoading: false,
  searchQuery: '',
  searchResults: [],
  searchLoading: false}

export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Theme actions
        setTheme: (theme) =>
          set(
            (state) => ({ ...state, theme }),
            false,
            'app/setTheme'
          ),

        // Sidebar actions
        toggleSidebar: () =>
          set(
            (state) => ({ ...state, sidebarOpen: !state.sidebarOpen }),
            false,
            'app/toggleSidebar'
          ),

        setSidebarOpen: (sidebarOpen) =>
          set(
            (state) => ({ ...state, sidebarOpen }),
            false,
            'app/setSidebarOpen'
          ),

        // Notification actions
        addNotification: (notification) => {
          const id = Math.random().toString(36).substr(2, 9)
          const newNotification = { ...notification, id }

          set(
            (state) => ({
              ...state,
              notifications: [...state.notifications, newNotification]}),
            false,
            'app/addNotification'
          )

          // Auto-remove after duration (default 5s)
          const duration = notification.duration ?? 5000
          if (duration > 0) {
            setTimeout(() => {
              get().removeNotification(id)
            }, duration)
          }
        },

        removeNotification: (id) =>
          set(
            (state) => ({
              ...state,
              notifications: state.notifications.filter((n) => n.id !== id)}),
            false,
            'app/removeNotification'
          ),

        clearNotifications: () =>
          set(
            (state) => ({ ...state, notifications: [] }),
            false,
            'app/clearNotifications'
          ),

        // Global loading
        setGlobalLoading: (globalLoading) =>
          set(
            (state) => ({ ...state, globalLoading }),
            false,
            'app/setGlobalLoading'
          ),

        // Search actions
        setSearchQuery: (searchQuery) =>
          set(
            (state) => ({ ...state, searchQuery }),
            false,
            'app/setSearchQuery'
          ),

        setSearchResults: (searchResults) =>
          set(
            (state) => ({ ...state, searchResults }),
            false,
            'app/setSearchResults'
          ),

        setSearchLoading: (searchLoading) =>
          set(
            (state) => ({ ...state, searchLoading }),
            false,
            'app/setSearchLoading'
          ),

        clearSearch: () =>
          set(
            (state) => ({
              ...state,
              searchQuery: '',
              searchResults: [],
              searchLoading: false}),
            false,
            'app/clearSearch'
          )}),
      {
        name: 'app-storage',
        partialize: (state) => ({
          theme: state.theme,
          sidebarOpen: state.sidebarOpen})}
    ),
    {
      name: 'app-store'}
  )
)

// Selector pour les notifications (utilisé dans l'app)
export const useNotifications = () => useAppStore((state) => state.notifications)