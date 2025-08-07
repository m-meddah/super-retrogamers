interface RegionFlagProps {
  region: string
  className?: string
}

export function RegionFlag({ region, className = "w-6 h-4" }: RegionFlagProps) {
  const getRegionFlag = (region: string) => {
    switch (region.toUpperCase()) {
      case 'EUROPE':
      case 'PAL':
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
      case 'NORTH_AMERICA':
      case 'NTSC':
      case 'NTSC_U':
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
      case 'JAPAN':
      case 'NTSC_J':
        return (
          <svg className={className} viewBox="0 0 24 16" fill="currentColor">
            <rect width="24" height="16" fill="#fff"/>
            <circle cx="12" cy="8" r="4.8" fill="#bc002d"/>
          </svg>
        )
      case 'FRANCE':
        return (
          <svg className={className} viewBox="0 0 24 16" fill="currentColor">
            <rect width="8" height="16" fill="#002395"/>
            <rect width="8" height="16" x="8" fill="#fff"/>
            <rect width="8" height="16" x="16" fill="#ed2939"/>
          </svg>
        )
      case 'GERMANY':
        return (
          <svg className={className} viewBox="0 0 24 16" fill="currentColor">
            <rect width="24" height="5.33" fill="#000"/>
            <rect width="24" height="5.33" y="5.33" fill="#dd0000"/>
            <rect width="24" height="5.33" y="10.66" fill="#ffce00"/>
          </svg>
        )
      case 'ITALY':
        return (
          <svg className={className} viewBox="0 0 24 16" fill="currentColor">
            <rect width="8" height="16" fill="#009246"/>
            <rect width="8" height="16" x="8" fill="#fff"/>
            <rect width="8" height="16" x="16" fill="#ce2b37"/>
          </svg>
        )
      case 'SPAIN':
        return (
          <svg className={className} viewBox="0 0 24 16" fill="currentColor">
            <rect width="24" height="4" fill="#aa151b"/>
            <rect width="24" height="8" y="4" fill="#f1bf00"/>
            <rect width="24" height="4" y="12" fill="#aa151b"/>
          </svg>
        )
      case 'UK':
        return (
          <svg className={className} viewBox="0 0 24 16" fill="currentColor">
            <rect width="24" height="16" fill="#012169"/>
            <path d="M0,0 L24,16 M24,0 L0,16" stroke="#fff" strokeWidth="2"/>
            <path d="M12,0 L12,16 M0,8 L24,8" stroke="#fff" strokeWidth="3"/>
            <path d="M0,0 L24,16 M24,0 L0,16" stroke="#c8102e" strokeWidth="1"/>
            <path d="M12,0 L12,16 M0,8 L24,8" stroke="#c8102e" strokeWidth="2"/>
          </svg>
        )
      case 'AUSTRALIA':
        return (
          <svg className={className} viewBox="0 0 24 16" fill="currentColor">
            <rect width="24" height="16" fill="#012169"/>
            <rect width="12" height="8" fill="#012169"/>
            <path d="M0,0 L12,8 M12,0 L0,8" stroke="#fff" strokeWidth="1"/>
            <path d="M6,0 L6,8 M0,4 L12,4" stroke="#fff" strokeWidth="2"/>
            <text x="18" y="6" fontSize="6" fill="#fff">★</text>
            <text x="18" y="12" fontSize="4" fill="#fff">★</text>
            <text x="22" y="10" fontSize="4" fill="#fff">★</text>
          </svg>
        )
      case 'WORLD':
        return (
          <svg className={className} viewBox="0 0 24 16" fill="currentColor">
            <rect width="24" height="16" fill="#4a90e2"/>
            <circle cx="12" cy="8" r="6" fill="none" stroke="#fff" strokeWidth="1"/>
            <path d="M6,8 Q12,4 18,8 Q12,12 6,8" fill="#5cb85c"/>
            <path d="M8,6 Q12,8 16,6" fill="#5cb85c"/>
            <path d="M8,10 Q12,8 16,10" fill="#5cb85c"/>
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