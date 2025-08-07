'use client'

import { useNotifications, useAppStore } from '@/lib/stores/app-store'
import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react'

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

const colorMap = {
  success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300',
  error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300',
  info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300',
}

export default function NotificationSystem() {
  const notifications = useNotifications()
  const { removeNotification } = useAppStore()

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => {
        const Icon = iconMap[notification.type]
        const colorClass = colorMap[notification.type]

        return (
          <div
            key={notification.id}
            className={`
              p-4 rounded-lg border shadow-lg transition-all duration-300 ease-in-out
              animate-in slide-in-from-right-full
              ${colorClass}
            `}
          >
            <div className="flex items-start gap-3">
              <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
              
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">
                  {notification.title}
                </p>
                {notification.message && (
                  <p className="text-sm opacity-90 mt-1">
                    {notification.message}
                  </p>
                )}
              </div>

              <button
                onClick={() => removeNotification(notification.id)}
                className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}