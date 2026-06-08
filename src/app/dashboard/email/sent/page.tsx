"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/db/client"
import { EmailList, EmailItem, mapEmailLogRow } from "@/components/email/email-list"
import { Skeleton } from "@/components/ui/skeleton"

export default function SentPage() {
  const [emails, setEmails] = useState<EmailItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from("email_log")
      .select("*")
      .in("status", ["sent", "delivered", "opened", "clicked", "bounced", "failed"])
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (!error && data) {
          setEmails(data.map(mapEmailLogRow))
        }
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="divide-y divide-border p-4 space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-2 w-2 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>
    )
  }

  return <EmailList emails={emails} basePath="/dashboard/email" />
}
