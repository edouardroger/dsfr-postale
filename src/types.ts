/** Adresse restituée lors de la sélection d'une suggestion. */
export interface SelectedAddress {
  /** Adresse complète */
  label: string
  /** Numéro dans la voie */
  housenumber?: string
  /** Nom de la voie */
  street?: string
  /** Code postal */
  postcode: string
  /** Commune */
  city: string
  /** Code INSEE de la commune */
  citycode?: string
  /** Latitude (WGS 84) */
  lat: number
  /** Longitude (WGS 84) */
  lng: number
}

/** Sous-ensemble utile d'une « feature » GeoJSON renvoyée par l'API Géocodage. */
export interface GeocodageFeature {
  properties: Omit<SelectedAddress, 'lat' | 'lng'>
  geometry: { coordinates: [number, number] }
}

/** Type de résultat attendu de l'API Géocodage. */
export type AddressType = 'housenumber' | 'street' | 'locality' | 'municipality'

/** Textes du composant, personnalisables via la prop `messages`. */
export interface DsfrPostaleMessages {
  /** Nom accessible de la liste de suggestions */
  listboxLabel: string
  /** Annonce du nombre de suggestions (n ≥ 1) */
  results: (n: number) => string
  /** Annonce en l'absence de suggestion */
  noResults: string
  /** Message quand l'API ne répond pas ou renvoie une erreur */
  serviceError: string
}
