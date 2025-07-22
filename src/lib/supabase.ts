import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('Supabase Config:', { 
  url: supabaseUrl ? 'Set' : 'Missing', 
  key: supabaseKey ? 'Set' : 'Missing' 
})

export const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
}) : null

// Demo mode fallback
const isDemoMode = !supabaseUrl || !supabaseKey

// Types for our database schema
export interface TemplateCategory {
  category_id: string
  name: string
  description?: string
  icon?: string
  color: string
  sort_order: number
  is_active: boolean
  created_at: string
}

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
  category?: TemplateCategory
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

let demoCategories: TemplateCategory[] = [
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
  },
  {
    category_id: 'cat-3',
    name: 'Quality Control',
    description: 'Product quality and compliance checks',
    icon: 'shield-check',
    color: '#F59E0B',
    sort_order: 3,
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    category_id: 'cat-4',
    name: 'Competitor Analysis',
    description: 'Competitive landscape assessment',
    icon: 'users',
    color: '#8B5CF6',
    sort_order: 4,
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    category_id: 'cat-5',
    name: 'Pricing Compliance',
    description: 'Price verification and compliance',
    icon: 'dollar-sign',
    color: '#EF4444',
    sort_order: 5,
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    category_id: 'cat-6',
    name: 'Brand Visibility',
    description: 'Brand presence and POSM audits',
    icon: 'eye',
    color: '#06B6D4',
    sort_order: 6,
    is_active: true,
    created_at: new Date().toISOString()
  }
]

// Template Categories CRUD
export const fetchTemplateCategories = async () => {
  if (isDemoMode) {
    console.log('Demo mode: returning demo categories')
    return { data: demoCategories, error: null }
  }

  if (!supabase) {
    return { data: [], error: new Error('Supabase not initialized') }
  }

  try {
    const { data, error } = await supabase
      .from('template_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
    
    console.log('Fetched categories:', data)
    return { data, error }
  } catch (error) {
    console.error('Error fetching categories:', error)
    return { data: [], error }
  }
}

export const createTemplateCategory = async (category: Partial<TemplateCategory>) => {
  if (isDemoMode) {
    const newCategory: TemplateCategory = {
      category_id: `demo-cat-${Date.now()}`,
      name: category.name || 'New Category',
      description: category.description || '',
      icon: category.icon || 'folder',
      color: category.color || '#3B82F6',
      sort_order: category.sort_order || demoCategories.length,
      is_active: true,
      created_at: new Date().toISOString()
    }
    demoCategories.push(newCategory)
    return { data: newCategory, error: null }
  }

  if (!supabase) {
    return { data: null, error: new Error('Supabase not initialized') }
  }

  try {
    const { data, error } = await supabase
      .from('template_categories')
      .insert(category)
      .select()
      .single()
    
    console.log('Created category:', data)
    return { data, error }
  } catch (error) {
    console.error('Error creating category:', error)
    return { data: null, error }
  }
}

// Templates CRUD
export const fetchTemplates = async () => {
  if (isDemoMode) {
    console.log('Demo mode: returning demo templates')
    return { data: demoTemplates, error: null }
  }

  if (!supabase) {
    return { data: [], error: new Error('Supabase not initialized') }
  }

  try {
    const { data, error } = await supabase
      .from('audit_templates')
      .select(`
        *,
        category:template_categories(*)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    
    console.log('Fetched templates:', data)
    return { data, error }
  } catch (error) {
    console.error('Error fetching templates:', error)
    return { data: [], error }
  }
}

export const createTemplate = async (template: Partial<AuditTemplate>) => {
  if (isDemoMode) {
    const newTemplate: AuditTemplate = {
      template_id: `demo-${Date.now()}`,
      name: template.name || 'Untitled Template',
      description: template.description || '',
      category_id: template.category_id || '',
      version: 1,
      sections: template.sections || [],
      conditional_logic: template.conditional_logic || {},
      scoring_rules: template.scoring_rules || {},
      validation_rules: template.validation_rules || {},
      created_by: 'demo-user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      published_at: template.is_published ? new Date().toISOString() : undefined,
      is_published: template.is_published || false,
      is_active: true
    }
    demoTemplates.unshift(newTemplate)
    console.log('Created demo template:', newTemplate)
    return { data: newTemplate, error: null }
  }

  if (!supabase) {
    return { data: null, error: new Error('Supabase not initialized') }
  }

  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    
    const templateData = {
      name: template.name,
      description: template.description,
      category_id: template.category_id,
      sections: template.sections || [],
      conditional_logic: template.conditional_logic || {},
      scoring_rules: template.scoring_rules || {},
      validation_rules: template.validation_rules || {},
      is_published: template.is_published || false,
      published_at: template.is_published ? new Date().toISOString() : null,
      created_by: user?.id
    }

    const { data, error } = await supabase
      .from('audit_templates')
      .insert(templateData)
      .select(`
        *,
        category:template_categories(*)
      `)
      .single()
    
    console.log('Created template:', data)
    return { data, error }
  } catch (error) {
    console.error('Error creating template:', error)
    return { data: null, error }
  }
}

export const updateTemplate = async (templateId: string, updates: Partial<AuditTemplate>) => {
  if (isDemoMode) {
    const index = demoTemplates.findIndex(t => t.template_id === templateId)
    if (index >= 0) {
      demoTemplates[index] = { 
        ...demoTemplates[index], 
        ...updates, 
        updated_at: new Date().toISOString() 
      }
      console.log('Updated demo template:', demoTemplates[index])
      return { data: demoTemplates[index], error: null }
    }
    return { data: null, error: new Error('Template not found') }
  }

  if (!supabase) {
    return { data: null, error: new Error('Supabase not initialized') }
  }

  try {
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    }

    // Remove template_id from updates to avoid conflicts
    delete updateData.template_id

    const { data, error } = await supabase
      .from('audit_templates')
      .update(updateData)
      .eq('template_id', templateId)
      .select(`
        *,
        category:template_categories(*)
      `)
      .single()
    
    console.log('Updated template:', data)
    return { data, error }
  } catch (error) {
    console.error('Error updating template:', error)
    return { data: null, error }
  }
}

export const deleteTemplate = async (templateId: string) => {
  if (isDemoMode) {
    const index = demoTemplates.findIndex(t => t.template_id === templateId)
    if (index >= 0) {
      demoTemplates.splice(index, 1)
      console.log('Deleted demo template:', templateId)
      return { error: null }
    }
    return { error: new Error('Template not found') }
  }

  if (!supabase) {
    return { error: new Error('Supabase not initialized') }
  }

  try {
    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('audit_templates')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('template_id', templateId)
    
    console.log('Deleted template:', templateId)
    return { error }
  } catch (error) {
    console.error('Error deleting template:', error)
    return { error }
  }
}

export const publishTemplate = async (templateId: string) => {
  const updates = {
    is_published: true,
    published_at: new Date().toISOString()
  }
  
  return updateTemplate(templateId, updates)
}

// Real-time subscriptions
export const subscribeToTemplates = (callback: (payload: any) => void) => {
  if (isDemoMode || !supabase) {
    console.log('Demo mode: mock subscription')
    return {
      unsubscribe: () => console.log('Unsubscribed from demo templates')
    }
  }

  console.log('Setting up real-time subscription for templates')
  return supabase
    .channel('templates')
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'audit_templates' 
      }, 
      (payload) => {
        console.log('Real-time template update:', payload)
        callback(payload)
      }
    )
    .subscribe()
}

export const subscribeToTemplateCategories = (callback: (payload: any) => void) => {
  if (isDemoMode || !supabase) {
    console.log('Demo mode: mock subscription')
    return {
      unsubscribe: () => console.log('Unsubscribed from demo categories')
    }
  }

  console.log('Setting up real-time subscription for categories')
  return supabase
    .channel('template_categories')
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'template_categories' 
      }, 
      (payload) => {
        console.log('Real-time category update:', payload)
        callback(payload)
      }
    )
    .subscribe()
}

// Connection test function
export const testSupabaseConnection = async () => {
  if (isDemoMode || !supabase) {
    console.log('Demo mode - no Supabase connection')
    return { connected: false, error: new Error('Demo mode - no Supabase connection') }
  }

  try {
    const { data, error } = await supabase
      .from('template_categories')
      .select('count')
      .limit(1)
    
    if (error) throw error
    console.log('Supabase connection successful')
    return { connected: true, error: null }
  } catch (error) {
    console.error('Supabase connection failed:', error)
    return { connected: false, error }
  }
}