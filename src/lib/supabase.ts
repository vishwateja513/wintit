import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Types for our database schema
export interface AuditTemplate {
  template_id: string
  name: string
  description?: string
  category_id?: string
  version: number
  sections: any[]
  conditional_logic: any
  scoring_rules: any
  validation_rules: any
  created_by?: string
  created_at: string
  updated_at: string
  published_at?: string
  is_published: boolean
  is_active: boolean
}

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

// Template management functions
export const saveTemplate = async (templateData: Partial<AuditTemplate>) => {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }

  const templateToSave = {
    ...templateData,
    created_by: user.id,
    updated_at: new Date().toISOString()
  }

  if (templateData.template_id) {
    // Update existing template
    const { data, error } = await supabase
      .from('audit_templates')
      .update(templateToSave)
      .eq('template_id', templateData.template_id)
      .select()
      .single()
    
    return { data, error }
  } else {
    // Create new template
    const { data, error } = await supabase
      .from('audit_templates')
      .insert(templateToSave)
      .select()
      .single()
    
    return { data, error }
  }
}

export const publishTemplate = async (templateId: string) => {
  const { data, error } = await supabase
    .from('audit_templates')
    .update({
      is_published: true,
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('template_id', templateId)
    .select()
    .single()
  
  return { data, error }
}

export const fetchTemplateCategories = async () => {
  const { data, error } = await supabase
    .from('template_categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')
  
  return { data, error }
}

export const fetchTemplates = async () => {
  const { data, error } = await supabase
    .from('audit_templates')
    .select(`
      *,
      template_categories (
        name,
        icon,
        color
      )
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  
  return { data, error }
}

// Real-time template functions with subscriptions
export const subscribeToTemplates = (callback: (payload: any) => void) => {
  return supabase
    .channel('templates')
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'audit_templates' 
      }, 
      callback
    )
    .subscribe()
}

export const subscribeToTemplateCategories = (callback: (payload: any) => void) => {
  return supabase
    .channel('template_categories')
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'template_categories' 
      }, 
      callback
    )
    .subscribe()
}

// Enhanced template functions
export const fetchTemplatesWithRealtime = async () => {
  const { data, error } = await supabase
    .from('audit_templates')
    .select(`
      *,
      template_categories (
        name,
        icon,
        color
      ),
      user_profiles!audit_templates_created_by_fkey (
        name
      )
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  
  return { data, error }
}

export const saveTemplateWithRealtime = async (templateData: Partial<AuditTemplate>) => {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }

  const templateToSave = {
    ...templateData,
    created_by: user.id,
    updated_at: new Date().toISOString()
  }

  if (templateData.template_id) {
    // Update existing template
    const { data, error } = await supabase
      .from('audit_templates')
      .update(templateToSave)
      .eq('template_id', templateData.template_id)
      .select(`
        *,
        template_categories (
          name,
          icon,
          color
        )
      `)
      .single()
    
    return { data, error }
  } else {
    // Create new template
    const { data, error } = await supabase
      .from('audit_templates')
      .insert(templateToSave)
      .select(`
        *,
        template_categories (
          name,
          icon,
          color
        )
      `)
      .single()
    
    return { data, error }
  }
}

export const publishTemplateWithRealtime = async (templateId: string) => {
  const { data, error } = await supabase
    .from('audit_templates')
    .update({
      is_published: true,
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('template_id', templateId)
    .select(`
      *,
      template_categories (
        name,
        icon,
        color
      )
    `)
    .single()
  
  return { data, error }
}

// Connection test function
export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('template_categories')
      .select('count')
      .limit(1)
    
    if (error) throw error
    return { connected: true, error: null }
  } catch (error) {
    return { connected: false, error }
  }
}