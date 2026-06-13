"use client"

import { useState } from "react"
import { Search, RotateCcw } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface BarangFilterValues {
  search: string
  kategori_id: string
  status: string
  kontrak: string
  satuan: string
  nama_kontrak: string
}

interface FilterOptions {
  categories: { id: string; nama: string }[]
  satuanList: string[]
  namaKontrakList: string[]
}

interface BarangFilterProps {
  options: FilterOptions
  values: BarangFilterValues
  onChange: (values: BarangFilterValues) => void
}

const defaultValues: BarangFilterValues = {
  search: "",
  kategori_id: "__all__",
  status: "all",
  kontrak: "all",
  satuan: "__all__",
  nama_kontrak: "__all__",
}

export function BarangFilter({ options, values, onChange }: BarangFilterProps) {
  const [local, setLocal] = useState<BarangFilterValues>(values)

  const update = (partial: Partial<BarangFilterValues>) => {
    setLocal((prev) => ({ ...prev, ...partial }))
  }

  const apply = () => {
    onChange(local)
  }

  const reset = () => {
    setLocal(defaultValues)
    onChange(defaultValues)
  }

  const hasActive = local.search || local.kategori_id !== "__all__" || local.status !== "all" || local.kontrak !== "all" || local.satuan !== "__all__" || local.nama_kontrak !== "__all__"

  return (
    <div className="flex flex-wrap items-end gap-3 mb-4">
      <div className="relative max-w-xs flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari nama/kode barang..."
          value={local.search}
          onChange={(e) => update({ search: e.target.value })}
          onKeyDown={(e) => { if (e.key === "Enter") apply() }}
          className="pl-9"
        />
      </div>

      <div className="w-[180px]">
        <Select value={local.kategori_id} onValueChange={(v) => update({ kategori_id: v })}>
          <SelectTrigger>
            <SelectValue placeholder="Semua Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Semua Kategori</SelectItem>
            {options.categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.nama}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-[140px]">
        <Select value={local.status} onValueChange={(v) => update({ status: v })}>
          <SelectTrigger>
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="active">Aktif</SelectItem>
            <SelectItem value="non-active">Non-Aktif</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="w-[160px]">
        <Select value={local.kontrak} onValueChange={(v) => update({ kontrak: v })}>
          <SelectTrigger>
            <SelectValue placeholder="Semua Kontrak" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kontrak</SelectItem>
            <SelectItem value="has">Ada Kontrak</SelectItem>
            <SelectItem value="none">Tanpa Kontrak</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="w-[150px]">
        <Select value={local.satuan} onValueChange={(v) => update({ satuan: v })}>
          <SelectTrigger>
            <SelectValue placeholder="Semua Satuan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Semua Satuan</SelectItem>
            {options.satuanList.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-[200px]">
        <Select value={local.nama_kontrak} onValueChange={(v) => update({ nama_kontrak: v })}>
          <SelectTrigger>
            <SelectValue placeholder="Semua Nama Kontrak" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Semua Nama Kontrak</SelectItem>
            {options.namaKontrakList.map((n) => (
              <SelectItem key={n} value={n}>{n}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button onClick={apply} size="sm">Terapkan</Button>

      {hasActive && (
        <Button variant="ghost" size="sm" onClick={reset} className="gap-1">
          <RotateCcw className="h-3 w-3" /> Reset
        </Button>
      )}
    </div>
  )
}
