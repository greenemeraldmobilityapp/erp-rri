"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/db/client"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  ArrowLeft,
  Reply,
  ReplyAll,
  Forward,
  Trash2,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertCircle,
  Paperclip,
  Download,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { useEmail } from "@/components/email/email-context"
import { toast } from "sonner"
import { getAuthToken } from "@/lib/api/client"

interface EmailDetail {
  id: string
  messageId?: string | null
  fromEmail?: string | null
  fromNama?: string | null
  toEmail: string
  toNama?: string | null
  cc?: string | null
  subject: string
  body?: string | null
  status: string
  errorMessage?: string | null
  hasAttachments?: boolean | null
  createdAt: string
  deliveredAt?: string | null
  openedAt?: string | null
  clickedAt?: string | null
  inbound?: boolean | null
  threadId?: string | null
}

interface EmailAttachment {
  id: string
  fileName: string
  fileUrl: string
  fileSize: number | null
  mimeType: string | null
}

const statusConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  sent: { label: "Sent", icon: <Clock className="h-3 w-3" />, color: "text-muted-foreground" },
  delivered: { label: "Delivered", icon: <CheckCircle2 className="h-3 w-3" />, color: "text-success" },
  opened: { label: "Opened", icon: <CheckCircle2 className="h-3 w-3" />, color: "text-primary" },
  clicked: { label: "Clicked", icon: <CheckCircle2 className="h-3 w-3" />, color: "text-primary" },
  bounced: { label: "Bounced", icon: <AlertCircle className="h-3 w-3" />, color: "text-destructive" },
  failed: { label: "Failed", icon: <AlertCircle className="h-3 w-3" />, color: "text-destructive" },
  trashed: { label: "Trash", icon: <Trash2 className="h-3 w-3" />, color: "text-muted-foreground" },
}

function formatBytes(bytes: number | null | undefined): string {
  if (!bytes) return ""
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function mapEmailDetail(row: Record<string, unknown>): EmailDetail {
  return {
    id: row.id as string,
    messageId: row.message_id as string | null | undefined,
    fromEmail: row.from_email as string | null | undefined,
    fromNama: row.from_nama as string | null | undefined,
    toEmail: row.to_email as string,
    toNama: row.to_nama as string | null | undefined,
    cc: row.cc as string | null | undefined,
    subject: row.subject as string,
    body: row.body as string | null | undefined,
    status: row.status as string,
    errorMessage: row.error_message as string | null | undefined,
    hasAttachments: row.has_attachments as boolean | null | undefined,
    createdAt: row.created_at as string,
    deliveredAt: row.delivered_at as string | null | undefined,
    openedAt: row.opened_at as string | null | undefined,
    clickedAt: row.clicked_at as string | null | undefined,
    inbound: row.inbound as boolean | null | undefined,
    threadId: row.thread_id as string | null | undefined,
  }
}

function formatDateTime(dateStr: string | null | undefined) {
  if (!dateStr) return ""
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ""
  return format(date, "dd MMM yyyy, HH:mm", { locale: idLocale })
}

function formatTrackingTime(dateStr: string | null | undefined) {
  if (!dateStr) return ""
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ""
  return format(date, "dd MMM HH:mm", { locale: idLocale })
}

function extractEmails(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined
  const matches = raw.match(/[^\s,<>]+@[^\s,<>]+/g)
  return matches ? matches.join(", ") : undefined
}

function quoteBody(body: string | null | undefined): string {
  if (!body) return ""
  const stripped = body.replace(/<[^>]*>/g, "")
  return stripped
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n")
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
  ]
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

function AvatarCircle({ name, email }: { name?: string | null; email?: string | null }) {
  const seed = name || email || "?"
  return (
    <div
      className={cn(
        "w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0",
        getAvatarColor(seed),
      )}
    >
      {getInitials(name, email)}
    </div>
  )
}

import { cn } from "@/lib/utils"

export default function EmailDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { openCompose } = useEmail()
  const [email, setEmail] = useState<EmailDetail | null>(null)
  const [threadEmails, setThreadEmails] = useState<EmailDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [trashOpen, setTrashOpen] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [purgeOpen, setPurgeOpen] = useState(false)
  const [purging, setPurging] = useState(false)
  const [trashing, setTrashing] = useState(false)
  const [attachmentsMap, setAttachmentsMap] = useState<Record<string, EmailAttachment[]>>({})
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [collapsedEmails, setCollapsedEmails] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!params.id) return
    supabase
      .from("email_log")
      .select("*")
      .eq("id", params.id)
      .single()
      .then(async ({ data, error }) => {
        if (!error && data) {
          const email = mapEmailDetail(data)
          setEmail(email)

          // Fetch all emails in same thread
          let threadData: EmailDetail[] = [email]
          if (email.threadId) {
            const { data: siblings } = await supabase
              .from("email_log")
              .select("*")
              .eq("thread_id", email.threadId)
              .order("created_at", { ascending: true })
            if (siblings) {
              threadData = siblings.map(mapEmailDetail)
            }
          }
          setThreadEmails(threadData)

          // Fetch attachments for all thread emails
          const threadIds = threadData.map((e) => e.id)
          if (threadIds.length > 0) {
            const { data: attData } = await supabase
              .from("email_attachments")
              .select("id, email_id, file_name, file_url, file_size, mime_type")
              .in("email_id", threadIds)
            if (attData) {
              const map: Record<string, EmailAttachment[]> = {}
              for (const att of attData) {
                const eid = att.email_id as string
                if (!map[eid]) map[eid] = []
                map[eid].push({
                  id: att.id as string,
                  fileName: (att.file_name ?? "") as string,
                  fileUrl: (att.file_url ?? "") as string,
                  fileSize: (att.file_size ?? null) as number | null,
                  mimeType: (att.mime_type ?? null) as string | null,
                })
              }
              setAttachmentsMap(map)
            }
          }
        }
        setLoading(false)
      })
  }, [params.id])

  const handleReply = (email: EmailDetail) => {
    openCompose({
      toEmail: email.inbound ? (email.fromEmail || email.toEmail) : email.toEmail,
      toNama: email.inbound ? (email.fromNama || undefined) : (email.toNama || undefined),
      cc: extractEmails(email.cc),
      subject: `Re: ${email.subject}`,
      body: `\n\n${quoteBody(email.body)}`,
      replyType: "reply",
      referenceId: email.messageId || undefined,
      referenceType: "reply",
    })
  }

  const handleReplyAll = (email: EmailDetail) => {
    openCompose({
      toEmail: email.inbound ? (email.fromEmail || email.toEmail) : email.toEmail,
      toNama: email.inbound ? (email.fromNama || undefined) : (email.toNama || undefined),
      cc: extractEmails(email.cc),
      subject: `Re: ${email.subject}`,
      body: `\n\n${quoteBody(email.body)}`,
      replyType: "replyAll",
      referenceId: email.messageId || undefined,
      referenceType: "reply",
    })
  }

  const handleForward = (email: EmailDetail) => {
    openCompose({
      subject: `Fwd: ${email.subject}`,
      body: `\n\n---------- Forwarded message ----------\nFrom: ${email.fromNama || email.fromEmail}\nDate: ${formatDateTime(email.createdAt)}\nSubject: ${email.subject}\n\n${quoteBody(email.body)}`,
      replyType: "forward",
      referenceId: email.messageId || undefined,
      referenceType: "forward",
    })
  }

  const handleTrash = async () => {
    if (!email) return
    setTrashing(true)
    const toastId = toast.loading("Memindahkan ke Trash...")
    try {
      const token = await getAuthToken()
      if (!token) throw new Error("Not authenticated")
      const res = await fetch(`/api/v1/email/${email.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Gagal memindahkan ke Trash")
      }
      toast.success("Email dipindahkan ke Trash", { id: toastId })
      setTrashOpen(false)
      router.back()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memindahkan ke Trash", { id: toastId })
    } finally {
      setTrashing(false)
    }
  }

  const handleRestore = async () => {
    if (!email) return
    setRestoring(true)
    const toastId = toast.loading("Mengembalikan email...")
    try {
      const token = await getAuthToken()
      if (!token) throw new Error("Not authenticated")
      const res = await fetch(`/api/v1/email/${email.id}/restore`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Gagal mengembalikan email")
      }
      toast.success("Email dikembalikan ke Inbox", { id: toastId })
      setEmail({ ...email, status: "sent" })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengembalikan email", { id: toastId })
    } finally {
      setRestoring(false)
    }
  }

  const handlePurge = async () => {
    if (!email) return
    setPurging(true)
    const toastId = toast.loading("Menghapus permanen...")
    try {
      const token = await getAuthToken()
      if (!token) throw new Error("Not authenticated")
      const res = await fetch(`/api/v1/email/${email.id}/purge`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Gagal menghapus email")
      }
      toast.success("Email dihapus permanen", { id: toastId })
      setPurgeOpen(false)
      router.back()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus email", { id: toastId })
    } finally {
      setPurging(false)
    }
  }

  const handleDownloadAttachment = async (attachment: EmailAttachment) => {
    setDownloadingId(attachment.id)
    const toastId = toast.loading("Mengunduh lampiran...")
    try {
      const token = await getAuthToken()
      if (!token) throw new Error("Not authenticated")
      const res = await fetch(`/api/v1/email/attachments/${attachment.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Gagal mengunduh lampiran")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = window.document.createElement("a")
      a.href = url
      a.download = attachment.fileName
      window.document.body.appendChild(a)
      a.click()
      window.document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success("Lampiran diunduh", { id: toastId })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengunduh lampiran", { id: toastId })
    } finally {
      setDownloadingId(null)
    }
  }

  const toggleCollapse = (id: string) => {
    setCollapsedEmails((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (!email) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Email tidak ditemukan</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          Kembali
        </Button>
      </div>
    )
  }

  const isTrashed = email.status === "trashed"
  const latestEmail = threadEmails[threadEmails.length - 1]
  const latestConfig = statusConfig[latestEmail?.status ?? email.status] ?? {
    label: email.status,
    icon: null,
    color: "text-muted-foreground",
  }

  const trackingEvents: { status: string; time?: string | null }[] = [
    { status: "sent", time: email.createdAt },
    { status: "delivered", time: email.deliveredAt },
    { status: "opened", time: email.openedAt },
    { status: "clicked", time: email.clickedAt },
  ].filter((e) => e.time)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="-ml-2">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {threadEmails.length > 1 && (
            <span className="flex items-center gap-1">
              {threadEmails.length} emails in this conversation
            </span>
          )}
        </div>
      </div>

      {/* Thread conversation */}
      <div className="space-y-4">
        {threadEmails.map((emailItem, idx) => {
          const isLatest = idx === threadEmails.length - 1
          const isCurrentEmail = emailItem.id === email.id
          const isCollapsed = collapsedEmails.has(emailItem.id)
          const atts = attachmentsMap[emailItem.id] || []

          return (
            <div
              key={emailItem.id}
              className={cn(
                "border rounded-lg transition-colors",
                isCurrentEmail
                  ? "border-primary/30 bg-primary/[0.02]"
                  : "border-border bg-card",
              )}
            >
              {/* Header row: avatar + metadata + collapse */}
              <div
                className="flex items-start gap-3 p-4 cursor-pointer select-none"
                onClick={() => toggleCollapse(emailItem.id)}
              >
                <AvatarCircle
                  name={emailItem.inbound ? emailItem.fromNama : emailItem.toNama}
                  email={emailItem.inbound ? emailItem.fromEmail : emailItem.toEmail}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-heading font-semibold text-sm text-foreground">
                      {emailItem.inbound
                        ? (emailItem.fromNama || emailItem.fromEmail)
                        : (emailItem.toNama || emailItem.toEmail)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {emailItem.inbound ? "to" : "from"}{" "}
                      {emailItem.inbound ? emailItem.toEmail : (emailItem.fromEmail || emailItem.toEmail)}
                    </span>
                    <Badge
                      variant={statusVariant[emailItem.status] ?? "outline"}
                      className="text-[10px] px-1.5 py-0"
                    >
                      {emailItem.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span>{formatDateTime(emailItem.createdAt)}</span>
                    {emailItem.cc && <span>CC: {emailItem.cc}</span>}
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0">
                  {isCollapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
                </Button>
              </div>

              {/* Body + attachments */}
              {!isCollapsed && (
                <div className="px-4 pb-4 space-y-3">
                  {emailItem.body && (
                    <div className="border-t border-border pt-3">
                      <div
                        className="text-sm leading-relaxed text-foreground prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: emailItem.body }}
                      />
                    </div>
                  )}

                  {atts.length > 0 && (
                    <div className="border-t border-border pt-3 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <Paperclip className="h-3 w-3" />
                        Lampiran ({atts.length})
                      </div>
                      {atts.map((att) => (
                        <div
                          key={att.id}
                          className="flex items-center justify-between px-3 py-2 bg-muted/30 border border-border rounded-md text-sm"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Paperclip className="h-3 w-3 text-muted-foreground shrink-0" />
                            <div className="min-w-0">
                              <p className="truncate text-foreground font-medium">{att.fileName}</p>
                              {att.fileSize && (
                                <p className="text-muted-foreground text-xs">{formatBytes(att.fileSize)}</p>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="shrink-0 ml-2 h-8 w-8 p-0"
                            onClick={() => handleDownloadAttachment(att)}
                            disabled={downloadingId === att.id}
                            title="Unduh lampiran"
                          >
                            {downloadingId === att.id ? (
                              <span className="h-3 w-3 animate-spin rounded-full border border-muted-foreground border-t-foreground" />
                            ) : (
                              <Download className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action buttons per email */}
                  {!isTrashed && (
                    <div className="border-t border-border pt-3 flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleReply(emailItem)}>
                        <Reply className="mr-1 h-3.5 w-3.5" /> Reply
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleReplyAll(emailItem)}>
                        <ReplyAll className="mr-1 h-3.5 w-3.5" /> Reply All
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleForward(emailItem)}>
                        <Forward className="mr-1 h-3.5 w-3.5" /> Forward
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Tracking timeline for latest email */}
      {trackingEvents.length > 0 && !isTrashed && latestEmail?.id === email.id && (
        <div className="border border-border rounded-lg p-4 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tracking</h3>
          <div className="space-y-2">
            {trackingEvents.map((event, i) => {
              const cfg = statusConfig[event.status]
              return (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-1.5">
                    <span className={cfg?.color || "text-muted-foreground"}>{cfg?.icon}</span>
                    <span className="font-medium text-foreground">{cfg?.label || event.status}</span>
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {formatTrackingTime(event.time)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Section-wide actions */}
      {!isTrashed && (
        <div className="flex gap-2 border-t border-border pt-4">
          <Button variant="outline" size="sm" className="text-muted-foreground hover:text-foreground" onClick={() => setTrashOpen(true)}>
            <Trash2 className="mr-1 h-4 w-4" /> Move to Trash
          </Button>
        </div>
      )}

      {isTrashed && (
        <div className="flex gap-2 border-t border-border pt-4">
          <Button variant="ghost" size="sm" onClick={handleRestore} disabled={restoring}>
            <RotateCcw className="mr-1 h-4 w-4" />
            {restoring ? "Mengembalikan..." : "Restore"}
          </Button>
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setPurgeOpen(true)}>
            <Trash2 className="mr-1 h-4 w-4" /> Delete Permanently
          </Button>
        </div>
      )}

      <AlertDialog open={trashOpen} onOpenChange={setTrashOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pindahkan ke Trash?</AlertDialogTitle>
            <AlertDialogDescription>
              Email akan dipindahkan ke Trash. Kamu bisa mengembalikannya kapan saja.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={trashing}>Batal</AlertDialogCancel>
            <AlertDialogAction disabled={trashing} onClick={handleTrash}>
              {trashing ? "Memindahkan..." : "Trash"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={purgeOpen} onOpenChange={setPurgeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Permanen?</AlertDialogTitle>
            <AlertDialogDescription>
              Email ini akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={purging}>Batal</AlertDialogCancel>
            <AlertDialogAction disabled={purging} onClick={handlePurge}>
              {purging ? "Menghapus..." : "Hapus Permanen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  sent: "default",
  delivered: "default",
  opened: "default",
  failed: "destructive",
  bounced: "destructive",
  trashed: "outline",
}
