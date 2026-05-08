import type { NextApiRequest } from 'next'

/**
 * Matches NextAuth core/init session cookie naming:
 * `useSecureCookies ?? new URL(origin).protocol === 'https:'`
 *
 * Magic-link callback must set the same cookie name NextAuth uses when reading the session.
 */
export function useSecureCookies(req: NextApiRequest): boolean {
  const override = process.env.NEXTAUTH_USE_SECURE_COOKIES
  if (override === 'true') return true
  if (override === 'false') return false

  const nu = process.env.NEXTAUTH_URL
  if (nu?.startsWith('https://')) return true
  if (process.env.VERCEL) return true

  const xf = req.headers['x-forwarded-proto']
  const proto =
    typeof xf === 'string' ? xf.split(',')[0].trim().toLowerCase() : ''
  if (proto === 'https') return true

  return false
}

export function sessionTokenCookieName(req: NextApiRequest): string {
  return useSecureCookies(req)
    ? '__Secure-next-auth.session-token'
    : 'next-auth.session-token'
}
