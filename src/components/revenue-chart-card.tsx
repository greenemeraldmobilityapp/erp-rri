"use client"

import { TrendingUp } from 'lucide-react'
import { RevenueChart } from '@/components/revenue-chart'

interface RevenueChartCardProps {
  data: { month: string; revenue: number }[]
}

export function RevenueChartCard({ data }: RevenueChartCardProps) {
  return (
    <div className="rounded-2xl bg-white dark:bg-primary/10 dark:backdrop-blur-sm border border-primary/10 dark:border-primary/20 hover:shadow-[0_4px_20px_rgba(0,0,255,0.08)] dark:hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between px-6 pt-6 pb-0">
        <p className="text-sm font-semibold uppercase tracking-wider text-foreground">
          Revenue Trend
        </p>
        <div className="bg-primary/20 p-3 rounded-lg">
          <TrendingUp className="h-5 w-5 text-primary" />
        </div>
      </div>
      <div className="p-6 pt-4">
        <div className="h-[140px]">
          <RevenueChart data={data} />
        </div>
        <p className="text-xs text-muted-foreground mt-2">12 bulan terakhir</p>
      </div>
    </div>
  )
}
