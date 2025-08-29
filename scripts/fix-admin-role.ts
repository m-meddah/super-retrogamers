import { prisma } from '@/lib/prisma'

async function fixAdminRole() {
  try {
    console.log('🔧 Fixing admin role...')
    
    // Mettre à jour le rôle en admin
    const updatedUser = await prisma.user.update({
      where: { email: 'admin@super-retrogamers.com' },
      data: { 
        role: 'admin',
        emailVerified: true // Boolean, pas DateTime
      }
    })
    
    console.log('✅ Admin role updated:', updatedUser)
    console.log('🎉 Admin user is ready!')
    console.log('👉 Email: admin@super-retrogamers.com')
    console.log('👉 Password: admin123')
    
  } catch (error) {
    console.error('❌ Error fixing admin role:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixAdminRole()