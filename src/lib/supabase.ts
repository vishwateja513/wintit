import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.warn('Missing Supabase environment variables. Using demo mode.')
}

export const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
}) : null

// Demo mode fallback
const isDemoMode = !supabaseUrl || !supabaseKey

// Demo data storage
let demoTemplates: AuditTemplate[] = [
  {
    template_id: 'demo-1',
    name: 'Sample Retail Audit',
    description: 'A comprehensive retail execution audit template',
    category_id: 'cat-1',
    version: 1,
    sections: [
      {
        section_id: 'sec-1',
        title: 'Product Availability',
        description: 'Check product availability and stock levels',
        order_index: 1,
        questions: [
          {
            question_id: 'q1',
            text: 'Is the product available on shelf?',
            type: 'single_choice',
            options: ['Yes', 'No'],
            validation: { mandatory: true }
          }
        ]
      }
    ],
    conditional_logic: {},
    scoring_rules: {},
    validation_rules: {},
    created_by: 'demo-user',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_published: true,
    is_active: true
  }
]

let demoCategories = [
  {
    category_id: 'cat-1',
    name: 'Merchandising',
    description: 'Product placement and visibility audits',
    icon: 'package',
    color: '#3B82F6',
    sort_order: 1,
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    category_id: 'cat-2', 
    name: 'Stock Management',
    description: 'Inventory and stock level checks',
    icon: 'archive',
    color: '#10B981',
    sort_order: 2,
    is_active: true,
    created_at: new Date().toISOString()
  }
]

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
  if (isDemoMode) {
    // Demo mode - store in memory
    const newTemplate: AuditTemplate = {
      template_id: templateData.template_id || `demo-${Date.now()}`,
      name: templateData.name || 'Untitled Template',
      description: templateData.description || '',
      category_id: templateData.category_id || '',
      version: templateData.version || 1,
      sections: templateData.sections || [],
      conditional_logic: templateData.conditional_logic || {},
      scoring_rules: templateData.scoring_rules || {},
      validation_rules: templateData.validation_rules || {},
      created_by: 'demo-user',
      created_at: templateData.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      published_at: templateData.published_at,
      is_published: templateData.is_published || false,
      is_active: templateData.is_active !== false
    }

    if (templateData.template_id) {
      // Update existing
      const index = demoTemplates.findIndex(t => t.template_id === templateData.template_id)
      if (index >= 0) {
        demoTemplates[index] = { ...demoTemplates[index], ...newTemplate }
        return { data: demoTemplates[index], error: null }
      }
    }
    
    // Create new
    demoTemplates.unshift(newTemplate)
    return { data: newTemplate, error: null }
  }

  if (!supabase) {
    return { data: null, error: new Error('Supabase not initialized') }
  }

  const templateToSave = {
    ...templateData,
    created_by: 'demo-user',
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
  if (isDemoMode) {
    const template = demoTemplates.find(t => t.template_id === templateId)
    if (template) {
      template.is_published = true
      template.published_at = new Date().toISOString()
      template.updated_at = new Date().toISOString()
      return { data: template, error: null }
    }
    return { data: null, error: new Error('Template not found') }
  }

  if (!supabase) {
    return { data: null, error: new Error('Supabase not initialized') }
  }

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
  if (isDemoMode) {
    return { data: demoCategories, error: null }
  }

  if (!supabase) {
    return { data: [], error: new Error('Supabase not initialized') }
  }

  const { data, error } = await supabase
    .from('template_categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')
  
  return { data, error }
}

export const fetchTemplates = async () => {
  if (isDemoMode) {
    return { data: demoTemplates, error: null }
  }

  if (!supabase) {
    return { data: [], error: new Error('Supabase not initialized') }
  }

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
  if (isDemoMode || !supabase) {
    // Return a mock subscription for demo mode
    return {
      unsubscribe: () => {}
    }
  }

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
  if (isDemoMode || !supabase) {
    return {
      unsubscribe: () => {}
    }
  }

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
  if (isDemoMode || !supabase) {
    return { connected: false, error: new Error('Demo mode - no Supabase connection') }
  }

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