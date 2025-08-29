import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth-server'
import CollectionClient from '@/components/collection/collection-client'

export default async function CollectionPage() {
  const session = await getServerSession()
  
  if (!session?.user) {
    redirect('/login')
  }

  return <CollectionClient session={session} />
}