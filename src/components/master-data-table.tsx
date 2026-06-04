"use client"

import { useState, useMemo, ReactNode } from "react"
import { Input } from "@/components/ui/input"
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table"
import { Search } from "lucide-react"

export interface Column<T> {
  header: string
  accessor: (item: T) => ReactNode
  sortKey?: string
  className?: string
  headerClassName?: string
}

interface MasterDataTableProps<T extends { id: string }> {
  data: T[]
  columns: Column<T>[]
  searchFields?: (keyof T)[]
  searchPlaceholder?: string
  showRowNumber?: boolean
}

export function MasterDataTable<T extends { id: string }>({
  data,
  columns,
  searchFields,
  searchPlaceholder = "Cari...",
  showRowNumber = true,
}: MasterDataTableProps<T>) {
  const [query, setQuery] = useState("")
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")

  const filtered = useMemo(() => {
    if (!query || !searchFields || searchFields.length === 0) return data
    const q = query.toLowerCase()
    return data.filter((item) =>
      searchFields.some((field) => String(item[field] ?? "").toLowerCase().includes(q)),
    )
  }, [data, query, searchFields])

  const sorted = useMemo(() => {
    if (!sortKey) return filtered
    return [...filtered].sort((a, b) => {
      const aRaw = a[sortKey as keyof T]
      const bRaw = b[sortKey as keyof T]
      if (typeof aRaw === "number" && typeof bRaw === "number") {
        return sortDir === "asc" ? aRaw - bRaw : bRaw - aRaw
      }
      const aVal = String(aRaw ?? "")
      const bVal = String(bRaw ?? "")
      return sortDir === "asc" ? aVal.localeCompare(bVal, "id") : bVal.localeCompare(aVal, "id")
    })
  }, [filtered, sortKey, sortDir])

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else { setSortKey(key); setSortDir("asc") }
  }

  return (
    <div className="space-y-4">
      {searchFields && searchFields.length > 0 && (
        <div className="flex items-center gap-4">
          <div className="relative max-w-sm flex-1" data-tour="barang-search">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          {query && (
            <div className="text-xs text-muted-foreground shrink-0">
              {sorted.length} dari {data.length}
            </div>
          )}
        </div>
      )}
      <div className="bg-card rounded-lg border overflow-hidden" data-tour="barang-table">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {showRowNumber && (
                  <TableHead className="w-12 text-xs">#</TableHead>
                )}
                {columns.map((col, idx) => (
                  <TableHead
                    key={idx}
                    className={`${col.sortKey ? "cursor-pointer select-none hover:text-primary" : ""} ${col.headerClassName ?? ""}`}
                    onClick={col.sortKey ? () => toggleSort(col.sortKey!) : undefined}
                  >
                    <div className="flex items-center gap-1">
                      {col.header}
                      {col.sortKey && sortKey === col.sortKey && (
                        <span className="text-xs">{sortDir === "asc" ? "\u2191" : "\u2193"}</span>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((item, i) => (
                <TableRow key={item.id}>
                  {showRowNumber && (
                    <TableCell className="text-muted-foreground text-xs w-12">{i + 1}</TableCell>
                  )}
                  {columns.map((col, idx) => (
                    <TableCell key={idx} className={col.className}>
                      {col.accessor(item)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
