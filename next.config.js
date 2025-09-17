/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable static optimization for admin pages that require authentication
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client']
  },
  // Force dynamic rendering for authenticated pages
  async rewrites() {
    return []
  },
  // Disable static generation for admin routes
  async generateStaticParams() {
    return []
  }
}

module.exports = nextConfig
