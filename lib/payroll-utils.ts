export interface EmployeeTimesheet {
  clock_in: string
  clock_out: string | null
}

export const calculateEmployeeHours = (timesheets: EmployeeTimesheet[]): number => {
  if (!timesheets || timesheets.length === 0) {
    return 0
  }

  let totalHours = 0
  for (const timesheet of timesheets) {
    if (timesheet.clock_out) {
      const clockIn = new Date(timesheet.clock_in)
      const clockOut = new Date(timesheet.clock_out)
      const durationSeconds = Math.floor((clockOut.getTime() - clockIn.getTime()) / 1000)
      const durationHours = durationSeconds / 3600
      totalHours += durationHours
    }
  }

  return Math.round(totalHours * 100) / 100 // Round to 2 decimal places
}

