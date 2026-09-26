# Autocomplétion d'adresse postale

[![CI](https://github.com/edouardroger/dsfr-postale/actions/workflows/ci.yml/badge.svg)](https://github.com/edouardroger/dsfr-postale/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/dsfr-postale)](https://www.npmjs.com/package/dsfr-postale)

## À propos

Ce composant Vue 3 interroge l'API Géocodage de la Géoplateforme (IGN), qui s'appuie sur la Base Adresse Nationale, pour auto-compléter un champ et restituer l'adresse postale choisie.

Il est destiné à s'intégrer au sein de l'écosystème du [système de design de l'État (DSFR)](https://www.systeme-de-design.gouv.fr).

<img width="390" alt="" src="https://github.com/user-attachments/assets/a9159c00-d957-4e7c-a5f5-2b6ffe8ba917" />

**[Accéder à la démonstration](https://edouardroger.github.io/dsfr-postale/)**

## Mise en œuvre

### Installation

```bash
npm i dsfr-postale
```

Vue 3.5 ou plus récent est requis (dépendance de pair). Pour une mise à jour depuis la version 1, consultez le [journal des modifications](CHANGELOG.md).

Le DSFR doit être chargé par l'application hôte. Importez aussi la feuille de style du composant :

```ts
import 'dsfr-postale/style.css'
```

### Utilisation

```vue
<script setup lang="ts">
import { ref } from 'vue'
import DsfrPostale, { type SelectedAddress } from 'dsfr-postale'

// Repasse à null dès que l'usager modifie le texte après son choix.
const adresse = ref<SelectedAddress | null>(null)
</script>

<template>
  <DsfrPostale v-model:address="adresse" label="Adresse postale" />
</template>
```

### Propriétés

| Propriété | Type | Défaut | Rôle |
| --- | --- | --- | --- |
| `label` | `string` | « Votre adresse postale » | Étiquette du champ |
| `hint` | `string` | — | Aide à la saisie |
| `postcode` | `string` | — | Restreint les suggestions à un code postal (5 chiffres, sinon ignoré) |
| `inputId` | `string` | généré (`useId`) | Identifiant du champ |
| `errorMessage` | `string` | — | Message d'erreur à afficher |
| `required` | `boolean` | `false` | Saisie obligatoire |
| `autocomplete` | `string` | `address-line1` | Finalité du champ (RGAA 11.13) ; `off` si l'adresse n'est pas celle de l'usager |
| `debounce` | `boolean` | `true` | Temporise les appels à l'API |
| `debounceDelay` | `number` | `300` | Délai de temporisation (ms) |
| `limit` | `number` | `5` | Nombre maximal de suggestions (ramené entre 1 et 50) |
| `timeout` | `number` | `8000` | Délai maximal de réponse de l'API (ms) |
| `type` | `AddressType` | — | Type de résultat : `housenumber` (numéro exigé), `street`, `locality` ou `municipality` |
| `messages` | `Partial<DsfrPostaleMessages>` | textes français | Remplace tout ou partie des textes (voir ci-dessous) |

### Liaisons (`v-model`)

| Liaison | Type | Rôle |
| --- | --- | --- |
| `v-model` | `string` | Texte saisi |
| `v-model:address` | `SelectedAddress \| null` | Adresse choisie ; repasse à `null` si le texte ne lui correspond plus |

### Événements

| Événement | Charge | Déclenchement |
| --- | --- | --- |
| `addressSelected` (`@address-selected`) | `SelectedAddress` | Choix d'une suggestion |
| `addressCleared` (`@address-cleared`) | — | L'adresse choisie ne correspond plus au texte saisi |

### Textes

La prop `messages` accepte `listboxLabel` (nom de la liste), `results` (fonction recevant le nombre de suggestions), `noResults` et `serviceError` :

```vue
<DsfrPostale :messages="{ noResults: 'Aucune adresse ne correspond.' }" />
```

Les types `SelectedAddress`, `AddressType` et `DsfrPostaleMessages` sont exportés par le paquet.

`SelectedAddress` contient `label`, `housenumber`, `street`, `postcode`, `city`, `citycode` (code INSEE), `lat` et `lng`.

### Comportement réseau

Les réponses récentes sont gardées en mémoire (20 requêtes) : effacer des caractères ne rappelle pas l'API. La connexion à l'API est préparée au premier focus du champ. Si l'API ne répond pas dans le délai `timeout`, ou renvoie une erreur, un message informe l'usager qu'il peut saisir l'adresse manuellement ; le champ n'est pas marqué invalide pour autant.

### Politique de sécurité du contenu

Si votre application définit une CSP, autorisez l'API : `connect-src https://data.geopf.fr`.

## Accessibilité

Le composant met en œuvre le motif ARIA « combobox » (liste de suggestions) : navigation au clavier (flèches, Entrée, Échap, Tab), identifiants uniques, nombre de résultats restitué aux technologies d'assistance, message d'erreur relié au champ, partie saisie mise en évidence dans chaque suggestion. Chaque état du composant (liste fermée, ouverte, erreur) est audité par axe-core dans les tests, et la démonstration par pa11y (axe et HTML_CodeSniffer) dans la CI, liste fermée puis ouverte, en thèmes clair et sombre (`?scheme=dark` force le thème de la démonstration). Ces contrôles automatiques ne remplacent pas un audit RGAA.

## Développement

```bash
npm install
npm run dev          # démonstration locale, sur les sources
npm run typecheck    # vérification des types
npm test             # tests unitaires, rendu serveur et accessibilité (axe-core)
npm run test:coverage  # idem, avec seuils de couverture
npm run test:umd     # chargement du build UMD sans outil de build (après npm run build)
npm run build        # paquet npm (dist/)
npm run build:demo   # démonstration (dist-demo/), déployée sur GitHub Pages par la CI
npm run preview      # aperçu de la démonstration construite (http://127.0.0.1:4173/dsfr-postale/)
```

## Publication

La publication sur npm est automatisée (`.github/workflows/publish.yml`) par [Trusted Publishing](https://docs.npmjs.com/trusted-publishers) : aucun jeton npm n'est stocké dans le dépôt et chaque version est accompagnée d'une attestation de provenance.

Une version tient en un seul commit :

1. Ajoutez en haut de `CHANGELOG.md` une section `## [x.y.z] — date` décrivant les changements.
2. Mettez à jour la version sans commit ni tag : `npm version minor --no-git-tag-version` (`patch` pour une correction, `major` pour un changement cassant).
3. Commitez l'ensemble (code, `CHANGELOG.md`, `package.json`, `package-lock.json`), par exemple « 2.2.0 : mise en évidence, type, textes ».
4. Créez un tag annoté et poussez : `git tag -a vx.y.z -m "x.y.z"` puis `git push --follow-tags`.

Le tag déclenche les vérifications, la publication sur npm puis la création de la release GitHub avec la section correspondante du journal.

La publication échoue si le tag ne correspond pas à la version du `package.json`, et ne fait rien si la version existe déjà sur npm.

## Données personnelles

Le texte saisi est transmis à l'API Géocodage de l'IGN pour obtenir les suggestions. Si l'adresse est celle de l'usager, mentionnez ce transfert dans l'information prévue par le RGPD (article 13) de votre service.

## Source des données

Base Adresse Nationale (BAN), via l'[API Géocodage de la Géoplateforme](https://geoservices.ign.fr/documentation/services/services-geoplateforme/geocodage). Le service est public et sans clé, mais soumis à une limite de requêtes : gardez la temporisation (`debounce`) activée.

## Licence

MIT
