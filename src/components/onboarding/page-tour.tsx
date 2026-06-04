"use client"

import { useState, useCallback, useEffect, type ReactNode } from 'react'
import dynamic from 'next/dynamic'
import type { Step, EventHandler } from 'react-joyride'
import { HelpCircle } from 'lucide-react'

const Joyride = dynamic(() => import('react-joyride').then(m => ({ default: m.Joyride })), { ssr: false })

interface PageTourProps {
  pageKey: string
  steps: Step[]
  autoShow?: boolean
  children?: ReactNode
}

export function PageTour({ pageKey, steps, autoShow = true, children }: PageTourProps) {
  const [run, setRun] = useState(false)

  useEffect(() => {
    if (autoShow && typeof window !== 'undefined') {
      const done = localStorage.getItem(`tour_${pageKey}_done`)
      if (done !== 'true') {
        const timer = setTimeout(() => setRun(true), 600)
        return () => clearTimeout(timer)
      }
    }
  }, [autoShow, pageKey])

  const handleEvent = useCallback<EventHandler>((data) => {
    if (data.status === 'finished' || data.status === 'skipped') {
      setRun(false)
      localStorage.setItem(`tour_${pageKey}_done`, 'true')
    }
  }, [pageKey])

  const start = () => setRun(true)

  return (
    <>
      <Joyride
        steps={steps}
        run={run}
        continuous
        onEvent={handleEvent}
        options={{
          showProgress: true,
          buttons: ['back', 'primary', 'skip'],
          spotlightPadding: 8,
        }}
        locale={{
          back: 'Kembali',
          last: 'Selesai',
          next: 'Lanjut',
          skip: 'Lewati',
        }}
        styles={{
          arrow: { color: 'var(--card)' },
          buttonPrimary: {
            backgroundColor: 'var(--primary)',
            color: 'var(--primary-foreground)',
            borderRadius: '8px',
            fontSize: '14px',
            padding: '8px 16px',
          },
          buttonBack: {
            color: 'var(--muted-foreground)',
            fontSize: '14px',
          },
          buttonSkip: {
            color: 'var(--muted-foreground)',
            fontSize: '14px',
          },
          overlay: { backgroundColor: 'rgba(0,0,0,0.5)' },
          tooltipContainer: { textAlign: 'left' },
          tooltip: {
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
            borderRadius: '12px',
            padding: '20px',
          },
          tooltipContent: {
            color: 'var(--foreground)',
            fontSize: '14px',
            lineHeight: '1.6',
          },
          tooltipTitle: {
            color: 'var(--foreground)',
            fontSize: '18px',
            fontWeight: 600,
          },
        }}
      />
      {children ? (
        <span onClick={start}>{children}</span>
      ) : (
        <button
          onClick={start}
          className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-input bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          title="Panduan Halaman"
        >
          <HelpCircle className="h-4 w-4" />
        </button>
      )}
    </>
  )
}
