const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const OUT_DIR = path.join(ROOT, '.coverage')
const OUTPUT = path.join(OUT_DIR, 'lcov.info')

const SKIP_DIRS = new Set(['node_modules', '.turbo', '.next', 'dist'])

function findLcovFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      findLcovFiles(full, acc)
    } else if (entry.name === 'lcov.info' && path.basename(dir) === 'coverage') {
      acc.push(full)
    }
  }
  return acc
}

function parseRecords(content) {
  return content
    .split('end_of_record')
    .filter((block) => block.includes('SF:'))
    .map((block) =>
      block
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
    )
}

function summarize(record) {
  const lf = record.filter((line) => line.startsWith('DA:')).length
  const lh = record.filter((line) => line.startsWith('DA:') && !line.endsWith(',0')).length
  const fnf = record.filter((line) => line.startsWith('FNDA:')).length
  const fnh = record.filter((line) => line.startsWith('FNDA:') && !line.slice(5).split(',')[0].startsWith('0')).length
  const brf = record.filter((line) => line.startsWith('BRDA:')).length
  const brh = record.filter((line) => line.startsWith('BRDA:') && !line.split(',')[3].startsWith('-')).length
  for (const prefix of ['LF:', 'LH:', 'FNF:', 'FNH:', 'BRF:', 'BRH:']) {
    const idx = record.findIndex((line) => line.startsWith(prefix))
    if (idx >= 0) record.splice(idx, 1)
  }
  record.push(`LF:${lf}`, `LH:${lh}`, `FNF:${fnf}`, `FNH:${fnh}`, `BRF:${brf}`, `BRH:${brh}`)
  return record
}

function mergeRecord(existing, incoming) {
  for (const line of incoming) {
    if (line.startsWith('DA:')) {
      const key = line.slice(0, line.indexOf(',') + 1)
      const idx = existing.findIndex((l) => l.startsWith(key))
      if (idx >= 0) {
        const [ln, hits] = line.slice(3).split(',')
        const [, oldHits] = existing[idx].slice(3).split(',')
        existing[idx] = `DA:${ln},${parseInt(oldHits || 0, 10) + parseInt(hits || 0, 10)}`
      } else {
        existing.push(line)
      }
    } else if (line.startsWith('SF:') || line.startsWith('TN:')) {
      if (!existing.includes(line)) existing.push(line)
    } else if (line.startsWith('FNDA:')) {
      const comma = line.indexOf(',')
      const hits = line.slice(5, comma)
      const name = line.slice(comma + 1)
      const idx = existing.findIndex(
        (l) => l.startsWith('FNDA:') && l.slice(l.indexOf(',') + 1) === name,
      )
      if (idx >= 0) {
        const oldHits = existing[idx].slice(5, existing[idx].indexOf(','))
        existing[idx] = `FNDA:${parseInt(oldHits || 0, 10) + parseInt(hits || 0, 10)},${name}`
      } else {
        existing.push(line)
      }
    } else if (line.startsWith('BRDA:')) {
      const parts = line.slice(5).split(',')
      const key = parts.slice(0, 3).join(',')
      const taken = parts[3]
      const idx = existing.findIndex(
        (l) => l.startsWith('BRDA:') && l.slice(5).split(',').slice(0, 3).join(',') === key,
      )
      if (idx >= 0) {
        const target = existing[idx].slice(5).split(',')
        const oldTaken = parseInt(target[3] || '0', 10)
        const newTaken = taken === '-' ? NaN : parseInt(taken, 10)
        target[3] = Number.isNaN(newTaken) ? String(oldTaken) : String(oldTaken + newTaken)
        existing[idx] = `BRDA:${target.join(',')}`
      } else {
        existing.push(line)
      }
    }
  }
  return summarize(existing)
}

const files = findLcovFiles(path.join(ROOT, 'packages'))
  .concat(findLcovFiles(path.join(ROOT, 'apps')))
  .sort()

if (files.length === 0) {
  console.log('No lcov.info files found; skipping coverage merge.')
  fs.mkdirSync(OUT_DIR, { recursive: true })
  fs.writeFileSync(OUTPUT, '')
  process.exit(0)
}

const merged = new Map()
for (const file of files) {
  for (const record of parseRecords(fs.readFileSync(file, 'utf-8'))) {
    const sf = record.find((line) => line.startsWith('SF:'))
    if (!sf) continue
    const source = sf.slice(3)
    const existing = merged.get(source)
    merged.set(source, existing ? mergeRecord(existing, record) : summarize(record))
  }
}

const body = [...merged.values()].map((record) => `${record.join('\n')}\nend_of_record`).join('\n')

fs.mkdirSync(OUT_DIR, { recursive: true })
fs.writeFileSync(OUTPUT, body)

const lf = [...merged.values()].reduce((sum, r) => sum + parseInt(r.find((l) => l.startsWith('LF:'))?.slice(3) || 0, 10), 0)
const lh = [...merged.values()].reduce((sum, r) => sum + parseInt(r.find((l) => l.startsWith('LH:'))?.slice(3) || 0, 10), 0)

console.log(`Merged ${files.length} coverage report(s) into .coverage/lcov.info`)
console.log(`Lines: ${lh}/${lf} (${lf > 0 ? ((lh / lf) * 100).toFixed(2) : 0}%)`)
