import { notFound, redirect } from "next/navigation"
import { getServerSession } from "@/lib/auth-server"
import { getConsoleBySlug } from "@/lib/data-prisma"
import { EditorialForm } from "@/components/admin/editorial-form"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface EditConsolePageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function EditConsolePage({ params }: EditConsolePageProps) {
  const session = await getServerSession()
  
  // Vérification des permissions admin
  if (!session?.user || session.user.role !== 'admin') {
    redirect('/login')
  }

  const { slug } = await params
  const console = await getConsoleBySlug(slug)

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
            Éditer l&apos;article éditorial
          </h1>
          <p className="mt-1 text-lg text-gray-600 dark:text-gray-400">
            {console.name} ({console.releaseYear})
          </p>
        </div>

        {/* Formulaire d'édition */}
        <EditorialForm console={console} />
      </div>
    </div>
  )
}