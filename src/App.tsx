import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './components/auth/AuthProvider'
import LoginForm from './components/auth/LoginForm'
import Layout from './components/common/Layout'
import Dashboard from './components/dashboard/Dashboard'
import TemplatesList from './components/templates/TemplatesList'
import TemplateWizard from './components/templates/TemplateWizard'
import AuditsList from './components/audits/AuditsList'
import ReportsView from './components/reports/ReportsView'
import { AuditTemplate } from './lib/supabase'

const AppContent: React.FC = () => {
  const { user, loading } = useAuth()
  const [showTemplateWizard, setShowTemplateWizard] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<AuditTemplate | undefined>(undefined)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginForm />
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/templates" element={
              <TemplatesList 
                onCreateTemplate={() => setShowTemplateWizard(true)} 
                onEditTemplate={(template) => {
                  setEditingTemplate(template)
                  setShowTemplateWizard(true)
                }}
                onTemplateUpdated={() => {
                  // Template updated, refresh will happen automatically
                }}
              />
            } />
            <Route path="/audits" element={<AuditsList />} />
            <Route path="/reports" element={<ReportsView />} />
            <Route path="/users" element={
              <div className="p-4 lg:p-6">
                <h2 className="text-xl lg:text-2xl font-bold text-gray-900">User Management</h2>
                <p className="text-gray-600 mt-1">Manage users and permissions</p>
                <div className="mt-8 text-center">
                  <p className="text-gray-500">User management module coming soon...</p>
                </div>
              </div>
            } />
            <Route path="/settings" element={
              <div className="p-4 lg:p-6">
                <h2 className="text-xl lg:text-2xl font-bold text-gray-900">Settings</h2>
                <p className="text-gray-600 mt-1">Configure your application settings</p>
                <div className="mt-8 text-center">
                  <p className="text-gray-500">Settings module coming soon...</p>
                </div>
              </div>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
        
        {showTemplateWizard && (
          <TemplateWizard 
            onClose={() => {
              setShowTemplateWizard(false)
              setEditingTemplate(undefined)
            }}
            template={editingTemplate}
            onTemplateCreated={(template) => {
              setShowTemplateWizard(false)
              setEditingTemplate(undefined)
            }}
          />
        )}
      </div>
    </Router>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App