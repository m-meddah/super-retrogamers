import { prisma } from "../lib/prisma"

const neoGeoEditorial = `# 🌟 La Neo Geo AES : La Rolls-Royce des Consoles de Jeu

Développée par **SNK** et lancée le **26 avril 1990** au Japon, la Neo Geo AES (Advanced Entertainment System) est une console légendaire qui a marqué l'histoire du jeu vidéo par son approche révolutionnaire, sa puissance technique et son statut de produit de luxe. Voici une analyse approfondie de son histoire, sa technologie, ses jeux et son héritage.

---

## 🕹️ **I. Concept & Innovation : L'Arcade Chez Soi**

- **Double Système MVS/AES** : La Neo Geo existait sous deux formes :
  - **MVS (Multi Video System)** : Borne d'arcade modulaire permettant de changer de jeu via des cartouches, réduisant les coûts pour les exploitants de salles.
  - **AES (Advanced Entertainment System)** : Version salon **techniquement identique** à l'arcade, offrant une fidélité parfaite aux jeux sans portage.

- **Prix Premium** : Vendue **650$** (Pack Gold avec 2 manettes et un jeu), soit l'équivalent de **1 500$ aujourd'hui**. Les jeux coûtaient jusqu'à **200$**. Un marché niche justifié par le slogan : *"Ramenez des jeux d'arcade chez vous !"*.

---

## ⚙️ **II. Technologie : Une Bête de Puissance**

- **Architecture 16/24 bits** : Basée sur un **Motorola 68000** (12 MHz) et un coprocesseur **Z80**, avec un bus graphique 24 bits.

- **Spécifications Clés** :
  - **Résolution** : 320x224 pixels.
  - **Couleurs** : 65 536 en palette, 4 096 affichables simultanément.
  - **Mémoire** : 64 Ko RAM + 84 Ko VRAM.

- **Avantages** : Des sprites volumineux, des animations fluides (ex: *Metal Slug*), et un son surround **Yamaha YM2610** inégalé à l'époque.

*Tableau Comparatif vs. Consoles Concurrentes (1991) :*

| **Console**       | **Processeur**     | **Couleurs Simultanées** | **Prix Lancement** |
|-------------------|-------------------|--------------------------|-------------------|
| **Neo Geo AES**   | 68000 @ 12 MHz   | 4 096                    | 650$              |
| **Sega Mega Drive**| 68000 @ 7.6 MHz  | 512                      | 200$              |
| **Super Nintendo**| Ricoh 5A22 @ 3.58 MHz | 256                 | 200$              |

---

## 🎮 **III. Ludothèque : L'Âme de la Neo Geo**

SNK a bâti sa réputation sur des séries cultes optimisées pour la plateforme :

- **Jeux de Combat** :
  - *Fatal Fury* (1991) : Introduit le *"Plan Switching"* (2 plans de déplacement).
  - *The King of Fighters* (dès 1994) : Crossover épique avec 30 personnages issus de *Fatal Fury*, *Art of Fighting* et *Ikari Warriors*.
  - *Samurai Shodown* (1993) : Premier jeu de combat avec système de "rage" et sprites gigantesques.

- **Autres Genres** :
  - *Metal Slug* (1996) : Run-and-gun à l'animation cartoon, célèbre pour son humour noir et ses sprites détaillés.
  - *Puzzle Bobble* (Taito, 1994) : Adaptation du célèbre casse-briques.

*Le Jeu Le Plus Vendu* : **Samurai Shodown** (1993), grâce à son système de combat tactique et ses graphismes épurés.

---

## 🏭 **IV. Développement & Anecdotes**

- **Culture Créative** : Des équipes petites mais ultra-motivées (*"Jeunes, énergiques et un peu punks !"*, selon Naoto Abe). Ex: *Metal Slug* était initialement un jeu de tanks, transformé en run-and-gun après l'ajout des personnages Marco et Tarma.

- **Défis Techniques** : Pour *Athena* (1986), le designer Toshiyuki Nakai a passé **2 mois dans un hôtel capsule** pour optimiser l'épée de feu, victime des limites mémoire.

- **Marketing Audacieux** : La mascotte **G-Mantle** (un homme en costume futuriste) a été créée pour incarner l'élitisme de la console, mais abandonnée car jugée trop mystérieuse.

---

## ⏳ **V. Longévité & Héritage**

- **Support Record** : Production officielle de jeux jusqu'en **2004** (*Samurai Shodown V Special*), soit **14 ans** après le lancement.

- **Scène Indé Moderne** : Des studios comme **NG:DEV.TEAM** produisent encore des jeux physiques (*Last Hope*, *Gunlord*), avec des éditions limitées à quelques centaines d'exemplaires.

- **Produits Dérivés** :
  - **Neo Geo Mini** (2018) : Borne miniature avec 40 jeux préchargés.
  - **Arcade Stick Pro** (2019) : Manette arcade + console avec 20 jeux de combat.

- **Impact Culturel** : Considérée comme l'apogée de la 2D, elle inspire encore des jeux indépendants (*Garou: Mark of the Wolves* est cité comme référence par les créateurs de *Street Fighter 6*).

---

## 💎 **Conclusion : Un Objet de Culte Intemporel**

La Neo Geo reste un symbole d'audace technique et de passion démesurée. Malgré son échec commercial relatif (moins d'1 million d'unités vendues), elle a forgé une mythologie grâce à :

- Son **identité arcade sans compromis**.
- Ses **licences inoubliables** (KOF, Metal Slug...).
- Sa **communauté de collectionneurs** acharnés (les cartouches rares valent des milliers d'euros).

Comme le résume Kazuhiro Tanaka, artiste sur *Metal Slug* : *"On voulait montrer aux concurrents qu'on était les meilleurs. On a donné notre âme."*.

Pour explorer ses jeux aujourd'hui : émulateurs, compilations (ex: *SNK 40th Anniversary*), ou bornes **Neo Geo MVSX** (50 jeux préinstallés).`

async function addNeoGeoEditorial() {
  try {
    // Chercher la console Neo Geo
    const neoGeoConsole = await prisma.console.findFirst({
      where: {
        OR: [
          { slug: 'neo-geo' },
          { name: { contains: 'Neo Geo', mode: 'insensitive' } },
          { name: { contains: 'NeoGeo', mode: 'insensitive' } }
        ]
      }
    })

    if (!neoGeoConsole) {
      console.log("Console Neo Geo non trouvée dans la base de données")
      return
    }

    // Ajouter le contenu éditorial
    await prisma.console.update({
      where: { id: neoGeoConsole.id },
      data: {
        editorialTitle: "🌟 La Neo Geo AES : La Rolls-Royce des Consoles de Jeu",
        editorialAuthor: "Équipe Super Retrogamers",
        editorialContent: neoGeoEditorial,
        editorialPublishedAt: new Date(),
      }
    })

    console.log(`Article éditorial ajouté avec succès pour ${neoGeoConsole.name}`)
  } catch (error) {
    console.error("Erreur lors de l'ajout de l'article éditorial:", error)
  } finally {
    await prisma.$disconnect()
  }
}

addNeoGeoEditorial()