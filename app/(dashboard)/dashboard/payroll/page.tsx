import { getPayRuns, getPayrollMetrics } from '@/app/actions/payroll'
import { PayRunsTable } from './components/pay-runs-table'
import { NewPayRunWizard } from './components/new-pay-run-wizard'
import { PayrollMetricsCard } from '@/components/dashboard/payroll-metrics-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function PayrollPage() {
  const { payRuns } = await getPayRuns()
  const payrollMetrics = await getPayrollMetrics()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payroll</h1>
          <p className="text-muted-foreground">
            Manage pay runs and generate payslips
          </p>
        </div>
        <NewPayRunWizard />
      </div>

      {/* Key Metrics - Top Section */}
      <PayrollMetricsCard metrics={payrollMetrics} />

      <Card>
        <CardHeader>
          <CardTitle>Pay Runs</CardTitle>
          <CardDescription>
            View all your pay runs and their details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PayRunsTable payRuns={payRuns} />
        </CardContent>
      </Card>
    </div>
  )
}

