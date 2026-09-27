# Journal des modifications

Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) ; le projet suit le
[versionnage sémantique](https://semver.org/lang/fr/).

## [Non publiée]

### Outillage

- Publication en une seule commande (`npm version`) ; release GitHub créée à partir de ce journal.

## [2.2.0] — 2026-09-26

### Ajouts

- Prop `type` (`housenumber`, `street`, `locality`, `municipality`), par exemple pour exiger un
  numéro de voie.
- Mise en évidence de la saisie dans les suggestions, sans tenir compte de la casse ni des accents.
- Prop `messages` pour personnaliser les textes ; types `AddressType` et `DsfrPostaleMessages` exportés.

### Outillage

- Contrôle pa11y de la démonstration liste ouverte, en thèmes clair et sombre ; les résultats « à vérifier manuellement » d'axe deviennent des avertissements.
- Release GitHub créée automatiquement à partir du CHANGELOG lors de la publication.
- Procédure de publication en un seul commit.

## [2.1.0] — 2026-09-26

### Ajouts

- `v-model:address` : adresse choisie, qui repasse à `null` quand le texte saisi ne lui
  correspond plus, et événement `addressCleared`.
- Prop `timeout` (8 s par défaut) : une API qui ne répond pas est signalée au lieu d'être
  attendue indéfiniment.
- Cache des 20 dernières réponses et préparation de la connexion à l'API au premier focus.

### Corrections

- L'option active reste visible au clavier quand la liste défile.
- `limit` est ramené entre 1 et 50 et un `postcode` qui n'a pas 5 chiffres est ignoré, au lieu
  de provoquer une erreur de l'API.
- Une indisponibilité de l'API n'est plus présentée comme une erreur de saisie : message
  d'information, sans `aria-invalid`.

## [2.0.0] — 2026-09-26

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
