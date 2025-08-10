/**
 * Script pour créer un utilisateur administrateur
 * Usage: npx tsx scripts/create-admin.ts <email> <password> [name]
 */

import { prisma } from '../lib/prisma'

async function createAdmin(email: string, password: string, name?: string) {
  try {
    console.log('🔄 Création d\'un utilisateur administrateur...')
    
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })
    
    if (existingUser) {
      console.log('❌ Un utilisateur avec cet email existe déjà')
      process.exit(1)
    }
    
    // Créer l'utilisateur admin
    const adminUser = await prisma.user.create({
      data: {
        email,
        name: name || 'Administrateur',
        role: 'admin',
        emailVerified: true,
      }
    })
    
    // Note: Pour définir le mot de passe, utilisez l'interface web de l'application
    // ou configurez Better Auth pour accepter les mots de passe lors de la première connexion
    
    console.log('✅ Utilisateur administrateur créé avec succès:')
    console.log(`   - Email: ${email}`)
    console.log(`   - Nom: ${adminUser.name}`)
    console.log(`   - ID: ${adminUser.id}`)
    console.log(`   - Rôle: ${adminUser.role}`)
    console.log('')
    console.log('⚠️  Important: Le mot de passe doit être défini via l\'interface web')
    console.log('💡 Connectez-vous sur /register pour définir le mot de passe')
    
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'administrateur:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Vérification des arguments
const args = process.argv.slice(2)
if (args.length < 1) {
  console.log('Usage: npx tsx scripts/create-admin.ts <email> [name]')
  console.log('Exemple: npx tsx scripts/create-admin.ts admin@example.com "John Doe"')
  process.exit(1)
}

const [email, name] = args
const password = 'temp' // Pas utilisé avec Better Auth

// Validation de l'email
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
if (!emailRegex.test(email)) {
  console.log('❌ Format d\'email invalide')
  process.exit(1)
}


createAdmin(email, password, name)