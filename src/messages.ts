import type { DsfrPostaleMessages } from './types'

export const DEFAULT_MESSAGES: DsfrPostaleMessages = {
  listboxLabel: 'Adresses postales suggérées',
  results: (n) => {
    const s = n > 1 ? 's' : ''
    return `${n} adresse${s} suggérée${s}. Utilisez les flèches haut et bas pour les parcourir.`
  },
  noResults: 'Aucune adresse trouvée.',
  serviceError:
    "Le service de suggestion d'adresses ne répond pas. Vous pouvez saisir l'adresse manuellement.",
}
