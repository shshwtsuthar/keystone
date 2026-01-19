export interface PayslipData {
  // 1. Employer Details
  employerName: string
  employerABN: string // CRITICAL for Australia
  companyLogoUrl?: string | null // Optional company logo URL

  // 2. Employee Details
  employeeName: string
  classification: string // e.g. "Level 2 Casual"
  payPeriodStart: string // "01 Jan 2026"
  payPeriodEnd: string // "14 Jan 2026"
  paymentDate: string // "15 Jan 2026"

  // 3. Earnings (The Table)
  earnings: {
    description: string // "Ordinary Hours", "Saturday Penalty", "Overtime"
    rate: number // $30.00
    hours: number // 20
    total: number // $600.00
  }[]

  // 4. Tax (PAYG)
  taxWithheld: number // The amount sent to ATO

  // 5. Superannuation (CRITICAL)
  superannuation: {
    fundName: string // e.g. "AustralianSuper"
    amount: number // Usually 11.5% - 12% of OTE
  }

  // 6. Totals
  grossPay: number // Total before tax
  netPay: number // The actual money sent to bank

  // 7. Leave Balances (Optional but highly recommended)
  leave?: {
    annualLeaveHours: number
    sickLeaveHours: number
  }
}

