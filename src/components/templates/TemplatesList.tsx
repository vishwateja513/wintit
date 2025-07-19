import React, { useState, useEffect } from 'react'
import { Plus, Edit, Copy, Trash2, Eye, FileText, Calendar, User, Search, Filter, RefreshCw } from 'lucide-react'
import { 
  AuditTemplate, 
  TemplateCategory,
  fetchTemplates, 
  fetchTemplateCategories,
  deleteTemplate,
  subscribeToTemplates,
  createTemplate
} from '../../lib/supabase'

interface TemplatesListProps {
  onCreateTemplate: () => void
  onEditTemplate?: (template: AuditTemplate) => void
  onTemplateUpdated?: () => void
}

const TemplatesList: React.FC<TemplatesListProps> = ({ 
  onCreateTemplate, 
  onEditTemplate,
  onTemplateUpdated 
}) => {
  const [templates, setTemplates] = useState<AuditTemplate[]>([])
  const [categories, setCategories] = useState<TemplateCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadData()
    
    // Set up real-time subscription
    const subscription = subscribeToTemplates((payload) => {
      console.log('Real-time template update:', payload)
      
      if (payload.eventType === 'INSERT') {
        setTemplates(prev => [payload.new, ...prev])
      } else if (payload.eventType === 'UPDATE') {
        setTemplates(prev => prev.map(template => 
          template.template_id === payload.new.template_id ? { ...template, ...payload.new } : template
        ))
      } else if (payload.eventType === 'DELETE') {
        setTemplates(prev => prev.filter(template => 
          template.template_id !== payload.old.template_id
        ))
      }
    })
    
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load templates and categories in parallel
      const [templatesResult, categoriesResult] = await Promise.all([
        fetchTemplates(),
        fetchTemplateCategories()
      ])
      
      if (templatesResult.error) {
        console.error('Error loading templates:', templatesResult.error)
      } else {
        setTemplates(templatesResult.data || [])
      }
      
      if (categoriesResult.error) {
        console.error('Error loading categories:', categoriesResult.error)
      } else {
        setCategories(categoriesResult.data || [])
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    loadData()
  }

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === '' || template.category_id === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleDeleteTemplate = async (templateId: string, templateName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${templateName}"?`)) {
      return
    }
    
    try {
      const { error } = await deleteTemplate(templateId)
      if (error) {
        console.error('Error deleting template:', error)
        alert('Failed to delete template. Please try again.')
      } else {
        // Remove from local state immediately for better UX
        setTemplates(prev => prev.filter(t => t.template_id !== templateId))
        alert('Template deleted successfully!')
      }
    } catch (error) {
      console.error('Error deleting template:', error)
      alert('Failed to delete template. Please try again.')
    }
  }

  const handleDuplicateTemplate = async (template: AuditTemplate) => {
    try {
      const { data, error } = await createTemplate({
        name: `${template.name} (Copy)`,
        description: template.description,
        category_id: template.category_id,
        sections: template.sections,
        conditional_logic: template.conditional_logic,
        scoring_rules: template.scoring_rules,
        validation_rules: template.validation_rules,
        is_published: false
      })
      
      if (error) {
        console.error('Error duplicating template:', error)
        alert('Failed to duplicate template. Please try again.')
      } else if (data) {
        // Add to local state immediately for better UX
        setTemplates(prev => [data, ...prev])
        alert('Template duplicated successfully!')
      }
    } catch (error) {
      console.error('Error duplicating template:', error)
      alert('Failed to duplicate template. Please try again.')
    }
  }

  const getCategoryById = (categoryId: string) => {
    return categories.find(cat => cat.category_id === categoryId)
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-gray-900">Audit Templates</h2>
          <p className="text-sm lg:text-base text-gray-600 mt-1">Create and manage your audit templates</p>
        </div>
        <div className="flex items-center space-x-2 lg:space-x-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-3 lg:px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center disabled:opacity-50 text-sm lg:text-base"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={onCreateTemplate}
            className="px-3 lg:px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center text-sm lg:text-base"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Create</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-3 lg:space-y-0 lg:flex lg:gap-4">
        <div className="flex-1 relative">
          <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm lg:text-base"
          />
        </div>
        <div className="lg:w-48 relative">
          <Filter className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none text-sm lg:text-base"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category.category_id} value={category.category_id}>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
          {filteredTemplates.map((template) => {
            const category = getCategoryById(template.category_id || '')
            return (
              <div key={template.template_id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="p-4 lg:p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div 
                        className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: (category?.color || '#3B82F6') + '20' }}
                      >
                        <FileText 
                          className="h-4 w-4 lg:h-5 lg:w-5" 
                          style={{ color: category?.color || '#3B82F6' }}
                        />
                      </div>
                      <div className="ml-2 lg:ml-3">
                        <h3 className="text-base lg:text-lg font-semibold text-gray-900 line-clamp-1">
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

                  <p className="text-gray-600 text-xs lg:text-sm mb-4 line-clamp-2">
                    {template.description || 'No description provided'}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-xs lg:text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-2" />
                      Created: {new Date(template.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center text-xs lg:text-sm text-gray-500">
                      <User className="h-4 w-4 mr-2" />
                      Version: {template.version}
                    </div>
                    {category && (
                      <div className="flex items-center text-xs lg:text-sm text-gray-500">
                        <FileText className="h-4 w-4 mr-2" />
                        Category: {category.name}
                      </div>
                    )}
                    <div className="flex items-center text-xs lg:text-sm text-gray-500">
                      <FileText className="h-4 w-4 mr-2" />
                      Sections: {template.sections?.length || 0}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex space-x-1 lg:space-x-2">
                      <button
                        onClick={() => onEditTemplate?.(template)}
                        className="p-1.5 lg:p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="Edit"
                      >
                        <Edit className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                      </button>
                      <button
                        onClick={() => handleDuplicateTemplate(template)}
                        className="p-1.5 lg:p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                        title="Duplicate"
                      >
                        <Copy className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                      </button>
                      <button
                        onClick={() => {}}
                        className="p-1.5 lg:p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                        title="Preview"
                      >
                        <Eye className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => handleDeleteTemplate(template.template_id, template.name)}
                      className="p-1.5 lg:p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {filteredTemplates.length === 0 && !loading && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 lg:h-16 lg:w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-base lg:text-lg font-medium text-gray-900 mb-2">No templates found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || selectedCategory 
              ? "No templates match your current filters." 
              : "Get started by creating your first audit template."}
          </p>
          <button
            onClick={onCreateTemplate}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center mx-auto text-sm lg:text-base"
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