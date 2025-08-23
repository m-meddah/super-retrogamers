'use client'

import ConsoleCardHomepage from '@/components/console-card-homepage'
import type { Console } from "@prisma/client"

interface ConsoleCardsHomepageSectionProps {
  consoles: Console[]
  regionalNames: Record<string, string>
  regionalDates: Record<string, Date | null>
}

export default function ConsoleCardsHomepageSection({
  consoles,
  regionalNames,
  regionalDates
}: ConsoleCardsHomepageSectionProps) {
  return (
    <div className="mb-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {consoles.map((console) => (
        <ConsoleCardHomepage 
          key={console.id} 
          console={console}
          regionalName={regionalNames[console.id]}
          regionalReleaseDate={regionalDates[console.id]}
        />
      ))}
    </div>
  )
}