import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from './api/auth/[...nextauth]'
import HelpLayout from '../components/HelpLayout'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { marked } from 'marked'
import { useState, useMemo } from 'react'

interface Release {
  version: string
  date: string
  type: string
  title: string
  description: string
  content: string
}

interface ReleaseNotesProps {
  releases: Release[]
}

export default function ReleaseNotes({ releases }: ReleaseNotesProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set([releases[0]?.version]))

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'major':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'minor':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'patch':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'major':
        return '🚀'
      case 'minor':
        return '✨'
      case 'patch':
        return '🔧'
      default:
        return '📦'
    }
  }

  const toggleVersion = (version: string) => {
    const newExpanded = new Set(expandedVersions)
    if (newExpanded.has(version)) {
      newExpanded.delete(version)
    } else {
      newExpanded.add(version)
    }
    setExpandedVersions(newExpanded)
  }

  const filteredReleases = useMemo(() => {
    return releases.filter(release => {
      const matchesSearch = searchQuery === '' || 
        release.version.toLowerCase().includes(searchQuery.toLowerCase()) ||
        release.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        release.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        release.content.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesType = selectedType === 'all' || release.type === selectedType
      
      return matchesSearch && matchesType
    })
  }, [releases, searchQuery, selectedType])

  const groupedReleases = useMemo(() => {
    const groups: { [key: string]: Release[] } = {}
    filteredReleases.forEach(release => {
      const majorVersion = `v${release.version.split('.')[0]}.x`
      if (!groups[majorVersion]) {
        groups[majorVersion] = []
      }
      groups[majorVersion].push(release)
    })
    return groups
  }, [filteredReleases])

  return (
    <HelpLayout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">📋 Release Notes</h1>
          <p className="text-lg text-gray-600">
            Track new features, improvements, and bug fixes across all versions
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search releases..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Type Filter */}
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedType('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedType === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedType('major')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedType === 'major'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🚀 Major
              </button>
              <button
                onClick={() => setSelectedType('minor')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedType === 'minor'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ✨ Minor
              </button>
              <button
                onClick={() => setSelectedType('patch')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedType === 'patch'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🔧 Patch
              </button>
            </div>
          </div>

          {/* Results Count */}
          {(searchQuery || selectedType !== 'all') && (
            <div className="mt-4 text-sm text-gray-600">
              Showing {filteredReleases.length} of {releases.length} releases
            </div>
          )}
        </div>

        {/* Grouped Releases */}
        <div className="space-y-8">
          {Object.keys(groupedReleases).sort((a, b) => b.localeCompare(a, undefined, { numeric: true })).map(majorVersion => (
            <div key={majorVersion} className="space-y-4">
              {/* Major Version Header */}
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-2xl font-bold text-gray-900">{majorVersion}</h2>
                <span className="text-sm text-gray-500">
                  {groupedReleases[majorVersion].length} release{groupedReleases[majorVersion].length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Releases in this major version */}
              <div className="space-y-4">
                {groupedReleases[majorVersion].map((release) => {
                  const isExpanded = expandedVersions.has(release.version)
                  
                  return (
                    <div key={release.version} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                      {/* Collapsible Header */}
                      <button
                        onClick={() => toggleVersion(release.version)}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <svg
                            className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          <div className="flex items-center gap-3">
                            <span className="text-xl font-bold text-gray-900">v{release.version}</span>
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getTypeColor(release.type)}`}>
                              {getTypeIcon(release.type)} {release.type.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">{release.date}</span>
                      </button>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="px-6 pb-6 border-t border-gray-100">
                          <div className="pt-4">
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">{release.title}</h3>
                            {release.description && (
                              <p className="text-gray-600 mb-6">{release.description}</p>
                            )}

                            {/* Markdown Content */}
                            <div 
                              className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-strong:text-gray-900 prose-ul:text-gray-700 prose-ol:text-gray-700"
                              dangerouslySetInnerHTML={{ __html: release.content }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredReleases.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No releases found</h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search or filters
            </p>
            <button
              onClick={() => {
                setSearchQuery('')
                setSelectedType('all')
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="text-4xl">🔔</div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Stay Updated</h3>
                <p className="text-gray-700 mb-4">
                  Want to be notified about new releases? Contact your administrator to be added to the update notifications.
                </p>
                <div className="flex gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Latest:</span>
                    <span>v{releases[0]?.version}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Total Releases:</span>
                    <span>{releases.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </HelpLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions)

  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    }
  }

  // Read markdown files from release-notes directory
  const releasesDir = path.join(process.cwd(), 'release-notes')
  const filenames = fs.readdirSync(releasesDir)
  
  const releases = filenames
    .filter(f => f.endsWith('.md') && f !== 'TEMPLATE.md')
    .map(filename => {
      const filePath = path.join(releasesDir, filename)
      const fileContents = fs.readFileSync(filePath, 'utf8')
      const { data, content } = matter(fileContents)
      
      // Extract version from filename if not in frontmatter (e.g., v2.4.1.md -> 2.4.1)
      const versionFromFilename = filename.replace(/^v/, '').replace(/\.md$/, '')
      
      // Parse markdown content for metadata if no frontmatter
      let parsedData = data
      if (!data.version) {
        // Extract from markdown heading (e.g., "# Release v2.4.1")
        const versionMatch = content.match(/^#\s+Release\s+v?(\d+\.\d+\.\d+)/m)
        const dateMatch = content.match(/\*\*Release Date:\*\*\s+(.+)/m)
        const summaryMatch = content.match(/##\s+Summary\s+([\s\S]+?)(?=\n##|\n###|$)/)
        
        parsedData = {
          version: versionMatch?.[1] || versionFromFilename,
          date: dateMatch?.[1] || '',
          type: versionFromFilename.split('.')[2] === '0' 
            ? (versionFromFilename.split('.')[1] === '0' ? 'major' : 'minor')
            : 'patch',
          title: `Release v${versionMatch?.[1] || versionFromFilename}`,
          description: summaryMatch?.[1]?.trim() || 'Release notes'
        }
      }
      
      return {
        version: parsedData.version || versionFromFilename,
        date: typeof parsedData.date === 'string' ? parsedData.date : parsedData.date?.toISOString?.()?.split('T')[0] || '',
        type: parsedData.type || 'patch',
        title: parsedData.title || `Release v${parsedData.version || versionFromFilename}`,
        description: parsedData.description || '',
        content: marked(content)
      }
    })
    .sort((a, b) => {
      // Sort by version number (descending)
      const versionA = (a.version || '').replace(/[^0-9.]/g, '')
      const versionB = (b.version || '').replace(/[^0-9.]/g, '')
      return versionB.localeCompare(versionA, undefined, { numeric: true })
    })

  return {
    props: {
      releases
    },
  }
}
