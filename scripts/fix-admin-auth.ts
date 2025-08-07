#!/usr/bin/env tsx

import { prisma } from "@/lib/prisma"
import { hashPassword } from "better-auth/crypto"

async function fixAdminAuth() {
  try {
    const email = "admin@super-retrogamers.com"
    const password = "SuperRetrogamers"

    console.log("🔍 Vérification de l'utilisateur admin existant...")

    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (!existingUser) {
      console.log("❌ Aucun utilisateur admin trouvé. Création...")
      
      // Créer l'utilisateur admin
      const admin = await prisma.user.create({
        data: {
          email,
          name: "Administrateur",
          role: "admin",
          emailVerified: true
        }
      })
      
      console.log("✅ Utilisateur admin créé")
    } else {
      console.log("✅ Utilisateur admin trouvé:", existingUser.email)
    }

    // Supprimer les anciens comptes credential
    console.log("🧹 Suppression des anciens comptes credential...")
    await prisma.account.deleteMany({
      where: {
        userId: existingUser?.id || email,
        providerId: "credential"
      }
    })

    // Créer le hash du mot de passe avec Better-auth
    console.log("🔐 Création du hash du mot de passe...")
    const hashedPassword = await hashPassword(password)

    // Créer un nouveau compte credential avec le bon format Better-auth
    const newAccount = await prisma.account.create({
      data: {
        accountId: email, // Better-auth utilise l'email comme accountId pour credential
        providerId: "credential",
        userId: existingUser?.id || email,
        password: hashedPassword,
      }
    })

    console.log("✅ Compte credential créé avec Better-auth!")
    console.log(`📧 Email: ${email}`)
    console.log(`🔐 Mot de passe: ${password}`)
    console.log(`🔑 Rôle: admin`)
    console.log("\n🎯 Vous pouvez maintenant vous connecter sur /login")

  } catch (error) {
    console.error("❌ Erreur:", error)
    
    // Afficher des informations de debug
    console.log("\n🔍 Informations de debug:")
    try {
      const users = await prisma.user.findMany({
        where: { role: 'admin' }
      })
      console.log("Utilisateurs admin:", users)
      
      const accounts = await prisma.account.findMany({
        where: { providerId: 'credential' }
      })
      console.log("Comptes credential:", accounts)
    } catch (debugError) {
      console.error("Erreur debug:", debugError)
    }
  } finally {
    await prisma.$disconnect()
  }
}

fixAdminAuth()