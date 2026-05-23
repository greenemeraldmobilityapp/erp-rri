"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const BUCKET_COLORS = ['#22c55e', '#eab308', '#f97316', '#ef4444']

interface AgingChartProps {
  data: { label: string; total: number }[]
  formatCurrency?: boolean
}

function rupiah(v: number) {
  return `Rp ${v.toLocaleString('id-ID')}`
}

export function AgingChart({ data, formatCurrency }: AgingChartProps) {
  if (!data.length) return null
  const chartData = data.map((d, i) => ({ ...d, fill: BUCKET_COLORS[i] }))
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} tickFormatter={v => formatCurrency ? rupiah(v) : String(v)} />
        <Tooltip
          formatter={(v) => formatCurrency ? rupiah(Number(v) || 0) : String(Number(v) || 0)}
          contentStyle={{ fontSize: 13, borderRadius: 8 }}
        />
        <Bar dataKey="total" radius={[6, 6, 0, 0]} maxBarSize={80} />
      </BarChart>
    </ResponsiveContainer>
  )
}
