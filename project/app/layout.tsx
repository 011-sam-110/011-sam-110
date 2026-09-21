import type { Metadata } from 'next'
import { Space_Mono, Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-mono',
  display: 'swap',
  // Self-host the font at build time so there is no runtime fetch to
  // fonts.gstatic.com (which was failing during capture and triggering the
  // --font-mono fallback shift in the hero pill / stats). `preload` ensures
  // the woff2 is emitted and link-preloaded; `adjustFontFallback: false`
  // stops Next injecting a size-adjusted fallback face that can also probe
  // the CDN, keeping the mono type stable from first paint.
  preload: true,
  adjustFontFallback: false,
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sam-poplett.vercel.app'

const title = 'Sam Poplett — AI-focused developer, open to contracts'
const description =
  'Sam Poplett builds AI-powered web apps and ships them. First-year CS with AI at the University of Sussex, taking paid contracts — agentic systems, vision pipelines, and live tooling.'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: '%s — Sam Poplett',
  },
  description,
  keywords: [
    'Sam Poplett',
    'AI developer',
    'contract developer',
    'web developer',
    'AI engineer',
    'Machine Learning',
    'Computer Vision',
    'Next.js',
    'TypeScript',
    'Python',
    'Sussex University',
  ],
  authors: [{ name: 'Sam Poplett' }],
  creator: 'Sam Poplett',
  openGraph: {
    type: 'website',
    url: siteUrl,
    siteName: 'Sam Poplett',
    title,
    description,
    locale: 'en_GB',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    creator: '@sampoplett',
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${spaceMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  )
}
