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

### Location Library (NEW in v4.9.0)
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
├── .windsurf/            # IDE configuration and workflows
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

This application uses a **Blue-Green Deployment System** for zero-downtime deployments.

### Deployment Architecture

- **Blue Environment** - Staging/Production environment
- **Green Environment** - Staging/Production environment
- **Database** - Shared PostgreSQL database
- **Load Balancer** - Routes traffic to active environment

Either Blue or Green can be LIVE or STANDBY. The system uses automated health checks and traffic switching for safe deployments.

### Deployment Workflow

The deployment process follows these main steps:

1. **Version Bump & Deploy to STANDBY**
   - Increment version number (patch/minor/major)
   - Generate release notes
   - Deploy code to STANDBY environment
   - Run automated tests

2. **Test STANDBY Environment**
   - Run E2E test suite (Playwright)
   - Verify all features work correctly
   - Ensure 98%+ test pass rate

3. **Switch Traffic to STANDBY**
   - Validate STANDBY environment health
   - Perform health checks
   - Switch load balancer routing
   - STANDBY becomes new LIVE (zero downtime)

4. **Sync New STANDBY**
   - Deploy LIVE code to new STANDBY
   - Ensure both environments match
   - Prepare for next deployment cycle

### Deployment Requirements

- **Testing:** All deployments must pass E2E tests before going live
- **Process Management:** PM2 for Node.js process management
- **Database Migrations:** Prisma migrations applied before code deployment
- **Environment Variables:** Properly configured on all environments

### For Maintainers

Internal deployment documentation and infrastructure details are available in the private `.windsurf/workflows/` directory. Contact the project maintainer for access to deployment credentials and infrastructure.

## 📚 Documentation

- **Contributing Guide:** See `CONTRIBUTING.md` for development setup and guidelines
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
1. Check `CONTRIBUTING.md` for development guidelines
2. Review existing issues on GitHub
3. Create a new issue with detailed information
4. Contact the project maintainer for deployment access

## 📝 Version History

- **v4.15.8** (2026-04-11) - Early Check-In Tab Fix
  - Fixed Early Check-In tab visibility for all volunteers when IVS module enabled
  - Removed overly restrictive IVS approval workflow checks

- **v4.15.7** (2026-03-20) - Volunteer Login & Bulk PIN Fixes
  - Fixed volunteer login redirect loop issue
  - Fixed bulk PIN setting for multiple volunteers
  - Fixed event QR code to point to volunteer login page

- **v4.15.6** (2026-03-20) - Multiple Volunteers Per Shift & Feedback Fixes
  - Multiple volunteers can now be assigned to the same shift
  - Early Check-In tab visibility fixed (only shows when IVS module enabled)
  - Auto-Assign button always visible with helpful tooltips
  - Improved position assignment workflow

- **v4.14.0** (2026-02-19) - PWA Bottom Navigation & Global Announcements
  - Volunteer bottom navigation bar on dashboard, early check-in, and select event pages
  - Global Announcements admin page — create system-wide messages with Info/Warning/Urgent types
  - In-app document viewer — documents open in fullscreen modal instead of new browser tab (iPhone fix)
  - Bug fixes: event tab bar, overseer dropdown, dashboard counts, ASSISTANT_OVERSEER event creation

- **v4.13.0** (2026-02-18) - Conflict Detection & Feedback Compliance
  - Conflict detection in volunteer assignment modal with amber badge and coordinator override
  - Feedback status API compliance — resolution comment required, email sent on status change

- **v4.12.0** (2026-02-18) - Phase 4 Cleanup & Architectural Simplification
  - Removed deprecated template systems (department templates, assignment templates)
  - Removed position-level oversight page (replaced by event-level oversight)
  - Simplified admin navigation and event tabs
  - Reduced codebase by 3,555 lines while maintaining backward compatibility

- **v4.11.0** (2026-02-17) - Event-Centric Configuration & Enhanced Cloning
  - Event-specific module settings and terminology customization
  - Granular clone options modal for selective event duplication
  - Module enforcement in navigation and dashboards
  - Critical bug fixes for event pages and shift templates

- **v4.10.0** (2026-02-16) - Early Check-in System User Linking & Phone Formatting
  - Event oversight user linking (Department Overseer, Assistants, Keymen)
  - Automatic phone number formatting across all phone fields
  - Phone auto-population from linked volunteer records
  - User management pagination fixes
  - Actions dropdown visibility improvements

- **v4.9.0** (2026-02-16) - Event Oversight User Linking & Phone Formatting
  - Event oversight user linking (Department Overseer, Assistants, Keymen)
  - Automatic phone number formatting across all phone fields
  - Phone auto-population from linked volunteer records
  - User management pagination fixes
  - Actions dropdown visibility improvements

- **v4.8.0** (2026-02-15) - IVS Module with Tab Navigation
  - Redesigned IVS Module with tab-based interface
  - Improved Early Check-In experience with collapsible sections
  - Volunteer portal early check-in
  - Early entry flag protection
  - Real-time updates and live stats

- **v4.7.0** (2026-02-11) - Infrastructure & Stability Improvements
  - Enhanced system stability and performance
  - Behind-the-scenes optimizations
  - Improved reliability

- **v4.6.0** (2026-02-11) - System Improvements
  - Enhanced stability and performance
  - General system optimizations

- **v4.5.0** (2026-02-10) - Event Creation Help & Onboarding
  - Event creation help and guidance
  - Improved onboarding experience

- **v4.4.0** (2026-02-10) - IVS Volunteer Approvals
  - Complete IVS volunteer management system
  - Approval workflow for international volunteers
  - IVS volunteer tracking and organization

- **v4.3.0** (2026-02-10) - Redesigned Admin Console
  - Modern admin console interface
  - Improved administrative workflows

- **v4.2.1** (2026-02-09) - Release Notes Improvements
  - Enhanced release notes page with search and filtering
  - Better update history navigation

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
