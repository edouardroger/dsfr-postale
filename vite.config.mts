import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";
import { configDefaults } from 'vitest/config';

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "DsfrPostale",
      fileName: (format) => `dsfr-postale.${format}.js`
    },
    rollupOptions: {
      external: ["vue"],
      output: {
        globals: {
          vue: "Vue"
        }
      }
    }
  },
  test: {
    globals: true, // Permet d'utiliser `describe`, `test` sans import
    environment: "jsdom", // Simule un environnement DOM
    setupFiles: "./vitest.setup.ts", // Fichier d'initialisation
    exclude: [...configDefaults.exclude, "node_modules/**"], // Exclut les fichiers non pertinents
  },
});
