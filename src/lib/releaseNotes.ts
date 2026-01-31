import fs from 'fs'
import path from 'path'

export interface ReleaseInfo {
  version: string
  summary: string
}

export function getLatestRelease(): ReleaseInfo | null {
  try {
    const releasesDir = path.join(process.cwd(), 'release-notes')
    
    if (!fs.existsSync(releasesDir)) {
      return null
    }

    const files = fs.readdirSync(releasesDir)
      .filter(file => file.endsWith('.md'))
      .sort()
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
