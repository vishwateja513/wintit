import React, { useState, useEffect } from 'react'
import { Plus, Edit, Copy, Trash2, Eye, FileText, Calendar, User, Search, Filter } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { 
  Template, 
  TemplateCategory,
  fetchTemplates, 
  fetchTemplateCategories,
  deleteTemplate,
  subscribeToTemplates,
  createTemplate
} from '../../lib/templates'

interface TemplatesListProps {
  onCreateTemplate: () => void
  onEditTemplate?: (template: Template) => void
  onTemplateUpdated?: () => void
}

const TemplatesList: React.FC<TemplatesListProps> = ({ 
  onCreateTemplate, 
  onEditTemplate,
  onTemplateUpdated 
}) => {
  const { user } = useAuth()
  const [templates, setTemplates] = useState<Template[]>([])
  const [categories, setCategories] = useState<TemplateCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  useEffect(() => {
    if (user) {
      loadTemplates()
      loadCategories()
      
      // Set up real-time subscription
      const subscription = subscribeToTemplates((payload) => {
        console.log('Real-time template update:', payload)
        
        if (payload.eventType === 'INSERT') {
          setTemplates(prev => [payload.new, ...prev])
        } else if (payload.eventType === 'UPDATE') {
          setTemplates(prev => prev.map(template => 
            template.id === payload.new.id ? { ...template, ...payload.new } : template
          ))
        } else if (payload.eventType === 'DELETE') {
          setTemplates(prev => prev.filter(template => 
            template.id !== payload.old.id
          ))
        }
      })
      
      return () => {
        subscription.unsubscribe()
      }
    }
  }, [user])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const { data, error } = await fetchTemplates()
      if (error) throw error
      setTemplates(data || [])
    } catch (error) {
      console.error('Error loading templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const { data, error } = await fetchTemplateCategories()
      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === '' || template.category_id === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleDeleteTemplate = async (templateId: string) => {
    if (!window.confirm('Are you sure you want to delete this template?')) {
      return
    }
    
    try {
      const { error } = await deleteTemplate(templateId)
      if (error) throw error
      
      // Template will be removed via real-time subscription
      alert('Template deleted successfully!')
    } catch (error) {
      console.error('Error deleting template:', error)
      alert('Failed to delete template. Please try again.')
    }
  }

  const handleDuplicateTemplate = async (template: Template) => {
    try {
      const { data, error } = await createTemplate({
        name: `${template.name} (Copy)`,
        description: template.description,
        category_id: template.category_id,
        conditional_logic: template.conditional_logic,
        scoring_rules: template.scoring_rules,
        validation_rules: template.validation_rules,
        is_published: false
      })
      
      if (error) throw error
      
      // Template will be added via real-time subscription
      alert('Template duplicated successfully!')
    } catch (error) {
      console.error('Error duplicating template:', error)
      alert('Failed to duplicate template. Please try again.')
    }
  }

  if (!user) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
          <p className="text-gray-500">Please sign in to manage templates.</p>
        </div>
      </div>
    )
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
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="sm:w-48 relative">
          <Filter className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading templates...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <div key={template.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: template.category?.color + '20' }}
                    >
                      <FileText 
                        className="h-5 w-5" 
                        style={{ color: template.category?.color || '#3B82F6' }}
                      />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                        {template.name}
                      </h3>
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
                  {template.description || 'No description provided'}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-2" />
                    Created: {new Date(template.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <User className="h-4 w-4 mr-2" />
                    Version: {template.version}
                  </div>
                  {template.category && (
                    <div className="flex items-center text-sm text-gray-500">
                      <FileText className="h-4 w-4 mr-2" />
                      Category: {template.category.name}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onEditTemplate?.(template)}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDuplicateTemplate(template)}
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
                  </div>
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredTemplates.length === 0 && !loading && (
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
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center mx-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </button>
        </div>
      )}
    </div>
  )
}

export default TemplatesList