import { flushPromises, mount } from '@vue/test-utils'
import axe from 'axe-core'
import { h } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import DsfrPostale from './DsfrPostale.vue'

const feature = (label: string, housenumber: string, lng: number, lat: number) => ({
  properties: { label, housenumber, street: 'Rue de Poitiers', postcode: '49400', city: 'Saumur', citycode: '49328' },
  geometry: { coordinates: [lng, lat] },
})

const FEATURES = [
  feature('10 Rue de Poitiers 49400 Saumur', '10', -0.079306, 47.253416),
  feature('12 Rue de Poitiers 49400 Saumur', '12', -0.0794, 47.2535),
]

const fetchMock = vi.fn()

/** fetch qui ne répond jamais, mais rejette comme le navigateur si sa requête est annulée. */
const abortable = (_url: string, { signal }: RequestInit) =>
  new Promise((_resolve, reject) => {
    signal?.addEventListener('abort', () => reject(signal.reason))
  })

/** Audit axe-core limité aux critères WCAG 2.1 A et AA (base du RGAA 4). */
async function auditAxe(element: Element) {
  const { violations } = await axe.run(element, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
    // jsdom ne calcule pas le rendu : le contraste se contrôle sur la démo (pa11y).
    rules: { 'color-contrast': { enabled: false } },
  })
  return violations.map((v) => `${v.id} : ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)
}

beforeEach(() => {
  fetchMock.mockResolvedValue({ ok: true, json: async () => ({ features: FEATURES }) })
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
  fetchMock.mockReset()
  document.body.innerHTML = ''
  document.head.innerHTML = ''
})

async function setup(props = {}) {
  const wrapper = mount(DsfrPostale, {
    props: { debounce: false, inputId: 'adresse', ...props },
    attachTo: document.body,
  })
  const input = wrapper.get('input')
  await input.setValue('10 rue de Poitiers')
  await flushPromises()
  return { wrapper, input }
}

describe('DsfrPostale', () => {
  it('interroge l’API Géocodage avec les bons paramètres', async () => {
    await setup({ postcode: '49400' })
    const url = new URL(fetchMock.mock.calls[0]?.[0])
    expect(url.origin + url.pathname).toBe('https://data.geopf.fr/geocodage/search')
    expect(url.searchParams.get('q')).toBe('10 rue de Poitiers')
    expect(url.searchParams.get('limit')).toBe('5')
    expect(url.searchParams.get('postcode')).toBe('49400')
  })

  it('n’interroge pas l’API pour une saisie trop courte ou invalide', async () => {
    const wrapper = mount(DsfrPostale, { props: { debounce: false } })
    await wrapper.get('input').setValue('10')
    await wrapper.get('input').setValue('---')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('expose le motif ARIA combobox', async () => {
    const { wrapper, input } = await setup()
    const listbox = wrapper.get('[role="listbox"]')
    expect(wrapper.get('label').attributes('for')).toBe('adresse')
    expect(input.attributes('aria-controls')).toBe(listbox.attributes('id'))
    expect(input.attributes('aria-expanded')).toBe('true')
    expect(listbox.findAll('[role="option"]')).toHaveLength(2)
    expect(wrapper.get('[role="status"]').text()).toContain('2 adresses suggérées')
  })

  it('navigue au clavier et sélectionne avec Entrée', async () => {
    const { wrapper, input } = await setup()
    await input.trigger('keydown', { key: 'ArrowUp' })
    expect(input.attributes('aria-activedescendant')).toBe('adresse-option-1')
    await input.trigger('keydown', { key: 'ArrowDown' })
    expect(input.attributes('aria-activedescendant')).toBe('adresse-option-0')
    expect(wrapper.get('#adresse-option-0').attributes('aria-selected')).toBe('true')

    await input.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('addressSelected')?.[0]?.[0]).toEqual({
      label: '10 Rue de Poitiers 49400 Saumur',
      housenumber: '10',
      street: 'Rue de Poitiers',
      postcode: '49400',
      city: 'Saumur',
      citycode: '49328',
      lat: 47.253416,
      lng: -0.079306,
    })
    expect((input.element as HTMLInputElement).value).toBe('10 Rue de Poitiers 49400 Saumur')
    expect(input.attributes('aria-expanded')).toBe('false')
  })

  it('sélectionne une adresse au clic et met à jour le v-model', async () => {
    const { wrapper } = await setup()
    await wrapper.findAll('[role="option"]')[1]?.trigger('click')
    expect(wrapper.emitted('addressSelected')?.[0]?.[0]).toMatchObject({ housenumber: '12' })
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['12 Rue de Poitiers 49400 Saumur'])
  })

  it('ferme la liste avec Échap, puis vide le champ', async () => {
    const { wrapper, input } = await setup()
    await input.trigger('keydown', { key: 'Escape' })
    expect(wrapper.get('[role="listbox"]').attributes('hidden')).toBeDefined()
    await input.trigger('keydown', { key: 'Escape' })
    expect((input.element as HTMLInputElement).value).toBe('')
  })

  it('signale une panne de l’API sans marquer le champ invalide', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500 })
    const { wrapper, input } = await setup()
    const messages = wrapper.get(`#${input.attributes('aria-describedby')}`)
    expect(messages.get('.fr-message--info').text()).toContain('ne répond pas')
    expect(input.attributes('aria-invalid')).toBeUndefined()
    expect(wrapper.classes()).not.toContain('fr-input-group--error')
  })

  it('affiche le message d’erreur transmis par le parent', async () => {
    const wrapper = mount(DsfrPostale, { props: { errorMessage: 'Adresse obligatoire' } })
    expect(wrapper.get('.fr-message--error').text()).toBe('Adresse obligatoire')
    expect(wrapper.classes()).toContain('fr-input-group--error')
  })

  it('temporise les appels et annule les requêtes obsolètes', async () => {
    vi.useFakeTimers()
    const wrapper = mount(DsfrPostale, { props: { debounceDelay: 300 } })
    const input = wrapper.get('input')
    await input.setValue('10 rue')
    await input.setValue('10 rue de')
    vi.advanceTimersByTime(299)
    expect(fetchMock).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(new URL(fetchMock.mock.calls[0]?.[0]).searchParams.get('q')).toBe('10 rue de')
  })

  it('génère des identifiants uniques par instance', () => {
    const wrapper = mount(() => [h(DsfrPostale), h(DsfrPostale)])
    const ids = wrapper.findAll('input').map((input) => input.attributes('id'))
    expect(new Set(ids).size).toBe(2)
  })

  it('annonce l’absence de résultat', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) })
    const { wrapper, input } = await setup()
    expect(input.attributes('aria-expanded')).toBe('false')
    expect(wrapper.get('[role="status"]').text()).toBe('Aucune adresse trouvée.')
  })

  it('suit le survol à la souris et ferme la liste avec Tab', async () => {
    const { wrapper, input } = await setup()
    await wrapper.findAll('[role="option"]')[1]?.trigger('mousemove')
    expect(input.attributes('aria-activedescendant')).toBe('adresse-option-1')
    await input.trigger('keydown', { key: 'Tab' })
    expect(input.attributes('aria-expanded')).toBe('false')
  })

  it('ferme la liste quand le focus quitte le composant', async () => {
    const { wrapper, input } = await setup()
    await wrapper.trigger('focusout', { relatedTarget: document.body })
    expect(input.attributes('aria-expanded')).toBe('false')
  })

  it('conserve la liste quand le focus reste dans le composant', async () => {
    const { wrapper, input } = await setup()
    await wrapper.trigger('focusout', { relatedTarget: input.element })
    expect(input.attributes('aria-expanded')).toBe('true')
  })

  it('ignore les touches de navigation sans suggestion', async () => {
    const wrapper = mount(DsfrPostale, { props: { inputId: 'vide' } })
    const input = wrapper.get('input')
    for (const key of ['ArrowDown', 'ArrowUp', 'Enter']) await input.trigger('keydown', { key })
    expect(input.attributes('aria-activedescendant')).toBeUndefined()
    expect(wrapper.emitted('addressSelected')).toBeUndefined()
  })

  it('ignore l’annulation d’une requête remplacée', async () => {
    fetchMock.mockImplementationOnce(abortable)
    const wrapper = mount(DsfrPostale, { props: { debounce: false } })
    const input = wrapper.get('input')
    await input.setValue('10 rue')
    await input.setValue('10 rue de Poitiers')
    await flushPromises()
    expect(wrapper.find('.fr-message').exists()).toBe(false)
    expect(wrapper.findAll('[role="option"]')).toHaveLength(2)
  })

  it('abandonne une requête trop longue et le signale', async () => {
    vi.useFakeTimers()
    fetchMock.mockImplementation(abortable)
    const wrapper = mount(DsfrPostale, { props: { debounce: false, timeout: 1000 } })
    await wrapper.get('input').setValue('10 rue de Poitiers')
    await vi.advanceTimersByTimeAsync(1000)
    expect(wrapper.get('.fr-message--info').text()).toContain('ne répond pas')
  })

  it('réutilise les réponses récentes sans rappeler l’API', async () => {
    const { wrapper, input } = await setup()
    await input.setValue('10 rue de Poitiers 4')
    await flushPromises()
    await input.setValue('10 rue de Poitiers')
    await flushPromises()
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(wrapper.findAll('[role="option"]')).toHaveLength(2)
  })

  it('borne limit et ignore un code postal invalide', async () => {
    await setup({ limit: 500, postcode: '494' })
    const url = new URL(fetchMock.mock.calls[0]?.[0])
    expect(url.searchParams.get('limit')).toBe('50')
    expect(url.searchParams.has('postcode')).toBe(false)
  })

  it('fait défiler la liste jusqu’à l’option active', async () => {
    const scroll = vi.fn()
    Element.prototype.scrollIntoView = scroll
    const { input } = await setup()
    await input.trigger('keydown', { key: 'ArrowUp' })
    await flushPromises()
    expect(scroll).toHaveBeenCalledWith({ block: 'nearest' })
    expect((scroll.mock.contexts.at(-1) as Element | undefined)?.id).toBe('adresse-option-1')
    delete (Element.prototype as Partial<Element>).scrollIntoView
  })

  it('renseigne v-model:address puis le vide si le texte change', async () => {
    const { wrapper, input } = await setup()
    await input.trigger('keydown', { key: 'ArrowDown' })
    await input.trigger('keydown', { key: 'Enter' })
    const choisie = wrapper.emitted('update:address')?.at(-1)?.[0]
    expect(choisie).toMatchObject({ housenumber: '10' })
    await wrapper.setProps({ address: choisie as never })
    await input.setValue('10 Rue de Poitiers 49400 Saumu')
    expect(wrapper.emitted('update:address')?.at(-1)).toEqual([null])
    expect(wrapper.emitted('addressCleared')).toHaveLength(1)
  })

  it('prépare la connexion à l’API au premier focus', async () => {
    const wrapper = mount(DsfrPostale, { attachTo: document.body })
    await wrapper.get('input').trigger('focus')
    await wrapper.get('input').trigger('focus')
    expect(document.head.querySelectorAll('link[rel="preconnect"][href="https://data.geopf.fr"]')).toHaveLength(1)
  })

  it('ne présente aucune erreur axe, liste fermée', async () => {
    const wrapper = mount(DsfrPostale, { attachTo: document.body, props: { required: true, hint: 'Aide' } })
    expect(await auditAxe(wrapper.element)).toEqual([])
  })

  it('ne présente aucune erreur axe, liste ouverte', async () => {
    const { wrapper, input } = await setup()
    await input.trigger('keydown', { key: 'ArrowDown' })
    expect(await auditAxe(wrapper.element)).toEqual([])
  })

  it('ne présente aucune erreur axe, service indisponible', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 503 })
    const { wrapper } = await setup()
    expect(await auditAxe(wrapper.element)).toEqual([])
  })

  it('ne présente aucune erreur axe, message d’erreur affiché', async () => {
    const wrapper = mount(DsfrPostale, { attachTo: document.body, props: { errorMessage: 'Adresse obligatoire' } })
    expect(await auditAxe(wrapper.element)).toEqual([])
  })
})
