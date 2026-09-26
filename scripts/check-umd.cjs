// Charge le build UMD comme le ferait une page sans outil de build :
// Vue, puis dsfr-postale, par balises <script>.
const { readFileSync } = require('node:fs')
const { JSDOM } = require('jsdom')

const build = 'dist/dsfr-postale.umd.cjs'
const { window } = new JSDOM('<!doctype html><div id="app"></div>', { runScripts: 'outside-only' })

try {
  window.eval(readFileSync(require.resolve('vue/dist/vue.global.prod.js'), 'utf8'))
  window.eval(readFileSync(build, 'utf8'))
  window.eval("Vue.createApp({ render: () => Vue.h(DsfrPostale.DsfrPostale) }).mount('#app')")

  if (!window.document.querySelector('[role="combobox"]') || window.DsfrPostale.default !== window.DsfrPostale.DsfrPostale) {
    throw new Error('composant non monté')
  }
  console.log(`✓ ${build}`)
} catch (error) {
  console.error(`✗ ${build} : ${error.message}`)
  process.exit(1)
}
