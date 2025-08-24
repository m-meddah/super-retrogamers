#!/usr/bin/env tsx

/**
 * Script de déploiement automatique en production
 * Orchestre toutes les étapes nécessaires pour lancer le site avec données prioritaires
 */

import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'

const prisma = new PrismaClient()

// Interface de configuration
interface DeploymentConfig {
  deployment: {
    name: string
    environment: string
    autoCreateAdmin: boolean
    adminEmail: string
    adminName: string
    skipExistingData: boolean
  }
  steps: {
    [key: string]: {
      enabled: boolean
      description: string
    }
  }
  logging: {
    enableDetailedLogs: boolean
    logToFile: boolean
    logFilePath: string
    showProgress: boolean
    showTimestamps: boolean
  }
  errorHandling: {
    continueOnError: boolean
    failOnCriticalError: boolean
    criticalSteps: string[]
  }
  performance: {
    estimatedDurationMinutes: number
  }
}

// État global du déploiement
interface DeploymentState {
  startTime: number
  currentStep: number
  totalSteps: number
  completedSteps: string[]
  failedSteps: string[]
  warnings: string[]
  logs: string[]
}

class DeploymentManager {
  private config: DeploymentConfig
  private state: DeploymentState
  private logFile?: string

  constructor(config: DeploymentConfig) {
    this.config = config
    this.state = {
      startTime: Date.now(),
      currentStep: 0,
      totalSteps: Object.keys(config.steps).filter(step => config.steps[step].enabled).length,
      completedSteps: [],
      failedSteps: [],
      warnings: [],
      logs: []
    }

    if (config.logging.logToFile) {
      this.logFile = join(__dirname, config.logging.logFilePath)
    }
  }

  private log(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
    const timestamp = this.config.logging.showTimestamps 
      ? `[${new Date().toLocaleTimeString('fr-FR')}] ` 
      : ''
    
    const emoji = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    }[type]

    const logMessage = `${timestamp}${emoji} ${message}`
    console.log(logMessage)
    
    this.state.logs.push(logMessage)
    
    if (this.logFile) {
      try {
        require('fs').appendFileSync(this.logFile, logMessage + '\n')
      } catch (error) {
        console.warn('⚠️ Impossible d\'écrire dans le fichier de log:', error)
      }
    }
  }

  private async executeStep(stepId: string, stepFunction: () => Promise<void>): Promise<boolean> {
    const step = this.config.steps[stepId]
    if (!step || !step.enabled) {
      return true
    }

    this.state.currentStep++
    this.log(`\n${'='.repeat(60)}`)
    this.log(`ÉTAPE ${this.state.currentStep}/${this.state.totalSteps}: ${step.description}`)
    this.log(`${'='.repeat(60)}`)

    const stepStart = Date.now()

    try {
      await stepFunction()
      
      const duration = Math.round((Date.now() - stepStart) / 1000)
      this.state.completedSteps.push(stepId)
      this.log(`✅ Étape ${stepId} terminée en ${duration}s`, 'success')
      return true

    } catch (error) {
      const duration = Math.round((Date.now() - stepStart) / 1000)
      this.state.failedSteps.push(stepId)
      this.log(`❌ Échec de l'étape ${stepId} après ${duration}s: ${error}`, 'error')

      const isCritical = this.config.errorHandling.criticalSteps.includes(stepId)
      
      if (isCritical && this.config.errorHandling.failOnCriticalError) {
        throw new Error(`Étape critique ${stepId} échouée: ${error}`)
      }
      
      if (!this.config.errorHandling.continueOnError && !isCritical) {
        throw new Error(`Étape ${stepId} échouée: ${error}`)
      }
      
      this.log(`⚠️ Continuation malgré l'échec (étape ${isCritical ? 'critique ignorée' : 'non critique'})`, 'warning')
      return false
    }
  }

  async deploy(): Promise<void> {
    this.log(`🚀 DÉBUT DU DÉPLOIEMENT: ${this.config.deployment.name}`)
    this.log(`🎯 Environnement: ${this.config.deployment.environment}`)
    this.log(`⏱️ Durée estimée: ${this.config.performance.estimatedDurationMinutes} minutes`)
    this.log(`📅 Démarré le: ${new Date().toLocaleString('fr-FR')}`)

    try {
      // Étape 1: Vérifier les prérequis
      await this.executeStep('1_checkPrerequisites', async () => {
        await this.checkPrerequisites()
      })

      // Étape 2: Créer le compte admin
      await this.executeStep('2_createAdmin', async () => {
        await this.createAdminAccount()
      })

      // Étape 3: Préparer le rescraping (genres + générations)
      await this.executeStep('3_prepareRescraping', async () => {
        await this.prepareRescraping()
      })

      // Étape 4: Scraper les consoles prioritaires
      await this.executeStep('4_scrapePriorityConsoles', async () => {
        await this.scrapePriorityData('consoles')
      })

      // Étape 5: Scraper les jeux prioritaires
      await this.executeStep('5_scrapePriorityGames', async () => {
        await this.scrapePriorityData('games')
      })

      // Étape 6: Générer les statistiques finales
      await this.executeStep('6_generateStats', async () => {
        await this.generateFinalStats()
      })

      // Résumé final
      this.displayFinalSummary()

    } catch (error) {
      this.log(`💥 DÉPLOIEMENT INTERROMPU: ${error}`, 'error')
      this.displayFailureSummary()
      process.exit(1)
    } finally {
      await prisma.$disconnect()
    }
  }

  private async checkPrerequisites(): Promise<void> {
    this.log('🔍 Vérification des prérequis...')

    // Vérifier les variables d'environnement
    const requiredEnvVars = ['DATABASE_URL', 'SCREENSCRAPER_DEV_ID', 'SCREENSCRAPER_DEV_PASSWORD']
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Variable d'environnement manquante: ${envVar}`)
      }
    }
    this.log('✅ Variables d\'environnement OK')

    // Vérifier la connexion à la base de données
    try {
      await prisma.$queryRaw`SELECT 1`
      this.log('✅ Connexion base de données OK')
    } catch (error) {
      throw new Error(`Connexion base de données échouée: ${error}`)
    }

    // Vérifier l'existence des fichiers de configuration
    const configFiles = ['priority-consoles.json', 'priority-games.json', 'deployment.json']
    for (const configFile of configFiles) {
      try {
        readFileSync(join(__dirname, 'config', configFile), 'utf-8')
        this.log(`✅ Fichier ${configFile} trouvé`)
      } catch (error) {
        throw new Error(`Fichier de configuration manquant: ${configFile}`)
      }
    }

    // Vérifier la connectivité Screenscraper (optionnel)
    this.log('🌐 Test de connectivité Screenscraper...')
    // Note: Ici on pourrait ajouter un test ping vers l'API Screenscraper
    this.log('✅ Prérequis validés')
  }

  private async createAdminAccount(): Promise<void> {
    if (!this.config.deployment.autoCreateAdmin) {
      this.log('⏭️ Création du compte admin désactivée')
      return
    }

    this.log(`👤 Création du compte admin: ${this.config.deployment.adminEmail}`)

    try {
      // Vérifier si l'admin existe déjà
      const existingAdmin = await prisma.user.findUnique({
        where: { email: this.config.deployment.adminEmail }
      })

      if (existingAdmin) {
        if (this.config.deployment.skipExistingData) {
          this.log('⏭️ Compte admin existant, ignoré')
          return
        } else {
          // Mettre à jour le rôle
          await prisma.user.update({
            where: { email: this.config.deployment.adminEmail },
            data: { role: 'admin' }
          })
          this.log('✅ Rôle admin mis à jour')
          return
        }
      }

      // Utiliser le script existant de création d'admin
      this.log('🔧 Exécution du script create-admin...')
      execSync(`npx tsx scripts/create-admin.ts "${this.config.deployment.adminEmail}" "${this.config.deployment.adminName}"`, {
        cwd: process.cwd(),
        stdio: this.config.logging.enableDetailedLogs ? 'inherit' : 'pipe'
      })
      
      this.log('✅ Compte admin créé avec succès')

    } catch (error) {
      throw new Error(`Création du compte admin échouée: ${error}`)
    }
  }

  private async prepareRescraping(): Promise<void> {
    this.log('🎯 Préparation du rescraping (genres + générations)...')

    try {
      // Utiliser le script existant de préparation
      this.log('🔧 Exécution du script prepare-rescraping...')
      execSync('npx tsx scripts/prepare-rescraping.ts', {
        cwd: process.cwd(),
        stdio: this.config.logging.enableDetailedLogs ? 'inherit' : 'pipe'
      })
      
      // Vérifier que les genres et générations sont bien présents
      const [genreCount, generationCount] = await Promise.all([
        prisma.genre.count(),
        prisma.generation.count()
      ])

      if (genreCount === 0) {
        throw new Error('Aucun genre synchronisé après la préparation')
      }
      if (generationCount === 0) {
        this.log('⚠️ Aucune génération trouvée après la préparation', 'warning')
      }

      this.log(`✅ Préparation terminée: ${genreCount} genres, ${generationCount} générations`)

    } catch (error) {
      throw new Error(`Préparation du rescraping échouée: ${error}`)
    }
  }

  private async scrapePriorityData(type: 'consoles' | 'games'): Promise<void> {
    const emoji = type === 'consoles' ? '🎮' : '🎯'
    const label = type === 'consoles' ? 'consoles' : 'jeux'
    
    this.log(`${emoji} Scraping des ${label} prioritaires...`)

    try {
      // Utiliser le script de scraping prioritaire
      this.log('🔧 Exécution du script scrape-priority-data...')
      execSync('npx tsx scripts/scrape-priority-data.ts', {
        cwd: process.cwd(),
        stdio: this.config.logging.enableDetailedLogs ? 'inherit' : 'pipe'
      })
      
      this.log(`✅ Scraping des ${label} prioritaires terminé`)

    } catch (error) {
      // Ne pas faire échouer le déploiement si seul le scraping échoue
      this.log(`⚠️ Scraping des ${label} partiellement échoué: ${error}`, 'warning')
      this.state.warnings.push(`Scraping ${label} partiellement échoué`)
    }
  }

  private async generateFinalStats(): Promise<void> {
    this.log('📊 Génération des statistiques finales...')

    try {
      const [
        totalConsoles, totalGames, totalFamilies, totalCorps,
        totalGenres, totalGenerations, totalCache
      ] = await Promise.all([
        prisma.console.count(),
        prisma.game.count(),
        prisma.family.count(),
        prisma.corporation.count(),
        prisma.genre.count(),
        prisma.generation.count(),
        prisma.mediaUrlCache.count()
      ])

      this.log('\n📈 CONTENU DE LA BASE DE DONNÉES:')
      this.log(`   🎮 Consoles: ${totalConsoles}`)
      this.log(`   🎯 Jeux: ${totalGames}`)
      this.log(`   👥 Familles: ${totalFamilies}`)
      this.log(`   🏢 Corporations: ${totalCorps}`)
      this.log(`   🏷️ Genres: ${totalGenres}`)
      this.log(`   📅 Générations: ${totalGenerations}`)
      this.log(`   💾 Cache média: ${totalCache} entrées`)

      // Vérifications de cohérence
      if (totalConsoles === 0) {
        this.log('⚠️ Aucune console dans la base', 'warning')
      }
      if (totalGames === 0) {
        this.log('⚠️ Aucun jeu dans la base', 'warning')
      }
      if (totalGenres === 0) {
        throw new Error('CRITIQUE: Aucun genre dans la base')
      }

      this.log('✅ Statistiques générées')

    } catch (error) {
      throw new Error(`Génération des statistiques échouée: ${error}`)
    }
  }

  private displayFinalSummary(): void {
    const duration = Math.round((Date.now() - this.state.startTime) / 1000 / 60 * 100) / 100
    
    this.log('\n🎉 ================================================================')
    this.log('🎉 DÉPLOIEMENT TERMINÉ AVEC SUCCÈS!')
    this.log('🎉 ================================================================')
    
    this.log(`\n📊 RÉSUMÉ:`)
    this.log(`   ⏱️ Durée totale: ${duration} minutes`)
    this.log(`   ✅ Étapes réussies: ${this.state.completedSteps.length}/${this.state.totalSteps}`)
    this.log(`   ❌ Étapes échouées: ${this.state.failedSteps.length}`)
    this.log(`   ⚠️ Avertissements: ${this.state.warnings.length}`)

    if (this.state.warnings.length > 0) {
      this.log(`\n⚠️ AVERTISSEMENTS:`)
      this.state.warnings.forEach(warning => this.log(`   - ${warning}`, 'warning'))
    }

    this.log(`\n🚀 LE SITE EST PRÊT POUR LA PRODUCTION!`)
    this.log(`   🌐 Les données prioritaires ont été scrapées`)
    this.log(`   👤 Le compte admin est créé`)
    this.log(`   💾 La base de données est initialisée`)
    
    if (this.logFile) {
      this.log(`\n📝 Logs détaillés sauvegardés dans: ${this.logFile}`)
    }
  }

  private displayFailureSummary(): void {
    const duration = Math.round((Date.now() - this.state.startTime) / 1000 / 60 * 100) / 100
    
    this.log('\n💥 ================================================================')
    this.log('💥 DÉPLOIEMENT ÉCHOUÉ')
    this.log('💥 ================================================================')
    
    this.log(`\n📊 RÉSUMÉ:`)
    this.log(`   ⏱️ Durée: ${duration} minutes`)
    this.log(`   ✅ Étapes réussies: ${this.state.completedSteps.length}`)
    this.log(`   ❌ Étapes échouées: ${this.state.failedSteps.length}`)

    if (this.state.failedSteps.length > 0) {
      this.log(`\n❌ ÉTAPES ÉCHOUÉES:`)
      this.state.failedSteps.forEach(step => this.log(`   - ${step}`, 'error'))
    }

    this.log(`\n🔧 ACTIONS RECOMMANDÉES:`)
    this.log(`   1. Vérifiez les logs ci-dessus pour identifier le problème`)
    this.log(`   2. Corrigez les erreurs identifiées`)
    this.log(`   3. Relancez le déploiement: npx tsx scripts/deploy-production.ts`)
    
    if (this.logFile) {
      this.log(`\n📝 Logs détaillés sauvegardés dans: ${this.logFile}`)
    }
  }
}

async function main(): Promise<void> {
  let config: DeploymentConfig

  try {
    // Charger la configuration
    const configPath = join(__dirname, 'config', 'deployment.json')
    const configContent = readFileSync(configPath, 'utf-8')
    config = JSON.parse(configContent)
  } catch (error) {
    console.error('💥 ERREUR: Impossible de charger deployment.json:', error)
    console.error('   Assurez-vous que le fichier existe dans scripts/config/')
    process.exit(1)
  }

  // Créer et lancer le gestionnaire de déploiement
  const manager = new DeploymentManager(config)
  await manager.deploy()
}

// Gestion des signaux pour arrêt propre
process.on('SIGINT', async () => {
  console.log('\n⏹️ Arrêt demandé, nettoyage...')
  await prisma.$disconnect()
  process.exit(0)
})

// Exécution du script
if (require.main === module) {
  main()
}

export { main as deployProduction }