import React, { useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import LoginForm from './components/auth/LoginForm'
import Layout from './components/common/Layout'
import Dashboard from './components/dashboard/Dashboard'
import TemplatesList from './components/templates/TemplatesList'
import TemplateWizard from './components/templates/TemplateWizard'
import AuditsList from './components/audits/AuditsList'
import ReportsView from './components/reports/ReportsView'

const AppContent: React.FC = () => {
  const { user, loading } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showTemplateWizard, setShowTemplateWizard] = useState(false)

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

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />
      case 'templates':
        return <TemplatesList 
          onCreateTemplate={() => setShowTemplateWizard(true)} 
          onTemplateUpdated={() => {
            // Refresh templates list if needed
            setActiveTab('templates')
          }}
        />
      case 'audits':
        return <AuditsList />
      case 'reports':
        return <ReportsView />
      case 'users':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
            <p className="text-gray-600 mt-1">Manage users and permissions</p>
            <div className="mt-8 text-center">
              <p className="text-gray-500">User management module coming soon...</p>
            </div>
          </div>
        )
      case 'settings':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
            <p className="text-gray-600 mt-1">Configure your application settings</p>
            <div className="mt-8 text-center">
              <p className="text-gray-500">Settings module coming soon...</p>
            </div>
          </div>
        )
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Layout activeTab={activeTab} onTabChange={setActiveTab}>
        {renderContent()}
      </Layout>
      
      {showTemplateWizard && (
        <TemplateWizard 
          onClose={() => setShowTemplateWizard(false)}
          onTemplateCreated={(template) => {
            setShowTemplateWizard(false)
            // Optionally refresh the templates list
            setActiveTab('templates')
          }}
        />
      )}
    </div>
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