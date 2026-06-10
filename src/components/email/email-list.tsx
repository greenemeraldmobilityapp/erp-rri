"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { Paperclip, InboxIcon, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

export interface EmailItem {
  id: string
  fromEmail?: string | null
  fromNama?: string | null
  toEmail: string
  toNama?: string | null
  cc?: string | null
  subject: string
  body?: string | null
  status: string
  hasAttachments?: boolean | null
  createdAt: string
  deliveredAt?: string | null
  openedAt?: string | null
  clickedAt?: string | null
  inbound?: boolean | null
  threadId?: string | null
}

export function mapEmailLogRow(row: Record<string, unknown>): EmailItem {
  return {
    id: row.id as string,
    fromEmail: row.from_email as string | null | undefined,
    fromNama: row.from_nama as string | null | undefined,
    toEmail: row.to_email as string,
    toNama: row.to_nama as string | null | undefined,
    cc: row.cc as string | null | undefined,
    subject: row.subject as string,
    body: row.body as string | null | undefined,
    status: row.status as string,
    hasAttachments: row.has_attachments as boolean | null | undefined,
    createdAt: row.created_at as string,
    deliveredAt: row.delivered_at as string | null | undefined,
    openedAt: row.opened_at as string | null | undefined,
    clickedAt: row.clicked_at as string | null | undefined,
    inbound: row.inbound as boolean | null | undefined,
    threadId: row.thread_id as string | null | undefined,
  }
}

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  sent: "default",
  delivered: "default",
  opened: "default",
  failed: "destructive",
  bounced: "destructive",
  trashed: "outline",
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return ""
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ""
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return format(date, "HH:mm")
  if (days < 7) return format(date, "EEE", { locale: id })
  return format(date, "dd/MM/yy")
}

function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return parts[0][0].toUpperCase()
  }
  return (email?.[0] ?? "?").toUpperCase()
}

function getAvatarColor(seed: string): string {
  const colors = [
    "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
    "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
    "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
    "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  ]
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

function AvatarCircle({ name, email, className }: { name?: string | null; email?: string | null; className?: string }) {
  const seed = name || email || "?"
  return (
    <div
      className={cn(
        "w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0",
        getAvatarColor(seed),
        className,
      )}
    >
      {getInitials(name, email)}
    </div>
  )
}

interface ThreadGroup {
  threadId: string
  emails: EmailItem[]
}

function groupThreads(emails: EmailItem[]): ThreadGroup[] {
  const map = new Map<string, EmailItem[]>()
  for (const email of emails) {
    const tid = email.threadId || email.id
    if (!map.has(tid)) map.set(tid, [])
    map.get(tid)!.push(email)
  }
  return Array.from(map.entries())
    .map(([threadId, items]) => ({
      threadId,
      emails: items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    }))
    .sort((a, b) => {
      const aLatest = new Date(a.emails[a.emails.length - 1].createdAt).getTime()
      const bLatest = new Date(b.emails[b.emails.length - 1].createdAt).getTime()
      return bLatest - aLatest
    })
}

function EmailThreadRow({ thread, path }: { thread: ThreadGroup; path: string }) {
  const pathname = usePathname()
  const latest = thread.emails[thread.emails.length - 1]
  const isUnread = thread.emails.some((e) => e.status === "sent")
  const isCurrent = pathname === `${path}/${latest.id}`

  return (
    <Link
      key={thread.threadId}
      href={`${path}/${latest.id}`}
      className={cn(
        "flex items-center gap-3 px-4 py-3 transition-colors duration-200 hover:bg-muted/40 cursor-pointer",
        isCurrent && "bg-primary/5 border-l-2 border-primary",
      )}
    >
      <AvatarCircle name={latest.fromNama || latest.toNama} email={latest.fromEmail || latest.toEmail} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "truncate text-sm",
              isUnread
                ? "font-heading font-semibold text-foreground"
                : "font-heading font-medium text-foreground",
            )}
          >
            {latest.inbound
              ? (latest.fromNama || latest.fromEmail || latest.toEmail)
              : (latest.toNama || latest.toEmail)}
          </span>
          {latest.hasAttachments && <Paperclip className="h-3 w-3 shrink-0 text-muted-foreground" />}
          {thread.emails.length > 1 && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
              <MessageSquare className="h-3 w-3" />
              {thread.emails.length}
            </span>
          )}
        </div>
        <p
          className={cn(
            "truncate text-sm",
            isUnread ? "font-medium text-foreground" : "text-muted-foreground",
          )}
        >
          {latest.subject}
        </p>
        <p className="truncate text-sm text-muted-foreground">
          {latest.body?.replace(/<[^>]*>/g, "").slice(0, 100) || ""}
        </p>
        {latest.cc && (
          <p className="truncate text-xs text-muted-foreground/70">CC: {latest.cc}</p>
        )}
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {formatDate(latest.createdAt)}
        </span>
        <Badge variant={statusVariant[latest.status] ?? "outline"} className="text-[10px] px-1.5 py-0">
          {latest.status}
        </Badge>
      </div>
    </Link>
  )
}

export function EmailList({
  emails,
  basePath,
}: {
  emails: EmailItem[]
  basePath?: string
}) {
  const path = basePath ?? "/dashboard/email"

  if (emails.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed rounded-lg bg-muted/20">
        <InboxIcon className="mx-auto h-8 w-8 text-muted-foreground/60 mb-2" />
        <p className="text-sm font-medium text-muted-foreground">Tidak ada email</p>
      </div>
    )
  }

  const threads = groupThreads(emails)

  return (
    <div className="divide-y divide-border">
      {threads.map((thread) => (
        <EmailThreadRow key={thread.threadId} thread={thread} path={path} />
      ))}
    </div>
  )
}
