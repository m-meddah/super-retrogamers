import { notFound, redirect } from "next/navigation"
import { getServerSession } from "@/lib/auth-server"
import { 
  getGameWithAllRelations, 
  getAllCorporations, 
  getAllFamilies 
} from "@/lib/data-prisma"
import { EnhancedGameEditorialForm } from "@/components/admin/enhanced-game-editorial-form"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface EditEnhancedGamePageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function EditEnhancedGamePage({ params }: EditEnhancedGamePageProps) {
  const session = await getServerSession()
  
  // Vérification des permissions admin
  if (!session?.user || session.user.role !== 'admin') {
    redirect('/login')
  }

  const { slug } = await params
  
  // Récupération parallèle des données
  const [game, corporations, families] = await Promise.all([
    getGameWithAllRelations(slug),
    getAllCorporations(),
    getAllFamilies()
  ])

  if (!game) {
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
            Édition avancée du jeu
          </h1>
          <p className="mt-1 text-lg text-gray-600 dark:text-gray-400">
            {game.title} ({game.console?.name})
          </p>
          <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
            <span>Corporation Dev: {game.corporationDev?.name || 'Aucune'}</span>
            <span>Corporation Pub: {game.corporationPub?.name || 'Aucune'}</span>
            <span>Genre: {game.genre || 'Aucun'}</span>
            <span>Famille: {game.family?.name || 'Aucune'}</span>
          </div>
        </div>

        {/* Formulaire d'édition amélioré */}
        <EnhancedGameEditorialForm 
          game={game} 
          corporations={corporations}
          families={families}
        />
      </div>
    </div>
  )
}