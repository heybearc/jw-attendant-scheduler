# Magic Link Authentication Implementation Plan

**Date:** 2026-04-19  
**Status:** Ready to implement  
**Strategy:** Backward compatible - both PIN and Magic Link work simultaneously

---

## Overview

Implement magic link authentication for volunteers while maintaining PIN authentication for backward compatibility. This allows testing on STANDBY while LIVE continues to work, and provides a gradual migration path.

---

## Phase 1: Add Email Provider to NextAuth (2 hours)

### 1.1 Update NextAuth Configuration

**File:** `pages/api/auth/[...nextauth].ts`

**Add EmailProvider alongside existing CredentialsProvider:**

```typescript
import EmailProvider from 'next-auth/providers/email'

providers: [
  // Admin: Email + Password (existing)
  CredentialsProvider({
    id: 'admin-credentials',
    // ... existing admin auth
  }),
  
  // Volunteer: PIN Login (existing - keep for backward compatibility)
  CredentialsProvider({
    id: 'volunteer-pin',
    // ... existing volunteer PIN auth
  }),
  
  // Volunteer: Magic Link (NEW)
  EmailProvider({
    server: {
      host: process.env.EMAIL_SERVER_HOST,
      port: process.env.EMAIL_SERVER_PORT,
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD
      }
    },
    from: process.env.EMAIL_FROM,
    async sendVerificationRequest({ identifier, url, provider }) {
      // Only allow volunteers with registered emails
      const volunteer = await prisma.volunteers.findUnique({
        where: { email: identifier }
      })
      
      if (!volunteer) {
        throw new Error('Email not registered. Please contact your coordinator.')
      }
      
      // Send custom email using existing email infrastructure
      const emailConfig = await prisma.system_settings.findFirst({
        where: { key: 'email_config' }
      })

      if (!emailConfig) {
        throw new Error('Email configuration not found')
      }

      const { authType, config } = JSON.parse(emailConfig.value)

      let transporter
      if (authType === 'gmail') {
        transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          requireTLS: true,
          auth: {
            user: config.gmailEmail,
            pass: config.gmailAppPassword
          }
        })
      } else {
        transporter = nodemailer.createTransport({
          host: config.smtpServer,
          port: parseInt(config.smtpPort || '587'),
          secure: config.smtpSecure || false,
          requireTLS: !config.smtpSecure,
          auth: {
            user: config.smtpUser,
            pass: config.smtpPassword
          }
        })
      }

      await transporter.sendMail({
        from: `"TheoShift Team" <${config.fromEmail}>`,
        to: identifier,
        subject: 'Sign in to TheoShift',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
              <!-- Header -->
              <div style="background-color: #10b981; color: white; padding: 30px 20px; text-align: center;">
                <h1 style="margin: 0; font-size: 24px; font-weight: bold;">Sign in to TheoShift</h1>
                <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Click the button below to access your volunteer dashboard.</p>
              </div>

              <!-- Main Content -->
              <div style="padding: 30px 20px;">
                <h2 style="color: #374151; margin: 0 0 20px 0;">Hello ${volunteer.firstName}!</h2>
                
                <p style="color: #6b7280; line-height: 1.6; margin: 0 0 20px 0;">
                  You requested to sign in to your TheoShift volunteer dashboard. Click the button below to continue.
                </p>

                <!-- Sign In Button -->
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${url}" style="display: inline-block; background-color: #10b981; color: white; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                    🔐 Sign In to TheoShift
                  </a>
                </div>

                <!-- Security Notice -->
                <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                  <p style="color: #92400e; margin: 0; line-height: 1.6; font-size: 14px;">
                    ⚡ <strong>Security Notice:</strong> This link will expire in 24 hours and can only be used once. If you didn't request this, you can safely ignore this email.
                  </p>
                </div>

                <!-- Alternative Login -->
                <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin: 20px 0;">
                  <p style="color: #6b7280; line-height: 1.6; margin: 0; font-size: 14px;">
                    <strong>Can't click the button?</strong> Copy and paste this link into your browser:<br>
                    <a href="${url}" style="color: #3b82f6; word-break: break-all;">${url}</a>
                  </p>
                </div>
              </div>

              <!-- Footer -->
              <div style="background-color: #374151; color: #d1d5db; padding: 20px; text-align: center;">
                <p style="margin: 0; font-size: 14px;">TheoShift - Supporting Theocratic Event Coordination</p>
                <p style="margin: 6px 0 0 0; font-size: 12px; opacity: 0.7;">This is an automated message. Please do not reply to this email.</p>
              </div>
            </div>
          </body>
          </html>
        `
      })
    }
  })
]
```

### 1.2 Update Callbacks

**Update signIn callback to handle email provider:**

```typescript
callbacks: {
  async signIn({ user, account }) {
    // For email provider, verify user is a volunteer
    if (account?.provider === 'email') {
      const volunteer = await prisma.volunteers.findUnique({
        where: { email: user.email }
      })
      
      if (!volunteer) {
        return false // Reject sign-in
      }
      
      // Add role and volunteer info to user object
      user.id = volunteer.id
      user.role = 'VOLUNTEER'
      user.congregation = volunteer.congregation
      return true
    }
    
    // Existing logic for other providers
    return true
  },
  
  async jwt({ token, user }) {
    if (user) {
      token.sub = user.id
      token.role = user.role
      token.congregation = (user as any).congregation
    }
    return token
  },
  
  async session({ session, token }) {
    if (session.user) {
      session.user.id = token.sub as string
      session.user.role = token.role as string
      session.user.congregation = token.congregation as string
    }
    return session
  },
  
  async redirect({ url, baseUrl, token }) {
    // Role-based redirect
    if (token?.role === 'VOLUNTEER') {
      if (url.startsWith(baseUrl)) return url
      return `${baseUrl}/volunteer/select-event`
    }
    
    if (url.startsWith(baseUrl)) return url
    return `${baseUrl}/events/select`
  }
}
```

---

## Phase 2: Update Volunteer Login Page (1 hour)

### 2.1 Add Email Login Option

**File:** `pages/volunteer/login.tsx`

**Add tab/toggle to switch between PIN and Email login:**

```typescript
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { signIn, getCsrfToken } from 'next-auth/react'

export default function VolunteerLogin() {
  const router = useRouter()
  const [loginMethod, setLoginMethod] = useState<'pin' | 'email'>('email') // Default to email
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [csrfToken, setCsrfToken] = useState<string | null>(null)
  
  // PIN form data
  const [pinFormData, setPinFormData] = useState({
    firstName: '',
    lastName: '',
    congregation: '',
    pin: ''
  })
  
  // Email form data
  const [email, setEmail] = useState('')

  useEffect(() => {
    getCsrfToken().then(token => {
      setCsrfToken(token || null)
    })
  }, [])

  const handlePinLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const callbackUrl = (router.query.callbackUrl as string) || '/volunteer/select-event'
      
      const result = await signIn('volunteer-pin', {
        firstName: pinFormData.firstName,
        lastName: pinFormData.lastName,
        congregation: pinFormData.congregation,
        pin: pinFormData.pin,
        callbackUrl,
        redirect: false
      })

      if (result?.error) {
        setError('Invalid credentials. Please check your information.')
        setLoading(false)
      } else if (result?.ok) {
        router.push(callbackUrl)
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const callbackUrl = (router.query.callbackUrl as string) || '/volunteer/select-event'
      
      const result = await signIn('email', {
        email,
        callbackUrl,
        redirect: false
      })

      if (result?.error) {
        setError('Email not registered. Please contact your coordinator.')
        setLoading(false)
      } else if (result?.ok) {
        setEmailSent(true)
        setLoading(false)
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Check your email</h2>
            <p className="mt-2 text-sm text-gray-600">
              We've sent a sign-in link to <strong>{email}</strong>
            </p>
            <p className="mt-4 text-sm text-gray-500">
              Click the link in the email to sign in to your volunteer dashboard.
            </p>
            <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>Check your spam folder</strong> if you don't see the email within a few minutes.
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setEmailSent(false)}
              className="mt-6 text-sm text-green-600 hover:text-green-500"
            >
              ← Back to login
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Volunteer Sign In
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Access your volunteer dashboard
          </p>
        </div>

        {/* Login Method Toggle */}
        <div className="flex rounded-lg bg-gray-100 p-1">
          <button
            onClick={() => setLoginMethod('email')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              loginMethod === 'email'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📧 Email Link
          </button>
          <button
            onClick={() => setLoginMethod('pin')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              loginMethod === 'pin'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🔢 PIN Login
          </button>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Email Login Form */}
        {loginMethod === 'email' && (
          <form className="mt-8 space-y-6" onSubmit={handleEmailLogin}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                placeholder="your.email@example.com"
              />
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    We'll send you a secure sign-in link. Click it to access your dashboard.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send Sign-In Link'}
            </button>
          </form>
        )}

        {/* PIN Login Form (existing) */}
        {loginMethod === 'pin' && (
          <form className="mt-8 space-y-6" onSubmit={handlePinLogin}>
            {/* Existing PIN form fields */}
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="firstName" className="sr-only">First Name</label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={pinFormData.firstName}
                  onChange={(e) => setPinFormData({...pinFormData, firstName: e.target.value})}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                  placeholder="First Name"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="sr-only">Last Name</label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={pinFormData.lastName}
                  onChange={(e) => setPinFormData({...pinFormData, lastName: e.target.value})}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                  placeholder="Last Name"
                />
              </div>
              <div>
                <label htmlFor="congregation" className="sr-only">Congregation</label>
                <input
                  id="congregation"
                  name="congregation"
                  type="text"
                  required
                  value={pinFormData.congregation}
                  onChange={(e) => setPinFormData({...pinFormData, congregation: e.target.value})}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                  placeholder="Congregation"
                />
              </div>
              <div>
                <label htmlFor="pin" className="sr-only">PIN</label>
                <input
                  id="pin"
                  name="pin"
                  type="password"
                  required
                  value={pinFormData.pin}
                  onChange={(e) => setPinFormData({...pinFormData, pin: e.target.value})}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                  placeholder="PIN"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
```

---

## Phase 3: Environment Variables

**Add to `.env` on STANDBY:**

```bash
# Email Provider (uses existing SMTP config from database)
# NextAuth will use the email config from system_settings table
EMAIL_FROM="TheoShift Team <noreply@theoshift.com>"

# These are read from database system_settings, but NextAuth needs them defined
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your-app-password
```

**Note:** We'll read actual values from `system_settings` table in the `sendVerificationRequest` function, so these are just placeholders for NextAuth.

---

## Phase 4: Testing Checklist (STANDBY)

### 4.1 Test Email Login
- [ ] Go to `http://10.92.3.24:3001/volunteer/login`
- [ ] Switch to "Email Link" tab
- [ ] Enter volunteer email
- [ ] Verify email is sent
- [ ] Click magic link in email
- [ ] Verify redirect to dashboard
- [ ] Verify session persists (refresh page, still logged in)

### 4.2 Test PIN Login (Backward Compatibility)
- [ ] Go to `http://10.92.3.24:3001/volunteer/login`
- [ ] Switch to "PIN Login" tab
- [ ] Enter PIN credentials
- [ ] Verify login works
- [ ] Verify redirect to dashboard

### 4.3 Test Email Links from Assignment Emails
- [ ] Send assignment notification email
- [ ] Click link in email (while logged out)
- [ ] Verify redirect to login with callbackUrl
- [ ] Login via magic link
- [ ] Verify redirect back to assignment page

### 4.4 Test Session Persistence
- [ ] Login via magic link
- [ ] Close browser
- [ ] Reopen browser
- [ ] Go to dashboard
- [ ] Verify still logged in (no re-login needed)

---

## Phase 5: Deployment to LIVE

### 5.1 Pre-Deployment
- [ ] All STANDBY tests passing
- [ ] No errors in logs
- [ ] Email delivery working reliably
- [ ] Session persistence confirmed

### 5.2 Deploy
```bash
# Use /release workflow
/release
```

### 5.3 Post-Deployment Monitoring
- [ ] Monitor email delivery
- [ ] Check for login errors
- [ ] Verify both PIN and email login work on LIVE
- [ ] Monitor user adoption

---

## Phase 6: User Migration (Optional - Future)

### 6.1 Communication (Week 1)
- Send email to all volunteers:
  - "New login method available!"
  - "Sign in with just your email - no more PIN to remember"
  - "Your old PIN still works if you prefer"

### 6.2 Encourage Adoption (Week 2-4)
- Add banner on PIN login page: "Try our new email sign-in!"
- Track usage metrics (how many use email vs PIN)
- Provide support for volunteers who need help

### 6.3 Deprecate PIN (Month 2+)
- After 90% adoption, consider removing PIN option
- Give 30-day notice before removal
- Provide migration support for remaining users

---

## Rollback Plan

If issues arise:

1. **Immediate:** Remove EmailProvider from NextAuth config
2. **Redeploy:** Push change to STANDBY, test, then LIVE
3. **Result:** System reverts to PIN-only login

**No data loss** - all changes are additive, nothing is removed.

---

## Benefits of This Approach

✅ **Zero downtime** - Both methods work simultaneously  
✅ **Gradual migration** - Users can switch at their own pace  
✅ **Easy rollback** - Just remove EmailProvider  
✅ **Test on STANDBY** - Verify before LIVE deployment  
✅ **Backward compatible** - Existing PIN users unaffected  
✅ **Future-proof** - Can deprecate PIN later when ready

---

## Estimated Timeline

- **Phase 1-2:** 3 hours (implementation)
- **Phase 3:** 1 hour (testing on STANDBY)
- **Phase 4:** 30 minutes (deployment to LIVE)
- **Phase 5:** Ongoing (user migration)

**Total implementation time:** ~4.5 hours  
**Ready for production:** Same day

---

## Next Steps

1. Implement Phase 1 (NextAuth EmailProvider)
2. Implement Phase 2 (Login page updates)
3. Test on STANDBY
4. Deploy to LIVE
5. Monitor and iterate

**Ready to start implementation?**
