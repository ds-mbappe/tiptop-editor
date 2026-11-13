// Test-only: loads the JSON / HTML fixtures under src/schema/__fixtures__.
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { DocNode } from '../../types'

const root = join(__dirname, '..', '..', '__fixtures__')

/** Every `<dir>/*.json` fixture, as [name, doc]. */
export function jsonFixtures(dir: string): [string, DocNode][] {
  const path = join(root, dir)
  return readdirSync(path)
    .filter(f => f.endsWith('.json'))
    .sort()
    .map(f => [`${dir}/${f}`, JSON.parse(readFileSync(join(path, f), 'utf8')) as DocNode])
}

/** Every `<dir>/*.html` fixture, as [name, html]. */
export function htmlFixtures(dir: string): [string, string][] {
  const path = join(root, dir)
  return readdirSync(path)
    .filter(f => f.endsWith('.html'))
    .sort()
    .map(f => [`${dir}/${f}`, readFileSync(join(path, f), 'utf8')])
}

/** True when the doc holds an emoji node (getHTML renders those per platform). */
export const hasEmoji = (doc: DocNode): boolean =>
  doc.type === 'emoji' || (doc.content ?? []).some(hasEmoji)
