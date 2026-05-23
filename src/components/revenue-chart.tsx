"use client"

import { LineChart, Line, Tooltip, ResponsiveContainer } from 'recharts'

interface RevenueChartProps {
  data: { month: string; revenue: number }[]
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="hsl(var(--success))"
          strokeWidth={2}
          dot={false}
        />
        <Tooltip
          formatter={(value) => [`Rp ${(value as number).toLocaleString('id-ID')}`, 'Revenue']}
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            backgroundColor: 'hsl(var(--card))',
            borderColor: 'hsl(var(--border))',
          }}
          labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}