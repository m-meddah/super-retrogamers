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
  TableRow} from "@/components/ui/table"
import { getAllGenerations } from "@/lib/data-prisma"
import { getServerSession } from "@/lib/auth-server"
import { redirect } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"
import { Cpu, Edit3, Plus, Calendar, Monitor } from "lucide-react"
import Link from "next/link"

async function GenerationsManagementContent() {
  const generations = await getAllGenerations()

  const formatDate = (date: Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Gestion des générations</h1>
          <p className="text-muted-foreground">
            Gérez les générations de consoles de jeux vidéo
          </p>
        </div>
        <Link href="/admin/content/generations/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nouvelle génération
          </Button>
        </Link>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total générations</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{generations.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avec consoles</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {generations.filter(g => (g._count?.consoles || 0) > 0).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avec nom anglais</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {generations.filter(g => g.nameEn).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Période la plus récente</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.max(...generations.filter(g => g.endYear).map(g => g.endYear!), 0) || "N/A"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Générations de consoles</CardTitle>
          <CardDescription>
            {generations.length} générations référencées dans la base de données
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>
              Liste des {generations.length} générations disponibles
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Génération</TableHead>
                <TableHead>Ordre</TableHead>
                <TableHead>Période</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Consoles</TableHead>
                <TableHead>Ajouté</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {generations
                .sort((a, b) => (a.startYear || 9999) - (b.startYear || 9999))
                .map((generation) => (
                <TableRow key={generation.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{generation.name}</div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      {generation.startYear ? `${generation.startYear}${generation.endYear ? `-${generation.endYear}` : '+'}` : 'N/A'}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    {generation.startYear || generation.endYear ? (
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">
                          {generation.startYear || "?"}
                          {generation.endYear && ` - ${generation.endYear}`}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    {generation.nameEn ? (
                      <div className="text-sm text-muted-foreground line-clamp-2 max-w-xs">
                        {generation.nameEn}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Aucune</span>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Monitor className="h-3 w-3 text-muted-foreground" />
                      <Badge variant="outline">
                        {generation._count?.consoles || 0}
                      </Badge>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(generation.createdAt)}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex space-x-2">
                      <Link href={`/admin/content/generations/${generation.id}/edit`}>
                        <Button variant="outline" size="sm" className="gap-1">
                          <Edit3 className="h-3 w-3" />
                          Éditer
                        </Button>
                      </Link>
                      <Link href={`/generations/${generation.id}`}>
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
          
          {generations.length === 0 && (
            <div className="text-center py-8">
              <div className="text-muted-foreground">
                Aucune génération référencée pour le moment
              </div>
              <Link href="/admin/content/generations/new">
                <Button className="mt-4">
                  Créer la première génération
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default async function GenerationsManagement() {
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
        <GenerationsManagementContent />
      </Suspense>
    </div>
  )
}