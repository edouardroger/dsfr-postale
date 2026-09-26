<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useId } from 'vue'
import type { GeocodageFeature, SelectedAddress } from './types'

const API_URL = 'https://data.geopf.fr/geocodage/search'
const MIN_LENGTH = 3

const props = withDefaults(
  defineProps<{
    /** Étiquette du champ */
    label?: string
    /** Aide à la saisie, affichée sous l'étiquette */
    hint?: string
    /** Identifiant du champ (généré par défaut) */
    inputId?: string
    /** Restreint les suggestions à un code postal */
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
    /** Nombre maximal de suggestions (1 à 50) */
    limit?: number
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
  },
)

const emit = defineEmits<{ addressSelected: [address: SelectedAddress] }>()

/** Texte saisi, liable via v-model (facultatif). */
const query = defineModel<string>({ default: '' })

const uid = useId()
const id = computed(() => props.inputId ?? `dsfr-postale-${uid}`)
const listboxId = computed(() => `${id.value}-listbox`)
const messagesId = computed(() => `${id.value}-messages`)
const optionId = (index: number) => `${id.value}-option-${index}`

const suggestions = ref<GeocodageFeature[]>([])
const activeIndex = ref(-1)
const fetchError = ref('')
const status = ref('')

const expanded = computed(() => suggestions.value.length > 0)
const error = computed(() => props.errorMessage || fetchError.value)
const activeDescendant = computed(() =>
  activeIndex.value >= 0 ? optionId(activeIndex.value) : undefined,
)

let timer: ReturnType<typeof setTimeout> | undefined
let controller: AbortController | undefined

/** L'API exige au moins 3 caractères commençant par une lettre ou un chiffre. */
const isSearchable = (q: string) =>
  q.length >= MIN_LENGTH && /^[\p{L}\p{N}]/u.test(q) && /\p{L}/u.test(q)

function cancelPending() {
  clearTimeout(timer)
  controller?.abort()
}

function close() {
  cancelPending()
  suggestions.value = []
  activeIndex.value = -1
}

async function search(q: string) {
  controller = new AbortController()
  const params = new URLSearchParams({ q, limit: String(props.limit) })
  if (props.postcode) params.set('postcode', props.postcode)

  try {
    const response = await fetch(`${API_URL}?${params}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const { features = [] } = (await response.json()) as { features?: GeocodageFeature[] }

    suggestions.value = features
    activeIndex.value = -1
    fetchError.value = ''
    const n = features.length
    status.value = n
      ? `${n} adresse${n > 1 ? 's' : ''} suggérée${n > 1 ? 's' : ''}. Utilisez les flèches haut et bas pour les parcourir.`
      : 'Aucune adresse trouvée.'
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') return
    suggestions.value = []
    fetchError.value = "Erreur lors de l'obtention des adresses. Veuillez réessayer."
  }
}

function onInput(event: Event) {
  const q = (event.target as HTMLInputElement).value.trim()
  close()
  if (!isSearchable(q)) return
  if (props.debounce) timer = setTimeout(search, props.debounceDelay, q)
  else void search(q)
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
  query.value = label
  status.value = ''
  close()
  emit('addressSelected', { label, housenumber, street, postcode, city, citycode, lat, lng })
}

function onFocusout(event: FocusEvent) {
  const root = event.currentTarget as HTMLElement
  if (!root.contains(event.relatedTarget as Node | null)) close()
}

onBeforeUnmount(cancelPending)
</script>

<template>
  <div
    class="fr-input-group dsfr-postale"
    :class="{ 'fr-input-group--error': error }"
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
      :class="{ 'fr-input--error': error }"
      role="combobox"
      aria-autocomplete="list"
      :aria-expanded="expanded"
      :aria-controls="listboxId"
      :aria-activedescendant="activeDescendant"
      :aria-describedby="messagesId"
      :aria-invalid="error ? true : undefined"
      :autocomplete="autocomplete"
      :required="required"
      spellcheck="false"
      @input="onInput"
      @keydown="onKeydown"
    />
    <div :id="messagesId" class="fr-messages-group" aria-live="polite">
      <p v-if="error" class="fr-message fr-message--error">{{ error }}</p>
    </div>
    <ul
      :id="listboxId"
      role="listbox"
      class="dsfr-postale__listbox"
      aria-label="Adresses postales suggérées"
      :hidden="!expanded"
    >
      <li
        v-for="(suggestion, index) in suggestions"
        :id="optionId(index)"
        :key="suggestion.properties.label"
        role="option"
        class="dsfr-postale__option"
        :aria-selected="index === activeIndex"
        @mousedown.prevent
        @mousemove="activeIndex = index"
        @click="select(index)"
      >
        {{ suggestion.properties.label }}
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

.dsfr-postale__option[aria-selected='true'] {
  background-color: var(--background-open-blue-france, #ececfe);
  outline: 2px solid var(--border-action-high-blue-france, #000091);
  outline-offset: -2px;
}
</style>
