# Autocomplétion d'adresse postale

## À propos

Ce composant interroge l'API « Base adresse nationale » pour auto-compléter un champ et restituer l’adresse postale choisie.

Il est destiné à s'intégrer au sein de l'écosystème du [système de design de l'État (DSFR)](https://www.systeme-de-design.gouv.fr).

<img width="390" alt="" src="https://github.com/user-attachments/assets/a9159c00-d957-4e7c-a5f5-2b6ffe8ba917" />

## Mise en œuvre

### Installation

npm i dsfr-postale

Remarque : veillez à aussi importer la feuille de style, qui apporte quelques modifications nécessaires.

### Paramètres

- `label` (optionnel) : étiquette du champ de saisie (par défaut, « Votre adresse postale »)
- `hint` (optionnel) : aide à la saisie
- `postcode` (optionnel) : restriction de l'auto-complétion à une ville donnée, en fonction de son code postal
- `inputId` (optionnel) : ID du champ (généré automatiquement par défaut)
- `errorMessage` (optionnel) : message d'erreur à afficher

### Démonstration

[Accéder à la démonstration](https://playcode.io/2052723)

## Accessibilité

Le composant met en œuvre le motif de conception ARIA « combobox » et devrait être accessible.
