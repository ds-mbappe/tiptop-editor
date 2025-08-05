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
        '@tiptap/extension-*',
        '@floating-ui/dom',
        '@tiptap/react',
        '@tiptap/core',
        '@heroui/react',
        'framer-motion',
        'lucide-react',
        'lowlight',
        'highlight.js',
        'prosemirror-*',
        'yjs',
        'y-prosemirror',
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          '@tiptap/react': 'TiptapReact',
          '@tiptap/core': 'TiptapCore',
          '@heroui/react': 'HeroUIReact',
          '@floating-ui/dom': 'FloatingUIDOM',
          'lucide-react': 'LucideReact',
          lowlight: 'Lowlight',
          'highlight.js': 'highlight',
          yjs: 'Yjs'
        },
        assetFileNames: 'tiptop-editor.[ext]',
      },
    },
    cssCodeSplit: true
  },
})