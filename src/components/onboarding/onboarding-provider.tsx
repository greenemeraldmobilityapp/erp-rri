'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/db/client'
import { tourSteps } from './tour-steps'
import type { EventData } from 'react-joyride'

const Joyride = dynamic(() => import('react-joyride').then(m => ({ default: m.Joyride })), { ssr: false })

const STORAGE_KEY = 'erp_rri_onboarding_done'

type OnboardingContext = {
  startTour: () => void
}

const Ctx = createContext<OnboardingContext>({ startTour: () => {} })

export const useOnboarding = () => useContext(Ctx)

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [showWelcome, setShowWelcome] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(STORAGE_KEY) !== 'true'
  })
  const [runTour, setRunTour] = useState(false)

  const handleWelcomeStart = async () => {
    setShowWelcome(false)
    setRunTour(true)
  }

  const handleWelcomeSkip = () => {
    setShowWelcome(false)
    localStorage.setItem(STORAGE_KEY, 'true')
    markDone()
  }

  const markDone = useCallback(async () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.id) {
        await supabase.from('users').update({ onboarding_disabled: true }).eq('id', session.user.id)
      }
    } catch {}
  }, [])

  const handleJoyrideEvent = useCallback(async (data: EventData) => {
    if (data.status === 'finished' || data.status === 'skipped') {
      setRunTour(false)
      await markDone()
    }
  }, [markDone])

  const startTour = () => {
    setRunTour(true)
  }

  return (
    <Ctx.Provider value={{ startTour }}>
      {showWelcome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-8 text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-3xl font-heading font-bold text-primary">ERP</span>
            </div>
            <div>
              <h2 className="text-2xl font-heading font-bold text-primary">Selamat Datang</h2>
              <p className="text-muted-foreground mt-2">
                ERP RRI — sistem terintegrasi untuk mengelola seluruh bisnis Anda. Ikuti tur singkat untuk mengenali fitur utama.
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={handleWelcomeStart}
                className="w-full bg-primary text-white rounded-lg py-2.5 font-medium hover:bg-primary/90 transition-colors"
              >
                Mulai Tur
              </button>
              <button
                onClick={handleWelcomeSkip}
                className="w-full text-muted-foreground text-sm py-2 hover:text-foreground transition-colors"
              >
                Lewati
              </button>
            </div>
          </div>
        </div>
      )}

      <Joyride
        steps={tourSteps}
        run={runTour}
        continuous
        onEvent={handleJoyrideEvent}
        options={{
          showProgress: true,
          buttons: ['back', 'primary', 'skip'],
        }}
        locale={{
          back: 'Kembali',
          last: 'Selesai',
          next: 'Lanjut',
          skip: 'Lewati',
        }}
        styles={{
          arrow: { color: '#FFFFFF' },
          buttonPrimary: {
            backgroundColor: '#0369A1',
            borderRadius: '8px',
            fontSize: '14px',
            padding: '8px 16px',
          },
          buttonBack: {
            color: '#475569',
            fontSize: '14px',
          },
          buttonSkip: {
            color: '#94a3b8',
            fontSize: '14px',
          },
          overlay: { backgroundColor: 'rgba(0, 0, 0, 0.4)' },
          tooltipContainer: { textAlign: 'left' },
          tooltip: { backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '20px' },
          tooltipContent: { color: '#020617', fontSize: '14px', lineHeight: '1.5' },
          tooltipTitle: { color: '#020617', fontSize: '18px', fontWeight: 600 },
        }}
      />

      {children}
    </Ctx.Provider>
  )
}
