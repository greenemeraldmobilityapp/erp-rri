"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Inbox, Send, FileText, File, LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface EmailFolder {
  href: string
  label: string
  icon: LucideIcon
  count?: number
}

const folders: EmailFolder[] = [
  { href: "/dashboard/email/inbox", label: "Inbox", icon: Inbox },
  { href: "/dashboard/email/sent", label: "Sent", icon: Send },
  { href: "/dashboard/email/draft", label: "Draft", icon: FileText },
  { href: "/dashboard/email/templates", label: "Templates", icon: File },
]

function isActive(href: string, pathname: string) {
  if (href === "/dashboard/email/inbox") return pathname === href || pathname === "/dashboard/email"
  return pathname === href || pathname.startsWith(href + "/")
}

export function EmailSidebar({ collapsed }: { collapsed?: boolean }) {
  const pathname = usePathname()

  return (
    <nav className={cn("space-y-1", collapsed ? "" : "p-2")}>
      {folders.map((folder) => {
        const active = isActive(folder.href, pathname)
        return (
          <Link
            key={folder.href}
            href={folder.href}
            className={cn(
              "flex items-center px-3 py-2 rounded-md text-sm transition-colors duration-200",
              active
                ? "bg-primary text-primary-foreground font-medium"
                : "text-foreground/80 hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <folder.icon className={cn("h-4 w-4 shrink-0", collapsed ? "" : "mr-3")} />
            {!collapsed && (
              <>
                <span className="flex-1">{folder.label}</span>
                {folder.count != null && (
                  <span className="text-xs font-semibold bg-primary/10 text-primary rounded-full px-2 py-0.5">
                    {folder.count}
                  </span>
                )}
              </>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
