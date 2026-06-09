"use client"

import { ReactNode, useState } from "react"
import { PageHeader } from "@/components/page-header"
import { EmailTabs } from "@/components/email/email-tabs"
import { EmailComposeSheet } from "@/components/email/email-compose-sheet"
import { EmailProvider, useEmail } from "@/components/email/email-context"
import { Button } from "@/components/ui/button"
import { Pencil } from "lucide-react"

function EmailLayoutInner({ children }: { children: ReactNode }) {
  const { composeOpen, composeData, closeCompose, openCompose } = useEmail()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Mail Center" description="Surat elektronik terpusat RRI" />
        <Button
          onClick={() => openCompose()}
          className="bg-gradient-to-b from-[#0000FF] to-[#0000D9] shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_1px_2px_rgba(0,0,0,0.1)] hover:opacity-95"
        >
          <Pencil className="mr-2 h-4 w-4" />
          Compose
        </Button>
      </div>

      <EmailTabs />

      <div className="bg-card border border-border rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        {children}
      </div>

      <EmailComposeSheet
        open={composeOpen}
        onOpenChange={(open) => (open ? openCompose() : closeCompose())}
        initialData={composeData}
      />
    </div>
  )
}

export default function EmailLayout({ children }: { children: ReactNode }) {
  return (
    <EmailProvider>
      <EmailLayoutInner>{children}</EmailLayoutInner>
    </EmailProvider>
  )
}
