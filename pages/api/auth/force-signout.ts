import { NextApiRequest, NextApiResponse } from 'next'
import { serialize } from 'cookie'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Clear all NextAuth cookies
  const cookiesToClear = [
    'next-auth.session-token',
    '__Secure-next-auth.session-token',
    'next-auth.csrf-token',
    '__Host-next-auth.csrf-token',
    'next-auth.callback-url',
    '__Secure-next-auth.callback-url'
  ]

  const clearCookies = cookiesToClear.map(name => 
    serialize(name, '', {
      maxAge: -1,
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    })
  )

  res.setHeader('Set-Cookie', clearCookies)
  res.setHeader('Clear-Site-Data', '"cache", "cookies", "storage"')
  
  // Redirect to signin
  res.redirect(302, '/auth/signin')
}
