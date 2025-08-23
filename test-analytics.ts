import { prisma } from './lib/prisma'

async function addTestViews() {
  console.log('🧪 Ajout de vues de test pour les analytics...')

  // Récupérer quelques jeux pour créer des vues de test
  const games = await prisma.game.findMany({
    select: {
      slug: true,
      title: true,
      console: {
        select: {
          slug: true,
          name: true
        }
      }
    },
    take: 5
  })

  console.log(`📊 Trouvé ${games.length} jeux pour les tests`)

  // Créer des vues de test avec des IPs hashées différentes
  for (const game of games) {
    const viewCount = Math.floor(Math.random() * 20) + 5 // Entre 5 et 25 vues
    
    for (let i = 0; i < viewCount; i++) {
      // Créer une IP hashée unique pour chaque vue
      const fakeHashedIP = `test-ip-${game.slug}-${i}-${Date.now()}`
      
      // Format du path selon le système existant
      const path = `/jeux/${game.slug}`
      
      await prisma.pageView.create({
        data: {
          path,
          ipAddress: fakeHashedIP,
          userAgent: 'Test User Agent',
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000) // Derniers 30 jours
        }
      })
    }
    
    console.log(`✅ ${viewCount} vues ajoutées pour "${game.title}" (${game.console?.name})`)
  }

  // Ajouter aussi quelques vues pour la homepage
  for (let i = 0; i < 50; i++) {
    await prisma.pageView.create({
      data: {
        path: '/',
        ipAddress: `home-ip-${i}-${Date.now()}`,
        userAgent: 'Test User Agent',
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000) // Derniers 7 jours
      }
    })
  }

  console.log('✅ 50 vues ajoutées pour la homepage')
  console.log('🎉 Données de test créées ! Vous pouvez maintenant tester /admin/analytics')

  await prisma.$disconnect()
}

addTestViews().catch(console.error)