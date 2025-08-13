'use client'

import { useRegionalSync } from '@/lib/hooks/use-regional-sync'
import { Suspense } from 'react'

function RegionalSyncComponent() {
  useRegionalSync()
  return null
}

export default function RegionalProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <RegionalSyncComponent />
      </Suspense>
      {children}
    </>
  )
}