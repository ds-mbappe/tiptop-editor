import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    dts({
      entryRoot: 'src',
      outDir: 'dist',
      insertTypesEntry: true,
      cleanVueFileName: true,
      tsconfigPath: './tsconfig.app.json',
    }),
    visualizer({ open: true })
  ],
  build: {
    minify: 'esbuild',
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'TiptopEditor',
      fileName: (format) => `tiptop-editor.${format}.js`,
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',

        // Tiptap Extensions
        '@tiptap/extension-bubble-menu',
        '@tiptap/extension-code-block-lowlight',
        '@tiptap/extension-drag-handle',
        '@tiptap/extension-drag-handle-react',
        '@tiptap/extension-highlight',
        '@tiptap/extension-horizontal-rule',
        '@tiptap/extension-list',
        '@tiptap/extension-node-range',
        '@tiptap/extension-subscript',
        '@tiptap/extension-superscript',
        '@tiptap/extension-superscript',
        '@tiptap/extension-superscript',
        '@tiptap/extension-text-style',
        '@tiptap/extension-emoji',
        '@tiptap/extensions',
        '@tiptap/react',
        '@tiptap/starter-kit',
        '@tiptap/suggestion',

        // ProseMirror internals (needed!)
        'prosemirror-state',
        'prosemirror-model',
        'prosemirror-view',
        'prosemirror-transform',
        'prosemirror-commands',
        'prosemirror-keymap',
        'prosemirror-dropcursor',
        'prosemirror-gapcursor',
        'prosemirror-schema-basic',
        'prosemirror-schema-list',
        'prosemirror-history',
        'prosemirror-tables',

        'framer-motion',
        'lowlight',
        'lucide-react',
        '@floating-ui/dom',
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
        assetFileNames: 'tiptop-editor.[ext]',
      },
    },
    cssCodeSplit: true
  },
})