"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { Paperclip } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

export interface EmailItem {
  id: string
  fromEmail?: string | null
  fromNama?: string | null
  toEmail: string
  toNama?: string | null
  subject: string
  body?: string | null
  status: string
  hasAttachments?: boolean | null
  createdAt: string
  deliveredAt?: string | null
  openedAt?: string | null
  clickedAt?: string | null
  inbound?: boolean | null
}

export function mapEmailLogRow(row: Record<string, unknown>): EmailItem {
  return {
    id: row.id as string,
    fromEmail: row.from_email as string | null | undefined,
    fromNama: row.from_nama as string | null | undefined,
    toEmail: row.to_email as string,
    toNama: row.to_nama as string | null | undefined,
    subject: row.subject as string,
    body: row.body as string | null | undefined,
    status: row.status as string,
    hasAttachments: row.has_attachments as boolean | null | undefined,
    createdAt: row.created_at as string,
    deliveredAt: row.delivered_at as string | null | undefined,
    openedAt: row.opened_at as string | null | undefined,
    clickedAt: row.clicked_at as string | null | undefined,
    inbound: row.inbound as boolean | null | undefined,
  }
}

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  sent: "default",
  delivered: "default",
  opened: "default",
  draft: "secondary",
  failed: "destructive",
  bounced: "destructive",
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

export function EmailList({
  emails,
  basePath,
}: {
  emails: EmailItem[]
  basePath?: string
}) {
  const pathname = usePathname()
  const path = basePath ?? "/dashboard/email"

  if (emails.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed rounded-lg bg-muted/20">
        <Inbox className="mx-auto h-8 w-8 text-muted-foreground/60 mb-2" />
        <p className="text-sm font-medium text-muted-foreground">Tidak ada email</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-border">
      {emails.map((email) => {
        const isUnread = email.status === "sent"
        const isCurrent = pathname === `${path}/${email.id}`

        return (
          <Link
            key={email.id}
            href={`${path}/${email.id}`}
            className={cn(
              "flex items-center gap-3 px-4 py-3 transition-colors duration-200 hover:bg-muted/40 cursor-pointer",
              isCurrent && "bg-primary/5 border-l-2 border-primary",
            )}
          >
            {isUnread && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-0.5" />}
            {!isUnread && <span className="w-2 h-2 shrink-0 mt-0.5" />}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "truncate text-sm",
                    isUnread ? "font-heading font-semibold text-foreground" : "font-heading font-medium text-foreground",
                  )}
                >
                  {email.fromNama || email.fromEmail || email.toEmail}
                </span>
                {email.hasAttachments && <Paperclip className="h-3 w-3 shrink-0 text-muted-foreground" />}
              </div>
              <p
                className={cn(
                  "truncate text-sm",
                  isUnread ? "font-medium text-foreground" : "text-muted-foreground",
                )}
              >
                {email.subject}
              </p>
              <p className="truncate text-sm text-muted-foreground">
                {email.body?.replace(/<[^>]*>/g, "").slice(0, 100) || ""}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDate(email.createdAt)}
              </span>
              <Badge variant={statusVariant[email.status] ?? "outline"} className="text-[10px] px-1.5 py-0">
                {email.status}
              </Badge>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

function Inbox(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  )
}
