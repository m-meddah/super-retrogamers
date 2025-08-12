#!/usr/bin/env tsx

import { prisma } from '../lib/prisma'
import { hash } from 'bcrypt'

async function fixCredentialAccount() {
  try {
    const email = 'admin@super-retrogamers.com'
    const password = 'admin123' // Mot de passe par défaut - à changer après connexion
    
    console.log('🔄 Correction du compte credential...')
    
    // Chercher l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email },
      include: { accounts: true }
    })

    if (!user) {
      console.log('❌ Utilisateur non trouvé')
      return
    }

    // Vérifier s'il y a déjà un compte credential
    const existingCredential = user.accounts.find(acc => acc.providerId === 'credential')
    
    if (existingCredential) {
      console.log('✅ Un compte credential existe déjà')
      return
    }

    // Hacher le mot de passe
    const hashedPassword = await hash(password, 12)
    
    // Créer le compte credential
    await prisma.account.create({
      data: {
        userId: user.id,
        providerId: 'credential',
        accountId: email, // Pour les credentials, accountId = email
        password: hashedPassword,
      }
    })

    console.log('✅ Compte credential créé avec succès!')
    console.log(`📧 Email: ${email}`)
    console.log(`🔑 Mot de passe: ${password}`)
    console.log('')
    console.log('⚠️  IMPORTANT: Changez ce mot de passe après votre première connexion!')
    
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixCredentialAccount()