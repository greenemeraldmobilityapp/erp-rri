"use client"

import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/db/client"
import { EmailList, EmailItem, mapEmailLogRow } from "@/components/email/email-list"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

const PAGE_SIZE = 50

export default function SentPage() {
  const [emails, setEmails] = useState<EmailItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const fetchPage = useCallback(async (pageNum: number, append: boolean) => {
    const start = (pageNum - 1) * PAGE_SIZE
    const end = start + PAGE_SIZE - 1

    if (append) setLoadingMore(true)

    const { data, error } = await supabase
      .from("email_log")
      .select("*")
      .in("status", ["sent", "delivered", "opened", "clicked", "bounced", "failed"])
      .neq("status", "trashed")
      .order("created_at", { ascending: false })
      .range(start, end)

    if (!error && data) {
      const mapped = data.map(mapEmailLogRow)
      if (append) {
        setEmails((prev) => [...prev, ...mapped])
      } else {
        setEmails(mapped)
      }
      setHasMore(data.length === PAGE_SIZE)
    }

    if (append) setLoadingMore(false)
    else setLoading(false)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPage(1, false)
  }, [fetchPage])

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchPage(nextPage, true)
  }

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

  return (
    <div>
      <EmailList emails={emails} basePath="/dashboard/email" />

      {hasMore && (
        <div className="flex justify-center py-4 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Memuat...
              </>
            ) : (
              "Muat lebih banyak"
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
