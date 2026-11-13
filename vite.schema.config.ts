// Builds the platform-free entry `tiptop-editor/schema` (src/schema) on its
// own: no React, no CSS, no Tiptap. prosemirror-model stays external.
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    dts({
      include: ['src/schema'],
      exclude: ['src/schema/__tests__', 'src/schema/__fixtures__'],
      entryRoot: 'src/schema',
      outDir: 'dist/schema',
      tsconfigPath: './tsconfig.app.json',
    }),
  ],
  build: {
    outDir: 'dist/schema',
    emptyOutDir: true,
    sourcemap: true,
    lib: {
      entry: resolve(__dirname, 'src/schema/index.ts'),
      formats: ['es', 'cjs'],
      fileName: format => (format === 'es' ? 'index.js' : 'index.cjs'),
    },
    rollupOptions: { external: ['prosemirror-model'] },
  },
})
