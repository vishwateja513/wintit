import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// Types for our database schema
export interface User {
  user_id: string
  name: string
  email: string
  role: 'admin' | 'supervisor' | 'auditor'
  assigned_regions: string[]
  created_at: string
  last_login?: string
}

export interface Template {
  template_id: string
  name: string
  description?: string
  category?: string
  sections: Section[]
  scoring_rules: ScoringRules
  created_by: string
  created_at: string
  updated_at: string
  is_published: boolean
}

export interface Section {
  section_id: string
  title: string
  description?: string
  order_index: number
  questions: Question[]
}

export interface Question {
  question_id: string
  text: string
  type: 'text' | 'numeric' | 'single_choice' | 'multiple_choice' | 'dropdown' | 'date' | 'file_upload' | 'barcode'
  options?: string[]
  validation?: {
    mandatory: boolean
    min_value?: number
    max_value?: number
  }
  conditional_logic?: ConditionalLogic[]
}

export interface ConditionalLogic {
  condition: string
  action: 'show' | 'hide' | 'skip_to'
  target: string
}

export interface ScoringRules {
  weights: Record<string, number>
  threshold: number
  critical_questions: string[]
}

export interface Audit {
  audit_id: string
  template_id: string
  status: 'pending' | 'in_progress' | 'completed'
  assigned_to: string
  location: {
    store_name?: string
    address?: string
    coordinates?: { lat: number; lng: number }
  }
  responses: Record<string, any>
  score: number
  submitted_at?: string
  created_at: string
}

export interface Report {
  report_id: string
  audit_id: string
  generated_by: string
  data: any
  created_at: string
}