import { LS } from '@/lib/utils'

async function analyzeAdminRoutes() {
  console.log('🔍 Analyse des routes admin pour déterminer les fichiers utilisés...\n')

  // Analyse des liens trouvés
  console.log('📋 Résultats de l\'analyse:')
  
  console.log('\n✅ FICHIERS UTILISÉS:')
  console.log('  📁 /app/admin/consoles/[slug]/edit/page.tsx')
  console.log('     - Référencé dans /app/admin/content/page.tsx ligne 269')
  console.log('     - Utilise le composant EditorialForm (simple)')
  console.log('     - Route: /admin/consoles/[slug]/edit')
  
  console.log('  📦 /components/admin/editorial-form.tsx')
  console.log('     - Utilisé par /app/admin/consoles/[slug]/edit/page.tsx')
  console.log('     - Formulaire simple d\'édition de console')

  console.log('\n❌ FICHIERS NON UTILISÉS:')
  console.log('  📁 /app/admin/consoles/[slug]/edit-enhanced/page.tsx')
  console.log('     - AUCUNE référence trouvée dans la codebase')
  console.log('     - Utilise EnhancedConsoleEditorialForm (avancé)')
  console.log('     - Route: /admin/consoles/[slug]/edit-enhanced (non liée)')
  
  console.log('  📦 /components/admin/enhanced-console-editorial-form.tsx')
  console.log('     - Utilisé UNIQUEMENT par le fichier edit-enhanced non référencé')
  console.log('     - Formulaire avancé avec génération, jeux, etc.')

  console.log('\n📊 COMPARAISON DES FONCTIONNALITÉS:')
  console.log('\n🔸 EditorialForm (UTILISÉ):')
  console.log('   - Formulaire simple pour les champs de base')
  console.log('   - Description éditorial, histoire, etc.')
  console.log('   - Interface basique')

  console.log('\n🔸 EnhancedConsoleEditorialForm (NON UTILISÉ):')
  console.log('   - Formulaire complet avec relations')
  console.log('   - Génération, meilleur jeu, unités vendues')
  console.log('   - Interface plus riche')

  console.log('\n🎯 RECOMMANDATIONS:')
  console.log('   1. SUPPRIMER /app/admin/consoles/[slug]/edit-enhanced/ (non utilisé)')
  console.log('   2. SUPPRIMER /components/admin/enhanced-console-editorial-form.tsx (non utilisé)')
  console.log('   3. GARDER /app/admin/consoles/[slug]/edit/ (utilisé)')
  console.log('   4. GARDER /components/admin/editorial-form.tsx (utilisé)')

  console.log('\n💡 OPTIONNEL:')
  console.log('   - Si vous voulez les fonctionnalités avancées,')
  console.log('   - vous pourriez migrer vers edit-enhanced et')
  console.log('   - mettre à jour le lien dans content/page.tsx')

  console.log('\n🧹 NETTOYAGE PROPOSÉ:')
  console.log('   rm -rf /app/admin/consoles/[slug]/edit-enhanced/')
  console.log('   rm /components/admin/enhanced-console-editorial-form.tsx')
}

async function main() {
  try {
    await analyzeAdminRoutes()
  } catch (error) {
    console.error('❌ Erreur:', error)
  }
}

main()