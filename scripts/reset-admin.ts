#!/usr/bin/env tsx

import { prisma } from "@/lib/prisma"
import { hash } from "bcrypt"

async function resetAdmin() {
  try {
    const email = "admin@super-retrogamers.com"
    const password = "SuperRetrogamers"
    const hashedPassword = await hash(password, 12)

    console.log("🔄 Suppression de l'ancien administrateur...")
    
    // Supprimer l'ancien admin et ses comptes
    await prisma.account.deleteMany({
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
    console.log("🆕 Création du nouvel administrateur...")

    // Créer le nouvel administrateur
    const admin = await prisma.user.create({
      data: {
        email,
        name: "Administrateur",
        role: "admin",
        emailVerified: true
      }
    })

    // Créer le compte associé
    await prisma.account.create({
      data: {
        accountId: admin.id,
        providerId: "credential",
        userId: admin.id,
        password: hashedPassword,
      }
    })

    console.log("✅ Nouvel administrateur créé avec succès!")
    console.log(`📧 Email: ${admin.email}`)
    console.log(`🔐 Mot de passe: ${password}`)
    console.log(`🔑 Rôle: ${admin.role}`)
    console.log("\n🎯 Vous pouvez maintenant vous connecter avec ces identifiants")

  } catch (error) {
    console.error("❌ Erreur lors de la réinitialisation de l'administrateur:", error)
  } finally {
    await prisma.$disconnect()
  }
}

resetAdmin()