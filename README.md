# Theocratic Shift Scheduler

Event-centric attendant management system for Jehovah's Witness conventions and assemblies.

## 🎯 Overview

Theocratic Shift Scheduler is a comprehensive web application designed to manage attendant assignments, positions, and scheduling for conventions and assemblies. The system provides event-scoped management with role-based access control, automated assignment capabilities, and real-time count tracking.

## ✨ Key Features

### Event Management
- **Event-Centric Architecture** - All functionality scoped within events
- **Event Dashboard** - Centralized workspace for event management
- **Event Status Tracking** - Upcoming, Current, Completed, Cancelled, Archived
- **Event Templates** - Copy events with positions and settings
- **Location Library** - Centralized location management with Google Maps integration

### Location Library (NEW in v4.2.0)
- **Saved Locations** - Create and reuse frequently used event locations
- **Google Maps Integration** - Address autocomplete and geocoding
- **Map Preview** - Interactive maps with markers and directions
- **Admin Management** - Full CRUD interface at `/admin/locations`
- **Usage Tracking** - Track popular locations and usage statistics
- **Smart Selector** - Autocomplete dropdown with recent/popular locations

### Volunteer Management
- **User Roles** - Admin, Overseer, Assistant Overseer, Keyman, Volunteer
- **Invitation System** - Secure token-based user invitations
- **User-Volunteer Linking** - Connect user accounts to volunteer profiles
- **Volunteer Dashboard** - Assignment info, oversight contact, count times
- **Volunteer Portal** - Self-service login and assignment viewing

### Position & Assignment Management
- **Unlimited Positions** - Create numbered positions per event
- **Position Shifts** - Time-based shift assignments
- **Position Templates** - Reusable position configurations
- **Bulk Operations** - Manage multiple positions efficiently
- **Auto-Assignment Engine** - Priority-based assignment algorithm with conflict detection
- **Drag-and-Drop** - Intuitive assignment creation

### Count Times System
- **Count Sessions** - Track count times per event
- **Position Counts** - Individual position count tracking
- **Live Entry** - Real-time count entry via volunteer dashboard
- **Count Analytics** - Reporting and analysis

### Oversight Management
- **Department Organization** - Organize positions by department
- **Station Ranges** - Assign oversight to position ranges
- **Overseer Assignments** - Multi-level hierarchical tracking
- **Oversight Reporting** - Track oversight responsibilities

### Communication
- **Email System** - Gmail App Password integration
- **Email Templates** - Invitations, notifications, reminders
- **Admin Configuration** - Email settings management

### Import/Export
- **CSV Import** - Bulk volunteer data import
- **Data Export** - Export volunteers, events, assignments
- **Sample Templates** - CSV templates for data import

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (React 18)
- **Language:** TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** NextAuth.js
- **Styling:** Tailwind CSS
- **Process Management:** PM2
- **Deployment:** MCP Blue-Green System

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- PM2 (for production deployment)
- SSH access to deployment servers (for production)

## 🚀 Getting Started

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/heybearc/theoshift.git
   cd theoshift
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials and settings
   ```

4. **Set up database**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Open http://localhost:3001 in your browser
   - Default admin credentials are set during first migration

### Environment Variables

Create a `.env` file with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/theoshift"

# NextAuth
NEXTAUTH_URL="http://localhost:3001"
NEXTAUTH_SECRET="your-secret-key-here"

# Email (optional)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-password"
EMAIL_FROM="Theocratic Shift Scheduler <your-email@gmail.com>"

# Google Maps (required for Location Library)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-google-maps-api-key"
```

## 📦 Available Scripts

```bash
npm run dev          # Start development server on port 3001
npm run build        # Build for production
npm start            # Start production server on port 3001
npm run lint         # Run ESLint
```

## 🏗️ Project Structure

```
theoshift/
├── src/                    # Source code
│   ├── auth.ts            # NextAuth configuration
│   ├── lib/               # Utility libraries
│   └── types/             # TypeScript type definitions
├── pages/                 # Next.js pages
│   ├── api/              # API routes
│   │   ├── events/       # Event API endpoints
│   │   ├── locations/    # Location Library API endpoints
│   │   └── volunteers/   # Volunteer API endpoints
│   ├── admin/            # Admin pages
│   │   └── locations.tsx # Location Library management
│   ├── events/           # Event management pages
│   └── volunteer/        # Volunteer portal pages
├── components/            # React components
│   ├── LocationSelector.tsx  # Location picker with autocomplete
│   └── MapPreview.tsx        # Google Maps integration
├── features/              # Feature modules
├── prisma/               # Database schema and migrations
│   ├── schema.prisma     # Prisma schema
│   └── migrations/       # Database migrations
├── public/               # Static assets
├── scripts/              # Utility scripts
├── tests/                # E2E tests (Playwright)
├── release-notes/        # Version release notes
├── .windsurf/            # Windsurf IDE workflows
│   └── workflows/        # Deployment workflows
├── .cloudy-work/         # Control plane governance (submodule)
├── _archive/             # Archived documentation
├── DECISIONS.md          # Architectural decisions
├── TASK-STATE.md         # Current task tracking
├── TECH-DEBT.md          # Technical debt tracking
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.js
└── ecosystem.config.js   # PM2 configuration
```

## 🚢 Deployment

This application uses the **MCP Blue-Green Deployment System** for zero-downtime deployments.

### Deployment Architecture

- **Blue Environment:** Container 134 (10.92.3.24) - https://blue.theoshift.com
- **Green Environment:** Container 132 (10.92.3.22) - https://green.theoshift.com
- **Database:** Container 131 (10.92.3.21) - Shared PostgreSQL
- **Main URL:** https://theoshift.com (routes to LIVE server)

Either Blue or Green can be LIVE or STANDBY. Status is dynamically determined by HAProxy routing.

### Deployment Workflow

The deployment process follows three main workflows:

1. **`/bump`** - Version bump, release notes, deploy to STANDBY
   - Increments version (patch/minor/major)
   - Generates release notes
   - Creates in-app announcements
   - Updates help documentation
   - Deploys to STANDBY server

2. **`/release`** - Switch traffic from STANDBY to LIVE
   - Validates STANDBY environment
   - Performs health checks
   - Switches HAProxy routing
   - STANDBY becomes new LIVE

3. **`/sync`** - Sync LIVE code to new STANDBY
   - Deploys LIVE code to new STANDBY
   - Ensures both environments are in sync
   - Prepares for next deployment cycle

### MCP Commands

```bash
# Check deployment status
mcp0_get_deployment_status(app: "theoshift")

# Deploy to STANDBY
mcp0_deploy_to_standby(app: "theoshift", pullGithub: true, runMigrations: false)

# Switch traffic (after testing STANDBY)
mcp0_switch_traffic(app: "theoshift", requireApproval: false)
```

### Manual Deployment (SSH)

If needed, you can deploy manually via SSH:

```bash
# SSH to server
ssh blue-theoshift  # Blue (10.92.3.24)
# OR
ssh green-theoshift  # Green (10.92.3.22)

# Navigate to project
cd /opt/theoshift

# Pull latest code
git pull origin main

# Install dependencies
npm install

# Build application
npm run build

# Restart PM2
pm2 restart theoshift-blue
# OR
pm2 restart theoshift-green
```

## 📚 Documentation

- **Deployment Guide:** See `.windsurf/workflows/` for detailed deployment workflows
- **API Documentation:** See `pages/api/` for API endpoint implementations
- **Database Schema:** See `prisma/schema.prisma` for complete data model
- **Architectural Decisions:** See `DECISIONS.md` for key technical decisions
- **Testing Policy:** See `TESTING-POLICY.md` for E2E testing requirements
- **Release Notes:** See `release-notes/` for version history

## 🔐 Security

- **Authentication:** NextAuth.js with credential-based authentication
- **Password Hashing:** bcrypt for secure password storage
- **Role-Based Access:** Admin, Overseer, Assistant Overseer, Keyman, Attendant roles
- **Session Management:** Secure session handling via NextAuth
- **Email Security:** Gmail App Passwords (no OAuth2 complexity)

## 🤝 Contributing

This is a private project for Jehovah's Witness convention management. For questions or support, contact the project maintainer.

## 📝 License

Private - All rights reserved

## 🆘 Support

For issues or questions:
1. Check the documentation in `.windsurf/workflows/`
2. Review `INFRASTRUCTURE_CONFIG.md` for deployment details
3. Contact the project maintainer

## 🔄 Version History

- **v4.2.0** (2026-02-09) - Location Library
  - Centralized location management with Google Maps integration
  - LocationSelector component with autocomplete
  - Admin locations page with CRUD operations
  - Map preview and directions integration
  - Usage tracking for popular locations

- **v4.1.1** (2026-02-08) - Redirect Bug Fix
  - Fixed localhost:3001 redirect issues in volunteer portal
  - Corrected NextAuth redirect logic

- **v3.11.0** (2026-02-05) - UI Modernization
  - Modernized Volunteers and Positions pages
  - Compact headers with inline stats
  - Contextual bulk operations
  - Mobile-responsive design improvements

- **v3.0.0** - MCP Blue-Green Deployment
  - Event-centric architecture
  - Enhanced user management
  - Count times system
  - Auto-assignment engine
  - Email integration

See `release-notes/` directory for detailed version history.

---

**Built with ❤️ for Jehovah's Witness conventions and assemblies**
