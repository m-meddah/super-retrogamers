'use client'

import { useRegionalConsoleName } from "@/lib/hooks/use-regional-names"
import { useState, useEffect } from 'react'

interface ConsoleNameRegionalProps {
  consoleId: string
  fallbackName: string
  className?: string
}

export default function ConsoleNameRegional({ 
  consoleId, 
  fallbackName, 
  className = ""
}: ConsoleNameRegionalProps) {
  const { name: regionalName, loading: nameLoading } = useRegionalConsoleName(consoleId)
  const [currentName, setCurrentName] = useState(fallbackName)

  // Update name smoothly when regional name changes
  useEffect(() => {
    const newName = regionalName || fallbackName
    if (newName !== currentName) {
      // Small delay for smooth transition
      const timer = setTimeout(() => {
        setCurrentName(newName)
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [regionalName, fallbackName, currentName])

  return (
    <span 
      className={`transition-all duration-200 ${nameLoading ? 'opacity-70' : 'opacity-100'} ${className}`}
    >
      {currentName}
    </span>
  )
}