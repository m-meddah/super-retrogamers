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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getContentManagementData, generateGameCompositeSlug, getAllCorporations, getAllFamilies, getAllGenerations } from "@/lib/data-prisma"
import { getServerSession } from "@/lib/auth-server"
import { redirect } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"
import { Monitor, Gamepad2, Users, Star, Calendar, AlertTriangle, Edit3, Building2, Tag, Layers, Cpu } from "lucide-react"
import Link from "next/link"
import { ScrapingButtons } from "@/components/admin/scraping-buttons"

async function ContentManagementContent() {
  const [{ consoles, games }, corporations, families, generations] = await Promise.all([
    getContentManagementData(),
    getAllCorporations(),
    getAllFamilies(),
    getAllGenerations()
  ])

  const formatDate = (date: Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr })
  }

  const getStatusBadge = (hasGames: boolean, gamesCount: number) => {
    if (gamesCount === 0) {
      return <Badge variant="destructive">Vide</Badge>
    } else if (gamesCount < 5) {
      return <Badge variant="secondary">Peu de jeux</Badge>
    }
    return <Badge variant="default">Complet</Badge>
  }

  const getGameRatingBadge = (rating: number | null) => {
    if (!rating) return <Badge variant="outline">Non noté</Badge>
    if (rating >= 4) return <Badge variant="default" className="bg-green-500">Excellent</Badge>
    if (rating >= 3) return <Badge variant="default" className="bg-blue-500">Bon</Badge>
    if (rating >= 2) return <Badge variant="default" className="bg-yellow-500">Moyen</Badge>
    return <Badge variant="destructive">Faible</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Gestion du contenu</h1>
        <p className="text-muted-foreground">
          Gérez les consoles et jeux référencés sur la plateforme
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total consoles</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{consoles.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total jeux</CardTitle>
            <Gamepad2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{games.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consoles vides</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {consoles.filter(c => c._count.games === 0).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jeux sans note</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {games.filter(g => !g.rating).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Management Entities Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold">Gestion des entités</h2>
          <p className="text-muted-foreground">
            Gérez les corporations, genres, familles et générations
          </p>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Corporations</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{corporations.length}</div>
              <div className="mt-2">
                <Link href="/admin/content/corporations">
                  <Button variant="outline" size="sm" className="w-full">
                    Gérer
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Genres</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">156</div>
              <div className="mt-2">
                <Link href="/admin/content/genres">
                  <Button variant="outline" size="sm" className="w-full">
                    Gérer
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Familles</CardTitle>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{families.length}</div>
              <div className="mt-2">
                <Link href="/admin/content/families">
                  <Button variant="outline" size="sm" className="w-full">
                    Gérer
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Générations</CardTitle>
              <Cpu className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{generations.length}</div>
              <div className="mt-2">
                <Link href="/admin/content/generations">
                  <Button variant="outline" size="sm" className="w-full">
                    Gérer
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="consoles" className="w-full">
        <TabsList>
          <TabsTrigger value="consoles">Consoles</TabsTrigger>
          <TabsTrigger value="games">Jeux</TabsTrigger>
        </TabsList>

        <TabsContent value="consoles">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des consoles</CardTitle>
              <CardDescription>
                {consoles.length} consoles référencées dans la base de données
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableCaption>
                  Liste des {consoles.length} consoles disponibles
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Console</TableHead>
                    <TableHead>Constructeur</TableHead>
                    <TableHead>Année</TableHead>
                    <TableHead>Jeux</TableHead>
                    <TableHead>Collections</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Ajouté</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consoles.map((console) => (
                    <TableRow key={console.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{console.name}</div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge variant="outline">
                          {console.manufacturer || 'N/A'}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span>{console.releaseYear || 'N/A'}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Gamepad2 className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">{console._count.games}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <span>{console._count.userCollections}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {getStatusBadge(console._count.games > 0, console._count.games)}
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(console.createdAt)}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex space-x-2">
                          <Link href={`/admin/consoles/${console.slug}/edit`}>
                            <Button variant="outline" size="sm" className="gap-1">
                              <Edit3 className="h-3 w-3" />
                              Éditer article
                            </Button>
                          </Link>
                          <Link href={`/consoles/${console.slug}/jeux`}>
                            <Button variant="outline" size="sm">
                              Voir jeux
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {consoles.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-muted-foreground">
                    Aucune console référencée pour le moment
                  </div>
                  <div className="mt-4">
                    <ScrapingButtons />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="games">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des jeux</CardTitle>
              <CardDescription>
                {games.length} jeux référencés dans la base de données
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableCaption>
                  Liste des {games.length} jeux disponibles
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Jeu</TableHead>
                    <TableHead>Console</TableHead>
                    <TableHead>Développeur</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead>Collections</TableHead>
                    <TableHead>Évaluations</TableHead>
                    <TableHead>Ajouté</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {games.slice(0, 50).map((game) => (
                    <TableRow key={game.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{game.title}</div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge variant="outline">
                          {game.console?.name || 'N/A'}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm">
                          {game.developer || 'N/A'}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {getGameRatingBadge(game.rating)}
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <span>{game._count.userCollections}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Star className="h-3 w-3 text-muted-foreground" />
                          <span>{game._count.reviews}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(game.createdAt)}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex space-x-2">
                          <Link href={`/admin/content/jeux/${generateGameCompositeSlug(game)}/edit`}>
                            <Button variant="outline" size="sm" className="gap-1">
                              <Edit3 className="h-3 w-3" />
                              Modifier
                            </Button>
                          </Link>
                          <Link href={`/jeux/${generateGameCompositeSlug(game)}`}>
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
              
              {games.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-muted-foreground">
                    Aucun jeu référencé pour le moment
                  </div>
                  <div className="mt-4">
                    <ScrapingButtons />
                  </div>
                </div>
              )}
              
              {games.length > 50 && (
                <div className="mt-4 text-center">
                  <Button variant="outline">
                    Charger plus de jeux ({games.length - 50} restants)
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default async function ContentManagement() {
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
        <ContentManagementContent />
      </Suspense>
    </div>
  )
}