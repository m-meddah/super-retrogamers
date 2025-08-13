interface RegionFlagProps {
  region: string
  className?: string
}

export function RegionFlag({ region, className = "w-6 h-4" }: RegionFlagProps) {
  const getRegionFlag = (region: string) => {
    switch (region.toUpperCase()) {
      case 'EU':
        return (
          <svg className={className} viewBox="0 0 24 16" fill="currentColor">
            <rect width="24" height="16" fill="#002b7f"/>
            <circle cx="8" cy="8" r="5" fill="none" stroke="#ffcc02" strokeWidth="1"/>
            <circle cx="6" cy="6" r="0.8" fill="#ffcc02"/>
            <circle cx="10" cy="6" r="0.8" fill="#ffcc02"/>
            <circle cx="12" cy="8" r="0.8" fill="#ffcc02"/>
            <circle cx="10" cy="10" r="0.8" fill="#ffcc02"/>
            <circle cx="6" cy="10" r="0.8" fill="#ffcc02"/>
            <circle cx="4" cy="8" r="0.8" fill="#ffcc02"/>
            <circle cx="6" cy="8" r="0.8" fill="#ffcc02"/>
            <circle cx="8" cy="6" r="0.8" fill="#ffcc02"/>
            <circle cx="8" cy="10" r="0.8" fill="#ffcc02"/>
            <circle cx="8" cy="8" r="0.8" fill="#ffcc02"/>
            <circle cx="10" cy="8" r="0.8" fill="#ffcc02"/>
            <circle cx="9" cy="7" r="0.6" fill="#ffcc02"/>
            <circle cx="9" cy="9" r="0.6" fill="#ffcc02"/>
          </svg>
        )
      case 'US':
        return (
          <svg className={className} viewBox="0 0 24 16" fill="currentColor">
            <rect width="24" height="16" fill="#bf0a30"/>
            <rect width="24" height="1.23" y="0" fill="#bf0a30"/>
            <rect width="24" height="1.23" y="2.46" fill="#fff"/>
            <rect width="24" height="1.23" y="4.92" fill="#bf0a30"/>
            <rect width="24" height="1.23" y="7.38" fill="#fff"/>
            <rect width="24" height="1.23" y="9.84" fill="#bf0a30"/>
            <rect width="24" height="1.23" y="12.3" fill="#fff"/>
            <rect width="24" height="1.23" y="14.76" fill="#bf0a30"/>
            <rect width="9.6" height="8.85" fill="#002868"/>
            <text x="4.8" y="5" fontSize="8" fill="#fff" textAnchor="middle">★</text>
          </svg>
        )
      case 'JP':
        return (
          <svg className={className} viewBox="0 0 24 16" fill="currentColor">
            <rect width="24" height="16" fill="#fff"/>
            <circle cx="12" cy="8" r="4.8" fill="#bc002d"/>
          </svg>
        )
      case 'FR':
        return (
          <svg className={className} viewBox="0 0 24 16" fill="currentColor">
            <rect width="8" height="16" fill="#002395"/>
            <rect width="8" height="16" x="8" fill="#fff"/>
            <rect width="8" height="16" x="16" fill="#ed2939"/>
          </svg>
        )
      case 'WOR':
        return (
          <svg className={className} viewBox="0 0 24 16" fill="currentColor">
            <rect width="24" height="16" fill="#4a90e2"/>
            <circle cx="12" cy="8" r="6" fill="none" stroke="#fff" strokeWidth="1"/>
            <path d="M6,8 Q12,4 18,8 Q12,12 6,8" fill="#5cb85c"/>
            <path d="M8,6 Q12,8 16,6" fill="#5cb85c"/>
            <path d="M8,10 Q12,8 16,10" fill="#5cb85c"/>
          </svg>
        )
      case 'ASI':
        return (
          <svg className={className} viewBox="0 0 24 16" fill="currentColor">
            <rect width="24" height="16" fill="#ff6b00"/>
            <circle cx="12" cy="8" r="3" fill="#fff"/>
            <path d="M12,5 L13,7 L15,7 L13.5,8.5 L14,11 L12,9.5 L10,11 L10.5,8.5 L9,7 L11,7 Z" fill="#ff6b00"/>
          </svg>
        )
      default:
        return (
          <svg className={className} viewBox="0 0 24 16" fill="currentColor">
            <rect width="24" height="16" fill="#6b7280" rx="2"/>
            <text x="12" y="10" fontSize="8" fill="#fff" textAnchor="middle">{region.slice(0,2)}</text>
          </svg>
        )
    }
  }

  return (
    <div className="inline-flex items-center">
      {getRegionFlag(region)}
    </div>
  )
}