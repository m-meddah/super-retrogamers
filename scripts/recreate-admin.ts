import { prisma } from '@/lib/prisma'

async function recreateAdmin() {
  try {
    console.log('🔄 Recreating admin user...')
    
    // Supprimer l'ancien admin
    await prisma.user.deleteMany({
      where: { email: 'admin@super-retrogamers.com' }
    })
    console.log('✅ Old admin deleted')
    
    // Créer le nouvel admin avec Better-auth
    const { auth } = await import('@/lib/auth')
    
    const result = await auth.api.signUpEmail({
      body: {
        email: 'admin@super-retrogamers.com',
        password: 'admin123',
        name: 'Admin'
      }
    })
    
    console.log('✅ New admin created:', result)
    
    // Mettre à jour le rôle en admin
    await prisma.user.update({
      where: { email: 'admin@super-retrogamers.com' },
      data: { 
        role: 'admin',
        emailVerified: new Date() // Forcer la vérification
      }
    })
    
    console.log('✅ Admin role set')
    console.log('🎉 Admin user recreated!')
    console.log('👉 Email: admin@super-retrogamers.com')
    console.log('👉 Password: admin123')
    
  } catch (error) {
    console.error('❌ Error recreating admin:', error)
  } finally {
    await prisma.$disconnect()
  }
}

recreateAdmin()