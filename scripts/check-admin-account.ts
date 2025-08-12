#!/usr/bin/env tsx

import { prisma } from '../lib/prisma'

async function checkAdminAccount() {
  try {
    console.log('🔍 Vérification du compte admin...')
    
    // Chercher l'utilisateur admin
    const user = await prisma.user.findUnique({
      where: { email: 'admin@super-retrogamers.com' },
      include: {
        accounts: true
      }
    })

    if (!user) {
      console.log('❌ Aucun utilisateur trouvé avec cet email')
      return
    }

    console.log('✅ Utilisateur trouvé:')
    console.log(`   - ID: ${user.id}`)
    console.log(`   - Email: ${user.email}`)
    console.log(`   - Nom: ${user.name}`)
    console.log(`   - Rôle: ${user.role}`)
    console.log(`   - Email vérifié: ${user.emailVerified}`)
    console.log(`   - Comptes associés: ${user.accounts.length}`)

    if (user.accounts.length > 0) {
      console.log('\n📋 Comptes associés:')
      user.accounts.forEach((account, i) => {
        console.log(`   ${i + 1}. Provider: ${account.providerId}`)
        console.log(`      Account ID: ${account.accountId}`)
      })
    } else {
      console.log('⚠️  Aucun compte credential trouvé - c\'est probablement le problème!')
    }

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAdminAccount()