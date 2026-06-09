"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from "react"

export interface ComposeData {
  toEmail?: string
  toNama?: string
  cc?: string
  bcc?: string
  subject?: string
  body?: string
  replyType?: "reply" | "replyAll" | "forward"
}

interface EmailContextType {
  composeOpen: boolean
  composeData: ComposeData | undefined
  openCompose: (data?: ComposeData) => void
  closeCompose: () => void
}

const EmailContext = createContext<EmailContextType | undefined>(undefined)

export function EmailProvider({ children }: { children: ReactNode }) {
  const [composeOpen, setComposeOpen] = useState(false)
  const [composeData, setComposeData] = useState<ComposeData | undefined>()

  const openCompose = useCallback((data?: ComposeData) => {
    setComposeData(data)
    setComposeOpen(true)
  }, [])

  const closeCompose = useCallback(() => {
    setComposeOpen(false)
    setComposeData(undefined)
  }, [])

  return (
    <EmailContext.Provider value={{ composeOpen, composeData, openCompose, closeCompose }}>
      {children}
    </EmailContext.Provider>
  )
}

export function useEmail() {
  const ctx = useContext(EmailContext)
  if (!ctx) throw new Error("useEmail must be used within EmailProvider")
  return ctx
}
