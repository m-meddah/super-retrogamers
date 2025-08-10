#!/usr/bin/env tsx

import { prisma } from '../lib/prisma'

async function promoteToAdmin() {
  try {
    const email = 'admin@super-retrogamers.com'
    
    console.log('🔄 Promotion au rôle administrateur...')
    
    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email }
    })
    
    if (!user) {
      console.log(`❌ Aucun utilisateur trouvé avec l'email: ${email}`)
      return
    }
    
    console.log(`👤 Utilisateur trouvé: ${user.name} (${user.email})`)
    console.log(`🎭 Rôle actuel: ${user.role}`)
    
    if (user.role === 'admin') {
      console.log('✅ L\'utilisateur est déjà administrateur')
      return
    }
    
    // Promouvoir au rôle admin
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { role: 'admin' }
    })
    
    console.log('✅ Promotion réussie!')
    console.log(`👑 ${updatedUser.name} est maintenant administrateur`)
    console.log('')
    console.log('💡 Reconnectez-vous pour que les changements prennent effet')
    
  } catch (error) {
    console.error('❌ Erreur lors de la promotion:', error)
  } finally {
    await prisma.$disconnect()
  }
}

promoteToAdmin()