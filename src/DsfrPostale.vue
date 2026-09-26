<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import { highlight } from './highlight'
import { DEFAULT_MESSAGES } from './messages'
import type { AddressType, DsfrPostaleMessages, GeocodageFeature, SelectedAddress } from './types'

const API_ORIGIN = 'https://data.geopf.fr'
const API_URL = `${API_ORIGIN}/geocodage/search`
const MIN_LENGTH = 3
const CACHE_SIZE = 20
const TYPES = new Set<AddressType>(['housenumber', 'street', 'locality', 'municipality'])

const props = withDefaults(
  defineProps<{
    /** Étiquette du champ */
    label?: string
    /** Aide à la saisie, affichée sous l'étiquette */
    hint?: string
    /** Identifiant du champ (généré par défaut) */
    inputId?: string
    /** Restreint les suggestions à un code postal (5 chiffres, sinon ignoré) */
    postcode?: string
    /** Message d'erreur fourni par le formulaire parent */
    errorMessage?: string
    /** Saisie obligatoire */
    required?: boolean
    /** Valeur de l'attribut autocomplete (RGAA 11.13) */
    autocomplete?: string
    /** Temporise les appels à l'API */
    debounce?: boolean
    /** Délai de temporisation, en millisecondes */
    debounceDelay?: number
    /** Nombre maximal de suggestions (ramené entre 1 et 50) */
    limit?: number
    /** Délai maximal de réponse de l'API, en millisecondes */
    timeout?: number
    /** Type de résultat attendu, par exemple `housenumber` pour exiger un numéro */
    type?: AddressType
    /** Textes du composant (remplace tout ou partie des textes par défaut) */
    messages?: Partial<DsfrPostaleMessages>
  }>(),
  {
    label: 'Votre adresse postale',
    hint: undefined,
    inputId: undefined,
    postcode: '',
    errorMessage: '',
    required: false,
    autocomplete: 'address-line1',
    debounce: true,
    debounceDelay: 300,
    limit: 5,
    timeout: 8000,
    type: undefined,
    messages: () => ({}),
  },
)

const emit = defineEmits<{
  addressSelected: [address: SelectedAddress]
  /** L'adresse choisie ne correspond plus au texte saisi. */
  addressCleared: []
}>()

/** Texte saisi, liable via v-model (facultatif). */
const query = defineModel<string>({ default: '' })
/** Adresse choisie, liable via v-model:address ; repasse à null si le texte change. */
const address = defineModel<SelectedAddress | null>('address', { default: null })

const uid = useId()
const id = computed(() => props.inputId ?? `dsfr-postale-${uid}`)
const listboxId = computed(() => `${id.value}-listbox`)
const messagesId = computed(() => `${id.value}-messages`)
const optionId = (index: number) => `${id.value}-option-${index}`

const listbox = ref<HTMLUListElement>()
const suggestions = ref<GeocodageFeature[]>([])
const activeIndex = ref(-1)
const serviceError = ref('')
const status = ref('')

const text = computed<DsfrPostaleMessages>(() => ({ ...DEFAULT_MESSAGES, ...props.messages }))
/** Texte pour lequel les suggestions affichées ont été obtenues (mise en évidence). */
const searched = ref('')

const expanded = computed(() => suggestions.value.length > 0)
const activeDescendant = computed(() =>
  activeIndex.value >= 0 ? optionId(activeIndex.value) : undefined,
)

let timer: ReturnType<typeof setTimeout> | undefined
let controller: AbortController | undefined
/** Réponses récentes, pour ne pas réinterroger l'API quand l'usager efface des caractères. */
const cache = new Map<string, GeocodageFeature[]>()

/** L'API exige au moins 3 caractères commençant par une lettre ou un chiffre. */
const isSearchable = (q: string) =>
  q.length >= MIN_LENGTH && /^[\p{L}\p{N}]/u.test(q) && /\p{L}/u.test(q)

/** Paramètres de requête, bornés pour éviter les erreurs 400 de l'API. */
function buildParams(q: string) {
  const limit = Math.min(50, Math.max(1, Math.trunc(props.limit) || 5))
  const params = new URLSearchParams({ q, limit: String(limit) })
  const postcode = props.postcode.trim()
  if (/^\d{5}$/.test(postcode)) params.set('postcode', postcode)
  if (props.type && TYPES.has(props.type)) params.set('type', props.type)
  return params.toString()
}

function cancelPending() {
  clearTimeout(timer)
  controller?.abort()
}

function close() {
  cancelPending()
  suggestions.value = []
  activeIndex.value = -1
}

function showResults(features: GeocodageFeature[], q: string) {
  suggestions.value = features
  searched.value = q
  activeIndex.value = -1
  serviceError.value = ''
  status.value = features.length ? text.value.results(features.length) : text.value.noResults
}

async function search(params: string, q: string) {
  const ctrl = new AbortController()
  controller = ctrl
  const deadline = setTimeout(
    () => ctrl.abort(new DOMException('Délai de réponse dépassé', 'TimeoutError')),
    props.timeout,
  )

  try {
    const response = await fetch(`${API_URL}?${params}`, {
      headers: { Accept: 'application/json' },
      signal: ctrl.signal,
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const { features = [] } = (await response.json()) as { features?: GeocodageFeature[] }
    if (ctrl.signal.aborted) return

    cache.delete(params)
    cache.set(params, features)
    if (cache.size > CACHE_SIZE) cache.delete(cache.keys().next().value!)
    showResults(features, q)
  } catch {
    // Requête remplacée par une saisie plus récente : rien à signaler.
    if (ctrl.signal.aborted && (ctrl.signal.reason as Error | undefined)?.name !== 'TimeoutError') return
    suggestions.value = []
    serviceError.value = text.value.serviceError
  } finally {
    clearTimeout(deadline)
  }
}

function onInput(event: Event) {
  const q = (event.target as HTMLInputElement).value.trim()
  close()
  if (!isSearchable(q)) return

  const params = buildParams(q)
  const cached = cache.get(params)
  if (cached) showResults(cached, q)
  else if (props.debounce) timer = setTimeout(search, props.debounceDelay, params, q)
  else void search(params, q)
}

/** Ouvre la connexion à l'API dès le premier focus, pour accélérer la première suggestion. */
let preconnected = false
function preconnect() {
  if (preconnected) return
  preconnected = true
  if (document.querySelector(`link[rel="preconnect"][href^="${API_ORIGIN}"]`)) return
  const link = document.createElement('link')
  link.rel = 'preconnect'
  link.href = API_ORIGIN
  link.crossOrigin = 'anonymous'
  document.head.append(link)
}

function onKeydown(event: KeyboardEvent) {
  const n = suggestions.value.length
  switch (event.key) {
    case 'ArrowDown':
      if (!n) return
      event.preventDefault()
      activeIndex.value = (activeIndex.value + 1) % n
      break
    case 'ArrowUp':
      if (!n) return
      event.preventDefault()
      activeIndex.value = activeIndex.value <= 0 ? n - 1 : activeIndex.value - 1
      break
    case 'Enter':
      if (activeIndex.value < 0) return
      event.preventDefault() // évite la soumission du formulaire
      select(activeIndex.value)
      break
    case 'Escape':
      if (n) close()
      else query.value = ''
      break
    case 'Tab':
      close()
  }
}

function select(index: number) {
  const feature = suggestions.value[index]
  if (!feature) return
  const { label, housenumber, street, postcode, city, citycode } = feature.properties
  const [lng, lat] = feature.geometry.coordinates
  const selected: SelectedAddress = { label, housenumber, street, postcode, city, citycode, lat, lng }
  query.value = label
  address.value = selected
  status.value = ''
  close()
  emit('addressSelected', selected)
}

function onFocusout(event: FocusEvent) {
  const root = event.currentTarget as HTMLElement
  if (!root.contains(event.relatedTarget as Node | null)) close()
}

// Garde l'option active visible quand la liste défile (RGAA 10.7 et 12.8).
watch(activeIndex, async (index) => {
  if (index < 0) return
  await nextTick()
  listbox.value?.children[index]?.scrollIntoView?.({ block: 'nearest' })
})

// Une adresse choisie devient caduque dès que le texte ne lui correspond plus.
watch(query, (text) => {
  if (address.value && text !== address.value.label) {
    address.value = null
    emit('addressCleared')
  }
})

onBeforeUnmount(cancelPending)
</script>

<template>
  <div
    class="fr-input-group dsfr-postale"
    :class="{ 'fr-input-group--error': errorMessage }"
    @focusout="onFocusout"
  >
    <label :for="id" class="fr-label">
      {{ label }}
      <span v-if="hint" class="fr-hint-text">{{ hint }}</span>
    </label>
    <input
      :id="id"
      v-model="query"
      type="text"
      class="fr-input"
      :class="{ 'fr-input--error': errorMessage }"
      role="combobox"
      aria-autocomplete="list"
      :aria-expanded="expanded"
      :aria-controls="listboxId"
      :aria-activedescendant="activeDescendant"
      :aria-describedby="messagesId"
      :aria-invalid="errorMessage ? true : undefined"
      :autocomplete="autocomplete"
      :required="required"
      spellcheck="false"
      @focus="preconnect"
      @input="onInput"
      @keydown="onKeydown"
    />
    <div :id="messagesId" class="fr-messages-group" aria-live="polite">
      <p v-if="errorMessage" class="fr-message fr-message--error">{{ errorMessage }}</p>
      <p v-if="serviceError" class="fr-message fr-message--info">{{ serviceError }}</p>
    </div>
    <ul
      :id="listboxId"
      ref="listbox"
      role="listbox"
      class="dsfr-postale__listbox"
      :aria-label="text.listboxLabel"
      :hidden="!expanded"
    >
      <li
        v-for="(suggestion, index) in suggestions"
        :id="optionId(index)"
        :key="`${index}-${suggestion.properties.label}`"
        role="option"
        class="dsfr-postale__option"
        :aria-selected="index === activeIndex"
        @mousedown.prevent
        @mousemove="activeIndex = index"
        @click="select(index)"
      >
        <template v-for="(part, p) in highlight(suggestion.properties.label, searched)" :key="p">
          <mark v-if="part.match" class="dsfr-postale__match">{{ part.text }}</mark>
          <template v-else>{{ part.text }}</template>
        </template>
      </li>
    </ul>
    <p class="fr-sr-only" role="status">{{ status }}</p>
  </div>
</template>
<style scoped>
.dsfr-postale {
  position: relative;
}

.dsfr-postale__listbox {
  position: absolute;
  z-index: 1000;
  inset-inline: 0;
  max-height: 20rem;
  margin: 0.25rem 0 0;
  padding: 0;
  overflow-y: auto;
  list-style: none;
  background-color: var(--background-overlap-grey, #fff);
  box-shadow:
    0 0 0 1px var(--border-default-grey, #ddd),
    var(--overlap-shadow, 0 6px 18px 0 rgb(0 0 18 / 16%));
}

.dsfr-postale__option {
  margin: 0;
  padding: 0.75rem 1rem;
  color: var(--text-default-grey, #3a3a3a);
  cursor: pointer;
}

.dsfr-postale__option + .dsfr-postale__option {
  border-top: 1px solid var(--border-default-grey, #ddd);
}

.dsfr-postale__match {
  padding: 0;
  font-weight: 700;
  color: inherit;
  background: none;
}

.dsfr-postale__option[aria-selected='true'] {
  background-color: var(--background-open-blue-france, #ececfe);
  outline: 2px solid var(--border-action-high-blue-france, #000091);
  outline-offset: -2px;
}
</style>
