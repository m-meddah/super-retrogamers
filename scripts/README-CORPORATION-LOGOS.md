# Guide des Logos des Corporations

Ce système permet de récupérer automatiquement les logos des corporations depuis l'API Screenscraper en utilisant l'endpoint `mediaCompagnie.php`.

## 📋 API Utilisée

**Endpoint** : `https://api.screenscraper.fr/api2/mediaCompagnie.php`

**Paramètres** :
- `devid` : ID développeur Screenscraper
- `devpassword` : Mot de passe développeur  
- `companyid` : ID de la corporation sur Screenscraper
- `media` : Type de média (`wheel` pour les logos)

**URL complète** :
```
https://api.screenscraper.fr/api2/mediaCompagnie.php?devid={SCREENSCRAPER_DEV_ID}&devpassword={SCREENSCRAPER_DEV_PASSWORD}&companyid={ssCorporationId}&media=wheel
```

## 🛠️ Utilisation

### Scripts Disponibles

```bash
# Vérifier l'état des logos
npx tsx scripts/update-corporation-logos.ts status

# Mettre à jour tous les logos manquants
npx tsx scripts/update-corporation-logos.ts update

# Tester une corporation spécifique
npx tsx scripts/update-corporation-logos.ts test 83
```

### Intégration Automatique

Les logos sont automatiquement récupérés lors de la création des corporations pendant le scraping des jeux, grâce à l'intégration dans `lib/screenscraper-games.ts`.

## ⚠️ Limitations Actuelles

### Protection Anti-Bot

L'API Screenscraper semble avoir une protection contre les appels programmatiques. Actuellement :

- ✅ **Les URLs fonctionnent dans un navigateur** et retournent bien les images PNG
- ❌ **Les appels programmatiques** (fetch, curl) reçoivent une page HTML d'erreur

**Exemple d'URL qui fonctionne manuellement** :
```
https://api.screenscraper.fr/api2/mediaCompagnie.php?devid=Fradz&devpassword=AGeJikPS7jZ&companyid=6&media=wheel
```

### Solutions Envisagées

1. **Sessions/Cookies** : L'API pourrait nécessiter une session préalable
2. **Rate Limiting Plus Strict** : Besoin de throttling plus important
3. **Whitelist IP** : L'accès programmatique pourrait nécessiter une IP autorisée
4. **Compte Premium** : Les credentials utilisateur pourraient être nécessaires

## 🔧 Code Technique

### Détection d'Images

Le système détecte les images de plusieurs façons :

1. **Content-Type** : `image/png`, `image/jpeg`, etc.
2. **Signatures binaires** : Analyse des premiers octets
3. **Redirections** : URLs finales vers des fichiers image

### Gestion d'Erreurs

Le code gère intelligemment les réponses HTML d'erreur :

- Détection des messages d'erreur courants
- Parsing HTML pour extraire des URLs d'images éventuelles
- Fallback vers l'URL directe si l'image est détectée

## 📊 Base de Données

### Table `corporations`

```sql
CREATE TABLE corporations (
  id VARCHAR PRIMARY KEY,
  name VARCHAR NOT NULL UNIQUE,
  slug VARCHAR NOT NULL UNIQUE,
  ssCorporationId INTEGER UNIQUE,
  logoUrl VARCHAR,  -- URL du logo récupéré
  -- ... autres champs
);
```

### Processus de Mise à Jour

1. **Vérification** : La corporation a-t-elle un `ssCorporationId` ?
2. **Logo existant** : Y a-t-il déjà un `logoUrl` ?
3. **Récupération** : Appel API vers mediaCompagnie.php
4. **Stockage** : Mise à jour du champ `logoUrl`

## 🚀 Déploiement

### Intégration au Déploiement Automatique

Le système est intégré dans le déploiement de production :

```javascript
// scripts/config/deployment.json
{
  "steps": {
    "6_updateCorporationLogos": {
      "enabled": true,
      "description": "Mettre à jour les logos des corporations"
    }
  }
}
```

### Variables d'Environnement

```bash
# Fichier .env
SCREENSCRAPER_DEV_ID="votre-dev-id"
SCREENSCRAPER_DEV_PASSWORD="votre-dev-password"
SCREENSCRAPER_USERNAME="votre-username"    # Optionnel
SCREENSCRAPER_PASSWORD="votre-password"    # Optionnel
```

## 🔍 Debug et Test

### Test Manuel dans Navigateur

1. Ouvrez l'URL dans votre navigateur :
   ```
   https://api.screenscraper.fr/api2/mediaCompagnie.php?devid=VOTRE_DEV_ID&devpassword=VOTRE_DEV_PASSWORD&companyid=6&media=wheel
   ```

2. Vérifiez dans les outils développeur :
   - **Status** : 200 OK
   - **Content-Type** : image/png
   - **Taille** : > 0 octets

### Test Programmatique

```bash
# Test avec curl
curl -H "User-Agent: Mozilla/5.0..." "https://api.screenscraper.fr/api2/mediaCompagnie.php?devid=DEV_ID&devpassword=DEV_PASSWORD&companyid=6&media=wheel"

# Test avec notre script
npx tsx scripts/test-corporation-api.ts 6
```

## 📈 Statistiques

### IDs de Corporations Courants

- **Nintendo** : 83
- **Sony** : 1  
- **Sega** : 6
- **Microsoft** : 2
- **Atari** : 3

### Types de Logos

L'API supporte plusieurs types de médias :
- `wheel` : Logos horizontaux (recommandé)
- `logo` : Logos standards
- `icon` : Icônes petites

## 🔄 Évolutions Futures

### Améliorations Prévues

1. **Bypass Protection** : Étudier les moyens de contourner la protection anti-bot
2. **Cache Local** : Télécharger et stocker les images localement
3. **Fallback** : Sources alternatives pour les logos manquants
4. **Interface Admin** : Gestion manuelle des logos via l'interface admin

### Contributions

Pour améliorer ce système :

1. **Analyser** les headers de requête qui fonctionnent dans le navigateur
2. **Tester** différentes approches d'authentification
3. **Implémenter** des stratégies de fallback
4. **Documenter** les découvertes dans ce fichier

## ✅ État Actuel

- ✅ Architecture complète implémentée
- ✅ Scripts de gestion créés
- ✅ Intégration au scraping automatique
- ✅ Gestion d'erreurs robuste
- ❌ API inaccessible programmatiquement (limitation externe)
- ✅ Prêt à fonctionner une fois l'accès résolu