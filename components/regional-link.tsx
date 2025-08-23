'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ReactNode, Suspense } from 'react'

interface RegionalLinkProps {
  href: string
  children: ReactNode
  className?: string
  [key: string]: unknown // Pour les autres props Link
}

function RegionalLinkComponent({ 
  href, 
  children, 
  className, 
  ...props 
}: RegionalLinkProps) {
  const searchParams = useSearchParams()
  const region = searchParams.get('region')
  
  // Construire l'URL avec le paramètre region si il existe
  const buildHref = () => {
    if (!region) return href
    
    const url = new URL(href, 'http://localhost') // Base temporaire pour parsing
    url.searchParams.set('region', region)
    
    // Retourner seulement le pathname + search
    return `${url.pathname}${url.search}`
  }

  return (
    <Link href={buildHref()} className={className} {...props}>
      {children}
    </Link>
  )
}

export default function RegionalLink(props: RegionalLinkProps) {
  return (
    <Suspense fallback={<Link href={props.href} className={props.className}>{props.children}</Link>}>
      <RegionalLinkComponent {...props} />
    </Suspense>
  )
}