'use client'

import { Suspense } from 'react'
import ConsoleCard from './console-card'
import type { Console, ConsoleMedia } from "@prisma/client"

interface ConsoleWithMedias extends Console {
  medias?: ConsoleMedia[]
}

interface ConsoleCardWrapperProps {
  console: ConsoleWithMedias
}

export default function ConsoleCardWrapper({ console }: ConsoleCardWrapperProps) {
  return (
    <Suspense fallback={
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
        <div className="aspect-[4/3] bg-gray-100 dark:bg-gray-800 animate-pulse" />
        <div className="p-4 space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3 animate-pulse" />
        </div>
      </div>
    }>
      <ConsoleCard console={console} />
    </Suspense>
  )
}