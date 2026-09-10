'use client'

import { useEffect } from 'react'
import Cal, { getCalApi } from '@calcom/embed-react'
import { colors } from '@/lib/theme'

/**
 * The actual Cal.com inline embed. Lives in its own module so it can be
 * `dynamic(..., { ssr: false })`-imported by BookACall — the @calcom/embed-react
 * SDK never enters the main bundle and never runs on the server.
 *
 * `getCalApi` configures the embed UI once on mount: dark theme to sit on the
 * deep-purple page, brand citrine call-to-action colour, and the page hidden
 * (no event-type list chrome) so it reads as a native booking surface.
 */
export default function CalEmbed({ calLink }: { calLink: string }) {
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const cal = await getCalApi()
      if (cancelled) return
      cal('ui', {
        theme: 'dark',
        hideEventTypeDetails: false,
        cssVarsPerTheme: {
          light: {
            'cal-brand': colors.citrine,
          },
          dark: {
            'cal-brand': colors.citrine,
          },
        },
        layout: 'month_view',
      })
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div
      className="overflow-hidden rounded-xl border"
      style={{
        borderColor: 'rgba(196,174,244,0.18)',
        background: 'rgba(10,6,22,0.4)',
      }}
    >
      <Cal
        calLink={calLink}
        style={{ width: '100%', height: '100%', minHeight: 560, overflow: 'scroll' }}
        config={{ layout: 'month_view', theme: 'dark' }}
      />
    </div>
  )
}
