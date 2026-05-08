import { SessionProvider } from 'next-auth/react'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import { useEffect } from 'react'
import ErrorBoundary from '../components/ErrorBoundary'
import { useActivityTracking } from '../src/hooks/useActivityTracking'
import '../styles/globals.css'

function AppContent({ Component, pageProps }: { Component: any; pageProps: any }) {
  // Track user activity for session management
  useActivityTracking()
  
  // PWA: register in production only. SW v2.0.2+ does not intercept full page
  // navigations (see public/sw.js) so magic link + Next.js auth work on mobile.
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
    if (process.env.NODE_ENV !== 'production') return

    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => console.log('[PWA] Service Worker registered', reg.scope))
      .catch((err) => console.warn('[PWA] Service Worker registration failed', err))
  }, [])
  
  return (
    <>
      <Head>
        {/* Viewport Configuration for Mobile */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes, viewport-fit=cover"
        />
        
        {/* PWA Meta Tags */}
        <meta name="application-name" content="TheoShift" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="TheoShift" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#1e40af" />
        
        {/* Description */}
        <meta name="description" content="TheoShift - Volunteer Coordination Platform for Theocratic Events" />
        
        {/* Icons */}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="alternate icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/logo.png" />
        
        {/* Manifest */}
        <link rel="manifest" href="/manifest.json" />
      </Head>
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
