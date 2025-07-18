import { supabase } from './supabase'

export interface TemplateCategory {
  id: string
  name: string
  description?: string
  icon?: string
  color: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Template {
  id: string
  name: string
  description?: string
  category_id?: string
  version: number
  conditional_logic: any
  scoring_rules: any
  validation_rules: any
  created_by: string
  created_at: string
  updated_at: string
  published_at?: string
  is_published: boolean
  is_active: boolean
  category?: TemplateCategory
  sections?: TemplateSection[]
}

export interface TemplateSection {
  id: string
  template_id: string
  title: string
  description?: string
  order_index: number
  created_at: string
  updated_at: string
  questions?: TemplateQuestion[]
}

export interface TemplateQuestion {
  id: string
  section_id: string
  text: string
  type: 'text' | 'numeric' | 'single_choice' | 'multiple_choice' | 'dropdown' | 'date' | 'file_upload' | 'barcode'
  options: string[]
  validation: any
  conditional_logic: any
  order_index: number
  created_at: string
  updated_at: string
}

// Template Categories
export const fetchTemplateCategories = async () => {
  const { data, error } = await supabase
    .from('template_categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')
  
  return { data, error }
}

// Templates CRUD
export const fetchTemplates = async () => {
  const { data, error } = await supabase
    .from('templates')
    .select(`
      *,
      category:template_categories(*)
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  
  return { data, error }
}

export const fetchTemplateById = async (id: string) => {
  const { data, error } = await supabase
    .from('templates')
    .select(`
      *,
      category:template_categories(*),
      sections:template_sections(
        *,
        questions:template_questions(*)
      )
    `)
    .eq('id', id)
    .single()
  
  return { data, error }
}

export const createTemplate = async (template: Partial<Template>) => {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }

  const { data, error } = await supabase
    .from('templates')
    .insert({
      ...template,
      created_by: user.id
    })
    .select(`
      *,
      category:template_categories(*)
    `)
    .single()
  
  return { data, error }
}

export const updateTemplate = async (id: string, updates: Partial<Template>) => {
  const { data, error } = await supabase
    .from('templates')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      category:template_categories(*)
    `)
    .single()
  
  return { data, error }
}

export const deleteTemplate = async (id: string) => {
  const { error } = await supabase
    .from('templates')
    .delete()
    .eq('id', id)
  
  return { error }
}

export const publishTemplate = async (id: string) => {
  const { data, error } = await supabase
    .from('templates')
    .update({
      is_published: true,
      published_at: new Date().toISOString()
    })
    .eq('id', id)
    .select(`
      *,
      category:template_categories(*)
    `)
    .single()
  
  return { data, error }
}

// Template Sections CRUD
export const createTemplateSection = async (section: Partial<TemplateSection>) => {
  const { data, error } = await supabase
    .from('template_sections')
    .insert(section)
    .select()
    .single()
  
  return { data, error }
}

export const updateTemplateSection = async (id: string, updates: Partial<TemplateSection>) => {
  const { data, error } = await supabase
    .from('template_sections')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  return { data, error }
}

export const deleteTemplateSection = async (id: string) => {
  const { error } = await supabase
    .from('template_sections')
    .delete()
    .eq('id', id)
  
  return { error }
}

// Template Questions CRUD
export const createTemplateQuestion = async (question: Partial<TemplateQuestion>) => {
  const { data, error } = await supabase
    .from('template_questions')
    .insert(question)
    .select()
    .single()
  
  return { data, error }
}

export const updateTemplateQuestion = async (id: string, updates: Partial<TemplateQuestion>) => {
  const { data, error } = await supabase
    .from('template_questions')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  return { data, error }
}

export const deleteTemplateQuestion = async (id: string) => {
  const { error } = await supabase
    .from('template_questions')
    .delete()
    .eq('id', id)
  
  return { error }
}

// Real-time subscriptions
export const subscribeToTemplates = (callback: (payload: any) => void) => {
  return supabase
    .channel('templates')
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'templates' 
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