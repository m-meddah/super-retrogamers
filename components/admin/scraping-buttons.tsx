"use client"

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Download } from 'lucide-react'
import { scrapeAllConsolesAction } from '@/lib/actions/admin-scraping-actions'
import { useToast } from '@/hooks/use-toast'

export function ScrapingButtons() {
  const [isPending, startTransition] = useTransition()
  const [isScrapingConsoles, setIsScrapingConsoles] = useState(false)
  const { toast } = useToast()

  const handleScrapeConsoles = () => {
    if (isScrapingConsoles) return
    
    setIsScrapingConsoles(true)
    startTransition(async () => {
      try {
        const result = await scrapeAllConsolesAction()
        
        if (result.success) {
          toast({
            title: "Scraping terminé",
            description: result.message})
          // Recharger la page pour voir les nouvelles données
          window.location.reload()
        } else {
          toast({
            title: "Erreur",
            description: result.error || "Erreur lors du scraping",
            variant: "destructive"})
        }
      } catch (error) {
        console.error('Erreur scraping:', error)
        toast({
          title: "Erreur",
          description: "Erreur inattendue lors du scraping",
          variant: "destructive"})
      } finally {
        setIsScrapingConsoles(false)
      }
    })
  }

  return (
    <Button 
      onClick={handleScrapeConsoles}
      disabled={isPending || isScrapingConsoles}
      className="flex items-center gap-2"
    >
      {(isPending || isScrapingConsoles) ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {(isPending || isScrapingConsoles) ? 'Scraping en cours...' : 'Lancer le scraping'}
    </Button>
  )
}