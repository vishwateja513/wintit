import React, { useState } from 'react'
import Layout from './components/common/Layout'
import Dashboard from './components/dashboard/Dashboard'
import TemplatesList from './components/templates/TemplatesList'
import TemplateWizard from './components/templates/TemplateWizard'
import AuditsList from './components/audits/AuditsList'
import ReportsView from './components/reports/ReportsView'
import { Template } from './lib/templates'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showTemplateWizard, setShowTemplateWizard] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | undefined>(undefined)

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />
      case 'templates':
        return <TemplatesList 
          onCreateTemplate={() => setShowTemplateWizard(true)} 
          onEditTemplate={(template) => {
            setEditingTemplate(template)
            setShowTemplateWizard(true)
          }}
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
          template={editingTemplate}
          onTemplateCreated={(template) => {
            setShowTemplateWizard(false)
            setEditingTemplate(undefined)
            // Optionally refresh the templates list
            setActiveTab('templates')
          }}
        />
      )}
    </div>
  )
}

export default App