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
  
  // Unregister service worker completely (debugging mobile issues)
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister()
          console.log('[PWA] Service Worker unregistered')
        })
      })
    }
  }, [])
  
  return (
    <>
      <Head>
        {/* Viewport Configuration for Mobile */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />
        
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
