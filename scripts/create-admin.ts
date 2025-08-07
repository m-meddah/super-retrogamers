#!/usr/bin/env tsx

import { prisma } from "@/lib/prisma"
import { hash } from "bcrypt"

async function createAdmin() {
  try {
    const email = "admin@super-retrogamers.com"
    const password = "SuperRetrogamers" // À changer en production
    const hashedPassword = await hash(password, 12)

    // Vérifier si un admin existe déjà
    const existingAdmin = await prisma.user.findFirst({
      where: { 
        OR: [
          { email },
          { role: 'admin' }
        ]
      }
    })

    if (existingAdmin) {
      console.log("Un administrateur existe déjà:")
      console.log(`Email: ${existingAdmin.email}`)
      console.log(`Rôle: ${existingAdmin.role}`)
      return
    }

    // Créer l'administrateur
    const admin = await prisma.user.create({
      data: {
        email,
        name: "Administrateur",
        role: "admin",
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

    console.log("✅ Administrateur créé avec succès!")
    console.log(`📧 Email: ${admin.email}`)
    console.log(`🔐 Mot de passe: ${password}`)
    console.log(`🔑 Rôle: ${admin.role}`)
    console.log("\n⚠️  IMPORTANT: Changez le mot de passe après la première connexion!")

  } catch (error) {
    console.error("❌ Erreur lors de la création de l'administrateur:", error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()