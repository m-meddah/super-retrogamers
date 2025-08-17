import { notFound, redirect } from "next/navigation"
import { getServerSession } from "@/lib/auth-server"
import { 
  getConsoleWithAllRelations, 
  getAllGenerations,
  getGamesByConsole
} from "@/lib/data-prisma"
import { EnhancedConsoleEditorialForm } from "@/components/admin/enhanced-console-editorial-form"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface EditEnhancedConsolePageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function EditEnhancedConsolePage({ params }: EditEnhancedConsolePageProps) {
  const session = await getServerSession()
  
  // Vérification des permissions admin
  if (!session?.user || session.user.role !== 'admin') {
    redirect('/login')
  }

  const { slug } = await params
  
  // Récupération parallèle des données
  const [console, generations, games] = await Promise.all([
    getConsoleWithAllRelations(slug),
    getAllGenerations(),
    getGamesByConsole(slug)
  ])

  if (!console) {
    notFound()
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/content"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à la gestion de contenu
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">
            Édition avancée de la console
          </h1>
          <p className="mt-1 text-lg text-gray-600 dark:text-gray-400">
            {console.name} ({console.manufacturer})
          </p>
          <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
            <span>Génération: {console.generation?.name || 'Aucune'}</span>
            <span>Unités vendues: {console.unitsSold?.toLocaleString() || 'N/A'}</span>
            <span>Meilleur jeu: {console.bestSellingGame?.title || 'Aucun'}</span>
            <span>Support: {console.media || 'N/A'}</span>
          </div>
        </div>

        {/* Formulaire d'édition amélioré */}
        <EnhancedConsoleEditorialForm 
          console={console} 
          generations={generations}
          games={games}
        />
      </div>
    </div>
  )
}