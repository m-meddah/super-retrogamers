import { headers } from "next/headers"
import { getServerSession } from "@/lib/auth-server"
import type { Region } from "@prisma/client"

/**
 * Get user's preferred region from URL params, user preferences, or default to FR
 * This is a server-side function for pages that need regional data server-side
 */
export async function getServerPreferredRegion(): Promise<Region> {
  try {
    // Check URL searchParams first
    const headersList = await headers()
    const url = headersList.get('x-url') || headersList.get('referer') || ''
    const urlSearchParams = new URL(url, 'http://localhost').searchParams
    const regionParam = urlSearchParams.get('region')?.toUpperCase()
    
    if (regionParam && ['FR', 'EU', 'WOR', 'US', 'JP', 'ASI'].includes(regionParam)) {
      return regionParam as Region
    }
    
    // Fallback to user session preference
    const session = await getServerSession()
    if (session?.user?.preferredRegion) {
      return session.user.preferredRegion as Region
    }
    
    // Default to FR
    return 'FR'
    
  } catch (error) {
    console.error('Error getting server preferred region:', error)
    return 'FR'
  }
}