import React, { useState } from 'react'
import { Plus, Edit, Copy, Trash2, Eye, FileText, Calendar, User } from 'lucide-react'
import { Template } from '../../lib/supabase'

interface TemplatesListProps {
  onCreateTemplate: () => void
}

const TemplatesList: React.FC<TemplatesListProps> = ({ onCreateTemplate }) => {
  const [templates, setTemplates] = useState<Template[]>([
    {
      template_id: '1',
      name: 'Store Merchandising Audit',
      description: 'Comprehensive audit for in-store merchandising compliance',
      category: 'Merchandising',
      sections: [],
      scoring_rules: { weights: {}, threshold: 80, critical_questions: [] },
      created_by: 'user1',
      created_at: '2024-01-15T10:30:00Z',
      updated_at: '2024-01-15T10:30:00Z',
      is_published: true
    },
    {
      template_id: '2',
      name: 'Quality Control Checklist',
      description: 'Product quality verification and compliance checks',
      category: 'Quality Control',
      sections: [],
      scoring_rules: { weights: {}, threshold: 90, critical_questions: [] },
      created_by: 'user1',
      created_at: '2024-01-10T14:20:00Z',
      updated_at: '2024-01-12T09:15:00Z',
      is_published: false
    },
    {
      template_id: '3',
      name: 'Competitor Analysis Survey',
      description: 'Track competitor products, pricing, and positioning',
      category: 'Competitor Analysis',
      sections: [],
      scoring_rules: { weights: {}, threshold: 75, critical_questions: [] },
      created_by: 'user1',
      created_at: '2024-01-08T16:45:00Z',
      updated_at: '2024-01-08T16:45:00Z',
      is_published: true
    }
  ])

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  const categories = ['All', 'Merchandising', 'Quality Control', 'Competitor Analysis', 'Stock Management', 'Pricing Compliance']

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === '' || selectedCategory === 'All' || template.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleDeleteTemplate = (templateId: string) => {
    setTemplates(templates.filter(t => t.template_id !== templateId))
  }

  const handleDuplicateTemplate = (templateId: string) => {
    const template = templates.find(t => t.template_id === templateId)
    if (template) {
      const newTemplate = {
        ...template,
        template_id: Date.now().toString(),
        name: `${template.name} (Copy)`,
        is_published: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      setTemplates([...templates, newTemplate])
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Audit Templates</h2>
          <p className="text-gray-600 mt-1">Create and manage your audit templates</p>
        </div>
        <button
          onClick={onCreateTemplate}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2 inline" />
          Create Template
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="sm:w-48">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {categories.map(category => (
              <option key={category} value={category === 'All' ? '' : category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <div key={template.template_id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      template.is_published
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {template.is_published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {template.description}
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-2" />
                  Created: {new Date(template.created_at).toLocaleDateString()}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <User className="h-4 w-4 mr-2" />
                  Category: {template.category}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  <button
                    onClick={() => {}}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    title="Edit"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDuplicateTemplate(template.template_id)}
                    className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                    title="Duplicate"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {}}
                    className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                    title="Preview"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(template.template_id)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || selectedCategory 
              ? "No templates match your current filters." 
              : "Get started by creating your first audit template."}
          </p>
          <button
            onClick={onCreateTemplate}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2 inline" />
            Create Template
          </button>
        </div>
      )}
    </div>
  )
}

export default TemplatesList