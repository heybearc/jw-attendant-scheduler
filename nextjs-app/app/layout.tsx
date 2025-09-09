import React from 'react'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'JW Attendant Scheduler',
  description: 'Next.js SDD Implementation of JW Attendant Scheduler',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="bg-blue-600 text-white p-4">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-xl font-bold">JW Attendant Scheduler</h1>
            <div className="space-x-4">
              <a href="/" className="hover:text-blue-200">Home</a>
              <a href="/attendants" className="hover:text-blue-200">Attendants</a>
              <a href="/events" className="hover:text-blue-200">Events</a>
              <a href="/counts" className="hover:text-blue-200">Count Tracking</a>
            </div>
          </div>
        </nav>
        <main className="container mx-auto p-4">
          {children}
        </main>
      </body>
    </html>
  )
}
