import { prisma } from '@/lib/prisma'

async function restoreDate() {
  await prisma.gameRegionalDate.update({
    where: { id: 'cmejz3rw5008isjyn50ky1hzu' },
    data: { releaseDate: new Date('1991-02-22T00:00:00.000Z') }
  })
  console.log('✅ Date restaurée')
  await prisma.$disconnect()
}

restoreDate()