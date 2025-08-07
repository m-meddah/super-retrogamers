import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface ScrapingProgress {
  current: number
  total: number
  processed: number
  errors: number
  lastProcessed?: string
}

interface ScrapingStatus {
  isRunning: boolean
  operation: 'consoles' | 'games' | 'full' | null
  progress: ScrapingProgress | null
  logs: string[]
  startTime: Date | null
  endTime: Date | null
}

interface ScrapingResult {
  success: boolean
  total: number
  imported: number
  errors: string[]
  operation: string
  duration?: number
}

interface ScrapingState {
  status: ScrapingStatus
  lastResult: ScrapingResult | null
  history: ScrapingResult[]
}

interface ScrapingActions {
  // Start/stop operations
  startScraping: (operation: 'consoles' | 'games' | 'full') => void
  stopScraping: () => void
  
  // Update progress
  updateProgress: (progress: Partial<ScrapingProgress>) => void
  
  // Add logs
  addLog: (message: string) => void
  clearLogs: () => void
  
  // Complete operation
  completeScraping: (result: ScrapingResult) => void
  
  // Reset state
  resetScraping: () => void
}

export type ScrapingStore = ScrapingState & ScrapingActions

const initialStatus: ScrapingStatus = {
  isRunning: false,
  operation: null,
  progress: null,
  logs: [],
  startTime: null,
  endTime: null,
}

const initialState: ScrapingState = {
  status: initialStatus,
  lastResult: null,
  history: [],
}

export const useScrapingStore = create<ScrapingStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      startScraping: (operation) =>
        set(
          (state) => ({
            ...state,
            status: {
              ...initialStatus,
              isRunning: true,
              operation,
              startTime: new Date(),
              logs: [`🚀 Début du scraping ${operation}...`],
            },
          }),
          false,
          `scraping/start/${operation}`
        ),

      stopScraping: () =>
        set(
          (state) => ({
            ...state,
            status: {
              ...state.status,
              isRunning: false,
              endTime: new Date(),
            },
          }),
          false,
          'scraping/stop'
        ),

      updateProgress: (progress) =>
        set(
          (state) => ({
            ...state,
            status: {
              ...state.status,
              progress: state.status.progress
                ? { ...state.status.progress, ...progress }
                : { current: 0, total: 0, processed: 0, errors: 0, ...progress },
            },
          }),
          false,
          'scraping/updateProgress'
        ),

      addLog: (message) =>
        set(
          (state) => ({
            ...state,
            status: {
              ...state.status,
              logs: [...state.status.logs, `${new Date().toLocaleTimeString()} - ${message}`],
            },
          }),
          false,
          'scraping/addLog'
        ),

      clearLogs: () =>
        set(
          (state) => ({
            ...state,
            status: {
              ...state.status,
              logs: [],
            },
          }),
          false,
          'scraping/clearLogs'
        ),

      completeScraping: (result) => {
        const { status } = get()
        const duration = status.startTime
          ? Date.now() - status.startTime.getTime()
          : undefined

        const finalResult = { ...result, duration }

        set(
          (state) => ({
            ...state,
            status: {
              ...state.status,
              isRunning: false,
              endTime: new Date(),
            },
            lastResult: finalResult,
            history: [finalResult, ...state.history.slice(0, 9)], // Keep last 10 results
          }),
          false,
          'scraping/complete'
        )
      },

      resetScraping: () =>
        set(
          initialState,
          false,
          'scraping/reset'
        ),
    }),
    {
      name: 'scraping-store',
    }
  )
)

// Selectors
export const useScrapingStatus = () => useScrapingStore((state) => state.status)
export const useScrapingProgress = () => useScrapingStore((state) => state.status.progress)
export const useScrapingLogs = () => useScrapingStore((state) => state.status.logs)
export const useScrapingHistory = () => useScrapingStore((state) => state.history)
export const useIsScrapingRunning = () => useScrapingStore((state) => state.status.isRunning)