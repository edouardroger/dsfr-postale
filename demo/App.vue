<script setup lang="ts">
import { ref } from 'vue'
import DsfrPostale, { type SelectedAddress } from 'dsfr-postale'

const LABELS: Record<keyof SelectedAddress, string> = {
  label: 'Adresse',
  housenumber: 'Numéro',
  street: 'Voie',
  postcode: 'Code postal',
  city: 'Commune',
  citycode: 'Code INSEE',
  lat: 'Latitude',
  lng: 'Longitude',
}

const examples = [
  { title: 'Utilisation simple', props: {} },
  { title: 'Restreinte au code postal 49400', props: { postcode: '49400', label: 'Adresse à Saumur' } },
] as const

const selected = ref<(SelectedAddress | null)[]>(examples.map(() => null))
</script>

<template>
  <main id="contenu" class="fr-container fr-py-6w">
    <div class="fr-grid-row fr-grid-row--center">
      <div class="fr-col-12 fr-col-md-10 fr-col-lg-6">
        <h1>dsfr-postale</h1>
        <p class="fr-text--lead">
          Composant Vue d'autocomplétion d'adresse postale, conforme au système de design de l'État,
          s'appuyant sur la Base Adresse Nationale.
        </p>

        <section v-for="(example, i) in examples" :key="example.title" class="fr-mb-6w">
          <h2 class="fr-h4">{{ example.title }}</h2>
          <DsfrPostale v-bind="example.props" hint="Saisissez au moins 3 caractères, par exemple « 10 rue de Poitiers »"
            v-model:address="selected[i]" />
          <template v-if="selected[i]">
            <h3 class="fr-h6">Adresse restituée</h3>
            <dl class="resultat">
              <template v-for="(name, key) in LABELS" :key="key">
                <dt>{{ name }}</dt>
                <dd>{{ selected[i]?.[key] ?? '—' }}</dd>
              </template>
            </dl>
          </template>
        </section>

        <h2 class="fr-h4">Installation</h2>
        <pre><code>npm i dsfr-postale</code></pre>
      </div>
    </div>
  </main>

  <footer class="fr-container fr-pb-6w">
    <div class="fr-grid-row fr-grid-row--center">
      <div class="fr-col-12 fr-col-md-10 fr-col-lg-6">
        <ul class="fr-links-group">
          <li><a class="fr-link" href="https://github.com/edouardroger/dsfr-postale">Code source sur GitHub</a></li>
          <li><a class="fr-link" href="https://www.npmjs.com/package/dsfr-postale">Paquet npm</a></li>
          <li><a class="fr-link" href="https://adresse.data.gouv.fr">Base Adresse Nationale</a></li>
        </ul>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.resultat {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 0.25rem 1.5rem;
}

.resultat dt {
  font-weight: 700;
}

.resultat dd {
  margin: 0;
  overflow-wrap: anywhere;
}
</style>
