#!/usr/bin/env tsx

import { prisma } from '../lib/prisma'

async function fixAdminAccount() {
  try {
    const email = 'admin@super-retrogamers.com'
    
    console.log('🔄 Correction du compte administrateur...')
    
    // Supprimer l'utilisateur existant et tous ses comptes associés
    console.log(`🗑️  Suppression du compte existant: ${email}`)
    
    // Supprimer l'utilisateur (cascade supprimera les accounts)
    const deletedUser = await prisma.user.delete({
      where: { email }
    })
    
    if (deletedUser) {
      console.log('✅ Ancien compte supprimé')
    }
    
    console.log('💡 Vous pouvez maintenant vous inscrire normalement sur /register avec:')
    console.log(`   - Email: ${email}`)
    console.log('   - Un mot de passe de votre choix')
    console.log('   - Le rôle admin sera assigné automatiquement')
    
  } catch (error) {
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      console.log('ℹ️  Aucun compte à supprimer')
    } else {
      console.error('❌ Erreur:', error)
    }
  } finally {
    await prisma.$disconnect()
  }
}

fixAdminAccount()