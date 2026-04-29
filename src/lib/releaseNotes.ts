import fs from 'fs'
import path from 'path'

export interface ReleaseInfo {
  version: string
  summary: string
}

function parseSemver(s: string): [number, number, number] | null {
  const m = s.match(/^(\d+)\.(\d+)\.(\d+)$/)
  if (!m) return null
  return [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10)]
}

/** Highest semver wins (do not use lexical sort — v4.9.x sorts after v4.18.x as strings). */
function compareSemverFilenames(a: string, b: string): number {
  const va = a.match(/v?(\d+\.\d+\.\d+)/)?.[1]
  const vb = b.match(/v?(\d+\.\d+\.\d+)/)?.[1]
  if (!va || !vb) return a.localeCompare(b)
  const pa = parseSemver(va)
  const pb = parseSemver(vb)
  if (!pa || !pb) return a.localeCompare(b)
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] - pb[i]
  }
  return 0
}

export function getLatestRelease(): ReleaseInfo | null {
  try {
    const releasesDir = path.join(process.cwd(), 'release-notes')
    
    if (!fs.existsSync(releasesDir)) {
      return null
    }

    const files = fs.readdirSync(releasesDir)
      .filter(file => file.endsWith('.md') && /v?\d+\.\d+\.\d+/.test(file))
      .sort(compareSemverFilenames)
      .reverse()

    if (files.length === 0) {
      return null
    }

    const latestFile = files[0]
    const content = fs.readFileSync(path.join(releasesDir, latestFile), 'utf-8')

    // Extract version from filename (e.g., v3.7.0.md -> 3.7.0)
    const versionMatch = latestFile.match(/v?(\d+\.\d+\.\d+)/)
    const version = versionMatch ? versionMatch[1] : '0.0.0'

    // Extract first heading after "What's New" as summary
    // Look for ## heading (like "Mobile Experience Overhaul")
    const summaryMatch = content.match(/##\s+[✨🎉🔧🐛💡📱🚀]\s*(.+)/m)
    const summary = summaryMatch ? summaryMatch[1].trim() : 'Check out the latest features and improvements!'

    return {
      version,
      summary
    }
  } catch (error) {
    console.error('Error reading release notes:', error)
    return null
  }
}
