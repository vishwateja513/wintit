import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  connectionError: string | null
  signIn: (email: string, password: string) => Promise<{ error?: any }>
  signUp: (email: string, password: string, name: string) => Promise<{ error?: any }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) {
      // Supabase not configured - show connection error
      setConnectionError('Supabase configuration missing. Please check your environment variables.')
      setLoading(false)
      return
    }

    // Get initial session
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setSession(session)
        setUser(session?.user ?? null)
        setConnectionError(null)
      } catch (error) {
        console.error('Error connecting to Supabase:', error)
        setConnectionError('Failed to connect to authentication service. Please check your Supabase configuration.')
      }
      setLoading(false)
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
        if (session) {
          setConnectionError(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      return { 
        error: { 
          message: 'Supabase is not configured. Please check your environment variables (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY).' 
        } 
      }
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (!error) {
        setConnectionError(null)
      }
      
      return { error }
    } catch (error) {
      console.error('Supabase connection error:', error)
      setConnectionError('Failed to connect to authentication service.')
      return { 
        error: { 
          message: 'Failed to connect to authentication service. Please check your Supabase configuration and internet connection.' 
        } 
      }
    }
  }

  const signUp = async (email: string, password: string, name: string) => {
    if (!supabase) {
      return { 
        error: { 
          message: 'Supabase is not configured. Please check your environment variables.' 
        } 
      }
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      })
      
      // If signup was successful and user was created, create user profile
      if (!error && data.user) {
        try {
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert({
              user_id: data.user.id,
              name: name,
              role: 'auditor'
            })
          
          if (profileError) {
            console.error('Error creating user profile:', profileError)
            // Don't return this error as the user was successfully created
            // The profile will be created by the database trigger if it exists
          }
        } catch (profileError) {
          console.error('Error creating user profile:', profileError)
          // Don't return this error as the user was successfully created
        }
      }
      
      if (!error) {
        setConnectionError(null)
      }
      
      return { error }
    } catch (error) {
      console.error('Supabase connection error during signup:', error)
      setConnectionError('Failed to connect to authentication service.')
      return { 
        error: { 
          message: 'Failed to connect to authentication service. Please check your Supabase configuration and internet connection.' 
        } 
      }
    }
  }

  const signOut = async () => {
    if (!supabase) {
      setUser(null)
      setSession(null)
      return
    }

    try {
      await supabase.auth.signOut()
      setConnectionError(null)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const value = {
    user,
    session,
    loading,
    connectionError,
    signIn,
    signUp,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}