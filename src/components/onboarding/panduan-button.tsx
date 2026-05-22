'use client'

import { HelpCircle } from 'lucide-react'
import { useOnboarding } from './onboarding-provider'

export function PanduanButton() {
  const { startTour } = useOnboarding()

  return (
    <button
      onClick={startTour}
      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
      title="Panduan ERP RRI"
    >
      <HelpCircle className="h-4 w-4" />
      Panduan
    </button>
  )
}
