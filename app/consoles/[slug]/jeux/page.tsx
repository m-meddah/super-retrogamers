import { notFound } from "next/navigation"
import { getConsoleBySlug, getGamesByConsoleWithConsoleInfo, getGenresByConsoleSlug } from "@/lib/data-prisma"
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

  const [games, genres] = await Promise.all([
    getGamesByConsoleWithConsoleInfo(console.slug),
    getGenresByConsoleSlug(console.slug)
  ])

  return (
    <ConsoleGamesClient 
      console={console}
      initialGames={games}
      genres={genres}
    />
  )
}
