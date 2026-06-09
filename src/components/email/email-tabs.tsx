"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Inbox, Send, FileText, File } from "lucide-react"
import { cn } from "@/lib/utils"

const tabs = [
  { href: "/dashboard/email/inbox", label: "Inbox", icon: Inbox },
  { href: "/dashboard/email/sent", label: "Sent", icon: Send },
  { href: "/dashboard/email/draft", label: "Draft", icon: FileText },
  { href: "/dashboard/email/templates", label: "Templates", icon: File },
]

function isActive(href: string, pathname: string) {
  if (href === "/dashboard/email/inbox") return pathname === href || pathname === "/dashboard/email"
  return pathname === href || pathname.startsWith(href + "/")
}

export function EmailTabs() {
  const pathname = usePathname()

  return (
    <div className="flex border-b border-border overflow-x-auto">
      {tabs.map((tab) => {
        const active = isActive(tab.href, pathname)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors shrink-0",
              active
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </Link>
        )
      })}
    </div>
  )
}
