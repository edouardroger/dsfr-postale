# Autocomplétion d'adresse postale

## À propos

Ce composant interroge l'API GeoPlateforme qui s'appuie sur « Base adresse nationale » pour auto-compléter un champ et restituer l’adresse postale choisie.

Il est destiné à s'intégrer au sein de l'écosystème du [système de design de l'État (DSFR)](https://www.systeme-de-design.gouv.fr).

<img width="390" alt="" src="https://github.com/user-attachments/assets/a9159c00-d957-4e7c-a5f5-2b6ffe8ba917" />

## Mise en œuvre

### Installation

```bash
npm i dsfr-postale
```

Remarque : veillez à aussi importer la feuille de style, qui apporte quelques modifications nécessaires.

### Utilisation

```vue
<template>
	<DsfrPostale @addressSelected="onAddressSelected" label="Adresse postale" />
</template>

<script setup lang="ts">
import DsfrPostale from 'dsfr-postale'

function onAddressSelected(address) {
	console.log('Adresse sélectionnée', address)
}
</script>
```

### Paramètres

- `label` (optionnel) : étiquette du champ de saisie (par défaut, « Votre adresse postale »)
- `hint` (optionnel) : aide à la saisie
- `postcode` (optionnel) : restriction de l'auto-complétion à une ville donnée, en fonction de son code postal
- `inputId` (optionnel) : ID du champ (généré automatiquement par défaut)
- `errorMessage` (optionnel) : message d'erreur à afficher
- `required` (optionnel) : caractère obligatoire de la saisie (par défaut, non)

### Démonstration

[Accéder à la démonstration](https://edouardroger.github.io/dsfr-postale-demo/)

## Accessibilité

Le composant met en œuvre le motif de conception ARIA « combobox » et devrait être accessible.

## Source des données

Le composant recourt aux données de la Base Adresse Nationale (BAN), obtenues via l'API GeoPlateforme.