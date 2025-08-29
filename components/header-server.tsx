import { getServerSession } from "@/lib/auth-server"
import HeaderClient from "@/components/header-client"

export default async function HeaderServer() {
  const session = await getServerSession()
  
  return <HeaderClient session={session} />
}