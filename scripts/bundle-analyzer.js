const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const OUTPUT = path.join(ROOT, '.bundle-report.json')

const TARGET_DIRS = ['dist', '.next']
const SKIP_DIRS = new Set(['node_modules', '.turbo'])

function collectBuildDirs(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (TARGET_DIRS.includes(entry.name)) {
        acc.push(full)
      } else {
        collectBuildDirs(full, acc)
      }
    }
  }
  return acc
}

function formatSize(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${bytes} B`
}

function directorySize(dir) {
  let total = 0
  const stack = [dir]
  while (stack.length > 0) {
    const current = stack.pop()
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name)
      if (entry.isDirectory()) {
        stack.push(full)
      } else {
        total += fs.statSync(full).size
      }
    }
  }
  return total
}

const candidates = [...collectBuildDirs(path.join(ROOT, 'packages')), ...collectBuildDirs(path.join(ROOT, 'apps'))]

const directories = candidates
  .map((dir) => {
    const sizeBytes = directorySize(dir)
    return {
      path: path.relative(ROOT, dir),
      sizeBytes,
      sizeFormatted: formatSize(sizeBytes),
    }
  })
  .sort((a, b) => b.sizeBytes - a.sizeBytes)

const totalSize = directories.reduce((sum, d) => sum + d.sizeBytes, 0)

const report = {
  generatedAt: new Date().toISOString(),
  totalSize,
  totalSizeFormatted: formatSize(totalSize),
  directories,
}

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true })
fs.writeFileSync(OUTPUT, JSON.stringify(report, null, 2))

console.log(`Bundle report written to .bundle-report.json`)
console.log(`Total size: ${report.totalSizeFormatted} (${totalSize} bytes) across ${directories.length} build directory(ies)`)
for (const dir of directories) {
  console.log(`  ${dir.path}: ${dir.sizeFormatted}`)
}
