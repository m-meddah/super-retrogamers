import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "@/lib/auth-server"
import { redirect } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"
import { Tag, Edit3, Plus, Layers } from "lucide-react"
import Link from "next/link"

async function getAllGenres() {
  return await prisma.genre.findMany({
    include: {
      _count: {
        select: {
          gameGenres: true
        }
      }
    },
    orderBy: [
      { isMainGenre: 'desc' },
      { name: 'asc' }
    ]
  })
}

async function GenresManagementContent() {
  const genres = await getAllGenres()

  const formatDate = (date: Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr })
  }

  const mainGenres = genres.filter(g => g.isMainGenre)
  const subGenres = genres.filter(g => !g.isMainGenre)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Gestion des genres</h1>
          <p className="text-muted-foreground">
            Gérez les genres de jeux synchronisés depuis Screenscraper
          </p>
        </div>
        <Link href="/admin/content/genres/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nouveau genre
          </Button>
        </Link>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total genres</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{genres.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Genres principaux</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mainGenres.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sous-genres</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subGenres.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avec couleurs</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {genres.filter(g => g.color).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Genres principaux */}
      <Card>
        <CardHeader>
          <CardTitle>Genres principaux ({mainGenres.length})</CardTitle>
          <CardDescription>
            Genres de base synchronisés depuis Screenscraper
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {mainGenres.map((genre) => (
              <div
                key={genre.id}
                className="group relative overflow-hidden rounded-lg bg-white p-4 shadow transition-all hover:shadow-lg dark:bg-gray-800 dark:hover:bg-gray-750"
                style={{
                  borderLeft: genre.color ? `4px solid ${genre.color}` : '4px solid #8B5CF6'
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {genre.name}
                    </h3>
                    <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                      <Tag className="h-3 w-3" />
                      {genre._count?.gameGenres || 0} jeux
                    </div>
                    {genre.color && (
                      <div className="mt-2 flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded border"
                          style={{ backgroundColor: genre.color }}
                        />
                        <span className="text-xs font-mono text-gray-500">{genre.color}</span>
                      </div>
                    )}
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      #{genre.screenscrapeId}
                    </Badge>
                  </div>
                </div>
                
                <div className="mt-3 flex space-x-2">
                  <Link href={`/admin/content/genres/${genre.id}/edit`}>
                    <Button variant="outline" size="sm" className="gap-1 text-xs">
                      <Edit3 className="h-3 w-3" />
                      Éditer
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sous-genres Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sous-genres ({subGenres.length})</CardTitle>
          <CardDescription>
            Sous-catégories de genres synchronisées depuis Screenscraper
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>
              Liste des {subGenres.length} sous-genres disponibles
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Genre</TableHead>
                <TableHead>Parent ID</TableHead>
                <TableHead>Couleur</TableHead>
                <TableHead>Jeux associés</TableHead>
                <TableHead>Screenscraper</TableHead>
                <TableHead>Ajouté</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subGenres.slice(0, 50).map((genre) => (
                <TableRow key={genre.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{genre.name}</div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {genre.parentId ? (
                      <Badge variant="outline" className="text-xs">
                        #{genre.parentId}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    {genre.color ? (
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: genre.color }}
                        />
                        <span className="text-xs font-mono">{genre.color}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Aucune</span>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Tag className="h-3 w-3 text-muted-foreground" />
                      <Badge variant="outline">
                        {genre._count?.gameGenres || 0}
                      </Badge>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      #{genre.screenscrapeId}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(genre.createdAt)}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex space-x-2">
                      <Link href={`/admin/content/genres/${genre.id}/edit`}>
                        <Button variant="outline" size="sm" className="gap-1">
                          <Edit3 className="h-3 w-3" />
                          Éditer
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {subGenres.length === 0 && (
            <div className="text-center py-8">
              <div className="text-muted-foreground">
                Aucun sous-genre référencé pour le moment
              </div>
            </div>
          )}
          
          {subGenres.length > 50 && (
            <div className="mt-4 text-center">
              <Button variant="outline">
                Charger plus de genres ({subGenres.length - 50} restants)
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default async function GenresManagement() {
  const session = await getServerSession()
  
  // Vérification des permissions admin
  if (!session?.user || session.user.role !== 'admin') {
    redirect('/login')
  }

  return (
    <div className="container mx-auto p-6">
      <Suspense fallback={
        <div className="space-y-6">
          <div className="h-8 w-64 bg-muted animate-pulse rounded" />
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-6">
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                  <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                </div>
              </Card>
            ))}
          </div>
          <Card className="p-6">
            <div className="space-y-4">
              <div className="h-6 w-48 bg-muted animate-pulse rounded" />
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-12 w-full bg-muted animate-pulse rounded" />
                ))}
              </div>
            </div>
          </Card>
        </div>
      }>
        <GenresManagementContent />
      </Suspense>
    </div>
  )
}