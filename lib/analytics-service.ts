'use server'

import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'

/**
 * Service pour enregistrer les vues de pages et générer les analytics
 */

// Hash de l'IP pour la confidentialité
function hashIP(ip: string): string {
  return crypto.createHash('sha256').update(ip + process.env.BETTER_AUTH_SECRET).digest('hex')
}

// Détecter si c'est un bot (basique)
function isBot(userAgent: string): boolean {
  const botPatterns = [
    /bot/i, /crawler/i, /spider/i, /scraper/i,
    /google/i, /bing/i, /yahoo/i, /facebook/i,
    /lighthouse/i, /pagespeed/i
  ]
  
  return botPatterns.some(pattern => pattern.test(userAgent))
}

/**
 * Enregistre une vue de page
 */
export async function recordPageView(path: string): Promise<void> {
  try {
    const headersList = await headers()
    const userAgent = headersList.get('user-agent') || ''
    
    // Filtrer les bots
    if (isBot(userAgent)) {
      return
    }
    
    // Récupérer l'IP (x-forwarded-for pour les proxies, sinon x-real-ip)
    const forwardedFor = headersList.get('x-forwarded-for')
    const realIP = headersList.get('x-real-ip')
    const remoteAddr = headersList.get('remote-addr')
    
    const clientIP = forwardedFor?.split(',')[0].trim() || 
                     realIP || 
                     remoteAddr || 
                     '127.0.0.1'
    
    const hashedIP = hashIP(clientIP)
    
    // Récupérer l'utilisateur connecté si disponible
    const session = await auth.api.getSession({
      headers: headersList
    })
    
    // Vérifier s'il y a déjà une vue de cette IP pour cette page dans les 30 dernières minutes
    // (éviter de compter les rafraîchissements répétés)
    const recentView = await prisma.pageView.findFirst({
      where: {
        path,
        ipAddress: hashedIP,
        createdAt: {
          gte: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes
        }
      }
    })
    
    // Si pas de vue récente, enregistrer
    if (!recentView) {
      await prisma.pageView.create({
        data: {
          path,
          ipAddress: hashedIP,
          userAgent: userAgent.slice(0, 500), // Limiter la taille
          userId: session?.user?.id || null
        }
      })
    }
    
  } catch (error) {
    // Silencer les erreurs pour ne pas impacter l'UX
    console.error('Erreur lors de l\'enregistrement de la vue:', error)
  }
}

/**
 * Obtient les statistiques de vues pour une page spécifique
 */
export async function getPageViewStats(path: string) {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    
    const [totalViews, uniqueViews, recentViews] = await Promise.all([
      // Total vues historique
      prisma.pageView.count({
        where: { path }
      }),
      
      // Vues uniques (par IP)
      prisma.pageView.groupBy({
        by: ['ipAddress'],
        where: { path },
        _count: { id: true }
      }).then(results => results.length),
      
      // Vues récentes (30 derniers jours)
      prisma.pageView.count({
        where: {
          path,
          createdAt: { gte: thirtyDaysAgo }
        }
      })
    ])
    
    return {
      totalViews,
      uniqueViews,
      recentViews
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des stats de page:', error)
    return {
      totalViews: 0,
      uniqueViews: 0,
      recentViews: 0
    }
  }
}

/**
 * Obtient les pages les plus visitées
 */
export async function getMostViewedPages(limit: number = 10) {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    
    const results = await prisma.pageView.groupBy({
      by: ['path'],
      where: {
        createdAt: { gte: thirtyDaysAgo }
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: limit
    })
    
    return results.map(result => ({
      path: result.path,
      viewCount: result._count.id
    }))
    
  } catch (error) {
    console.error('Erreur lors de la récupération des pages populaires:', error)
    return []
  }
}

/**
 * Obtient les statistiques globales d'analytics
 */
export async function getGlobalAnalytics() {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    
    const [
      totalViews,
      recentViews,
      weeklyViews,
      uniqueVisitors,
      popularPages
    ] = await Promise.all([
      // Total vues
      prisma.pageView.count(),
      
      // Vues derniers 30 jours
      prisma.pageView.count({
        where: { createdAt: { gte: thirtyDaysAgo } }
      }),
      
      // Vues derniers 7 jours
      prisma.pageView.count({
        where: { createdAt: { gte: sevenDaysAgo } }
      }),
      
      // Visiteurs uniques derniers 30 jours
      prisma.pageView.groupBy({
        by: ['ipAddress'],
        where: { createdAt: { gte: thirtyDaysAgo } }
      }).then(results => results.length),
      
      // Pages populaires
      getMostViewedPages(5)
    ])
    
    return {
      totalViews,
      recentViews,
      weeklyViews,
      uniqueVisitors,
      popularPages
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des analytics globales:', error)
    return {
      totalViews: 0,
      recentViews: 0,
      weeklyViews: 0,
      uniqueVisitors: 0,
      popularPages: []
    }
  }
}