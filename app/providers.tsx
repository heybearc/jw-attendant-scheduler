'use client'

import { SessionProvider } from 'next-auth/react'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  )
}

// Legacy auth hook for backward compatibility - will be removed
export function useAuth() {
  throw new Error('useAuth is deprecated. Use useSession from next-auth/react instead.')
}
