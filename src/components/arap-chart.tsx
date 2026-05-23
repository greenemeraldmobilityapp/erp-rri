"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

function rupiah(v: number) {
  return `Rp ${v.toLocaleString('id-ID')}`
}

interface ArapChartProps {
  ar: { label: string; total: number }[]
  ap: { label: string; total: number }[]
}

export function ArapChart({ ar, ap }: ArapChartProps) {
  const labels = ar.length ? ar.map(a => a.label) : ap.map(a => a.label)
  const data = labels.map((label, i) => ({
    label,
    Piutang: ar[i]?.total ?? 0,
    Hutang: ap[i]?.total ?? 0,
  }))

  if (!data.length) return null

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={v => rupiah(v)} />
        <Tooltip
          formatter={(v) => rupiah(Number(v) || 0)}
          contentStyle={{ fontSize: 13, borderRadius: 8 }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="Piutang" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={50} name="Piutang" />
        <Bar dataKey="Hutang" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={50} name="Hutang" />
      </BarChart>
    </ResponsiveContainer>
  )
}
