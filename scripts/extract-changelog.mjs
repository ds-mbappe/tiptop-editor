import { readFileSync, writeFileSync } from 'node:fs'

const [, , rawVersion, outputPath] = process.argv

if (!rawVersion) {
  console.error('Usage: node scripts/extract-changelog.mjs <version-or-tag> [output-path]')
  process.exit(1)
}

const changelog = readFileSync(new URL('../CHANGELOG.md', import.meta.url), 'utf8')
const version = rawVersion.replace(/^v/, '')

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const headingPattern = new RegExp(
  `^##\\s+(?:\\[)?(?:v)?${escapeRegExp(version)}(?:\\])?(?:\\s+-\\s+.*)?$`,
  'm'
)

const match = headingPattern.exec(changelog)

if (!match || match.index === undefined) {
  console.error(`Could not find a CHANGELOG section for version ${rawVersion}.`)
  process.exit(1)
}

const sectionStart = match.index + match[0].length
const remaining = changelog.slice(sectionStart)
const nextHeadingMatch = /^##\s+/m.exec(remaining)
const sectionEnd = nextHeadingMatch?.index ?? remaining.length

const body = remaining.slice(0, sectionEnd).trim()

if (!body) {
  console.error(`CHANGELOG section for version ${rawVersion} is empty.`)
  process.exit(1)
}

if (outputPath) {
  writeFileSync(outputPath, `${body}\n`)
} else {
  process.stdout.write(`${body}\n`)
}
