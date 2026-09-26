# Journal des modifications

Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) ; le projet suit le
[versionnage sémantique](https://semver.org/lang/fr/).

# [2.0.0] — 2026-09-26

### À vérifier avant de mettre à jour

- **`vue` devient une dépendance de pair** (`^3.5`).
- **Chemins d'import verrouillés** par le champ `exports` : `dsfr-postale`, `dsfr-postale/style.css`
  et `dsfr-postale/dist/*`. Le build UMD est renommé `dsfr-postale.umd.cjs` et expose
  `{ default, DsfrPostale }`.
- **`autocomplete="address-line1"`** par défaut ; passer `autocomplete="off"` si
  l'adresse saisie n'est pas celle de l'usager.
- **Nouveau balisage d'erreur DSFR** (`fr-messages-group`) et classes propres à la liste de
  suggestions (`dsfr-postale__listbox`, `dsfr-postale__option`).

### Ajouts

- `v-model` facultatif sur le texte saisi, prop `limit`, type `SelectedAddress` exporté.
- Tests d'accessibilité (axe-core), de rendu serveur, du build UMD, seuils de couverture et
  contrôle pa11y de la démonstration en CI.
- Démonstration intégrée au dépôt et publiée sur GitHub Pages ; publication npm automatisée
  avec provenance.

### Corrections

- Accessibilité : `aria-controls` valide, identifiants uniques par instance (`useId`),
  navigation ArrowUp, Entrée ne soumet plus le formulaire, annonce du nombre de résultats,
  `aria-invalid` en cas d'erreur.
- Annulation des requêtes obsolètes, saisies accentuées acceptées, thème sombre.
