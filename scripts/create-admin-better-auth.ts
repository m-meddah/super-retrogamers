#!/usr/bin/env tsx

import { prisma } from "@/lib/prisma"

async function createAdminBetterAuth() {
  try {
    const email = "admin@super-retrogamers.com"
    const password = "SuperRetrogamers"

    console.log("🔄 Suppression de l'ancien administrateur...")
    
    // Supprimer l'ancien admin et ses comptes
    await prisma.account.deleteMany({
      where: {
        user: {
          email: email
        }
      }
    })
    
    await prisma.session.deleteMany({
      where: {
        user: {
          email: email
        }
      }
    })
    
    await prisma.user.deleteMany({
      where: {
        OR: [
          { email: email },
          { role: 'admin' }
        ]
      }
    })

    console.log("✅ Ancien administrateur supprimé")

    // Utiliser l'API better-auth pour créer l'utilisateur
    console.log("🆕 Création via l'API Better-Auth...")
    
    const response = await fetch('http://localhost:3000/api/auth/sign-up/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        name: "Administrateur"
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`Erreur API: ${response.status} - ${errorData}`)
    }

    const result = await response.json()
    console.log("✅ Utilisateur créé via Better-Auth:", result)

    // Mettre à jour le rôle en admin
    await prisma.user.update({
      where: { email },
      data: { 
        role: 'admin',
        emailVerified: true 
      }
    })

    console.log("✅ Administrateur créé avec succès!")
    console.log(`📧 Email: ${email}`)
    console.log(`🔐 Mot de passe: ${password}`)
    console.log(`🔑 Rôle: admin`)
    console.log("\n🎯 Vous pouvez maintenant vous connecter avec ces identifiants")

  } catch (error) {
    console.error("❌ Erreur lors de la création de l'administrateur:", error)
    
    // Fallback: créer directement en base sans better-auth
    console.log("🔄 Tentative de création directe en base...")
    
    try {
      const admin = await prisma.user.create({
        data: {
          email: "admin@super-retrogamers.com",
          name: "Administrateur",
          role: "admin",
          emailVerified: true
        }
      })
      
      console.log("✅ Administrateur créé en fallback!")
      console.log("⚠️  Note: Vous devrez vous inscrire normalement puis changer le rôle en admin")
      
    } catch (fallbackError) {
      console.error("❌ Erreur en fallback:", fallbackError)
    }
  } finally {
    await prisma.$disconnect()
  }
}

createAdminBetterAuth()