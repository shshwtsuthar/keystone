import { getEmployees } from '@/app/actions/employees'
import { getLocations } from '@/app/actions/locations'
import { EmployeeForm } from './employee-form'
import { EmployeeTable } from './employee-table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export default async function EmployeesPage() {
  const { employees } = await getEmployees()
  const { locations } = await getLocations()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
          <p className="text-muted-foreground">
            Manage your employees and their PINs
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
              <DialogDescription>
                Create a new employee and generate their PIN
              </DialogDescription>
            </DialogHeader>
            <EmployeeForm locations={locations} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Employees</CardTitle>
          <CardDescription>
            View and manage all your employees
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmployeeTable employees={employees} locations={locations} />
        </CardContent>
      </Card>
    </div>
  )
}
