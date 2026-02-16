import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const webRoot = path.resolve(__dirname, '..')
const localesDir = path.join(webRoot, 'locales')
const translationsPath = path.join(webRoot, 'src', 'i18n', 'translations.ts')

function loadArbKeys(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8')
  const json = JSON.parse(raw)
  return Object.keys(json).filter((k) => !k.startsWith('@') && k !== '@@locale')
}

function allArbKeys() {
  const names = fs.readdirSync(localesDir)
  const paths = names
    .filter((n) => n.endsWith('.arb') && !n.includes('/'))
    .map((n) => path.join(localesDir, n))
  const keySet = new Set()
  for (const p of paths) {
    for (const k of loadArbKeys(p)) keySet.add(k)
  }
  return [...keySet].sort()
}

const existingKeyRe = /'([^']+)':\s*(?:string|\([^)]*\)\s*=>\s*string)/g

function findTypeBlock(content) {
  const start = content.indexOf('export type ScaffoldTranslationEntries = {')
  if (start === -1) return null
  const begin = start + 'export type ScaffoldTranslationEntries = {'.length
  let depth = 1
  for (let i = begin; i < content.length; i++) {
    const c = content[i]
    if (c === '{') depth++
    else if (c === '}') {
      depth--
      if (depth === 0) return { start: start, end: i + 1, inner: content.slice(begin, i) }
    }
  }
  return null
}

function main() {
  const arbKeys = allArbKeys()
  let content = fs.readFileSync(translationsPath, 'utf8')
  const block = findTypeBlock(content)
  if (!block) return
  const existingKeys = new Set()
  let keyMatch
  existingKeyRe.lastIndex = 0
  while ((keyMatch = existingKeyRe.exec(block.inner)) !== null) {
    existingKeys.add(keyMatch[1])
  }
  const missing = arbKeys.filter((k) => !existingKeys.has(k))
  if (missing.length === 0) return
  const insert = missing.map((k) => `  '${k}': string,`).join('\n')
  const before = content.slice(0, block.end - 1)
  const after = content.slice(block.end - 1)
  content = before + '\n' + insert + '\n' + after
  fs.writeFileSync(translationsPath, content)
}

main()
