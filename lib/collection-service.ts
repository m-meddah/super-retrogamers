import { prisma } from '@/lib/prisma'
import { 
  CollectionStatus, 
  ItemCondition
} from '@prisma/client'

export interface AddConsoleToCollectionData {
  userId: string
  consoleId?: string
  consoleVariantId?: string
  status: CollectionStatus
  condition?: ItemCondition
  purchaseDate?: Date
  purchasePrice?: number
  currentValue?: number
  notes?: string
  isComplete?: boolean
  hasBox?: boolean
  hasManual?: boolean
  hasCables?: boolean
  hasControllers?: boolean
  controllersCount?: number
}

export interface AddGameToCollectionData {
  userId: string
  gameId?: string
  gameVariantId?: string
  status: CollectionStatus
  condition?: ItemCondition
  purchaseDate?: Date
  purchasePrice?: number
  currentValue?: number
  notes?: string
  isComplete?: boolean
  hasBox?: boolean
  hasManual?: boolean
  hasMap?: boolean
  isCompleted?: boolean
  hoursPlayed?: number
  lastPlayed?: Date
}

export class CollectionService {
  // Console Collection Management
  static async addConsoleToCollection(data: AddConsoleToCollectionData) {
    const collection = await prisma.userConsoleCollection.create({
      data: {
        userId: data.userId,
        consoleId: data.consoleId,
        consoleVariantId: data.consoleVariantId,
        status: data.status,
        condition: data.condition,
        purchaseDate: data.purchaseDate,
        purchasePrice: data.purchasePrice,
        currentValue: data.currentValue,
        notes: data.notes,
        isComplete: data.isComplete || false,
        hasBox: data.hasBox || false,
        hasManual: data.hasManual || false,
        hasCables: data.hasCables || false,
        hasControllers: data.hasControllers || false,
        controllersCount: data.controllersCount || 0,
      },
      include: {
        console: true,
        variant: true,
      }
    })

    // Update user collection stats
    await this.updateUserStats(data.userId)
    
    return collection
  }

  static async getUserConsoleCollection(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit

    const [items, total] = await Promise.all([
      prisma.userConsoleCollection.findMany({
        where: { userId },
        include: {
          console: {
            include: {
              medias: true
            }
          },
          variant: {
            include: {
              console: {
                include: {
                  medias: true
                }
              }
            }
          }
        },
        orderBy: { addedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.userConsoleCollection.count({
        where: { userId }
      })
    ])

    return {
      items,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page
    }
  }

  static async removeConsoleFromCollection(collectionId: string, userId: string) {
    const deleted = await prisma.userConsoleCollection.deleteMany({
      where: {
        id: collectionId,
        userId // Security: ensure user can only delete their own items
      }
    })

    if (deleted.count > 0) {
      await this.updateUserStats(userId)
    }

    return deleted.count > 0
  }

  // Game Collection Management
  static async addGameToCollection(data: AddGameToCollectionData) {
    const collection = await prisma.userGameCollection.create({
      data: {
        userId: data.userId,
        gameId: data.gameId,
        gameVariantId: data.gameVariantId,
        status: data.status,
        condition: data.condition,
        purchaseDate: data.purchaseDate,
        purchasePrice: data.purchasePrice,
        currentValue: data.currentValue,
        notes: data.notes,
        isComplete: data.isComplete || false,
        hasBox: data.hasBox || false,
        hasManual: data.hasManual || false,
        hasMap: data.hasMap || false,
        isCompleted: data.isCompleted || false,
        hoursPlayed: data.hoursPlayed,
        lastPlayed: data.lastPlayed,
      },
      include: {
        game: {
          include: {
            console: true
          }
        },
        variant: {
          include: {
            game: {
              include: {
                console: true
              }
            }
          }
        }
      }
    })

    // Update user collection stats
    await this.updateUserStats(data.userId)
    
    return collection
  }

  static async getUserGameCollection(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit

    const [items, total] = await Promise.all([
      prisma.userGameCollection.findMany({
        where: { userId },
        include: {
          game: {
            include: {
              console: true,
              medias: true
            }
          },
          variant: {
            include: {
              game: {
                include: {
                  console: true,
                  medias: true
                }
              }
            }
          }
        },
        orderBy: { addedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.userGameCollection.count({
        where: { userId }
      })
    ])

    return {
      items,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page
    }
  }

  static async removeGameFromCollection(collectionId: string, userId: string) {
    const deleted = await prisma.userGameCollection.deleteMany({
      where: {
        id: collectionId,
        userId // Security: ensure user can only delete their own items
      }
    })

    if (deleted.count > 0) {
      await this.updateUserStats(userId)
    }

    return deleted.count > 0
  }

  // Collection Statistics
  static async updateUserStats(userId: string) {
    const consoleStats = await prisma.userConsoleCollection.aggregate({
      where: { userId, status: 'OWNED' },
      _count: { id: true },
      _sum: { currentValue: true }
    })

    const gameStats = await prisma.userGameCollection.aggregate({
      where: { userId, status: 'OWNED' },
      _count: { id: true },
      _sum: { currentValue: true }
    })

    const completedGames = await prisma.userGameCollection.count({
      where: { userId, isCompleted: true }
    })

    // Calculate rare items (you'll need to implement rarity logic)
    const rareConsoles = await prisma.userConsoleCollection.count({
      where: {
        userId,
        status: 'OWNED',
        variant: {
          rarity: {
            in: ['Rare', 'Very Rare', 'Ultra Rare']
          }
        }
      }
    })

    const rareGames = await prisma.userGameCollection.count({
      where: {
        userId,
        status: 'OWNED',
        variant: {
          rarity: {
            in: ['Rare', 'Very Rare', 'Ultra Rare']
          }
        }
      }
    })

    const totalConsoles = consoleStats._count.id || 0
    const totalGames = gameStats._count.id || 0
    const totalConsoleValue = consoleStats._sum.currentValue || 0
    const totalGameValue = gameStats._sum.currentValue || 0

    await prisma.userCollectionStats.upsert({
      where: { userId },
      update: {
        totalConsoles,
        totalConsoleValue,
        rareConsoles,
        totalGames,
        totalGameValue,
        completedGames,
        rareGames,
        totalItems: totalConsoles + totalGames,
        totalValue: totalConsoleValue + totalGameValue,
        lastCalculated: new Date()
      },
      create: {
        userId,
        totalConsoles,
        totalConsoleValue,
        rareConsoles,
        totalGames,
        totalGameValue,
        completedGames,
        rareGames,
        totalItems: totalConsoles + totalGames,
        totalValue: totalConsoleValue + totalGameValue,
      }
    })
  }

  static async getUserStats(userId: string) {
    return await prisma.userCollectionStats.findUnique({
      where: { userId }
    })
  }

  // Wishlist Management
  static async addToWishlist(userId: string, data: {
    gameId?: string
    consoleId?: string
    gameVariantId?: string
    consoleVariantId?: string
    priority?: number
    maxPrice?: number
    notes?: string
  }) {
    return await prisma.userWishlist.create({
      data: {
        userId,
        ...data,
        priority: data.priority || 1
      },
      include: {
        game: {
          include: {
            console: true
          }
        },
        console: true
      }
    })
  }

  static async getUserWishlist(userId: string) {
    return await prisma.userWishlist.findMany({
      where: { userId },
      include: {
        game: {
          include: {
            console: true
          }
        },
        console: true
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    })
  }

  static async removeFromWishlist(wishlistId: string, userId: string) {
    const deleted = await prisma.userWishlist.deleteMany({
      where: {
        id: wishlistId,
        userId
      }
    })

    return deleted.count > 0
  }

  // Search and Filter
  static async searchUserCollection(userId: string, query: string, type: 'console' | 'game' | 'all' = 'all') {
    const results: {
      consoles?: unknown[]
      games?: unknown[]
    } = {}

    if (type === 'console' || type === 'all') {
      results.consoles = await prisma.userConsoleCollection.findMany({
        where: {
          userId,
          OR: [
            {
              console: {
                name: {
                  contains: query,
                  mode: 'insensitive'
                }
              }
            },
            {
              variant: {
                name: {
                  contains: query,
                  mode: 'insensitive'
                }
              }
            }
          ]
        },
        include: {
          console: true,
          variant: {
            include: {
              console: true
            }
          }
        }
      })
    }

    if (type === 'game' || type === 'all') {
      results.games = await prisma.userGameCollection.findMany({
        where: {
          userId,
          OR: [
            {
              game: {
                title: {
                  contains: query,
                  mode: 'insensitive'
                }
              }
            },
            {
              variant: {
                name: {
                  contains: query,
                  mode: 'insensitive'
                }
              }
            }
          ]
        },
        include: {
          game: {
            include: {
              console: true
            }
          },
          variant: {
            include: {
              game: {
                include: {
                  console: true
                }
              }
            }
          }
        }
      })
    }

    return results
  }
}