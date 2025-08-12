'use client'

import { Suspense } from 'react'
import { useCurrentRegion } from '@/lib/hooks/use-regional-preferences'
import ConsoleCardWrapper from './console-card-wrapper'
import type { Console, ConsoleMedia } from "@prisma/client"

interface ConsoleWithMedias extends Console {
  medias?: ConsoleMedia[]
}

interface ConsoleCardRegionalWrapperProps {
  console: ConsoleWithMedias
}

function ConsoleCardWithRegion({ console }: ConsoleCardRegionalWrapperProps) {
  const currentRegion = useCurrentRegion()
  const preferredRegion = currentRegion.toLowerCase()
  
  return <ConsoleCardWrapper console={console} preferredRegion={preferredRegion} />
}

export default function ConsoleCardRegionalWrapper({ console }: ConsoleCardRegionalWrapperProps) {
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
      <ConsoleCardWithRegion console={console} />
    </Suspense>
  )
}