import { prisma } from '@/lib/prisma'

async function forceClearAuth() {
  try {
    console.log('🧹 FORCE CLEARING ALL AUTH DATA...')
    
    // Supprimer TOUT ce qui concerne l'auth
    await prisma.session.deleteMany({})
    console.log('✅ All sessions deleted')
    
    await prisma.account.deleteMany({})
    console.log('✅ All accounts deleted')
    
    // Aussi supprimer les tokens de vérification si ils existent
    try {
      await prisma.verification.deleteMany({})
      console.log('✅ All verification tokens deleted')
    } catch (e) {
      console.log('ℹ️ No verification table found')
    }
    
    console.log('🎉 ALL AUTH DATA CLEARED!')
    console.log('👉 Now restart your server and clear browser data!')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

forceClearAuth()