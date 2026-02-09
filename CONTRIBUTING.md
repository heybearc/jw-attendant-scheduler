# Contributing to TheoShift

Thank you for your interest in contributing to TheoShift! This document provides guidelines and information for contributors.

---

## 📋 Prerequisites

Before contributing, ensure you have:

- **Node.js 18+** and npm installed
- **PostgreSQL 14+** running locally
- **Git** configured with your credentials
- **SSH access** to deployment servers (for production deployments)
- **Google Maps API key** (for Location Library features)

---

## 🚀 Getting Started

### 1. Clone and Setup

```bash
# Clone the repository
git clone https://github.com/heybearc/theoshift.git
cd theoshift

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Configure your .env file with database credentials
# Edit .env with your settings

# Set up database
npx prisma migrate dev
npx prisma generate

# Run development server
npm run dev
```

### 2. Development Workflow

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Make your changes
# Write tests for new features
# Update documentation as needed

# Run linting
npm run lint

# Run tests
npm run test:e2e

# Commit your changes
git add .
git commit -m "feat: your feature description"

# Push to GitHub
git push origin feature/your-feature-name
```

---

## 📁 Project Structure

### Key Directories

- **`pages/`** - Next.js pages and API routes
  - `pages/api/` - Backend API endpoints
  - `pages/admin/` - Admin interface pages
  - `pages/events/` - Event management pages
  - `pages/volunteer/` - Volunteer portal pages

- **`components/`** - Reusable React components
  - Keep components focused and single-purpose
  - Use TypeScript for all components
  - Follow existing naming conventions

- **`prisma/`** - Database schema and migrations
  - `schema.prisma` - Database schema definition
  - `migrations/` - Database migration history

- **`tests/`** - E2E tests (Playwright)
  - Write tests for new features
  - Ensure tests pass before submitting PR

- **`release-notes/`** - Version release notes
  - Document all user-facing changes

---

## 🎯 Development Guidelines

### Code Style

- **TypeScript** - Use TypeScript for all new code
- **Formatting** - Follow existing code formatting
- **Naming** - Use descriptive, meaningful names
- **Comments** - Add comments for complex logic only

### Component Guidelines

```typescript
// Good: Typed props, clear naming
interface LocationSelectorProps {
  value: string | null;
  onChange: (locationId: string | null) => void;
  disabled?: boolean;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  value,
  onChange,
  disabled = false
}) => {
  // Component implementation
};
```

### API Endpoint Guidelines

```typescript
// Good: Proper error handling, type safety
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = await prisma.locations.findMany();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error fetching locations:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

### Database Changes

When modifying the database schema:

1. **Update `prisma/schema.prisma`**
2. **Create migration**: `npx prisma migrate dev --name descriptive-name`
3. **Test migration** on local database
4. **Document changes** in PR description
5. **Update seed data** if needed

---

## 🧪 Testing

### E2E Tests (Playwright)

All new features must include E2E tests:

```bash
# Run all tests
npm run test:e2e

# Run specific test file
npx playwright test tests/your-test.spec.ts

# Run tests in UI mode
npx playwright test --ui
```

### Test Requirements

- ✅ Test happy path scenarios
- ✅ Test error handling
- ✅ Test edge cases
- ✅ Ensure tests are deterministic
- ✅ Clean up test data after tests

### Writing Tests

```typescript
import { test, expect } from '@playwright/test';

test.describe('Location Library', () => {
  test('should create new location', async ({ page }) => {
    await page.goto('/admin/locations');
    await page.click('text=Create Location');
    await page.fill('[name="name"]', 'Test Location');
    await page.fill('[name="address"]', '123 Main St');
    await page.click('text=Save');
    
    await expect(page.locator('text=Test Location')).toBeVisible();
  });
});
```

---

## 🚢 Deployment Process

TheoShift uses a **blue-green deployment system** with automated workflows.

### Deployment Workflows

1. **`/bump`** - Version bump and deploy to STANDBY
   - Increments version number
   - Generates release notes
   - Deploys to STANDBY server
   - Creates in-app announcements

2. **`/test-release`** - Run E2E tests on STANDBY
   - Tests run from qa-01 container
   - Tests against STANDBY environment
   - Must pass before traffic switch

3. **`/release`** - Switch traffic to STANDBY
   - Switches HAProxy routing
   - STANDBY becomes LIVE
   - Zero downtime switch

4. **`/sync`** - Sync new STANDBY with LIVE code
   - Ensures both environments match
   - Prepares for next deployment

### Testing Policy

**CRITICAL:** All deployments must pass E2E tests before release.

- Tests run on **qa-01** container (10.92.3.13)
- Tests target **STANDBY** environment
- 98%+ pass rate required for release
- See `TESTING-POLICY.md` for details

---

## 📝 Commit Message Guidelines

Follow conventional commits format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks

### Examples

```bash
feat(locations): add Google Maps autocomplete to location selector

Implemented Google Places API integration for address autocomplete
in the LocationSelector component. Includes geocoding for lat/lng
population.

Closes #123
```

```bash
fix(auth): correct volunteer portal redirect logic

Fixed issue where volunteer logins redirected to localhost:3001
instead of production domain. Updated NextAuth callback to respect
callbackUrl parameter.

Fixes FB-028
```

---

## 🐛 Bug Reports

When reporting bugs, include:

1. **Description** - Clear description of the issue
2. **Steps to Reproduce** - Exact steps to reproduce
3. **Expected Behavior** - What should happen
4. **Actual Behavior** - What actually happens
5. **Environment** - Browser, OS, version
6. **Screenshots** - If applicable
7. **Error Messages** - Console errors or logs

---

## 💡 Feature Requests

When requesting features:

1. **Use Case** - Describe the problem you're solving
2. **Proposed Solution** - How you envision the feature
3. **Alternatives** - Other approaches you considered
4. **Additional Context** - Screenshots, mockups, examples

---

## 📚 Key Documentation Files

- **`README.md`** - Project overview and setup
- **`DECISIONS.md`** - Architectural decisions
- **`TASK-STATE.md`** - Current task tracking
- **`TECH-DEBT.md`** - Technical debt tracking
- **`TESTING-POLICY.md`** - Testing requirements
- **`.windsurf/workflows/`** - Deployment workflows
- **`release-notes/`** - Version history

---

## 🔐 Security

- **Never commit secrets** - Use `.env` files (gitignored)
- **Use environment variables** - For all sensitive data
- **Follow authentication patterns** - Use NextAuth.js
- **Validate user input** - Always sanitize and validate
- **Use Prisma** - For SQL injection protection

---

## 🤝 Code Review Process

1. **Create Pull Request** - Against `main` branch
2. **Describe Changes** - Clear PR description
3. **Link Issues** - Reference related issues
4. **Request Review** - Tag maintainers
5. **Address Feedback** - Respond to review comments
6. **Tests Must Pass** - All CI checks must pass
7. **Merge** - Maintainer will merge when approved

---

## 📞 Getting Help

- **Documentation**: Check `.windsurf/workflows/` for deployment guides
- **Architecture**: Review `DECISIONS.md` for design decisions
- **Issues**: Search existing issues before creating new ones
- **Contact**: Reach out to project maintainer

---

## 📄 License

This is a private project for Jehovah's Witness convention management. All rights reserved.

---

**Thank you for contributing to TheoShift! 🎉**
