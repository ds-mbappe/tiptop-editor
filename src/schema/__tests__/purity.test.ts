// tiptop-editor/schema must load in Node, browsers and Hermes, and be
// copyable as source into another app (e.g. React Native): its files may only import each
// other and prosemirror-model (pure JS, no DOM).
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = join(__dirname, '..')
const ALLOWED_PACKAGES = ['prosemirror-model']

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap(name => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return name.startsWith('__') ? [] : sources(path)
    return /\.tsx?$/.test(name) ? [path] : []
  })
}

describe('schema purity', () => {
  it.each(sources(root).map(p => [relative(root, p), p]))('%s imports only relative files and prosemirror-model', (_rel, path) => {
    const text = readFileSync(path, 'utf8')
    const specifiers = [...text.matchAll(/(?:import|export)\s[^'"]*?from\s+['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g)].map(m => m[1] ?? m[2])
    const bad = specifiers.filter(s => !s.startsWith('.') && !ALLOWED_PACKAGES.includes(s))
    expect(bad).toEqual([])
    // No DOM or React globals either.
    expect(text).not.toMatch(/\b(window|document|navigator)\.[A-Za-z_]/)
  })
})
