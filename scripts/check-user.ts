import { prisma } from '@/lib/prisma'

async function checkUser() {
  try {
    console.log('🔍 Checking user data...')
    
    // Vérifier tous les utilisateurs
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      }
    })
    
    console.log('📊 Users in database:')
    users.forEach(user => {
      console.log(`- ${user.email} (${user.role}) - emailVerified: ${user.emailVerified}`)
    })
    
    // Vérifier les sessions
    const sessions = await prisma.session.findMany()
    console.log(`📊 Sessions: ${sessions.length}`)
    
    // Vérifier les comptes
    const accounts = await prisma.account.findMany()
    console.log(`📊 Accounts: ${accounts.length}`)
    
    if (users.length === 0) {
      console.log('❌ No users found! Need to recreate admin user.')
    }
    
  } catch (error) {
    console.error('❌ Error checking user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUser()