# 🚀 Plan de Migration - Améliorations du Schéma Prisma

## ⚠️ IMPORTANT - Sécurité des données
- **AUCUNE table existante ne sera supprimée**
- **AUCUNE donnée ne sera perdue**
- **Migration additive uniquement**
- **Backup automatique avant chaque étape**

## 📋 Étapes de Migration

### Étape 1: Backup et préparation
```bash
# Backup de la base de données
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql

# Synchronisation des médias existants
npx tsx scripts/sync-existing-medias.ts
```

### Étape 2: Ajout des nouvelles tables
```sql
-- Ajouter les nouvelles tables sans relations d'abord
-- Corporation, Generation, GameType, Manual, Video, Family

-- Ces tables sont indépendantes et n'affectent pas l'existant
```

### Étape 3: Ajout des nouveaux champs optionnels
```sql
-- Ajouter les nouveaux champs aux tables existantes
-- Tous les champs sont optionnels (nullable)

-- Console:
ALTER TABLE consoles ADD COLUMN generationId TEXT;
ALTER TABLE consoles ADD COLUMN unitsSold INTEGER;
ALTER TABLE consoles ADD COLUMN bestSellingGameId TEXT;
ALTER TABLE consoles ADD COLUMN dimensions TEXT;
ALTER TABLE consoles ADD COLUMN media TEXT;
ALTER TABLE consoles ADD COLUMN coProcessor TEXT;
ALTER TABLE consoles ADD COLUMN audioChip TEXT;

-- Game:
ALTER TABLE games ADD COLUMN corporationDevId TEXT;
ALTER TABLE games ADD COLUMN corporationPubId TEXT;  
ALTER TABLE games ADD COLUMN gameTypeId TEXT;
ALTER TABLE games ADD COLUMN familyId TEXT;
ALTER TABLE games ADD COLUMN sizeMB REAL;
ALTER TABLE games ADD COLUMN onlinePlay BOOLEAN DEFAULT FALSE;
ALTER TABLE games ADD COLUMN cloneOf TEXT;
```

### Étape 4: Ajout des relations
```sql
-- Ajouter les contraintes de clés étrangères
-- Seulement après que les tables et champs existent

-- Relations Console
ALTER TABLE consoles ADD CONSTRAINT fk_console_generation 
  FOREIGN KEY (generationId) REFERENCES generations(id);

-- Relations Game  
ALTER TABLE games ADD CONSTRAINT fk_game_corporation_dev
  FOREIGN KEY (corporationDevId) REFERENCES corporations(id);
  
ALTER TABLE games ADD CONSTRAINT fk_game_corporation_pub
  FOREIGN KEY (corporationPubId) REFERENCES corporations(id);
  
ALTER TABLE games ADD CONSTRAINT fk_game_type
  FOREIGN KEY (gameTypeId) REFERENCES game_types(id);
  
ALTER TABLE games ADD CONSTRAINT fk_game_family
  FOREIGN KEY (familyId) REFERENCES families(id);
```

### Étape 5: Migration des données existantes
```sql
-- Migrer les données string vers les nouvelles tables

-- 1. Créer les corporations à partir des developers/publishers existants
INSERT INTO corporations (id, name, createdAt, updatedAt)
SELECT 
  gen_random_uuid()::text, 
  developer,
  NOW(),
  NOW()
FROM (
  SELECT DISTINCT developer FROM games WHERE developer IS NOT NULL
  UNION
  SELECT DISTINCT publisher FROM games WHERE publisher IS NOT NULL
) AS devs_pubs(developer);

-- 2. Créer les types de jeux à partir des genres existants
INSERT INTO game_types (id, name, createdAt, updatedAt)
SELECT 
  gen_random_uuid()::text,
  genre,
  NOW(),
  NOW()
FROM (
  SELECT DISTINCT genre FROM games WHERE genre IS NOT NULL
) AS genres(genre);

-- 3. Lier les jeux aux nouvelles corporations
UPDATE games SET corporationDevId = (
  SELECT id FROM corporations WHERE name = games.developer
) WHERE developer IS NOT NULL;

UPDATE games SET corporationPubId = (
  SELECT id FROM corporations WHERE name = games.publisher  
) WHERE publisher IS NOT NULL;

-- 4. Lier les jeux aux nouveaux types
UPDATE games SET gameTypeId = (
  SELECT id FROM game_types WHERE name = games.genre
) WHERE genre IS NOT NULL;
```

### Étape 6: Création des index de performance
```sql
-- Ajouter les index pour optimiser les performances
CREATE INDEX idx_corporations_name ON corporations(name);
CREATE INDEX idx_generations_start_end ON generations(startYear, endYear);
CREATE INDEX idx_videos_type ON videos(type);
CREATE INDEX idx_manuals_language ON manuals(language);
CREATE INDEX idx_games_family ON games(familyId);
CREATE INDEX idx_games_type ON games(gameTypeId);
CREATE INDEX idx_games_corp_dev ON games(corporationDevId);
CREATE INDEX idx_games_corp_pub ON games(corporationPubId);
```

### Étape 7: Tests de validation
```sql
-- Vérifier l'intégrité des données
SELECT COUNT(*) FROM consoles; -- Doit être identique à avant
SELECT COUNT(*) FROM games;    -- Doit être identique à avant
SELECT COUNT(*) FROM game_medias; -- Peut être plus élevé après sync

-- Vérifier les nouvelles relations
SELECT 
  g.title,
  c_dev.name AS developer,
  c_pub.name AS publisher,
  gt.name AS game_type
FROM games g
LEFT JOIN corporations c_dev ON g.corporationDevId = c_dev.id
LEFT JOIN corporations c_pub ON g.corporationPubId = c_pub.id  
LEFT JOIN game_types gt ON g.gameTypeId = gt.id
LIMIT 10;
```

## 🛡️ Plan de Rollback

En cas de problème, rollback possible via :

```bash
# Restaurer depuis le backup
psql $DATABASE_URL < backup-YYYYMMDD-HHMMSS.sql

# Ou supprimer uniquement les nouvelles tables
DROP TABLE IF EXISTS videos CASCADE;
DROP TABLE IF EXISTS manuals CASCADE;
DROP TABLE IF EXISTS families CASCADE;
DROP TABLE IF EXISTS game_types CASCADE;
DROP TABLE IF EXISTS corporation_roles CASCADE;
DROP TABLE IF EXISTS corporations CASCADE;
DROP TABLE IF EXISTS generations CASCADE;

# Supprimer les nouveaux champs (optionnel)
ALTER TABLE consoles DROP COLUMN IF EXISTS generationId;
ALTER TABLE consoles DROP COLUMN IF EXISTS unitsSold;
-- etc.
```

## 📊 Bénéfices attendus

1. **Gestion riche des entreprises** : Historique, anecdotes, logos
2. **Classification par génération** : Meilleure organisation des consoles
3. **Types de jeux structurés** : Catégorisation précise
4. **Médias optimisés** : Pas de re-téléchargement des fichiers existants
5. **Relations cohérentes** : Liens entre corporations, jeux, familles
6. **Performance améliorée** : Index optimisés pour les requêtes

## 🔧 Scripts disponibles

- `scripts/sync-existing-medias.ts` : Sync des médias existants
- `scripts/migrate-corporations.ts` : Migration des corporations (à créer)
- `scripts/validate-migration.ts` : Validation post-migration (à créer)

## ⏱️ Temps estimé

- Étape 1-2 : 5 minutes
- Étape 3-4 : 10 minutes  
- Étape 5 : 15 minutes (selon volume de données)
- Étape 6-7 : 5 minutes

**Total : ~35 minutes pour une migration complète**