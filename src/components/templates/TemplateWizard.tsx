import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Save, X, Plus } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { 
  Template, 
  TemplateCategory, 
  TemplateSection, 
  TemplateQuestion,
  createTemplate,
  updateTemplate,
  publishTemplate,
  fetchTemplateCategories,
  createTemplateSection,
  createTemplateQuestion,
  fetchTemplateById
} from '../../lib/templates'

interface TemplateWizardProps {
  onClose: () => void
  template?: Template
  onTemplateCreated?: (template: Template) => void
}

const TemplateWizard: React.FC<TemplateWizardProps> = ({ 
  onClose, 
  template, 
  onTemplateCreated 
}) => {
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [categories, setCategories] = useState<TemplateCategory[]>([])
  
  const [templateData, setTemplateData] = useState<Partial<Template>>({
    id: template?.id,
    name: template?.name || '',
    description: template?.description || '',
    category_id: template?.category_id || '',
    version: template?.version || 1,
    conditional_logic: template?.conditional_logic || {},
    scoring_rules: template?.scoring_rules || {
      weights: {},
      threshold: 80,
      critical_questions: []
    },
    validation_rules: template?.validation_rules || {},
    is_published: template?.is_published || false,
    is_active: template?.is_active !== false
  })

  const [sections, setSections] = useState<Partial<TemplateSection>[]>([])
  const [questions, setQuestions] = useState<Record<string, Partial<TemplateQuestion>[]>>({})

  useEffect(() => {
    loadCategories()
    if (template?.id) {
      loadTemplateDetails(template.id)
    }
  }, [template])

  const loadCategories = async () => {
    try {
      const { data, error } = await fetchTemplateCategories()
      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const loadTemplateDetails = async (templateId: string) => {
    try {
      const { data, error } = await fetchTemplateById(templateId)
      if (error) throw error
      
      if (data) {
        setTemplateData(data)
        setSections(data.sections || [])
        
        // Convert sections and questions to local state
        const questionsMap: Record<string, Partial<TemplateQuestion>[]> = {}
        data.sections?.forEach(section => {
          questionsMap[section.id] = section.questions || []
        })
        setQuestions(questionsMap)
      }
    } catch (error) {
      console.error('Error loading template details:', error)
    }
  }

  if (!user) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-4">Please sign in to create templates.</p>
          <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded-md">
            Close
          </button>
        </div>
      </div>
    )
  }

  const steps = [
    { id: 1, title: 'Basic Information', subtitle: 'Set up template details' },
    { id: 2, title: 'Create Sections', subtitle: 'Organize your audit structure' },
    { id: 3, title: 'Add Questions', subtitle: 'Define audit questions' },
    { id: 4, title: 'Review & Publish', subtitle: 'Finalize and deploy' }
  ]

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSaveDraft = async () => {
    setIsLoading(true)
    try {
      let savedTemplate: Template

      if (templateData.id) {
        // Update existing template
        const { data, error } = await updateTemplate(templateData.id, {
          ...templateData,
          is_published: false
        })
        if (error) throw error
        savedTemplate = data!
      } else {
        // Create new template
        const { data, error } = await createTemplate({
          ...templateData,
          is_published: false
        })
        if (error) throw error
        savedTemplate = data!
      }

      // Save sections and questions
      await saveSectionsAndQuestions(savedTemplate.id)
      
      setTemplateData(prev => ({ ...prev, id: savedTemplate.id }))
      onTemplateCreated?.(savedTemplate)
      alert('Template saved as draft successfully!')
    } catch (error) {
      console.error('Error saving template:', error)
      alert('Failed to save template. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePublishTemplate = async () => {
    if (!templateData.name || sections.length === 0) {
      alert('Please complete the template before publishing.')
      return
    }

    setIsLoading(true)
    try {
      let savedTemplate: Template

      if (templateData.id) {
        // Update and publish existing template
        const { data, error } = await publishTemplate(templateData.id)
        if (error) throw error
        savedTemplate = data!
      } else {
        // Create and publish new template
        const { data: createdTemplate, error: createError } = await createTemplate({
          ...templateData,
          is_published: false
        })
        if (createError) throw createError
        
        const { data: publishedTemplate, error: publishError } = await publishTemplate(createdTemplate!.id)
        if (publishError) throw publishError
        savedTemplate = publishedTemplate!
      }

      // Save sections and questions
      await saveSectionsAndQuestions(savedTemplate.id)
      
      onTemplateCreated?.(savedTemplate)
      alert('Template published successfully!')
      onClose()
    } catch (error) {
      console.error('Error publishing template:', error)
      alert('Failed to publish template. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const saveSectionsAndQuestions = async (templateId: string) => {
    // Save sections
    for (const section of sections) {
      if (!section.id) {
        const { data: savedSection, error } = await createTemplateSection({
          ...section,
          template_id: templateId
        })
        if (error) throw error
        
        // Save questions for this section
        const sectionQuestions = questions[section.title || ''] || []
        for (const question of sectionQuestions) {
          await createTemplateQuestion({
            ...question,
            section_id: savedSection!.id
          })
        }
      }
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <BasicInformation 
          templateData={templateData} 
          setTemplateData={setTemplateData} 
          categories={categories} 
        />
      case 2:
        return <CreateSections 
          sections={sections} 
          setSections={setSections} 
        />
      case 3:
        return <AddQuestions 
          sections={sections} 
          questions={questions} 
          setQuestions={setQuestions} 
        />
      case 4:
        return <ReviewAndPublish 
          templateData={templateData} 
          sections={sections} 
          questions={questions}
          onPublish={handlePublishTemplate} 
          isLoading={isLoading} 
        />
      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                {template ? 'Edit Template' : 'Create Template'}
              </h2>
              <p className="text-blue-100 mt-1">
                Step {currentStep} of 4: {steps[currentStep - 1].subtitle}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-gray-50 px-6 py-4">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= step.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step.id}
                </div>
                <div className="ml-3 hidden sm:block">
                  <p className={`text-sm font-medium ${
                    currentStep >= step.id ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-0.5 ml-4 ${
                    currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {renderStepContent()}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button 
              onClick={handleSaveDraft}
              disabled={isLoading}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Draft'}
            </button>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className={`px-4 py-2 border border-gray-300 rounded-md transition-colors flex items-center ${
                currentStep === 1
                  ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                  : 'text-gray-700 bg-white hover:bg-gray-50'
              }`}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </button>
            <button
              onClick={handleNext}
              disabled={currentStep === 4}
              className={`px-4 py-2 rounded-md transition-colors flex items-center ${
                currentStep === 4 || isLoading
                  ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                  : 'text-white bg-blue-600 hover:bg-blue-700'
              }`}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Step Components
const BasicInformation: React.FC<{
  templateData: Partial<Template>
  setTemplateData: (data: Partial<Template>) => void
  categories: TemplateCategory[]
}> = ({ templateData, setTemplateData, categories }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Template Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template Name *
            </label>
            <input
              type="text"
              value={templateData.name || ''}
              onChange={(e) => setTemplateData({ ...templateData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter template name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={templateData.category_id || ''}
              onChange={(e) => setTemplateData({ ...templateData, category_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={templateData.description || ''}
            onChange={(e) => setTemplateData({ ...templateData, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Describe the purpose and scope of this audit template"
          />
        </div>
      </div>
    </div>
  )
}

const CreateSections: React.FC<{
  sections: Partial<TemplateSection>[]
  setSections: (sections: Partial<TemplateSection>[]) => void
}> = ({ sections, setSections }) => {
  const addSection = () => {
    const newSection: Partial<TemplateSection> = {
      id: `temp_${Date.now()}`,
      title: '',
      description: '',
      order_index: sections.length
    }
    setSections([...sections, newSection])
  }

  const removeSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index))
  }

  const updateSection = (index: number, updates: Partial<TemplateSection>) => {
    setSections(sections.map((section, i) => 
      i === index ? { ...section, ...updates } : section
    ))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Create Sections</h3>
        <button
          onClick={addSection}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Section
        </button>
      </div>

      <div className="space-y-4">
        {sections.map((section, index) => (
          <div key={section.id || index} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-medium text-gray-900">Section {index + 1}</h4>
              <button
                onClick={() => removeSection(index)}
                className="text-red-500 hover:text-red-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Section Title *
                </label>
                <input
                  type="text"
                  value={section.title || ''}
                  onChange={(e) => updateSection(index, { title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter section title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order
                </label>
                <input
                  type="number"
                  value={section.order_index || 0}
                  onChange={(e) => updateSection(index, { order_index: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={section.description || ''}
                onChange={(e) => updateSection(index, { description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe what this section covers"
              />
            </div>
          </div>
        ))}
      </div>

      {sections.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No sections created yet. Add your first section to get started.</p>
        </div>
      )}
    </div>
  )
}

const AddQuestions: React.FC<{
  sections: Partial<TemplateSection>[]
  questions: Record<string, Partial<TemplateQuestion>[]>
  setQuestions: (questions: Record<string, Partial<TemplateQuestion>[]>) => void
}> = ({ sections, questions, setQuestions }) => {
  const [selectedSectionIndex, setSelectedSectionIndex] = useState<number>(0)

  const questionTypes = [
    { value: 'text', label: 'Text Input' },
    { value: 'numeric', label: 'Numeric Input' },
    { value: 'single_choice', label: 'Single Choice' },
    { value: 'multiple_choice', label: 'Multiple Choice' },
    { value: 'dropdown', label: 'Dropdown' },
    { value: 'date', label: 'Date/Time' },
    { value: 'file_upload', label: 'File Upload' },
    { value: 'barcode', label: 'Barcode Scanner' }
  ]

  const addQuestion = (sectionTitle: string) => {
    const newQuestion: Partial<TemplateQuestion> = {
      id: `temp_${Date.now()}`,
      text: '',
      type: 'text',
      options: [],
      validation: { mandatory: false },
      conditional_logic: {},
      order_index: (questions[sectionTitle] || []).length
    }

    setQuestions({
      ...questions,
      [sectionTitle]: [...(questions[sectionTitle] || []), newQuestion]
    })
  }

  const removeQuestion = (sectionTitle: string, questionIndex: number) => {
    const sectionQuestions = questions[sectionTitle] || []
    setQuestions({
      ...questions,
      [sectionTitle]: sectionQuestions.filter((_, i) => i !== questionIndex)
    })
  }

  const updateQuestion = (sectionTitle: string, questionIndex: number, updates: Partial<TemplateQuestion>) => {
    const sectionQuestions = questions[sectionTitle] || []
    setQuestions({
      ...questions,
      [sectionTitle]: sectionQuestions.map((q, i) => 
        i === questionIndex ? { ...q, ...updates } : q
      )
    })
  }

  if (sections.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Please create sections first before adding questions.</p>
      </div>
    )
  }

  const selectedSection = sections[selectedSectionIndex]
  const sectionQuestions = questions[selectedSection?.title || ''] || []

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Questions</h3>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Section
          </label>
          <select
            value={selectedSectionIndex}
            onChange={(e) => setSelectedSectionIndex(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {sections.map((section, index) => (
              <option key={section.id || index} value={index}>
                {section.title || `Section ${index + 1}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-md font-medium text-gray-900">
            Questions for: {selectedSection?.title || 'Selected Section'}
          </h4>
          <button
            onClick={() => addQuestion(selectedSection?.title || '')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Question
          </button>
        </div>

        {sectionQuestions.map((question, index) => (
          <div key={question.id || index} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h5 className="text-sm font-medium text-gray-900">Question {index + 1}</h5>
              <button
                onClick={() => removeQuestion(selectedSection?.title || '', index)}
                className="text-red-500 hover:text-red-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question Text *
                </label>
                <input
                  type="text"
                  value={question.text || ''}
                  onChange={(e) => updateQuestion(selectedSection?.title || '', index, { text: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter question text"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question Type
                </label>
                <select
                  value={question.type || 'text'}
                  onChange={(e) => updateQuestion(selectedSection?.title || '', index, { type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {questionTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {['single_choice', 'multiple_choice', 'dropdown'].includes(question.type || '') && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Options (one per line)
                </label>
                <textarea
                  value={(question.options || []).join('\n')}
                  onChange={(e) => updateQuestion(selectedSection?.title || '', index, { 
                    options: e.target.value.split('\n').filter(o => o.trim()) 
                  })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Option 1&#10;Option 2&#10;Option 3"
                />
              </div>
            )}

            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={question.validation?.mandatory || false}
                  onChange={(e) => updateQuestion(selectedSection?.title || '', index, {
                    validation: { ...question.validation, mandatory: e.target.checked }
                  })}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Mandatory</span>
              </label>
            </div>
          </div>
        ))}

        {sectionQuestions.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No questions added yet. Add your first question to get started.</p>
          </div>
        )}
      </div>
    </div>
  )
}

const ReviewAndPublish: React.FC<{
  templateData: Partial<Template>
  sections: Partial<TemplateSection>[]
  questions: Record<string, Partial<TemplateQuestion>[]>
  onPublish: () => void
  isLoading: boolean
}> = ({ templateData, sections, questions, onPublish, isLoading }) => {
  const totalQuestions = Object.values(questions).reduce((total, sectionQuestions) => 
    total + sectionQuestions.length, 0
  )

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Review & Publish</h3>
        
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">Template Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Name:</span>
              <span className="ml-2 font-medium">{templateData.name || 'Untitled'}</span>
            </div>
            <div>
              <span className="text-gray-600">Description:</span>
              <span className="ml-2 font-medium">{templateData.description || 'No description'}</span>
            </div>
            <div>
              <span className="text-gray-600">Sections:</span>
              <span className="ml-2 font-medium">{sections.length}</span>
            </div>
            <div>
              <span className="text-gray-600">Total Questions:</span>
              <span className="ml-2 font-medium">{totalQuestions}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900">Sections Overview</h4>
          {sections.map((section, index) => {
            const sectionQuestions = questions[section.title || ''] || []
            return (
              <div key={section.id || index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium text-gray-900">{section.title}</h5>
                    <p className="text-sm text-gray-500">{section.description}</p>
                  </div>
                  <span className="text-sm text-gray-500">
                    {sectionQuestions.length} questions
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex items-center space-x-4 pt-6">
          <button 
            onClick={onPublish}
            disabled={isLoading || !templateData.name || sections.length === 0}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Publishing...' : 'Publish Template'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default TemplateWizard