import { SessionProvider } from 'next-auth/react'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import ErrorBoundary from '../components/ErrorBoundary'
import RebrandingBanner from '../components/RebrandingBanner'
import { useActivityTracking } from '../src/hooks/useActivityTracking'
import '../styles/globals.css'

function AppContent({ Component, pageProps }: { Component: any; pageProps: any }) {
  // Track user activity for session management
  useActivityTracking()
  
  return (
    <>
      <Head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="alternate icon" href="/favicon.ico" />
        <meta name="application-name" content="TheoShift" />
        <meta name="description" content="TheoShift - Volunteer Coordination Platform for Theocratic Events" />
      </Head>
      <RebrandingBanner />
      <Component {...pageProps} />
    </>
  )
}

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  return (
    <ErrorBoundary>
      <SessionProvider session={session}>
        <AppContent Component={Component} pageProps={pageProps} />
      </SessionProvider>
    </ErrorBoundary>
  )
}
