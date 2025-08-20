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
import { getAllFamilies } from "@/lib/data-prisma"
import { getServerSession } from "@/lib/auth-server"
import { redirect } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"
import { Layers, Edit3, Plus, Gamepad2 } from "lucide-react"
import Link from "next/link"

async function FamiliesManagementContent() {
  const families = await getAllFamilies()

  const formatDate = (date: Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Gestion des familles de jeux</h1>
          <p className="text-muted-foreground">
            Gérez les séries et franchises de jeux vidéo
          </p>
        </div>
        <Link href="/admin/content/families/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nouvelle famille
          </Button>
        </Link>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total familles</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{families.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avec jeux</CardTitle>
            <Gamepad2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {families.filter(f => (f._count?.games || 0) > 0).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avec description</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {families.filter(f => f.description).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avec Screenscraper ID</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {families.filter(f => f.ssFamilyId).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Families Table */}
      <Card>
        <CardHeader>
          <CardTitle>Familles de jeux</CardTitle>
          <CardDescription>
            {families.length} familles de jeux référencées dans la base de données
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>
              Liste des {families.length} familles de jeux disponibles
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Famille</TableHead>
                <TableHead>Nom anglais</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Jeux associés</TableHead>
                <TableHead>Screenscraper</TableHead>
                <TableHead>Ajouté</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {families.map((family) => (
                <TableRow key={family.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{family.name}</div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {family.nameEn ? (
                      <span className="text-sm">{family.nameEn}</span>
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    {family.description ? (
                      <div className="text-sm text-muted-foreground line-clamp-2 max-w-xs">
                        {family.description}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Aucune</span>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Gamepad2 className="h-3 w-3 text-muted-foreground" />
                      <Badge variant="outline">
                        {family._count?.games || 0}
                      </Badge>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {family.ssFamilyId ? (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        #{family.ssFamilyId}
                      </Badge>
                    ) : (
                      <Badge variant="outline">Non lié</Badge>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(family.createdAt)}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex space-x-2">
                      <Link href={`/admin/content/families/${family.id}/edit`}>
                        <Button variant="outline" size="sm" className="gap-1">
                          <Edit3 className="h-3 w-3" />
                          Éditer
                        </Button>
                      </Link>
                      <Link href={`/familles/${family.id}`}>
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
          
          {families.length === 0 && (
            <div className="text-center py-8">
              <div className="text-muted-foreground">
                Aucune famille de jeu référencée pour le moment
              </div>
              <Link href="/admin/content/families/new">
                <Button className="mt-4">
                  Créer la première famille
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default async function FamiliesManagement() {
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
        <FamiliesManagementContent />
      </Suspense>
    </div>
  )
}