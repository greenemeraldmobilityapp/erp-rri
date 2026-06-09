"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Inbox, Send, FileText, Trash2, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/db/client"
import { Button } from "@/components/ui/button"

const tabs = [
  { href: "/dashboard/email/inbox", label: "Inbox", icon: Inbox },
  { href: "/dashboard/email/sent", label: "Sent", icon: Send },
  { href: "/dashboard/email/trash", label: "Trash", icon: Trash2 },
  { href: "/dashboard/email/templates", label: "Templates", icon: FileText },
]

function isActive(href: string, pathname: string) {
  if (href === "/dashboard/email/inbox") return pathname === href || pathname === "/dashboard/email"
  return pathname === href || pathname.startsWith(href + "/")
}

export function EmailTabs() {
  const pathname = usePathname()
  const [unreadCount, setUnreadCount] = useState(0)
  const [trashCount, setTrashCount] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  const fetchCounts = () => {
    Promise.all([
      supabase
        .from("email_log")
        .select("*", { count: "exact", head: true })
        .eq("inbound", true)
        .is("opened_at", null),
      supabase
        .from("email_log")
        .select("*", { count: "exact", head: true })
        .eq("status", "trashed"),
    ]).then(([{ count: unread }, { count: trashed }]) => {
      if (unread !== null) setUnreadCount(unread)
      if (trashed !== null) setTrashCount(trashed)
    })
  }

  useEffect(() => {
    fetchCounts()
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchCounts()
    setTimeout(() => setRefreshing(false), 500)
  }

  return (
    <div className="flex items-center justify-between border-b border-border">
      <div className="flex overflow-x-auto">
        {tabs.map((tab) => {
          const active = isActive(tab.href, pathname)
          const count =
            tab.href === "/dashboard/email/inbox"
              ? unreadCount
              :               tab.href === "/dashboard/email/trash"
                ? trashCount
                : null

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all duration-200 shrink-0 rounded-t-lg",
                active
                  ? "bg-primary text-primary-foreground shadow-sm animate-tab-pulse"
                  : "text-muted-foreground hover:bg-primary/10 hover:text-primary",
              )}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {count != null && count > 0 && (
                <span
                  className={cn(
                    "inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold leading-none",
                    tab.href === "/dashboard/email/inbox"
                      ? "bg-destructive text-destructive-foreground"
                      : "bg-muted-foreground text-background",
                  )}
                >
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </Link>
          )
        })}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="mr-1 shrink-0 text-muted-foreground hover:text-foreground"
        onClick={handleRefresh}
        disabled={refreshing}
      >
        <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
      </Button>
    </div>
  )
}
