# Guide du Système de Scraping Screenscraper

Ce guide explique comment utiliser le système de scraping pour importer les données depuis l'API Screenscraper.fr.

## Configuration Requise

### Variables d'environnement

Ajoutez ces variables dans votre fichier `.env` :

```env
# Screenscraper API - Obligatoire
SCREENSCRAPER_DEV_ID="votre-dev-id"
SCREENSCRAPER_DEV_PASSWORD="votre-dev-password"

# Screenscraper API - Optionnel (pour augmenter les limites)
SCREENSCRAPER_USERNAME="votre-username"
SCREENSCRAPER_PASSWORD="votre-password"
```

### Obtenir les Identifiants Screenscraper

1. Créez un compte sur [Screenscraper.fr](https://www.screenscraper.fr)
2. Rendez-vous dans la section développeur pour obtenir vos identifiants dev
3. Les identifiants dev sont requis, les identifiants utilisateur sont optionnels

## Endpoints API Disponibles

### 1. Statut du Scraping
```bash
GET /api/scrape/status
```
Affiche les statistiques actuelles de la base de données.

### 2. Scraping des Consoles
```bash
POST /api/scrape/consoles
Content-Type: application/json

{
  "mode": "priority"  // ou "all"
}
```

**Modes disponibles :**
- `priority` : Importe les consoles prioritaires (NES, SNES, PlayStation, etc.)
- `all` : Importe toutes les consoles disponibles sur Screenscraper

### 3. Scraping des Jeux
```bash
POST /api/scrape/games
Content-Type: application/json

{
  "systemId": 3,        // ID Screenscraper (3 = NES)
  "maxGames": 50        // Nombre max de jeux à importer
}
```

**IDs de systèmes courants :**
- NES: 3
- SNES: 4
- Game Boy: 9
- Game Boy Color: 10
- Game Boy Advance: 12
- Sega Genesis: 1
- Nintendo 64: 14
- PlayStation: 57
- PlayStation 2: 58

### 4. Scraping Complet Automatisé
```bash
POST /api/scrape/full
Content-Type: application/json

{
  "maxGamesPerSystem": 25  // Nombre max de jeux par console
}
```

Cette route automatise tout le processus :
1. Importe les consoles prioritaires
2. Importe les jeux pour chaque console
3. Gère automatiquement les pauses entre requêtes

## Utilisation Recommandée

### Première Installation

1. **Vérifiez le statut initial :**
   ```bash
   curl http://localhost:3000/api/scrape/status
   ```

2. **Lancez un scraping complet avec peu de jeux :**
   ```bash
   curl -X POST http://localhost:3000/api/scrape/full \
     -H "Content-Type: application/json" \
     -d '{"maxGamesPerSystem": 10}'
   ```

3. **Vérifiez les résultats :**
   ```bash
   curl http://localhost:3000/api/scrape/status
   ```

### Ajout de Contenu

1. **Ajoutez plus de jeux pour une console spécifique :**
   ```bash
   curl -X POST http://localhost:3000/api/scrape/games \
     -H "Content-Type: application/json" \
     -d '{"systemId": 3, "maxGames": 100}'
   ```

2. **Importez toutes les consoles :**
   ```bash
   curl -X POST http://localhost:3000/api/scrape/consoles \
     -H "Content-Type: application/json" \
     -d '{"mode": "all"}'
   ```

## Limites et Bonnes Pratiques

### Limites de l'API Screenscraper

- **Rate Limiting :** 1,2 seconde minimum entre les requêtes
- **Limites quotidiennes :** Dépendent de votre type de compte
- **Timeout :** Les requêtes peuvent prendre plusieurs secondes

### Bonnes Pratiques

1. **Commencez petit :** Testez avec peu de jeux avant d'importer massivement
2. **Surveillez les logs :** Les erreurs sont affichées dans la console du serveur
3. **Patience :** Un import complet peut prendre 10-30 minutes
4. **Évitez les doublons :** Le système détecte automatiquement les éléments existants

### Gestion des Erreurs

Le système gère automatiquement :
- Les erreurs de réseau (retry automatique)
- Les doublons (détection par screenscrapeId)
- Les slugs en conflit (génération automatique d'alternatives)
- Le rate limiting (pauses automatiques)

## Monitoring

### Logs du Serveur

Surveillez les logs de votre serveur Next.js pour voir le progrès :

```bash
pnpm dev
```

Les émojis dans les logs indiquent :
- 🚀 Début d'opération
- ✅ Succès
- ❌ Erreur
- 📊 Statistiques
- 🎯 Fin d'opération

### Base de Données

Vérifiez vos données avec Prisma Studio :

```bash
npx prisma studio
```

## Dépannage

### Erreur "Screenscraper credentials not configured"
- Vérifiez vos variables d'environnement `.env`
- Redémarrez le serveur après modification du `.env`

### Erreur "Rate limit exceeded"
- Attendez quelques minutes avant de relancer
- Réduisez le nombre de jeux par requête

### Erreur "Database connection"
- Vérifiez que PostgreSQL est démarré
- Vérifiez votre `DATABASE_URL` dans `.env`
- Lancez `npx prisma migrate dev` si nécessaire

### Slugs en conflit
- Le système génère automatiquement des alternatives
- Vérifiez les logs pour voir les conflits résolus

## Structure des Données Importées

### Consoles
- Nom, fabricant, année de sortie
- Description (si disponible)
- Image/logo (si disponible)
- ID Screenscraper pour référence

### Jeux
- Titre, développeur, éditeur
- Genres, description
- Screenshots et images
- Note/rating
- ID Screenscraper pour référence

## Enrichissement Futur

Une fois les données de base importées, vous pourrez :

1. **Enrichir manuellement** les descriptions
2. **Ajouter du contenu IA** pour des analyses plus poussées
3. **Compléter** les informations techniques manquantes
4. **Ajouter** vos propres métadonnées et catégories

Le système de scraping fournit une base solide que vous pouvez ensuite enrichir selon vos besoins spécifiques.