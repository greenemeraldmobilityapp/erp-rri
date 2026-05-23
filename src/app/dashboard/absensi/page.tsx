"use client"

import Link from 'next/link'
import { supabase } from '@/lib/db/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CalendarSkeleton } from '@/components/ui/skeleton'
import { useState, useEffect } from 'react'
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react'

interface AbsensiRecord {
  id: string
  tanggal: string
  status: string
  keterangan: string | null
  karyawan: {
    nama: string
    nik: string
  } | null
}

const statusColors = {
  hadir: 'success',
  sakit: 'warning',
  izin: 'secondary',
  alpha: 'destructive',
  cuti: 'outline',
} as const

const statusLabels = {
  hadir: 'Hadir',
  sakit: 'Sakit',
  izin: 'Izin',
  alpha: 'Alpha',
  cuti: 'Cuti',
} as const

export default function AbsensiPage() {
  const [data, setData] = useState<AbsensiRecord[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [currentDate, setCurrentDate] = useState<Date>(new Date())

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const { data: absensiData, error: absensiError } = await supabase
          .from('absensi')
          .select('*, karyawan!karyawan_id(nama, nik)')
          .order('tanggal', { ascending: false })

        if (absensiError) throw absensiError
        setData(absensiData ?? [])
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Gagal memuat data absensi')
        setData([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-3xl font-heading font-bold">Absensi</h1><p className="text-muted-foreground mt-1">Catatan kehadiran karyawan</p></div>
          <Button asChild><Link href="/dashboard/absensi/tambah"><Plus className="h-4 w-4 mr-2" />Tambah Absensi</Link></Button>
        </div>
        <CalendarSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-3xl font-heading font-bold">Absensi</h1><p className="text-muted-foreground mt-1">Catatan kehadiran karyawan</p></div>
          <Button asChild><Link href="/dashboard/absensi/tambah"><Plus className="h-4 w-4 mr-2" />Tambah Absensi</Link></Button>
        </div>
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>
      </div>
    )
  }

  // Group absensi by date
  const absensiByDate: Record<string, string[]> = {}
  data.forEach((item) => {
    const date = new Date(item.tanggal)
    const dateString = date.toISOString().split('T')[0] // YYYY-MM-DD
    if (!absensiByDate[dateString]) {
      absensiByDate[dateString] = []
    }
    absensiByDate[dateString].push(item.status)
  })

  // Get current month and year
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth() // 0-11

  // First day of the month
  const firstDay = new Date(year, month, 1)
  // Last day of the month
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()

  // Day of week for the first day (0 = Sunday, 1 = Monday, etc.)
  const startingDay = firstDay.getDay()

  // Weeks in the month (for calendar grid)
  const weeks: number[][] = []
  let week: number[] = []

  // Add empty cells for days before the 1st
  for (let i = 0; i < startingDay; i++) {
    week.push(0) // 0 represents empty cell
  }

  // Fill days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    week.push(day)
    if (week.length === 7) {
      weeks.push(week)
      week = []
    }
  }

  // Add empty cells for the last week
  if (week.length > 0) {
    while (week.length < 7) {
      week.push(0)
    }
    weeks.push(week)
  }

  // Today
  const today = new Date()
  const isToday = (y: number, m: number, d: number) => 
    y === today.getFullYear() && m === today.getMonth() && d === today.getDate()

  // Prev and next month handlers
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  // Format month and year for display
  const monthYearString = currentDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold">Absensi</h1>
          <p className="text-muted-foreground mt-1">Kalender kehadiran karyawan</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Header */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-center">{monthYearString}</h2>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Days of week header */}
        <div className="text-xs font-medium text-muted-foreground text-center">Min</div>
        <div className="text-xs font-medium text-muted-foreground text-center">Sen</div>
        <div className="text-xs font-medium text-muted-foreground text-center">Sel</div>
        <div className="text-xs font-medium text-muted-foreground text-center">Rab</div>
        <div className="text-xs font-medium text-muted-foreground text-center">Kam</div>
        <div className="text-xs font-medium text-muted-foreground text-center">Jum</div>
        <div className="text-xs font-medium text-muted-foreground text-center">Sab</div>

        {/* Calendar days */}
        {weeks.map((week, weekIndex) =>
          week.map((day, dayIndex) => {
            const isEmpty = day === 0
            const dateString = !isEmpty ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : null
            const statuses = dateString ? absensiByDate[dateString] : []
            const isTodayCell = !isEmpty && isToday(year, month, day)

            // Determine the most common status for this day
let statusColor: (typeof statusColors)[keyof typeof statusColors] | undefined = undefined
let statusLabel: string | undefined = undefined
            if (statuses.length > 0) {
              // Count occurrences of each status
              const statusCount: Record<string, number> = {}
              statuses.forEach((status: string) => {
                statusCount[status] = (statusCount[status] || 0) + 1
              })
              // Find the status with the highest count
              const maxStatus = Object.entries(statusCount).reduce((a, b) => (a[1] > b[1] ? a : b))[0] as keyof typeof statusColors
              statusColor = statusColors[maxStatus]
              statusLabel = statusLabels[maxStatus as keyof typeof statusLabels]
            }

            return (
              <div
                key={`${weekIndex}-${dayIndex}`}
                className={`relative cursor-default ${isTodayCell ? 'ring-2 ring-primary ring-offset-2' : ''} ${isEmpty ? 'opacity-25' : ''}`}
              >
                {!isEmpty && (
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted/50 hover:bg-muted/100 transition-colors">
                    {statusColor ? (
                      <Badge variant={statusColor as (typeof statusColors)[keyof typeof statusColors]} className="text-xs">{statusLabel?.charAt(0)}</Badge>
                    ) : (
                      <div className="text-xs text-muted-foreground">{day}</div>
                    )}
                  </div>
                )}
                {!isEmpty && statuses.length > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 -mb-2 flex justify-center space-x-1">
                    {statuses.map((status: string, index: number) => (
                      <Badge
                        key={index}
                        variant={statusColors[status as keyof typeof statusColors]}
                        className="text-xs"
                      >
                        {statusLabels[status as keyof typeof statusLabels].charAt(0)}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-col space-x-2 text-sm">
        <div className="flex items-center space-x-2">
          <Badge variant="success" className="mr-1">H</Badge>
          <span>Hadir</span>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="warning" className="mr-1">S</Badge>
          <span>Sakit</span>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="mr-1">I</Badge>
          <span>Izin</span>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="destructive" className="mr-1">A</Badge>
          <span>Alpha</span>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="mr-1">C</Badge>
          <span>Cuti</span>
        </div>
      </div>
    </div>
  )
}
