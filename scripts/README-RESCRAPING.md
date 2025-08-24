# Guide de Re-scraping Complet

Ce guide décrit comment effectuer un re-scraping complet de toutes les données Screenscraper pour mettre à jour les tables : `consoles`, `games`, `families`, `corporations`, `genres`, `generations`, et `media_url_cache`.

## ⚠️ Prérequis Obligatoires

1. **Variables d'environnement Screenscraper configurées** :
   ```bash
   SCREENSCRAPER_DEV_ID="your-dev-id"
   SCREENSCRAPER_DEV_PASSWORD="your-dev-password"
   ```

2. **Base de données accessible** avec données existantes ayant des IDs Screenscraper

3. **Temps disponible** : Le processus peut prendre plusieurs heures selon la quantité de données

## 🚀 Procédure de Re-scraping

### Étape 1 : Préparation (OBLIGATOIRE)

```bash
npx tsx scripts/prepare-rescraping.ts
```

Cette étape :
- ✅ Vérifie les prérequis (credentials, base de données)
- 🏷️ **Synchronise TOUS les genres depuis Screenscraper** (critique pour les jeux)
- 📅 Remplit la table `generations` avec les 9 générations de consoles
- 📊 Affiche les statistiques des données à traiter

**⚠️ IMPORTANT** : Cette étape est OBLIGATOIRE car les jeux nécessitent des genres existants.

### Étape 2 : Test sur Échantillon

```bash
npx tsx scripts/test-rescraping.ts
```

Ce script teste le re-scraping sur :
- 1 console (première trouvée avec `ssConsoleId`)
- 1 jeu (premier trouvé avec `ssGameId`)

Attendez que les deux tests réussissent avant de continuer.

### Étape 3 : Re-scraping Complet

```bash
npx tsx scripts/rescrape-all-data.ts
```

⏱️ **Durée estimée** : 2-6 heures selon la quantité de données

Le script traite :
1. **Genres** : Re-synchronisation complète (156+ genres)
2. **Consoles** : Toutes les consoles avec `ssConsoleId`
3. **Jeux** : Tous les jeux avec `ssGameId` (+ familles/corporations automatiquement)
4. **Nettoyage** : Cache média expiré et entrées orphelines

## 📊 Surveillance du Processus

### Logs en Temps Réel
Le script affiche :
- 📦 Progression par lots (10 éléments à la fois)
- ✅ Succès et ❌ échecs pour chaque élément
- ⏸️ Pauses automatiques entre les lots
- 📈 Statistiques intermédiaires

### Exemple de Log
```
🎮 === RE-SCRAPING DES CONSOLES ===
📊 45 consoles à re-scraper

📦 Lot 1/5 (10 consoles)
   🔄 Nintendo Entertainment System (ID: 3)
   ✅ Mise à jour réussie
   🔄 Super Nintendo (ID: 4)  
   ✅ Mise à jour réussie
   ⏸️  Pause de 2000ms...
```

### Interruption Sécurisée
- **Ctrl+C** : Arrêt propre avec nettoyage des connexions
- **Reprise** : Relancez le script, il ignore les éléments déjà traités

## 🔧 Tables Mises à Jour

| Table | Description | Mise à jour |
|-------|-------------|-------------|
| `consoles` | Données de base des consoles | Métadonnées, descriptions, specs |
| `console_regional_names` | Noms par région | Noms FR, EU, JP, US, etc. |
| `console_regional_dates` | Dates de sortie par région | Dates précises par marché |
| `console_variants` | Variantes de consoles | Versions, éditions spéciales |
| `games` | Données de base des jeux | Métadonnées, notes, descriptions |
| `game_regional_titles` | Titres par région | Titres localisés |
| `game_regional_dates` | Dates de sortie par région | Lancements régionaux |
| `game_variants` | Variantes de jeux | Versions, rééditions |
| `families` | Franchises de jeux | Séries comme "Super Mario" |
| `corporations` | Éditeurs/développeurs | Entreprises du jeu vidéo |
| `corporation_roles` | Rôles des entreprises | Développeur/éditeur par jeu |
| `media_url_cache` | Cache des URLs média | URLs Screenscraper avec TTL |
| `generations` | Générations de consoles | 9 générations historiques |
| `genres` | Genres de jeux | 156+ genres Screenscraper |

## ⚡ Performance et Limitations

### Rate Limiting
- **1.2 secondes** entre chaque requête API Screenscraper
- **2 secondes** de pause entre chaque lot de 10 éléments
- **Respect strict** des limites API pour éviter les blocages

### Gestion Mémoire
- Traitement par **lots de 10 éléments** pour éviter la surcharge
- **Nettoyage automatique** des connexions et caches
- **Monitoring** de l'utilisation mémoire

### Gestion d'Erreurs
- **Retry automatique** en cas d'erreur temporaire
- **Logging détaillé** de tous les problèmes
- **Continuation** même si certains éléments échouent
- **Statistiques finales** avec taux de succès

## 🛠️ Scripts Individuels

### `populate-generations.ts`
```bash
npx tsx scripts/populate-generations.ts
```
Remplit uniquement la table `generations` avec les 9 générations historiques.

### `test-rescraping.ts` 
```bash
npx tsx scripts/test-rescraping.ts
```
Test rapide sur 1 console + 1 jeu pour valider la configuration.

### `prepare-rescraping.ts`
```bash
npx tsx scripts/prepare-rescraping.ts  
```
Préparation complète : genres + générations + vérifications.

### `rescrape-all-data.ts`
```bash
npx tsx scripts/rescrape-all-data.ts
```
Re-scraping complet de toutes les données.

## 🚨 Dépannage

### "Aucun genre en base"
```bash
npx tsx scripts/prepare-rescraping.ts
```
Synchronise d'abord les genres avant le re-scraping des jeux.

### "Rate limit exceeded"
- Le script respecte déjà les limites (1.2s)
- Vérifiez vos credentials Screenscraper
- Attendez et relancez le script

### "Database connection error"
- Vérifiez la variable `DATABASE_URL`
- Confirmez que PostgreSQL est démarré
- Testez la connexion avec `npx prisma studio`

### "No data to rescrape"
- Vos données n'ont pas d'IDs Screenscraper (`ssConsoleId`, `ssGameId`)
- Effectuez d'abord un scraping initial via l'interface admin

## 📋 Checklist Post-Rescraping

- [ ] Vérifiez les statistiques finales du script
- [ ] Consultez les logs pour identifier les éventuels échecs
- [ ] Testez l'affichage des consoles/jeux sur le site
- [ ] Vérifiez que les nouvelles données sont bien visibles
- [ ] Contrôlez les images et médias régionaux
- [ ] Confirmez le bon fonctionnement de la recherche

## 📈 Statistiques Attendues

Pour un projet typique :
- **Consoles** : 95-100% de succès
- **Jeux** : 90-95% de succès (certains peuvent être supprimés de Screenscraper)
- **Familles/Corporations** : Création automatique selon les jeux
- **Genres** : 100% (156+ genres standard)
- **Cache média** : Nettoyage des entrées expirées

Un taux de succès >90% est considéré comme excellent.