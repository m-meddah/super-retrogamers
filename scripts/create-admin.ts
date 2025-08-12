#!/usr/bin/env tsx

import { prisma } from '../lib/prisma'
import { auth } from '../lib/auth'

async function createAdmin() {
  try {
    const email = 'admin@super-retrogamers.com'
    const password = 'SuperRetrogamers'
    
    console.log('🔄 Suppression et recréation complète du compte admin...')
    
    // Supprimer complètement l'utilisateur existant
    await prisma.user.deleteMany({
      where: { email }
    })
    
    console.log('🗑️ Ancien compte supprimé')
    
    // Utiliser Better Auth pour créer le compte proprement
    console.log('✨ Création du nouveau compte avec Better Auth...')
    
    // Simuler une création de compte via Better Auth
    const result = await auth.api.signUpEmail({
      body: {
        name: 'Administrateur',
        email: email,
        password: password,
      }
    })
    
    if (result) {
      console.log('✅ Compte créé avec Better Auth!')
      
      // Mettre à jour le rôle pour en faire un admin
      await prisma.user.update({
        where: { email },
        data: { role: 'admin' }
      })
      
      console.log('✅ Rôle admin assigné!')
      console.log('')
      console.log('🎉 Vous pouvez maintenant vous connecter avec:')
      console.log(`📧 Email: ${email}`)
      console.log(`🔑 Mot de passe: ${password}`)
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()