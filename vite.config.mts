import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import { defineConfig, type Plugin } from 'vite'

const src = (path: string) => fileURLToPath(new URL(path, import.meta.url))

const CDN = 'https://cdn.jsdelivr.net'

/** Politique de sécurité du contenu (RGS) injectée dans la démo publiée. */
const csp = (): Plugin => ({
  name: 'demo-csp',
  apply: 'build',
  transformIndexHtml: () => [
    {
      tag: 'meta',
      attrs: {
        'http-equiv': 'Content-Security-Policy',
        content: [
          "default-src 'none'",
          `script-src 'self' ${CDN}`,
          `style-src 'self' ${CDN}`,
          `img-src 'self' data: ${CDN}`,
          `font-src ${CDN}`,
          'connect-src https://data.geopf.fr',
          "base-uri 'none'",
          "form-action 'none'",
        ].join('; '),
      },
      injectTo: 'head-prepend',
    },
  ],
})

export default defineConfig(({ command, mode }) => {
  // `npm run dev` et `npm run build:demo` : démonstration (GitHub Pages)
  if (mode === 'demo' || (command === 'serve' && mode !== 'test')) {
    return {
      root: src('./demo'),
      base: '/dsfr-postale/',
      plugins: [vue(), csp()],
      resolve: { alias: { 'dsfr-postale': src('./src/index.ts') } },
      build: { outDir: src('./dist-demo'), emptyOutDir: true },
    }
  }

  // `npm run build` : bibliothèque publiée sur npm ; `npm test` : Vitest
  return {
    plugins: [
      vue(),
      dts({ include: ['src'], exclude: ['src/**/*.spec.ts'], outDirs: 'dist/types', entryRoot: 'src', processor: 'vue' }),
    ],
    build: {
      lib: {
        entry: src('./src/index.ts'),
        name: 'DsfrPostale',
        fileName: (format) => (format === 'umd' ? 'dsfr-postale.umd.cjs' : 'dsfr-postale.es.js'),
        formats: ['es', 'umd'],
        cssFileName: 'dsfr-postale',
      },
      rollupOptions: {
        external: ['vue'],
        output: { globals: { vue: 'Vue' }, exports: 'named' },
      },
    },
    test: {
      environment: 'jsdom',
      include: ['src/**/*.spec.ts'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'lcov'],
        include: ['src/**/*.{ts,vue}'],
        exclude: ['src/**/*.spec.ts', 'src/types.ts'],
        thresholds: { statements: 90, branches: 85, functions: 90, lines: 90 },
      },
    },
  }
})
