import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { defineConfig } from 'vitest/config'

// Tests only. Kept apart from vite.config.ts so the library build is untouched.
// Two forks at most, to keep memory use modest.
//
// Two projects:
// - "next": this repo's Tiptap. Always runs.
// - "web-prod": the same tiptop extension sources, run on another, pinned
//   Tiptap/ProseMirror install (for example the 3.22.x stack that
//   tiptop-editor 2.3.x shipped with), to prove the schema matches editors
//   already deployed. It only runs the oracle tests, and only when
//   TIPTAP_ORACLE_MODULES points at a node_modules folder holding that stack;
//   otherwise it is skipped and a plain `npm test` needs nothing extra.
const prodModules = process.env.TIPTAP_ORACLE_MODULES ?? ''
const hasProd = prodModules !== '' && existsSync(join(prodModules, '@tiptap/core/package.json'))

const shared = {
  pool: 'forks' as const,
  poolOptions: { forks: { maxForks: 2, minForks: 1 } },
  css: false,
}

export default defineConfig({
  test: {
    projects: [
      {
        // package.json is not in these packages' "exports"; point at the files.
        resolve: {
          alias: [
            { find: '@tiptap/core/package.json', replacement: join(__dirname, 'node_modules/@tiptap/core/package.json') },
            { find: 'prosemirror-model/package.json', replacement: join(__dirname, 'node_modules/prosemirror-model/package.json') },
          ],
        },
        test: { ...shared, name: 'next', include: ['src/**/*.test.ts'], environment: 'node' },
      },
      ...(hasProd
        ? [{
            resolve: {
              alias: [
                { find: /^@tiptap\/(.*)$/, replacement: `${prodModules}/@tiptap/$1` },
                { find: /^(prosemirror-[a-z-]+)((?:\/.*)?)$/, replacement: `${prodModules}/$1$2` },
              ],
            },
            test: {
              ...shared,
              name: 'web-prod',
              include: ['src/**/*.oracle.test.ts'],
              environment: 'node',
              env: { TIPTAP_STACK: 'web-prod' },
            },
          }]
        : []),
    ],
  },
})
