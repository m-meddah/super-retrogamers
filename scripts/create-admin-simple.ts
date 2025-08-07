#!/usr/bin/env tsx

import { prisma } from "@/lib/prisma"

async function createAdminSimple() {
  try {
    const email = "admin@super-retrogamers.com"

    console.log("🔄 Nettoyage des anciens comptes admin...")
    
    // Supprimer complètement tous les comptes admin existants
    await prisma.account.deleteMany({
      where: {
        user: {
          OR: [
            { email: email },
            { role: 'admin' }
          ]
        }
      }
    })
    
    await prisma.session.deleteMany({
      where: {
        user: {
          OR: [
            { email: email },
            { role: 'admin' }
          ]
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

    console.log("✅ Anciens comptes supprimés")
    console.log("🆕 Création d'un utilisateur admin simplifié...")

    // Créer seulement l'utilisateur admin, sans compte de connexion
    // L'utilisateur devra s'inscrire normalement puis son rôle sera modifié
    const admin = await prisma.user.create({
      data: {
        email,
        name: "Administrateur",
        role: "admin",
        emailVerified: true
      }
    })

    console.log("✅ Utilisateur admin créé!")
    console.log(`📧 Email: ${admin.email}`)
    console.log(`🔑 Rôle: ${admin.role}`)
    console.log("\n🎯 PROCÉDURE DE CONNEXION:")
    console.log("1. Allez sur /register")
    console.log(`2. Inscrivez-vous avec l'email: ${email}`)
    console.log("3. Utilisez n'importe quel mot de passe")
    console.log("4. Le système détectera automatiquement le rôle admin")

  } catch (error) {
    console.error("❌ Erreur lors de la création de l'administrateur:", error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdminSimple()