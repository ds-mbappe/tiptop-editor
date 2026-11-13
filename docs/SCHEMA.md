# `tiptop-editor/schema`

A platform-free description of the document TiptopEditor reads and writes,
plus a codec between that document and the HTML the editor stores. You can
use it without React, without a DOM and without the Tiptap runtime: in Node,
in a browser, or in React Native (Hermes).

It exists so that **another editor** (a native mobile editor, a server job,
an importer) can read and write exactly the content TiptopEditor does, and
so that content written there opens unchanged in TiptopEditor.

```ts
import { fromHTML, fromHTMLWithSource, toHTML, validate, normalize } from 'tiptop-editor/schema'
```

`prosemirror-model` is the only runtime import, and it is already a peer
dependency of the package.

## What is in it

| Export | What it does |
|---|---|
| `getSchemaSpec(options?)`, `NODE_NAMES`, `MARK_NAMES`, `SCHEMA_VERSION` | The node and mark types TiptopEditor builds, their attributes, defaults and content expressions, as plain data. `{ comments: true }` adds the comment mark and `commentId` (as with `editorOptions.showCommentMenu`). |
| `marksExclude(a, b)` | Mark exclusion, directional as in ProseMirror's `MarkType.excludes` (e.g. `code` excludes every other mark). |
| `fromHTML(html, options?)` | Stored HTML → document JSON, **the same document the editor loads** (`editor.getJSON()` right after `setContent`). It uses ProseMirror's own `DOMParser` on a small pure-JS DOM, with each extension's parse rules. |
| `toHTML(doc, options?)` | Document JSON → the HTML the editor stores (`editor.getHTML()`), byte for byte. Throws `UnsupportedContentError` for a node or mark outside the schema. |
| `fromHTMLWithSource(html, options?)` | `fromHTML` plus a `SourceMap`: which slice of the stored HTML each top-level block came from. |
| `validate(doc, options?)` | Reports what the editor could not load as written (unknown nodes, invalid content, bad attribute values). It never changes the document. |
| `normalize(doc)` | Fills attribute defaults, merges adjacent text with equal marks, drops empty text: two documents the editor treats as equal become equal JSON. |
| `EMOJI` | The emoji shortcode table the emoji extension renders. |

### Options

- `tiptap: '3.22' | '3.33'`: which editor output to match. A few
  serialisation details changed between Tiptap releases (`DEFAULT_FLAVOUR`
  is `'3.22'`, the output of tiptop-editor 2.3.x; use `'3.33'` for this
  version).
- `preserveUnknown: true` (`fromHTML`): elements TiptopEditor drops on load
  (legacy `<img>`, `<iframe>` and similar, see `RAW_TAGS`) are kept as
  `rawBlock` / `rawInline` nodes holding their exact source, and `toHTML`
  writes them back unchanged. They are not part of the editor's schema:
  `validate` accepts them only with `{ allowRaw: true }`. Use this when an
  editor other than TiptopEditor must not lose content it cannot show.
- `source` (`toHTML`): the `SourceMap` from `fromHTMLWithSource`. Top-level
  blocks that are unchanged are written as their original markup, so opening
  and saving a document without edits keeps its exact bytes, and an edit
  rewrites only the blocks it touched.

### A round trip

```ts
const { doc, source } = fromHTMLWithSource(stored, { preserveUnknown: true })
// ... edit `doc` in any editor that speaks this JSON ...
const result = validate(edited, { allowRaw: true })
if (result.issues.some(i => i.severity === 'error')) throw new Error('not loadable')
const html = toHTML(edited, { preserveUnknown: true, source })
```

## How it is tested

`npm test` runs Vitest. Nothing beyond `npm install` is needed:

- **Unit and property tests** (`src/schema/__tests__`): the spec, validate,
  normalize, the DOM, the emoji table. A purity test checks that
  `src/schema` only imports itself and `prosemirror-model`.
- **Oracle tests** (`*.oracle.test.ts`): every fixture under
  `src/schema/__fixtures__`, plus randomly generated documents
  (`fast-check`), go through the real TiptopEditor extensions in a headless
  Tiptap editor (jsdom). `fromHTML` must equal what the editor loads, and
  `toHTML` must equal what it stores.
- **Optional, a second Tiptap stack:** set `TIPTAP_ORACLE_MODULES` to a
  `node_modules` folder holding another Tiptap/ProseMirror install (e.g.
  the 3.22.x stack tiptop-editor 2.3.x used). A `web-prod` project then runs
  the oracle tests against that stack too (`TIPTAP_ORACLE_VERSION`, default
  `3.22.5`, is the `@tiptap/core` version it must report). Unset, the project
  is skipped.
- **Optional, real documents:** set `SCHEMA_CORPUS_DIR` to a folder of JSON
  files shaped `[{ id, html }]`. The corpus tests then check parse, write and
  source-map round trips on each document (`SCHEMA_CORPUS_SLICE="0:500"`
  runs part of it). Unset, they are skipped. Keep such content outside the
  repository.

`npm run build:schema` builds `dist/schema` (ESM, CJS and types) on its
own. `npm run build` now runs it after the library build, so the published
package includes the `./schema` entry.
