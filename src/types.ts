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
