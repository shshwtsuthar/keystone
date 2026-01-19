import { getPayRuns } from '@/app/actions/payroll'
import { PayRunsTable } from './components/pay-runs-table'
import { NewPayRunWizard } from './components/new-pay-run-wizard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function PayrollPage() {
  const { payRuns } = await getPayRuns()

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

