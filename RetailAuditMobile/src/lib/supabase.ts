import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'
import Constants from 'expo-constants'

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Custom storage implementation using Expo SecureStore
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key)
  },
  setItem: (key: string, value: string) => {
    SecureStore.setItemAsync(key, value)
  },
  removeItem: (key: string) => {
    SecureStore.deleteItemAsync(key)
  },
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Types for our database schema (matching web app)
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

// Auth helper functions
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export const signUp = async (email: string, password: string, name: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      },
    },
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

// Data fetching functions
export const fetchAudits = async (userId: string) => {
  const { data, error } = await supabase
    .from('audits')
    .select('*')
    .eq('assigned_to', userId)
    .order('created_at', { ascending: false })
  
  return { data, error }
}

export const fetchTemplates = async () => {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
  
  return { data, error }
}

export const updateAuditResponse = async (auditId: string, responses: Record<string, any>) => {
  const { data, error } = await supabase
    .from('audits')
    .update({ responses, status: 'in_progress' })
    .eq('audit_id', auditId)
  
  return { data, error }
}

export const submitAudit = async (auditId: string, responses: Record<string, any>, score: number) => {
  const { data, error } = await supabase
    .from('audits')
    .update({ 
      responses, 
      score, 
      status: 'completed',
      submitted_at: new Date().toISOString()
    })
    .eq('audit_id', auditId)
  
  return { data, error }
}