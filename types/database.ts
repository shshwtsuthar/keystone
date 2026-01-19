export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'owner' | 'manager'
export type TimesheetStatus = 'working' | 'completed'

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          organization_id: string
          role: UserRole
          full_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          organization_id: string
          role?: UserRole
          full_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          role?: UserRole
          full_name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      locations: {
        Row: {
          id: string
          organization_id: string
          name: string
          address: string | null
          timezone: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          address?: string | null
          timezone?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          address?: string | null
          timezone?: string
          created_at?: string
          updated_at?: string
        }
      }
      employees: {
        Row: {
          id: string
          organization_id: string
          default_location_id: string | null
          full_name: string
          pin_hash: string
          pay_rate: number | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          default_location_id?: string | null
          full_name: string
          pin_hash: string
          pay_rate?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          default_location_id?: string | null
          full_name?: string
          pin_hash?: string
          pay_rate?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      timesheets: {
        Row: {
          id: string
          organization_id: string
          employee_id: string
          location_id: string
          clock_in: string
          clock_out: string | null
          status: TimesheetStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          employee_id: string
          location_id: string
          clock_in: string
          clock_out?: string | null
          status?: TimesheetStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          employee_id?: string
          location_id?: string
          clock_in?: string
          clock_out?: string | null
          status?: TimesheetStatus
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

