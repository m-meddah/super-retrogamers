import { notFound } from "next/navigation"
import { getConsoleBySlug, getGenresByConsoleSlug } from "@/lib/data-prisma"
import { loadConsoleGamesStream } from "@/lib/actions/console-games-streaming-actions"
import ConsoleGamesClient from "./client"

interface ConsoleGamesPageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function ConsoleGamesPage({ params }: ConsoleGamesPageProps) {
  const { slug } = await params
  const console = await getConsoleBySlug(slug)

  if (!console) {
    notFound()
  }

  // Load only initial games for faster page load - streaming will handle the rest
  const [initialGames, genres] = await Promise.all([
    loadConsoleGamesStream(0, 20, {
      consoleSlug: console.slug,
      sortBy: 'title',
      sortOrder: 'asc'
    }),
    getGenresByConsoleSlug(console.slug)
  ])

  return (
    <ConsoleGamesClient 
      console={console}
      initialGames={initialGames}
      genres={genres}
    />
  )
}
