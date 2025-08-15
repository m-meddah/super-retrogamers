'use client'

import { Region } from '@prisma/client'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usePersistentRegion } from '@/lib/hooks/use-persistent-region'
import { RegionFlag } from '@/components/ui/region-flag'
import { Globe } from 'lucide-react'

interface RegionSelectorProps {
  variant?: 'default' | 'compact'
  showLabel?: boolean
  className?: string
}

const REGION_LABELS: Record<Region, string> = {
  FR: 'France',
  EU: 'Europe',
  WOR: 'Monde',
  JP: 'Japon',
  ASI: 'Asie',
  US: 'États-Unis'
}

const REGION_DESCRIPTIONS: Record<Region, string> = {
  FR: 'Privilégie les versions françaises',
  EU: 'Privilégie les versions européennes',
  WOR: 'Privilégie les versions mondiales',
  JP: 'Privilégie les versions japonaises',
  ASI: 'Privilégie les versions asiatiques',
  US: 'Privilégie les versions américaines'
}

export function RegionSelector({ 
  variant = 'default', 
  showLabel = true, 
  className = '' 
}: RegionSelectorProps) {
  // Utilise le nouveau système persistant
  const { region, setRegion } = usePersistentRegion()

  const handleRegionChange = (newRegion: string) => {
    setRegion(newRegion as Region)
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showLabel && variant === 'default' && (
        <div className="flex items-center gap-2 text-sm font-medium">
          <Globe className="h-4 w-4" />
          <span>Région :</span>
        </div>
      )}
      
      <Select value={region} onValueChange={handleRegionChange}>
        <SelectTrigger className={`${variant === 'compact' ? 'w-auto' : 'w-40'}`}>
          <SelectValue>
            <div className="flex items-center gap-2">
              <RegionFlag region={region} className="w-4 h-3" />
              <span className="font-medium">{REGION_LABELS[region]}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(REGION_LABELS) as Region[]).map((regionOption) => (
            <SelectItem key={regionOption} value={regionOption}>
              <div className="flex items-center gap-3">
                <RegionFlag region={regionOption} className="w-4 h-3" />
                <div className="flex flex-col">
                  <span className="font-medium">{REGION_LABELS[regionOption]}</span>
                  <span className="text-xs text-muted-foreground">
                    {REGION_DESCRIPTIONS[regionOption]}
                  </span>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

// Version compacte pour les en-têtes
export function CompactRegionSelector({ className }: { className?: string }) {
  return (
    <RegionSelector 
      variant="compact" 
      showLabel={false}
      className={className}
    />
  )
}