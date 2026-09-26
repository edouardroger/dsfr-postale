import { createApp } from 'vue'
import App from './App.vue'

// ?scheme=dark ou ?scheme=light force le thème (utile pour les contrôles d'accessibilité).
// Exécuté avant le script du DSFR, chargé depuis le CDN (voir index.html).
const scheme = new URLSearchParams(location.search).get('scheme')
if (scheme === 'dark' || scheme === 'light') document.documentElement.dataset.frScheme = scheme

createApp(App).mount('#app')
