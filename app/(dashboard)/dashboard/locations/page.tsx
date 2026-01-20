import { getLocations, getLocationsMetrics } from '@/app/actions/locations'
import { LocationForm } from './location-form'
import { LocationTable } from './location-table'
import { LocationsMetricsCard } from '@/components/dashboard/locations-metrics-card'
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

export default async function LocationsPage() {
  const { locations } = await getLocations()
  const locationsMetrics = await getLocationsMetrics()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Locations</h1>
          <p className="text-muted-foreground">
            Manage your business locations
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Location
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Location</DialogTitle>
              <DialogDescription>
                Create a new location for your business
              </DialogDescription>
            </DialogHeader>
            <LocationForm />
          </DialogContent>
        </Dialog>
      </div>

      {/* Key Metrics - Top Section */}
      <LocationsMetricsCard metrics={locationsMetrics} />

      <Card>
        <CardHeader>
          <CardTitle>All Locations</CardTitle>
          <CardDescription>
            View and manage all your business locations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LocationTable locations={locations} />
        </CardContent>
      </Card>
    </div>
  )
}
