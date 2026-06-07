/**
 * Post-build: reads dist/webview/{index.html,bundle.js,bundle.css},
 * inlines everything into a single self-contained HTML string,
 * then writes dist/webview/editor.{js,d.ts} for use in React Native.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dist = path.resolve(__dirname, '../dist/webview')

const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf-8')
const js   = fs.readFileSync(path.join(dist, 'bundle.js'),  'utf-8')

let css = ''
try { css = fs.readFileSync(path.join(dist, 'bundle.css'), 'utf-8') } catch {}

// NOTE: replacements use functions (not template strings) — `js`/`css` are
// minified bundles that can contain literal `$&`, `` $` ``, `$'` sequences,
// which `String.replace` would otherwise interpret as special replacement
// patterns and corrupt the output.
const inlined = html
  // Replace <link ... .css ...> with inline <style>
  .replace(/<link[^>]+\.css[^>]*>/g, () => (css ? `<style>\n${css}\n</style>` : ''))
  // Replace <script ... bundle.js ...> with inline <script>
  .replace(/<script[^>]+bundle\.js[^>]*><\/script>/g, () => `<script>\n${js}\n</script>`)
  // Strip module/crossorigin attrs that aren't needed when inlined
  .replace(/\s+type="module"/g, '')
  .replace(/\s+crossorigin/g, '')

const output = `\
// Auto-generated — do not edit.
// Run: npm run build:webview
export const editorHtml = ${JSON.stringify(inlined)};
`

fs.writeFileSync(path.join(dist, 'editor.js'),   output)
fs.writeFileSync(path.join(dist, 'editor.d.ts'),
  'export declare const editorHtml: string;\n')

console.log('✓ WebView bundle written to dist/webview/editor.js')
