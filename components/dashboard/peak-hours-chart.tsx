'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from 'recharts'

interface PeakHoursChartProps {
  peakHours: Array<{ hour: number; count: number }>
}

const peakHoursConfig = {
  count: {
    label: 'Employees',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig

export const PeakHoursChart = ({ peakHours }: PeakHoursChartProps) => {
  const peakHoursData = peakHours.map((ph) => ({
    hour: `${ph.hour}:00`,
    count: ph.count,
  }))

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="shrink-0">
        <CardTitle className="text-sm font-medium">Peak Hours</CardTitle>
        <CardDescription>Employee activity by hour of day</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        <ChartContainer config={peakHoursConfig} className="h-full !aspect-auto">
          <BarChart data={peakHoursData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(var(--muted))"
              opacity={0.5}
            />
            <XAxis
              dataKey="hour"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} 
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => [`${value} employees`, 'Count']}
                />
              }
            />
            <Bar
              dataKey="count"
              fill="var(--color-count)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

