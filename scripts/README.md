# Scripts d'administration

Ce dossier contient les scripts utilitaires pour la gestion de l'application Super Retrogamers.

## Prérequis

Les scripts utilisent `tsx` pour l'exécution TypeScript. Assurez-vous d'avoir installé les dépendances :

```bash
pnpm install
```

## Scripts disponibles

### 🔐 create-admin.ts
Crée un utilisateur administrateur avec email.

```bash
npx tsx scripts/create-admin.ts <email> [nom]
```

**Exemples :**
```bash
npx tsx scripts/create-admin.ts admin@example.com
npx tsx scripts/create-admin.ts admin@example.com "John Doe"
```

**Note :** Le mot de passe doit être défini via l'interface web après création.

### 🕹️ scrape-consoles.ts
Lance le scraping des consoles depuis Screenscraper.fr.

```bash
npx tsx scripts/scrape-consoles.ts [limite]
```

**Exemples :**
```bash
npx tsx scripts/scrape-consoles.ts     # Scraper toutes les consoles
npx tsx scripts/scrape-consoles.ts 10  # Scraper 10 consoles maximum
```

### 🌍 generate-console-variants.ts
Génère automatiquement les variants régionaux pour toutes les consoles existantes.

```bash
npx tsx scripts/generate-console-variants.ts
```

Crée des variants pour les régions : FR, EU, WOR, JP, US selon les mappings prédéfinis.

### 🔍 check-database.ts
Vérifie l'état de la base de données et affiche des statistiques.

```bash
npx tsx scripts/check-database.ts
```

Affiche :
- Nombre de consoles, jeux, utilisateurs
- Liste des administrateurs
- Statistiques sur les variants
- État de la connexion base de données

## Notes importantes

### Variables d'environnement
Assurez-vous que votre fichier `.env` contient :

```env
DATABASE_URL="postgresql://..."
SCREENSCRAPER_DEV_ID="your-dev-id"
SCREENSCRAPER_DEV_PASSWORD="your-dev-password"
```

### Rate limiting
Le script de scraping respecte automatiquement les limites de l'API Screenscraper (1.2s entre les requêtes).

### Sécurité
- Les utilisateurs administrateurs créés doivent définir leur mot de passe via l'interface web
- Les scripts vérifient les permissions et formats d'entrée
- Utilisez des mots de passe forts pour les administrateurs

## Workflow recommandé

1. **Vérifier la base** : `npx tsx scripts/check-database.ts`
2. **Créer un admin** : `npx tsx scripts/create-admin.ts admin@domain.com`
3. **Scraper les consoles** : `npx tsx scripts/scrape-consoles.ts 20`
4. **Générer les variants** : `npx tsx scripts/generate-console-variants.ts`
5. **Vérifier le résultat** : `npx tsx scripts/check-database.ts`