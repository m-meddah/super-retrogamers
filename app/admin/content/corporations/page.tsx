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
import { getAllCorporations } from "@/lib/data-prisma"
import { getServerSession } from "@/lib/auth-server"
import { redirect } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"
import { Building2, Edit3, Plus, MapPin, Calendar } from "lucide-react"
import Link from "next/link"

async function CorporationsManagementContent() {
  const corporations = await getAllCorporations()

  const formatDate = (date: Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Gestion des corporations</h1>
          <p className="text-muted-foreground">
            Gérez les entreprises développeurs et éditeurs de jeux vidéo
          </p>
        </div>
        <Link href="/admin/content/corporations/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nouvelle corporation
          </Button>
        </Link>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total corporations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{corporations.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Développeurs</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {corporations.filter(c => (c._count?.developedGames || 0) > 0).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Éditeurs</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {corporations.filter(c => (c._count?.publishedGames || 0) > 0).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avec Screenscraper ID</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {corporations.filter(c => c.screenscrapeId).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Corporations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Corporations</CardTitle>
          <CardDescription>
            {corporations.length} corporations référencées dans la base de données
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>
              Liste des {corporations.length} corporations disponibles
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Corporation</TableHead>
                <TableHead>Siège social</TableHead>
                <TableHead>Période</TableHead>
                <TableHead>Jeux développés</TableHead>
                <TableHead>Jeux publiés</TableHead>
                <TableHead>Screenscraper</TableHead>
                <TableHead>Ajouté</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {corporations.map((corporation) => (
                <TableRow key={corporation.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{corporation.name}</div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {corporation.headquarters ? (
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {corporation.headquarters}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    {corporation.foundedDate ? (
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">
                          {corporation.foundedDate.getFullYear()}
                          {corporation.defunctDate && ` - ${corporation.defunctDate.getFullYear()}`}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      {corporation._count?.developedGames || 0}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant="outline" className="bg-purple-50 text-purple-700">
                      {corporation._count?.publishedGames || 0}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    {corporation.screenscrapeId ? (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        #{corporation.screenscrapeId}
                      </Badge>
                    ) : (
                      <Badge variant="outline">Non lié</Badge>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(corporation.createdAt)}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex space-x-2">
                      <Link href={`/admin/content/corporations/${corporation.id}/edit`}>
                        <Button variant="outline" size="sm" className="gap-1">
                          <Edit3 className="h-3 w-3" />
                          Éditer
                        </Button>
                      </Link>
                      <Link href={`/corporations/${corporation.id}`}>
                        <Button variant="outline" size="sm">
                          Voir détails
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {corporations.length === 0 && (
            <div className="text-center py-8">
              <div className="text-muted-foreground">
                Aucune corporation référencée pour le moment
              </div>
              <Link href="/admin/content/corporations/new">
                <Button className="mt-4">
                  Créer la première corporation
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default async function CorporationsManagement() {
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
        <CorporationsManagementContent />
      </Suspense>
    </div>
  )
}