import { prisma } from '@/lib/prisma'

async function main() {
  const entry = await prisma.mediaUrlCache.findFirst({
    where: { 
      entityType: 'console', 
      mediaType: 'minicon', 
      region: 'wor' 
    },
    select: { 
      screenscrapeId: true, 
      isValid: true, 
      url: true 
    }
  })
  
  console.log('Entrée minicon:', entry)
  await prisma.$disconnect()
}

main()