#!/bin/bash

# Staging-Only Next.js Setup Script
# Restricted to staging server development only

echo "🎯 Setting up Next.js development on staging server (10.92.3.24)"
echo "⚠️  STAGING DEVELOPMENT ONLY - No production deployment"

# SSH to staging server and set up Next.js
ssh -i ~/.ssh/jw_staging root@10.92.3.24 << 'EOF'

echo "📁 Creating Next.js development directory..."
mkdir -p /opt/jw-attendant-nextjs
cd /opt/jw-attendant-nextjs

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    apt-get install -y nodejs
fi

echo "📋 Node.js version: $(node --version)"
echo "📋 NPM version: $(npm --version)"

# Initialize Next.js application
echo "⚡ Initializing Next.js application..."
npx create-next-app@latest web --typescript --tailwind --eslint --app --src-dir --import-alias '@/*' --yes

# Create SDD library structure
echo "🏗️  Creating SDD library structure..."
mkdir -p libs/{attendant-management,event-management,count-tracking,authentication,ui-components,shared}
mkdir -p apps/{api,database}
mkdir -p contracts tests docs

# Create library package.json files
for lib in attendant-management event-management count-tracking authentication ui-components shared; do
    mkdir -p libs/$lib/{src,tests,docs}
    cat > libs/$lib/package.json << LIBEOF
{
  "name": "@jw-scheduler/$lib",
  "version": "0.1.0",
  "description": "JW Scheduler $lib library",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "build": "tsc",
    "test": "vitest",
    "lint": "eslint src/**/*.ts"
  }
}
LIBEOF

    echo "// $lib library" > libs/$lib/src/index.ts
    echo "# $lib\n\nJW Scheduler $lib library for staging development." > libs/$lib/README.md
done

# Install additional dependencies
echo "📦 Installing development dependencies..."
cd web
npm install prisma @prisma/client next-auth zod react-hook-form @hookform/resolvers zustand
npm install @testing-library/react @testing-library/jest-dom vitest
npm install -D @types/node @types/react

# Initialize Prisma
echo "🗄️  Initializing Prisma for staging database..."
npx prisma init

# Create basic environment configuration
cat > .env.local << ENVEOF
# Staging Environment Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/jw_attendant_staging"
NEXTAUTH_URL="http://10.92.3.24:3000"
NEXTAUTH_SECRET="staging-secret-key"
NODE_ENV="development"
ENVEOF

# Create staging-specific Next.js configuration
cat > next.config.js << NEXTEOF
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  env: {
    STAGING_MODE: 'true',
    STAGING_SERVER: '10.92.3.24'
  }
}

module.exports = nextConfig
NEXTEOF

# Create basic page structure
mkdir -p src/app/{attendants,events,counts}

# Create staging homepage
cat > src/app/page.tsx << PAGEEOF
export default function Home() {
  return (
    <main className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-4">
        JW Attendant Scheduler - Next.js (Staging)
      </h1>
      <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-6">
        <p className="text-yellow-700">
          <strong>Staging Development Only</strong> - This is for evaluation and development workflow testing.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Attendant Management</h2>
          <p className="text-gray-600">Manage attendants and assignments</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Event Management</h2>
          <p className="text-gray-600">Create and manage events</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Count Tracking</h2>
          <p className="text-gray-600">Track count times and sessions</p>
        </div>
      </div>
    </main>
  )
}
PAGEEOF

echo ""
echo "✅ Next.js staging setup complete!"
echo "📋 Setup Summary:"
echo "  - Location: /opt/jw-attendant-nextjs"
echo "  - Framework: Next.js 14 with TypeScript"
echo "  - SDD Libraries: Created structure"
echo "  - Database: Prisma configured for staging"
echo "  - Environment: Staging development only"
echo ""
echo "🚀 To start development server:"
echo "  cd /opt/jw-attendant-nextjs/web"
echo "  npm run dev"
echo ""
echo "🌐 Access at: http://10.92.3.24:3000"

EOF

echo ""
echo "✅ Staging Next.js setup script completed!"
echo "📋 Next steps:"
echo "1. SSH to staging server: ssh -i ~/.ssh/jw_staging root@10.92.3.24"
echo "2. Navigate to: cd /opt/jw-attendant-nextjs/web"
echo "3. Start development: npm run dev"
echo "4. Access at: http://10.92.3.24:3000"
