'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Save, RefreshCw, Database, Mail, Shield, Globe } from 'lucide-react'

interface SettingsData {
  siteName: string
  siteDescription: string
  maintenanceMode: boolean
  userRegistration: boolean
  emailNotifications: boolean
  screenscrapeApiLimit: number
  cacheExpiration: number
  defaultLanguage: string
  adminEmail: string
  backupFrequency: string
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SettingsData>({
    siteName: 'Super Retrogamers',
    siteDescription: 'Le site de référence pour les consoles et jeux rétro',
    maintenanceMode: false,
    userRegistration: true,
    emailNotifications: true,
    screenscrapeApiLimit: 100,
    cacheExpiration: 24,
    defaultLanguage: 'fr',
    adminEmail: 'admin@super-retrogamers.com',
    backupFrequency: 'daily'
  })

  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  const handleSave = async () => {
    setIsSaving(true)
    
    // Simuler la sauvegarde
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Ici vous intégrerez la vraie sauvegarde
    console.log('Sauvegarde des paramètres:', settings)
    
    setLastSaved(new Date())
    setIsSaving(false)
  }

  const handleReset = () => {
    // Reset aux valeurs par défaut
    setSettings({
      siteName: 'Super Retrogamers',
      siteDescription: 'Le site de référence pour les consoles et jeux rétro',
      maintenanceMode: false,
      userRegistration: true,
      emailNotifications: true,
      screenscrapeApiLimit: 100,
      cacheExpiration: 24,
      defaultLanguage: 'fr',
      adminEmail: 'admin@super-retrogamers.com',
      backupFrequency: 'daily'
    })
  }

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Paramètres</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Configuration générale du site et des fonctionnalités
        </p>
        {lastSaved && (
          <p className="text-sm text-green-600 dark:text-green-400 mt-2">
            Dernière sauvegarde : {lastSaved.toLocaleString('fr-FR')}
          </p>
        )}
      </div>

      <div className="space-y-6">
        {/* Paramètres généraux */}
        <Card className="p-6">
          <div className="flex items-center mb-6">
            <Globe className="h-5 w-5 text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Paramètres Généraux
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="siteName">Nom du site</Label>
              <Input
                id="siteName"
                value={settings.siteName}
                onChange={(e) => setSettings({...settings, siteName: e.target.value})}
                placeholder="Nom du site"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="adminEmail">Email administrateur</Label>
              <Input
                id="adminEmail"
                type="email"
                value={settings.adminEmail}
                onChange={(e) => setSettings({...settings, adminEmail: e.target.value})}
                placeholder="admin@example.com"
              />
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <Label htmlFor="siteDescription">Description du site</Label>
            <Textarea
              id="siteDescription"
              value={settings.siteDescription}
              onChange={(e) => setSettings({...settings, siteDescription: e.target.value})}
              placeholder="Description du site"
              rows={3}
            />
          </div>

          <div className="mt-6">
            <Label htmlFor="defaultLanguage">Langue par défaut</Label>
            <Select 
              value={settings.defaultLanguage} 
              onValueChange={(value) => setSettings({...settings, defaultLanguage: value})}
            >
              <SelectTrigger className="w-48 mt-2">
                <SelectValue placeholder="Sélectionner une langue" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="de">Deutsch</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Paramètres utilisateurs */}
        <Card className="p-6">
          <div className="flex items-center mb-6">
            <Shield className="h-5 w-5 text-green-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Gestion des Utilisateurs
            </h2>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Inscription ouverte</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Permettre aux nouveaux utilisateurs de s&apos;inscrire
                </p>
              </div>
              <Switch
                checked={settings.userRegistration}
                onCheckedChange={(checked) => setSettings({...settings, userRegistration: checked})}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Mode maintenance</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Désactiver temporairement l&apos;accès au site
                </p>
              </div>
              <Switch
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) => setSettings({...settings, maintenanceMode: checked})}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Notifications email</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Envoyer des notifications par email aux administrateurs
                </p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => setSettings({...settings, emailNotifications: checked})}
              />
            </div>
          </div>
        </Card>

        {/* Paramètres API et Performance */}
        <Card className="p-6">
          <div className="flex items-center mb-6">
            <Database className="h-5 w-5 text-purple-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              API et Performance
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="screenscrapeLimit">Limite API Screenscraper (par heure)</Label>
              <Input
                id="screenscrapeLimit"
                type="number"
                value={settings.screenscrapeApiLimit}
                onChange={(e) => setSettings({...settings, screenscrapeApiLimit: parseInt(e.target.value) || 0})}
                min="1"
                max="1000"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cacheExpiration">Expiration du cache (heures)</Label>
              <Input
                id="cacheExpiration"
                type="number"
                value={settings.cacheExpiration}
                onChange={(e) => setSettings({...settings, cacheExpiration: parseInt(e.target.value) || 0})}
                min="1"
                max="168"
              />
            </div>
          </div>

          <div className="mt-6">
            <Label htmlFor="backupFrequency">Fréquence des sauvegardes</Label>
            <Select 
              value={settings.backupFrequency} 
              onValueChange={(value) => setSettings({...settings, backupFrequency: value})}
            >
              <SelectTrigger className="w-48 mt-2">
                <SelectValue placeholder="Fréquence" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hourly">Toutes les heures</SelectItem>
                <SelectItem value="daily">Quotidien</SelectItem>
                <SelectItem value="weekly">Hebdomadaire</SelectItem>
                <SelectItem value="monthly">Mensuel</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Actions rapides */}
        <Card className="p-6">
          <div className="flex items-center mb-6">
            <RefreshCw className="h-5 w-5 text-orange-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Actions Rapides
            </h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Cache</h3>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Vider le cache
                </Button>
                <Button variant="outline" size="sm">
                  <Database className="h-4 w-4 mr-2" />
                  Optimiser la base
                </Button>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Maintenance</h3>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" size="sm">
                  <Shield className="h-4 w-4 mr-2" />
                  Vérifier les permissions
                </Button>
                <Button variant="outline" size="sm">
                  <Mail className="h-4 w-4 mr-2" />
                  Test notifications
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Boutons de sauvegarde */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button 
            variant="outline" 
            onClick={handleReset}
            disabled={isSaving}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Réinitialiser
          </Button>
          
          <Button 
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>
      </div>
    </div>
  )
}