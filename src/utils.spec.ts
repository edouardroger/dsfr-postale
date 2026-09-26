import { describe, expect, it } from 'vitest'
import { highlight } from './highlight'
import { DEFAULT_MESSAGES } from './messages'

const marked = (label: string, query: string) =>
  highlight(label, query).filter((s) => s.match).map((s) => s.text)

describe('highlight', () => {
  it('marque les mots saisis, sans tenir compte de la casse ni des accents', () => {
    expect(marked('10 Rue de la République 69002 Lyon', '10 rue de la republique')).toEqual([
      '10 Rue de la République',
    ])
  })

  it('marque les occurrences séparées', () => {
    expect(marked('10 Rue de Poitiers 86000 Poitiers', 'poitiers')).toEqual(['Poitiers', 'Poitiers'])
  })

  it('conserve le texte intégral', () => {
    const label = '12 Avenue des Érables 49400 Saumur'
    expect(highlight(label, 'erab saum').map((s) => s.text).join('')).toBe(label)
  })

  it('ne marque rien pour une saisie vide', () => {
    expect(highlight('Saumur', '  ')).toEqual([{ text: 'Saumur', match: false }])
  })
})

describe('DEFAULT_MESSAGES', () => {
  it('accorde l’annonce au nombre de suggestions', () => {
    expect(DEFAULT_MESSAGES.results(1)).toMatch(/^1 adresse suggérée\./)
    expect(DEFAULT_MESSAGES.results(3)).toMatch(/^3 adresses suggérées\./)
  })
})
