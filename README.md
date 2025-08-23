# 🕹️ Super Retrogamers

Une application Next.js 15 moderne dédiée aux consoles de jeux rétro et leurs jeux emblématiques. Découvrez l'histoire des machines légendaires des années 80-2000 avec une gestion complète de collections, des analytics en temps réel, et une intégration avancée avec l'API Screenscraper.

![Next.js](https://img.shields.io/badge/Next.js-15.2.4-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-6.13.0-2D3748?style=flat-square&logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791?style=flat-square&logo=postgresql)

## ✨ Fonctionnalités

### 🏛️ Catalogue Complet
- **40+ Consoles rétro** : NES, SNES, PlayStation, Neo Geo, Game Boy, PC Engine et bien plus
- **Milliers de jeux légendaires** : Base de données enrichie avec métadonnées complètes
- **14+ types de médias** : Captures d'écran, box art, logos, wheels automatiquement téléchargés
- **Contenu enrichi par IA** : Descriptions détaillées et analyses historiques des consoles
- **Données dynamiques** : Synchronisation temps réel avec l'API Screenscraper.fr

### 👤 Gestion de Collection Avancée
- **Suivi multi-régional** : Collectionnez la même console/jeu dans différentes régions (FR, EU, US, JP, ASI, WOR)
- **État de conservation** : Suivez l'état (Scellé, Mint, Complet, Loose) avec estimation de valeur
- **Liste de souhaits intelligente** : Gérez vos envies avec priorités et limites de prix
- **Statistiques complètes** : Tableaux de bord détaillés de votre collection
- **Système de notes** : Évaluations multi-critères (graphismes, son, gameplay, histoire)
- **Détection de variants** : Système automatique de variantes par région et édition

### 📊 Analytics & Tracking
- **Analytics temps réel** : Suivi des vues avec respect de la confidentialité (IP hachées)
- **Filtrage des bots** : Exclusion automatique des crawlers et requêtes automatisées
- **Déduplication** : Fenêtre de 30 minutes pour éviter les comptes multiples
- **Dashboard administrateur** : Interface complète avec statistiques en direct
- **Support des slugs composés** : Gestion intelligente des URLs de jeux multi-consoles

### 🔍 Recherche Hybride
- **Recherche locale** : Filtrages complexes sur la base de données interne
- **Intégration Screenscraper** : Expansion des résultats via l'API externe
- **Filtres avancés** : Par année, note, nombre de joueurs, console, genre
- **Résultats fusionnés** : Combinaison intelligente local + externe sans doublons
- **Débouncing 300ms** : Interface fluide et responsive

### 🌍 Système Régional Avancé
- **6 régions supportées** : France, Europe, Monde, Japon, Asie, États-Unis
- **Préférences persistantes** : Stockage en base + URL avec nuqs
- **Média prioritaire** : Sélection automatique des meilleures images par région
- **Navigation sélective** : Les pages admin/collection ne preservent pas les paramètres de région
- **Composants réactifs** : Mise à jour en temps réel des images selon la région

### 🔐 Authentification & Sécurité
- **Better-auth** : Système d'authentification moderne avec adaptateur Prisma
- **Sessions sécurisées** : Cookies avec 7 jours d'expiration, renouvellement automatique
- **Gestion des rôles** : Système administrateur avec permissions granulaires
- **Hachage des IPs** : Protection de la confidentialité avec SHA-256 + salt

### 🎨 Interface Moderne
- **Design responsive** : Mobile-first avec support thème sombre/clair
- **shadcn/ui** : Composants élégants dans le style "New York"
- **Tailwind CSS v4** : Variables CSS modernes et classe utilitaires
- **Inter Font** : Typographie optimisée de Google Fonts
- **Favicon dynamiques** : Favicons personnalisés par console/jeu

## 🛠️ Stack Technique

### Frontend & Framework
- **Next.js 15.2.4** avec App Router et Turbopack pour le développement
- **React 19** avec Server Components et Server Actions
- **TypeScript 5** pour la sécurité des types
- **Tailwind CSS v4** avec variables CSS modernes

### Backend & Database
- **PostgreSQL** comme base de données principale
- **Prisma ORM 6.13.0** avec migrations automatiques
- **Better-auth** pour l'authentification avec adaptateur Prisma
- **Zustand** pour la gestion d'état global côté client

### External APIs & Services
- **Screenscraper.fr** : Source principale des données de jeux
- **Rate limiting** : 1.2s entre les requêtes pour respecter l'API
- **Cache média URLs** : TTL 24h pour optimiser les performances
- **nuqs** : Gestion d'état URL pour les préférences régionales

### Development & Tools
- **pnpm** comme gestionnaire de paquets
- **ESLint** avec configuration Next.js
- **tsx** pour l'exécution TypeScript directe (scripts admin)

## 🚀 Installation

### Prérequis
- **Node.js 18+** (recommandé: 20+)
- **PostgreSQL 14+** 
- **pnpm** (installé via `npm install -g pnpm`)
- **Compte développeur Screenscraper** (optionnel mais fortement recommandé)

### Setup Complet

1. **Cloner le repository**
```bash
git clone [repository-url]
cd super-retrogamers
```

2. **Installer les dépendances**
```bash
pnpm install
```

3. **Configuration de l'environnement**
Créez un fichier `.env` à la racine :
```env
# Base de données PostgreSQL
DATABASE_URL="postgresql://username:password@localhost:5432/super_retrogamers"

# Better-auth (générez une clé sécurisée)
BETTER_AUTH_SECRET="your-long-secure-secret-key"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_BETTER_AUTH_URL="http://localhost:3000"

# API Screenscraper (créez un compte sur screenscraper.fr)
SCREENSCRAPER_DEV_ID="your-dev-id"
SCREENSCRAPER_DEV_PASSWORD="your-dev-password"

# Optionnel : compte utilisateur Screenscraper (pour des limites plus élevées)
SCREENSCRAPER_USERNAME="your-username"
SCREENSCRAPER_PASSWORD="your-password"
```

4. **Initialiser la base de données**
```bash
# Appliquer les migrations
npx prisma migrate dev

# Générer le client Prisma
npx prisma generate
```

5. **Créer un utilisateur administrateur**
```bash
npx tsx scripts/create-admin.ts admin@example.com "Admin User"
```

6. **Vérifier l'installation**
```bash
npx tsx scripts/check-database.ts
```

7. **Lancer le serveur de développement**
```bash
pnpm dev
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

## 📊 Gestion des Données

### Scripts d'Administration
```bash
# Vérifier l'état de la base de données
npx tsx scripts/check-database.ts

# Créer un administrateur
npx tsx scripts/create-admin.ts <email> [nom]

# Promouvoir un utilisateur existant
npx tsx scripts/promote-to-admin.ts <email>

# Scraper les consoles (avec limite pour dev)
npx tsx scripts/scrape-consoles.ts [limit]

# Générer les variantes régionales automatiquement
npx tsx scripts/generate-console-variants.ts

# Synchroniser les médias existants
npx tsx scripts/sync-existing-medias.ts
```

### Interface d'Administration (`/admin`)
- **Analytics** : Statistiques en temps réel des vues et utilisateurs
- **Scraping** : Interface pour synchroniser les données Screenscraper
- **Content** : Gestion des consoles, jeux, genres, corporations
- **Users** : Administration des utilisateurs et rôles
- **ROMs** : Gestion manuelle des liens ROM (Archive.org, Myrient)
- **Settings** : Configuration des préférences administrateur

### Base de données
```bash
# Interface graphique Prisma Studio
npx prisma studio

# Appliquer les migrations (production)
npx prisma migrate deploy

# Pousser le schéma (développement uniquement)
npx prisma db push

# Reset complet (DESTRUCTIF)
npx prisma db push --force-reset
```

## 🏗️ Architecture

### Structure des Dossiers
```
app/                          # Next.js App Router
├── api/auth/[...all]/        # Better-auth API routes
├── admin/                    # Interface d'administration complète
│   ├── analytics/            # Analytics en temps réel
│   ├── content/              # Gestion du contenu
│   ├── scraping/             # Interface de scraping
│   ├── settings/             # Paramètres administrateur
│   └── users/                # Gestion des utilisateurs
├── collection/               # Gestion des collections utilisateur
├── consoles/[slug]/         # Pages individuelles des consoles
│   └── jeux/                 # Jeux par console
├── jeux/[slug]/             # Pages individuelles des jeux
├── recherche/               # Recherche hybride avancée
├── dashboard/               # Profils et paramètres utilisateur
├── login/ & register/       # Authentification
└── layout.tsx               # Layout global avec Header

components/                   # Composants React réutilisables
├── ui/                      # shadcn/ui components
├── admin/                   # Composants spécifiques admin
├── collection/              # Composants de collection
├── console-card.tsx         # Affichage des consoles
├── game-card.tsx           # Affichage des jeux
├── page-view-tracker.tsx   # Tracking analytics côté client
├── regional-link.tsx       # Liens qui préservent les préférences régionales
└── region-selector.tsx     # Sélecteur de région

lib/                         # Logique métier et utilitaires
├── actions/                 # Server Actions (Next.js 15)
│   ├── analytics-actions.ts # Actions analytics et tracking
│   ├── collection-actions.ts # Gestion des collections
│   ├── scraping-actions.ts  # Actions de scraping
│   └── search-actions.ts    # Recherche hybride
├── hooks/                   # React hooks personnalisés
├── stores/                  # État global Zustand
├── analytics-service.ts     # Service analytics avec hachage IP
├── screenscraper-*.ts      # Clients API Screenscraper
├── data-prisma.ts          # Requêtes base de données centralisées
├── auth.ts                 # Configuration Better-auth
└── prisma.ts               # Client Prisma singleton

prisma/
├── schema.prisma           # Modèles de données
└── migrations/             # Historique des migrations

scripts/                    # Scripts d'administration TypeScript
└── README.md               # Documentation des scripts
```

### Modèles de Données Principaux

#### Authentification & Utilisateurs
- **User** : Profils avec préférences régionales et rôles
- **Account/Session** : OAuth et gestion des sessions Better-auth

#### Catalogue Gaming
- **Console** : Consoles avec spécs techniques et contenu IA
- **Game** : Jeux avec métadonnées et relations genre normalisées
- **Genre** : Taxonomie normalisée de 156+ genres français Screenscraper
- **Rom** : Gestion séparée des ROMs avec liens et checksums

#### Collection Management
- **UserConsoleCollection** : Collections avec état et valeur
- **UserGameCollection** : Jeux possédés avec statut d'achèvement
- **UserWishlist** : Listes de souhaits avec priorités
- **ConsoleVariant/GameVariant** : Variants régionaux et éditions spéciales

#### Analytics & Media
- **PageView** : Tracking des visites avec IPs hachées
- **MediaUrlCache** : Cache des URLs Screenscraper avec TTL 24h

## 🔧 Commandes de Développement

### Développement Principal
```bash
pnpm dev              # Serveur de dev avec Turbopack
pnpm dev:safe         # Serveur de dev sans Turbopack (fallback)
pnpm build            # Build de production
pnpm start            # Serveur de production
pnpm lint             # ESLint avec règles Next.js
```

### Base de Données
```bash
npx prisma migrate dev        # Créer et appliquer migrations
npx prisma generate           # Générer client après changements schema
npx prisma studio             # Interface graphique de la base
npx prisma db push            # Pousser schema (dev uniquement)
npx prisma db push --force-reset  # Reset destructif complet
```

### Exécution TypeScript
```bash
npx tsx script.ts             # Exécuter fichier TypeScript directement
```

## 🚀 Fonctionnalités Récentes

### ✅ Analytics Système Temps Réel
- Tracking des vues avec respect de la confidentialité (IPs hachées SHA-256)
- Filtrage automatique des bots et crawlers
- Déduplication intelligente (fenêtre de 30 minutes)
- Dashboard administrateur avec statistiques en direct
- Server Actions (pas d'API routes) pour le tracking côté client

### ✅ Système de Collection Avancé
- Support multi-régional complet (6 régions)
- Gestion des variants par région et condition
- Détection automatique des régions disponibles
- Interface de collection intuitive avec sélection de région

### ✅ Recherche Hybride Intelligente
- Combinaison base locale + API Screenscraper
- Fusion des résultats sans doublons
- Filtres complexes multiples critères
- Interface responsive avec débouncing

### ✅ Architecture Server Actions
- Migration complète vers Server Actions (exit API routes)
- Respect des préférences architecturales du projet
- Meilleure intégration TypeScript et performance

## 📈 Roadmap

### 🔄 En Cours
- **ROM Management** : Système complet de gestion des ROMs
- **Media Optimization** : Optimisation des images et cache avancé
- **Collection Sharing** : Partage public des collections

### 🔮 Prévu
- **API Publique** : Endpoints REST pour accès externe
- **Import/Export** : Sauvegarde et restauration des collections
- **PWA Support** : Mode hors ligne avec synchronisation
- **Recommandations IA** : Suggestions basées sur les goûts
- **Social Features** : Suivi d'autres collectionneurs

## 🤝 Contribution

Les contributions sont les bienvenues ! Pour contribuer :

1. **Fork** le projet
2. **Créer une branche feature** (`git checkout -b feature/amazing-feature`)
3. **Commit vos changements** (`git commit -m 'Add amazing feature'`)
4. **Push vers la branche** (`git push origin feature/amazing-feature`)
5. **Ouvrir une Pull Request**

### Guidelines de Développement
- **Server Actions privilégiées** plutôt que API routes
- **TypeScript strict** pour tous les nouveaux code
- **Prisma centralisé** via `lib/data-prisma.ts`
- **Rate limiting respecté** pour Screenscraper API (1.2s)
- **Commits sans attribution Claude** (politique stricte)

## 🐛 Troubleshooting

### Problèmes Fréquents

**Erreurs de compilation TypeScript :**
```bash
npx prisma generate  # Régénérer le client après changements schema
```

**Erreurs de migration Prisma :**
```bash
npx prisma db push --force-reset  # Reset développement (DESTRUCTIF)
```

**Conflits de port :**
```bash
PORT=3001 pnpm dev  # Utiliser un port alternatif
```

**Problèmes de cache Turbopack :**
```bash
pnpm dev:safe  # Utiliser le mode sans Turbopack
```

## 📝 Documentation

- **`CLAUDE.md`** : Guide complet pour les développeurs IA
- **`SCRAPING.md`** : Documentation détaillée du système de scraping
- **`scripts/README.md`** : Guide des scripts d'administration
- **`MIGRATION-COMPLETE.md`** : Historique des migrations majeures

## 🎯 Support & Contact

- **Issues GitHub** : Pour bugs et demandes de features
- **Documentation** : Consultez les fichiers `.md` du projet
- **Logs de développement** : Activés via `console.debug`

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

---

**Super Retrogamers** - Redécouvrez la magie du gaming rétro avec une technologie moderne ! 🕹️✨