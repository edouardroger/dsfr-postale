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

Le DSFR doit être chargé par l'application hôte. Importez aussi la feuille de style du composant :

```ts
import 'dsfr-postale/style.css'
```

### Utilisation

```vue
<script setup lang="ts">
import DsfrPostale, { type SelectedAddress } from 'dsfr-postale'

function onAddressSelected(address: SelectedAddress) {
  console.log('Adresse sélectionnée', address)
}
</script>

<template>
  <DsfrPostale label="Adresse postale" @address-selected="onAddressSelected" />
</template>
```

### Propriétés

| Propriété | Type | Défaut | Rôle |
| --- | --- | --- | --- |
| `label` | `string` | « Votre adresse postale » | Étiquette du champ |
| `hint` | `string` | — | Aide à la saisie |
| `postcode` | `string` | — | Restreint les suggestions à un code postal |
| `inputId` | `string` | généré (`useId`) | Identifiant du champ |
| `errorMessage` | `string` | — | Message d'erreur à afficher |
| `required` | `boolean` | `false` | Saisie obligatoire |
| `autocomplete` | `string` | `address-line1` | Finalité du champ (RGAA 11.13) ; `off` si l'adresse n'est pas celle de l'usager |
| `debounce` | `boolean` | `true` | Temporise les appels à l'API |
| `debounceDelay` | `number` | `300` | Délai de temporisation (ms) |
| `limit` | `number` | `5` | Nombre maximal de suggestions (1 à 50) |

Le texte saisi est accessible via `v-model` (facultatif).

### Événement

`addressSelected` (`@address-selected`) restitue un objet `SelectedAddress` : `label`, `housenumber`, `street`, `postcode`, `city`, `citycode` (code INSEE), `lat`, `lng`.

### Politique de sécurité du contenu

Si votre application définit une CSP, autorisez l'API : `connect-src https://data.geopf.fr`.

## Accessibilité

Le composant met en œuvre le motif ARIA « combobox » (liste de suggestions) : navigation au clavier (flèches, Entrée, Échap, Tab), identifiants uniques, nombre de résultats restitué aux technologies d'assistance, message d'erreur relié au champ. Chaque état du composant (liste fermée, ouverte, erreur) est audité par axe-core dans les tests, et la démonstration par pa11y (axe et HTML_CodeSniffer) dans la CI. Ces contrôles automatiques ne remplacent pas un audit RGAA.

## Développement

```bash
npm install
npm run dev          # démonstration locale, sur les sources
npm test             # tests unitaires, rendu serveur et accessibilité (axe-core)
npm run test:coverage  # idem, avec seuils de couverture
npm run test:umd     # chargement du build UMD sans outil de build (après npm run build)
npm run build        # paquet npm (dist/)
npm run build:demo   # démonstration (dist-demo/), déployée sur GitHub Pages par la CI
```

## Publication

La publication sur npm est automatisée (`.github/workflows/publish.yml`) par [Trusted Publishing](https://docs.npmjs.com/trusted-publishers) : aucun jeton npm n'est stocké dans le dépôt et chaque version est accompagnée d'une attestation de provenance.

```bash
npm version minor            # met à jour package.json, crée le commit et le tag vX.Y.Z
git push --follow-tags       # le tag déclenche vérifications puis publication
```

La publication échoue si le tag ne correspond pas à la version du `package.json`, et ne fait rien si la version existe déjà sur npm.

## Source des données

Base Adresse Nationale (BAN), via l'[API Géocodage de la Géoplateforme](https://geoservices.ign.fr/documentation/services/services-geoplateforme/geocodage).
