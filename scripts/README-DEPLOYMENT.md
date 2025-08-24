# Guide de Déploiement Automatique en Production

Ce système permet de déployer automatiquement Super Retrogamers en production avec un scraping prioritaire des consoles et jeux essentiels, garantissant un site déjà peuplé au lancement.

## 🎯 Objectifs

- ✅ **Déploiement one-click** : Un seul script pour tout automatiser
- ✅ **Site pré-peuplé** : Consoles et jeux prioritaires scrapés automatiquement
- ✅ **Configuration flexible** : Fichiers JSON pour personnaliser les priorités
- ✅ **Gestion d'erreurs** : Robuste avec logs détaillés et récupération
- ✅ **Production-ready** : Optimisé pour les environnements de production

## 📋 Architecture

```
scripts/
├── config/                          # Configurations JSON
│   ├── deployment.json              # Configuration générale du déploiement
│   ├── priority-consoles.json       # Consoles prioritaires à scraper
│   └── priority-games.json          # Jeux prioritaires à scraper
├── deploy-production.ts             # Script principal de déploiement
├── scrape-priority-data.ts          # Scraping des données prioritaires
└── README-DEPLOYMENT.md             # Cette documentation
```

## 🚀 Utilisation Rapide

### Déploiement Complet
```bash
# Déploiement automatique complet (recommandé)
npx tsx scripts/deploy-production.ts
```

### Scripts Individuels
```bash
# Scraping prioritaire uniquement
npx tsx scripts/scrape-priority-data.ts

# Autres scripts de support (optionnels)
npx tsx scripts/prepare-rescraping.ts
npx tsx scripts/populate-generations.ts
```

## ⚙️ Configuration des Priorités

### 1. Consoles Prioritaires (`priority-consoles.json`)

Ajoutez les consoles que vous voulez avoir dès le lancement :

```json
{
  "consoles": [
    {
      "ssConsoleId": "REMPLACER_PAR_ID_REEL",
      "name": "EXEMPLE: Nintendo Entertainment System (NES)",
      "priority": 1,
      "note": "⚠️ REMPLACEZ par les vrais IDs Screenscraper"
    }
  ]
}
```

**⚠️ IMPORTANT** : Remplacez `"REMPLACER_PAR_ID_REEL"` par les vrais IDs numériques de Screenscraper.

**Priorités** :
- `1` : Priorité maximale (traité en premier)
- `2` : Priorité haute
- `3` : Priorité normale
- `4-5` : Priorités plus basses

### 2. Jeux Prioritaires (`priority-games.json`)

Ajoutez les jeux essentiels pour chaque console :

```json
{
  "games": [
    {
      "ssGameId": "REMPLACER_PAR_ID_REEL",
      "ssConsoleId": "REMPLACER_PAR_ID_CONSOLE_PARENT", 
      "title": "EXEMPLE: Super Mario Bros.",
      "console": "EXEMPLE: NES",
      "priority": 1,
      "note": "⚠️ REMPLACEZ par les vrais IDs Screenscraper"
    }
  ]
}
```

**⚠️ IMPORTANT** : 
- Remplacez `"REMPLACER_PAR_ID_REEL"` par le vrai ID numérique du jeu
- Remplacez `"REMPLACER_PAR_ID_CONSOLE_PARENT"` par l'ID de la console parente

**Important** :
- Le `ssConsoleId` doit correspondre à une console dans `priority-consoles.json`
- Les jeux sont traités après leurs consoles parentes
- Les priorités déterminent l'ordre de traitement

## 📝 Configuration Générale (`deployment.json`)

### Paramètres Principaux

```json
{
  "deployment": {
    "autoCreateAdmin": true,
    "adminEmail": "admin@super-retrogamers.com",
    "adminName": "Super Admin"
  },
  "scraping": {
    "downloadMedia": true,
    "throttleDelayMs": 1200,
    "batchSize": 5
  },
  "steps": {
    "4_scrapePriorityConsoles": {
      "enabled": true
    },
    "5_scrapePriorityGames": {
      "enabled": true
    }
  }
}
```

### Personnalisation Avancée

- **Désactiver des étapes** : `"enabled": false` dans la section `steps`
- **Ajuster le throttling** : Modifier `throttleDelayMs` (min 1200ms)
- **Changer la taille des lots** : Modifier `batchSize` (recommandé : 3-10)
- **Logs détaillés** : `"enableDetailedLogs": true`

## 🔍 Trouver les IDs Screenscraper

### Méthode 1 : Interface Admin
1. Accédez à `/admin/screenscraper-search`
2. Recherchez la console ou le jeu
3. Copiez l'ID affiché dans les résultats

### Méthode 2 : Site Screenscraper
1. Allez sur [screenscraper.fr](https://screenscraper.fr)
2. Recherchez votre console/jeu
3. L'ID est dans l'URL : `systemeid=XXXX` ou `gameid=YYYY`

### Méthode 3 : Logs du Scraping
Les IDs apparaissent dans les logs lors du scraping :
```
🔄 Nintendo Entertainment System (ID: XXXX)
🔄 Nom du jeu (ID: YYYY)
```
Copiez ces IDs numériques dans vos fichiers de configuration.

## 📊 Processus de Déploiement

Le script `deploy-production.ts` exécute ces étapes dans l'ordre :

### 1. Vérification des Prérequis ✅
- Variables d'environnement Screenscraper
- Connexion à la base de données
- Présence des fichiers de configuration

### 2. Création du Compte Admin 👤
- Création automatique du compte administrateur
- Attribution du rôle `admin`
- Possibilité de personnaliser email/nom

### 3. Préparation du Rescraping 🎯
- Synchronisation de TOUS les genres Screenscraper (156+)
- Création des 9 générations de consoles historiques
- Vérification de l'intégrité des données

### 4. Scraping des Consoles Prioritaires 🎮
- Traitement par ordre de priorité (1 → 5)
- Scraping par lots avec throttling
- Création des variantes régionales automatique

### 5. Scraping des Jeux Prioritaires 🎯
- Traitement après les consoles parentes
- Création des familles et corporations automatique
- Téléchargement des médias (images, logos, etc.)

### 6. Génération des Statistiques 📈
- Compteurs de tous les éléments créés
- Vérifications de cohérence
- Rapport final détaillé

## ⏱️ Durée et Performance

### Temps Estimés
- **Prérequis + Admin** : 30 secondes
- **Préparation (genres/générations)** : 2-5 minutes
- **Scraping consoles** : 1-3 minutes par console
- **Scraping jeux** : 2-5 secondes par jeu
- **Total pour 8 consoles + 20 jeux** : ~15-25 minutes

### Optimisations
- **Throttling** : 1.2s entre chaque requête (respect des limites API)
- **Lots** : Traitement par groupes de 5 avec pauses
- **Mémoire** : Nettoyage automatique des connexions
- **Parallélisme** : Certaines opérations en parallèle quand possible

## 🛠️ Gestion des Erreurs

### Types d'Erreurs

#### Erreurs Critiques (arrêt du déploiement)
- Variables d'environnement manquantes
- Impossible de se connecter à la base de données
- Échec de la synchronisation des genres

#### Erreurs Non-Critiques (continuation possible)
- Échec du scraping d'une console/jeu spécifique
- Timeout temporaire de l'API Screenscraper
- Problème de téléchargement d'un média

### Stratégies de Récupération
- **Retry automatique** : 3 tentatives avec délai croissant
- **Logs détaillés** : Tous les échecs sont documentés
- **Continuation partielle** : Le déploiement continue malgré les échecs partiels
- **Rapport final** : Résumé de tous les succès/échecs

### Monitoring
```bash
# Logs en temps réel
tail -f scripts/deployment-logs.txt

# Vérifier l'état de la base après déploiement  
npx prisma studio
```

## 🔧 Maintenance et Mise à Jour

### Ajouter de Nouvelles Consoles
1. Trouvez l'ID Screenscraper de la console
2. Ajoutez l'entrée dans `priority-consoles.json`
3. Relancez le déploiement ou le scraping prioritaire

### Ajouter de Nouveaux Jeux
1. Assurez-vous que la console parente existe
2. Ajoutez l'entrée dans `priority-games.json`
3. Relancez le scraping prioritaire

### Mettre à Jour les Priorités
1. Modifiez les valeurs `priority` dans les fichiers JSON
2. Les priorités 1 sont traitées avant les priorités 2, etc.
3. Relancez pour appliquer le nouvel ordre

### Configuration pour Différents Environnements
```bash
# Copier les configurations pour un nouvel environnement
cp scripts/config/deployment.json scripts/config/deployment-staging.json

# Utiliser une configuration spécifique (code à adapter)
DEPLOYMENT_CONFIG=deployment-staging.json npx tsx scripts/deploy-production.ts
```

## 📋 Checklist de Déploiement

### Avant le Déploiement
- [ ] Variables d'environnement configurées (`DATABASE_URL`, `SCREENSCRAPER_DEV_ID`, `SCREENSCRAPER_DEV_PASSWORD`)
- [ ] Base de données PostgreSQL accessible
- [ ] Fichiers de configuration JSON à jour
- [ ] Credentials Screenscraper valides et avec quotas suffisants

### Pendant le Déploiement
- [ ] Surveiller les logs pour identifier d'éventuels problèmes
- [ ] Vérifier que les étapes critiques se terminent avec succès
- [ ] Noter les éventuels échecs partiels pour traitement ultérieur

### Après le Déploiement
- [ ] Vérifier que le site fonctionne correctement
- [ ] Tester la connexion admin avec les credentials configurés
- [ ] Contrôler que les consoles/jeux prioritaires sont présents
- [ ] Vérifier l'affichage des images et médias
- [ ] Lancer les tests automatisés s'ils existent

## 🚨 Dépannage

### "Variables d'environnement manquantes"
```bash
# Vérifiez votre fichier .env
cat .env | grep SCREENSCRAPER
```

### "Impossible de charger deployment.json"
```bash
# Vérifiez l'existence et la syntaxe JSON
cat scripts/config/deployment.json | jq .
```

### "Aucun genre synchronisé"
```bash
# Réinitialisez la synchronisation des genres
npx tsx scripts/prepare-rescraping.ts
```

### "Rate limit exceeded"
- Le script respecte déjà les limites (1.2s entre requêtes)
- Vérifiez vos quotas Screenscraper sur leur site
- Augmentez `throttleDelayMs` si nécessaire

### "Console parent introuvable"
- La console doit être scrapée avant ses jeux
- Vérifiez que le `ssConsoleId` dans `priority-games.json` correspond à une console dans `priority-consoles.json`

## 📈 Exemples de Résultats

### Déploiement Typique Réussi
```
🎉 DÉPLOIEMENT TERMINÉ AVEC SUCCÈS!
📊 RÉSUMÉ:
   ⏱️ Durée totale: 18.5 minutes
   ✅ Étapes réussies: 6/6
   ❌ Étapes échouées: 0
   ⚠️ Avertissements: 2

💾 BASE DE DONNÉES (après déploiement):
   🎮 Consoles: 8
   🎯 Jeux: 45
   👥 Familles: 12
   🏢 Corporations: 15
   🏷️ Genres: 156
   📅 Générations: 9
```

### Site Prêt pour Production
Après un déploiement réussi, votre site aura :
- **Compte admin** opérationnel
- **Consoles iconiques** avec descriptions et médias
- **Jeux légendaires** avec screenshots et informations
- **Système de genres** complet (156+ genres)
- **Générations historiques** documentées
- **Cache média** optimisé pour les performances

Le site est immédiatement utilisable et attrayant pour les visiteurs ! 🎮