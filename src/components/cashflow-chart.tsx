"use client"

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

function rupiah(v: number) {
  return `Rp ${v.toLocaleString('id-ID')}`
}

interface CashflowChartProps {
  data: { bulan: string; revenue: number; expense: number }[]
}

export function CashflowChart({ data }: CashflowChartProps) {
  if (!data.length) return null

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="bulan" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={v => rupiah(v)} />
        <Tooltip
          formatter={(v) => rupiah(Number(v) || 0)}
          contentStyle={{ fontSize: 13, borderRadius: 8 }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#22c55e"
          fill="#22c55e"
          fillOpacity={0.12}
          strokeWidth={2}
          name="Pemasukan"
        />
        <Area
          type="monotone"
          dataKey="expense"
          stroke="#ef4444"
          fill="#ef4444"
          fillOpacity={0.12}
          strokeWidth={2}
          name="Pengeluaran"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
