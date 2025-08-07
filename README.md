# Super Retrogamers

Une application Next.js moderne dédiée aux consoles de jeux rétro et leurs jeux emblématiques. Découvrez l'histoire des machines légendaires des années 80-2000 avec une gestion complète de collections utilisateur.

## 🎮 Fonctionnalités

### 🏛️ Catalogue Complet
- **Consoles rétro** : NES, SNES, PlayStation, Neo Geo, Game Boy et plus encore
- **Jeux légendaires** : Base de données enrichie avec métadonnées, captures d'écran et notes
- **Contenu enrichi par IA** : Descriptions détaillées et analyses des consoles et jeux
- **Données dynamiques** : Synchronisation avec l'API Screenscraper.fr

### 👤 Gestion de Collection Avancée
- **Suivi des possessions** : Cataloguez vos consoles et jeux avec état de conservation
- **Estimation de valeur** : Suivez la valeur de votre collection
- **Liste de souhaits** : Gérez vos envies avec priorités et limites de prix
- **Statistiques** : Tableaux de bord détaillés de votre collection
- **Système de notes** : Évaluations multi-critères (graphismes, son, gameplay, histoire)

### 🔐 Authentification & Utilisateurs
- **Better-auth** : Système d'authentification moderne avec email/mot de passe
- **Sessions sécurisées** : Gestion des sessions avec cookies sécurisés
- **Profils utilisateur** : Gestion des rôles et permissions

### 🎨 Interface Moderne
- **Design responsive** : Mobile-first avec support des thèmes sombre/clair
- **shadcn/ui** : Composants UI élégants dans le style "New York"
- **Tailwind CSS v4** : Stylisation moderne avec variables CSS
- **Inter Font** : Typographie optimisée de Google Fonts

## 🛠️ Stack Technique

- **Framework** : Next.js 15 avec App Router et Turbopack
- **Base de données** : PostgreSQL avec Prisma ORM
- **Authentification** : Better-auth avec adaptateur Prisma
- **API externe** : Screenscraper.fr pour les données de jeux
- **Styling** : Tailwind CSS v4 avec variables CSS
- **Composants UI** : shadcn/ui (style New York)
- **Icônes** : Lucide React
- **Gestionnaire de paquets** : pnpm

## 🚀 Installation

### Prérequis
- Node.js 18+
- PostgreSQL
- pnpm
- Compte développeur Screenscraper (optionnel mais recommandé)

### Configuration

1. **Cloner le repository**
```bash
git clone <repository-url>
cd super-retrogamers
```

2. **Installer les dépendances**
```bash
pnpm install
```

3. **Configuration de l'environnement**
Créez un fichier `.env` avec :
```env
# Base de données
DATABASE_URL="postgresql://username:password@localhost:5432/super_retrogamers"

# Better-auth
BETTER_AUTH_SECRET="your-secret-key"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_BETTER_AUTH_URL="http://localhost:3000"

# API Screenscraper
SCREENSCRAPER_DEV_ID="your-dev-id"
SCREENSCRAPER_DEV_PASSWORD="your-dev-password"
SCREENSCRAPER_USERNAME="your-username" # Optionnel
SCREENSCRAPER_PASSWORD="your-password" # Optionnel
```

4. **Configuration de la base de données**
```bash
npx prisma migrate dev
npx prisma generate
```

5. **Lancer le serveur de développement**
```bash
pnpm dev
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

## 📊 Gestion des Données

### Synchronisation Screenscraper
```bash
# Scraper toutes les consoles
curl -X POST http://localhost:3000/api/scraping/consoles

# Scraper un nombre limité de consoles (développement)
curl -X POST http://localhost:3000/api/scraping/consoles-limited
```

### Base de données
```bash
# Ouvrir Prisma Studio
npx prisma studio

# Appliquer les migrations
npx prisma migrate dev

# Pousser le schéma (dev uniquement)
npx prisma db push
```

## 🏗️ Architecture

### Structure des dossiers
```
app/                    # Pages Next.js App Router
├── api/               # Routes API
├── collection/        # Gestion des collections
├── consoles/         # Pages des consoles
├── jeux/             # Pages des jeux
└── login/            # Authentification

components/            # Composants React
├── ui/               # shadcn/ui components
├── header.tsx        # Navigation
├── console-card.tsx  # Affichage des consoles
└── game-card.tsx     # Affichage des jeux

lib/                   # Utilitaires et services
├── actions/          # Server Actions
├── hooks/            # React hooks
├── stores/           # État global (Zustand)
├── prisma.ts         # Client Prisma
├── auth.ts           # Configuration Better-auth
└── data-prisma.ts    # Requêtes base de données

prisma/               # Schéma et migrations
└── schema.prisma     # Modèles de données
```

### Modèles de Données Principaux
- **User** : Utilisateurs avec authentification Better-auth
- **Console** : Consoles avec specs techniques et médias
- **Game** : Jeux avec métadonnées et captures d'écran
- **UserConsoleCollection** : Collections utilisateur avec état et valeur
- **UserGameCollection** : Jeux possédés avec statut de completion
- **GameReview** : Évaluations détaillées multi-critères

## 🔧 Commandes de Développement

```bash
# Développement
pnpm dev              # Serveur de développement avec Turbopack
pnpm build            # Build de production
pnpm start            # Serveur de production
pnpm lint             # Linter ESLint

# Base de données
npx prisma migrate dev    # Créer et appliquer les migrations
npx prisma generate       # Générer le client Prisma
npx prisma studio         # Interface graphique de la base
npx prisma db push        # Pousser le schéma (dev uniquement)
```

## 📈 Fonctionnalités à Venir

- **IA générative** : Descriptions enrichies automatiques
- **Mode hors ligne** : PWA avec synchronisation
- **Import/Export** : Sauvegarde des collections
- **Partage social** : Partage de collections et critiques
- **API publique** : Accès programmatique aux données

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/amazing-feature`)
3. Commit vos changements (`git commit -m 'Add amazing feature'`)
4. Push vers la branche (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🎯 Support

Pour toute question ou problème :
- Ouvrir une issue sur GitHub
- Consulter la documentation dans `/CLAUDE.md`
- Vérifier les logs de développement

---

**Super Retrogamers** - Redécouvrez la magie du gaming rétro 🕹️
