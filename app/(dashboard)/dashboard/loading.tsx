import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardLoading() {
  return (
    <div className="flex flex-col h-full gap-6">
      {/* Header Skeleton */}
      <div>
        <Skeleton className="h-9 w-48 mb-2" />
        <Skeleton className="h-5 w-64" />
      </div>

      {/* Key Metrics - Top Section Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Labor Cost Card Skeleton */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-4 rounded" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-9 w-36 mb-2" />
            <Skeleton className="h-3 w-24" />
          </CardContent>
        </Card>

        {/* Payrolls Generated Card Skeleton */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-4 rounded" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-40" />
          </CardContent>
        </Card>

        {/* Currently Working Card Skeleton */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-4 rounded" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-12 mb-2" />
            <Skeleton className="h-3 w-36" />
          </CardContent>
        </Card>

        {/* Total Employees Card Skeleton */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-4 rounded" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-12 mb-2" />
            <Skeleton className="h-3 w-40" />
          </CardContent>
        </Card>
      </div>

      {/* Charts Section - Side by Side Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 flex-1 min-h-0">
        {/* Hours Chart Card Skeleton */}
        <Card className="flex flex-col h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 shrink-0">
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-8 w-[180px]" />
          </CardHeader>
          <CardContent className="flex-1 min-h-0">
            <Skeleton className="h-full w-full" />
          </CardContent>
        </Card>

        {/* Peak Hours Chart Card Skeleton */}
        <Card className="flex flex-col h-full">
          <CardHeader className="shrink-0">
            <Skeleton className="h-6 w-28 mb-2" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="flex-1 min-h-0">
            <Skeleton className="h-full w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

