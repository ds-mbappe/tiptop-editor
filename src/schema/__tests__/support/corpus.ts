// Test-only: real stored documents, exported read-only from a consumer app's
// database and kept OUTSIDE the repo (private content). Set SCHEMA_CORPUS_DIR
// to a folder of JSON files shaped [{ id, html }]; the corpus tests skip when
// it is unset. SCHEMA_CORPUS_SLICE="start:end" runs part of it (the editor
// oracle holds a lot of memory over a long run).
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

export interface CorpusDoc { id: string; html: string }

export const corpusDir = process.env.SCHEMA_CORPUS_DIR

export function corpus(): CorpusDoc[] {
  if (!corpusDir || !existsSync(corpusDir)) return []
  return readdirSync(corpusDir)
    .filter(f => f.endsWith('.json'))
    .flatMap(f => (JSON.parse(readFileSync(join(corpusDir, f), 'utf8')) as CorpusDoc[] | null) ?? [])
    .filter(d => typeof d.html === 'string')
    .slice(...slice())
}

function slice(): [number, number?] {
  const m = /^(\d+):(\d*)$/.exec(process.env.SCHEMA_CORPUS_SLICE ?? '')
  return m ? [Number(m[1]), m[2] ? Number(m[2]) : undefined] : [0]
}
