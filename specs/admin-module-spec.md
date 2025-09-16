# Admin Module Specification
## JW Attendant Scheduler - User Management & Configuration

### Overview
The Admin Module provides comprehensive user management, role assignment, and system configuration capabilities. This module serves as the foundation for all other system functionality.

### User Roles (From Prisma Schema)
```typescript
enum UserRole {
  ADMIN           // Full system access, user management
  OVERSEER        // Department oversight, assignment management  
  ASSISTANT_OVERSEER // Limited oversight capabilities
  KEYMAN          // Key position assignments, special access
  ATTENDANT       // Standard user, view assignments
}
```

### Role Hierarchy & Permissions
- **ADMIN**: Complete system control, user CRUD, role assignment, system configuration
- **OVERSEER**: Manage events, assign attendants, view reports, department oversight
- **ASSISTANT_OVERSEER**: Limited event management, assist with assignments
- **KEYMAN**: Special position assignments, access to key areas
- **ATTENDANT**: View personal assignments, update availability, basic profile management

### Core Features

#### 1. User Management
- **User CRUD Operations**
  - Create new users with role assignment
  - Edit user profiles (name, email, phone, role)
  - Deactivate/reactivate users
  - Delete users (with cascade considerations)
  - Bulk user operations

#### 2. User Invitation System
- **Email-Based Invitations**
  - Generate secure invitation tokens
  - Send invitation emails via Gmail App Password
  - Token expiration management (7-day default)
  - Resend invitation capability
  - Track invitation status

- **SMS Notifications (Future Enhancement)**
  - Research indicates free SMS options are limited
  - Twilio offers free trial credits but requires paid plan for production
  - Consider SMS as premium feature for future implementation
  - **Current Decision: Email-only for MVP**

#### 3. Email Configuration
- **Gmail App Password Integration**
  - SMTP configuration for Gmail
  - App-specific password setup
  - Template management for invitations
  - Email delivery status tracking
  - Configurable sender information

#### 4. Role Management
- **Role Assignment Interface**
  - Visual role hierarchy display
  - Bulk role changes
  - Role change audit trail
  - Permission matrix display

### Technical Implementation

#### Database Models Used
- `users` - Core user information and roles
- `email_configurations` - SMTP settings and templates
- `attendants` - Extended attendant profiles (linked to users)

#### API Endpoints
```
POST   /api/admin/users              # Create user
GET    /api/admin/users              # List users with pagination
GET    /api/admin/users/[id]         # Get user details
PUT    /api/admin/users/[id]         # Update user
DELETE /api/admin/users/[id]         # Delete user
POST   /api/admin/users/invite       # Send invitation
POST   /api/admin/users/bulk         # Bulk operations
GET    /api/admin/email/config       # Get email configuration
PUT    /api/admin/email/config       # Update email configuration
POST   /api/admin/email/test         # Test email configuration
```

#### UI Components
- User list with search/filter capabilities
- User creation/edit forms with role selection
- Invitation management interface
- Email configuration panel
- Role management dashboard
- Bulk operation tools

### Email Configuration Requirements
```typescript
interface EmailConfig {
  smtpServer: string      // smtp.gmail.com
  smtpPort: number        // 587 (TLS) or 465 (SSL)
  smtpUser: string        // Gmail address
  smtpPassword: string    // Gmail App Password
  fromEmail: string       // Sender email
  fromName: string        // Display name
  replyToEmail?: string   // Reply-to address
  inviteTemplate: string  // HTML email template
}
```

### Security Considerations
- Invitation tokens must be cryptographically secure
- Email passwords encrypted at rest
- Role changes require admin authentication
- Audit trail for all user management actions
- Rate limiting on invitation sending

### WMACS Guardian Integration
- All admin operations protected by WMACS Guardian
- Automatic recovery from email configuration failures
- Database transaction rollback on user creation errors
- Deployment protection during admin module updates

### Development Approach
1. **Feature Branch**: `feature/admin-module`
2. **Incremental Development**: Build and test each component with WMACS Guardian
3. **Staging Testing**: Use container 134 for all testing
4. **API-First**: Complete backend APIs before UI development
5. **Email Testing**: Test with actual Gmail configuration

### Success Criteria
- [ ] Complete user CRUD operations
- [ ] Working invitation system with email delivery
- [ ] Role management with proper permissions
- [ ] Gmail integration with app passwords
- [ ] Bulk user operations
- [ ] Admin UI with all functionality
- [ ] WMACS Guardian protection on all operations
- [ ] Comprehensive error handling and validation

### Future Enhancements
- SMS invitation capability (paid service integration)
- Advanced user analytics and reporting
- Single Sign-On (SSO) integration
- Multi-factor authentication
- Advanced permission granularity
- User import/export functionality
