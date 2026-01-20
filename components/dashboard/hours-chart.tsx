'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ButtonGroup } from '@/components/ui/button-group'
import { Button } from '@/components/ui/button'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Area, AreaChart, XAxis, YAxis, CartesianGrid } from 'recharts'
import { formatHours } from '@/lib/analytics-utils'
import { format, parseISO } from 'date-fns'
import type { HoursByPeriodData } from '@/app/actions/analytics'

interface HoursChartProps {
  dailyData: HoursByPeriodData[]
  weeklyData: HoursByPeriodData[]
  monthlyData: HoursByPeriodData[]
}

const chartConfig = {
  hours: {
    label: 'Hours',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig

const formatDateLabel = (date: string, period: 'daily' | 'weekly' | 'monthly'): string => {
  try {
    if (period === 'monthly') {
      return format(parseISO(date + '-01'), 'MMM yyyy')
    }
    const parsed = parseISO(date)
    if (period === 'daily') {
      return format(parsed, 'MMM d')
    }
    return format(parsed, 'MMM d')
  } catch {
    return date
  }
}

export const HoursChart = ({ dailyData, weeklyData, monthlyData }: HoursChartProps) => {
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly'>('daily')

  const getData = () => {
    switch (activeTab) {
      case 'daily':
        return dailyData
      case 'weekly':
        return weeklyData
      case 'monthly':
        return monthlyData
    }
  }

  const data = getData()
  const hasData = data && data.length > 0 && data.some(d => d.hours > 0)

  const handlePeriodChange = (period: 'daily' | 'weekly' | 'monthly') => {
    setActiveTab(period)
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 shrink-0">
        <div className="flex flex-col gap-2">
          <CardTitle className="text-sm font-medium">Hours Worked</CardTitle>
          <CardDescription>Track hours worked over time</CardDescription>
        </div>
        <ButtonGroup>
          <Button
            variant={activeTab === 'daily' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handlePeriodChange('daily')}
          >
            Daily
          </Button>
          <Button
            variant={activeTab === 'weekly' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handlePeriodChange('weekly')}
          >
            Weekly
          </Button>
          <Button
            variant={activeTab === 'monthly' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handlePeriodChange('monthly')}
          >
            Monthly
          </Button>
        </ButtonGroup>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        {hasData ? (
          <ChartContainer config={chartConfig} className="h-full !aspect-auto">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
              <defs>
                <linearGradient id="fillHours" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-hours)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-hours)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(var(--muted))"
                opacity={0.5}
              />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => formatDateLabel(value, activeTab)}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              />
              <YAxis
                tickFormatter={(value) => formatHours(value)}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => [
                      formatHours(Number(value)),
                      'Hours',
                    ]}
                    labelFormatter={(value) => {
                      return formatDateLabel(value, activeTab)
                    }}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="hours"
                stroke="var(--color-hours)"
                fill="url(#fillHours)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>No data available for this period</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

