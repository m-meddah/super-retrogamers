#!/usr/bin/env tsx

import { prisma } from "@/lib/prisma"

async function checkAdmin() {
  try {
    const email = "admin@super-retrogamers.com"
    
    console.log("🔍 Vérification de l'utilisateur admin...")
    
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        accounts: true,
        sessions: true
      }
    })
    
    if (!user) {
      console.log("❌ Aucun utilisateur trouvé avec cet email")
      return
    }
    
    console.log("✅ Utilisateur trouvé:")
    console.log({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt
    })
    
    console.log("\n🔐 Comptes associés:")
    user.accounts.forEach((account, index) => {
      console.log(`${index + 1}. Provider: ${account.providerId}`)
      console.log(`   Account ID: ${account.accountId}`)
      console.log(`   Has Password: ${account.password ? 'Oui' : 'Non'}`)
      if (account.password) {
        console.log(`   Password Hash: ${account.password.substring(0, 20)}...`)
      }
    })
    
    console.log("\n📋 Sessions actives:")
    if (user.sessions.length === 0) {
      console.log("   Aucune session active")
    } else {
      user.sessions.forEach((session, index) => {
        console.log(`${index + 1}. Token: ${session.token.substring(0, 20)}...`)
        console.log(`   Expires: ${session.expiresAt}`)
        console.log(`   IP: ${session.ipAddress || 'N/A'}`)
      })
    }
    
    // Test de connexion avec Better-auth
    console.log("\n🧪 Test de connexion Better-auth...")
    const testUrl = process.env.BETTER_AUTH_URL || "http://localhost:3001"
    console.log(`URL Better-auth: ${testUrl}`)
    
    try {
      const response = await fetch(`${testUrl}/api/auth/sign-in/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: "SuperRetrogamers"
        })
      })
      
      const responseText = await response.text()
      console.log(`Status: ${response.status}`)
      console.log(`Response: ${responseText}`)
      
      if (response.ok) {
        console.log("✅ Test de connexion réussi!")
      } else {
        console.log("❌ Test de connexion échoué")
      }
    } catch (fetchError) {
      console.log("❌ Erreur lors du test de connexion:", fetchError)
    }
    
  } catch (error) {
    console.error("❌ Erreur:", error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAdmin()