import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Save, X, Plus, Trash2, Eye, Settings, CheckCircle } from 'lucide-react'
import { 
  AuditTemplate, 
  TemplateCategory, 
  createTemplate,
  updateTemplate,
  fetchTemplateCategories
} from '../../lib/supabase'

interface TemplateWizardProps {
  onClose: () => void
  template?: AuditTemplate
  onTemplateCreated?: (template: AuditTemplate) => void
}

interface Section {
  section_id: string
  title: string
  description: string
  order_index: number
  questions: Question[]
}

interface Question {
  question_id: string
  text: string
  type: 'text' | 'numeric' | 'single_choice' | 'multiple_choice' | 'dropdown' | 'date' | 'file_upload' | 'barcode'
  options?: string[]
  validation?: {
    mandatory: boolean
    min_value?: number
    max_value?: number
  }
  conditional_logic?: any
}

interface ConditionalRule {
  id: string
  sourceQuestionId: string
  condition: {
    operator: 'equals' | 'not_equals' | 'less_than' | 'greater_than' | 'contains'
    value: any
  }
  action: {
    type: 'show_question' | 'hide_question' | 'skip_to_section'
    targetId: string
  }
}

interface ScoringRule {
  questionId: string
  weight: number
  isCritical: boolean
}

const TemplateWizard: React.FC<TemplateWizardProps> = ({ 
  onClose, 
  template, 
  onTemplateCreated 
}) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [categories, setCategories] = useState<TemplateCategory[]>([])
  
  // Step 1: Template Setup
  const [templateData, setTemplateData] = useState({
    name: template?.name || '',
    description: template?.description || '',
    category_id: template?.category_id || '',
  })

  // Step 2: Define Sections
  const [sections, setSections] = useState<Section[]>(
    template?.sections || []
  )

  // Step 3: Questions are managed within sections
  const [selectedSectionIndex, setSelectedSectionIndex] = useState(0)

  // Step 4: Configure Logic
  const [conditionalRules, setConditionalRules] = useState<ConditionalRule[]>([])

  // Step 5: Scoring and Publish
  const [scoringEnabled, setScoringEnabled] = useState(false)
  const [scoringRules, setScoringRules] = useState<ScoringRule[]>([])
  const [complianceThreshold, setComplianceThreshold] = useState(70)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const { data, error } = await fetchTemplateCategories()
      if (error) {
        console.error('Error loading categories:', error)
      } else {
        setCategories(data || [])
      }
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const steps = [
    { id: 1, title: 'Template Setup', subtitle: 'Basic information and category' },
    { id: 2, title: 'Define Sections', subtitle: 'Organize audit structure' },
    { id: 3, title: 'Add Questions', subtitle: 'Configure questions for each section' },
    { id: 4, title: 'Configure Logic', subtitle: 'Set up conditional logic' },
    { id: 5, title: 'Scoring & Publish', subtitle: 'Configure scoring and deploy' }
  ]

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return templateData.name.trim() !== ''
      case 2:
        return sections.length > 0 && sections.every(s => s.title.trim() !== '')
      case 3:
        return sections.every(s => s.questions.length > 0)
      default:
        return true
    }
  }

  const handleSaveDraft = async () => {
    if (!templateData.name.trim()) {
      alert('Please enter a template name')
      return
    }

    setIsLoading(true)
    try {
      const templatePayload = {
        name: templateData.name,
        description: templateData.description,
        category_id: templateData.category_id || null,
        sections: sections,
        conditional_logic: { rules: conditionalRules },
        scoring_rules: { 
          enabled: scoringEnabled, 
          rules: scoringRules, 
          threshold: complianceThreshold 
        },
        validation_rules: {},
        is_published: false
      }

      let result
      if (template?.template_id) {
        result = await updateTemplate(template.template_id, templatePayload)
      } else {
        result = await createTemplate(templatePayload)
      }

      if (result.error) {
        console.error('Error saving template:', result.error)
        alert(`Failed to save template: ${result.error.message}`)
      } else if (result.data) {
        onTemplateCreated?.(result.data)
        alert('Template saved as draft successfully!')
      }
    } catch (error) {
      console.error('Error saving template:', error)
      alert('Failed to save template. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePublishTemplate = async () => {
    if (!validateCurrentStep()) {
      alert('Please complete all required fields before publishing')
      return
    }

    setIsLoading(true)
    try {
      const templatePayload = {
        name: templateData.name,
        description: templateData.description,
        category_id: templateData.category_id || null,
        sections: sections,
        conditional_logic: { rules: conditionalRules },
        scoring_rules: { 
          enabled: scoringEnabled, 
          rules: scoringRules, 
          threshold: complianceThreshold 
        },
        validation_rules: {},
        is_published: true,
        published_at: new Date().toISOString()
      }

      let result
      if (template?.template_id) {
        result = await updateTemplate(template.template_id, templatePayload)
      } else {
        result = await createTemplate(templatePayload)
      }

      if (result.error) {
        console.error('Error publishing template:', result.error)
        alert(`Failed to publish template: ${result.error.message}`)
      } else if (result.data) {
        onTemplateCreated?.(result.data)
        alert('Template published successfully!')
        onClose()
      }
    } catch (error) {
      console.error('Error publishing template:', error)
      alert('Failed to publish template. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <TemplateSetup 
          templateData={templateData} 
          setTemplateData={setTemplateData} 
          categories={categories} 
        />
      case 2:
        return <DefineSections 
          sections={sections} 
          setSections={setSections} 
        />
      case 3:
        return <AddQuestions 
          sections={sections} 
          setSections={setSections}
          selectedSectionIndex={selectedSectionIndex}
          setSelectedSectionIndex={setSelectedSectionIndex}
        />
      case 4:
        return <ConfigureLogic 
          sections={sections}
          conditionalRules={conditionalRules}
          setConditionalRules={setConditionalRules}
        />
      case 5:
        return <ScoringAndPublish 
          templateData={templateData} 
          sections={sections}
          scoringEnabled={scoringEnabled}
          setScoringEnabled={setScoringEnabled}
          scoringRules={scoringRules}
          setScoringRules={setScoringRules}
          complianceThreshold={complianceThreshold}
          setComplianceThreshold={setComplianceThreshold}
          onPublish={handlePublishTemplate} 
          isLoading={isLoading} 
        />
      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg lg:text-2xl font-bold">
                {template ? 'Edit Template' : 'Create Template'}
              </h2>
              <p className="text-blue-100 mt-1 text-sm lg:text-base">
                Step {currentStep} of 5: {steps[currentStep - 1].subtitle}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors p-1"
            >
              <X className="h-5 w-5 lg:h-6 lg:w-6" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-gray-50 px-4 lg:px-6 py-3 lg:py-4">
          <div className="flex items-center justify-between overflow-x-auto">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-shrink-0">
                <div
                  className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center text-xs lg:text-sm font-medium ${
                    currentStep >= step.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {currentStep > step.id ? <CheckCircle className="h-4 w-4" /> : step.id}
                </div>
                <div className="ml-2 lg:ml-3 hidden lg:block">
                  <p className={`text-xs lg:text-sm font-medium ${
                    currentStep >= step.id ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 lg:w-12 h-0.5 ml-2 lg:ml-4 ${
                    currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 lg:p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {renderStepContent()}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-4 lg:px-6 py-3 lg:py-4 flex flex-col lg:flex-row items-center justify-between border-t space-y-3 lg:space-y-0">
          <div className="flex items-center space-x-2 lg:space-x-3 w-full lg:w-auto">
            <button
              onClick={onClose}
              className="flex-1 lg:flex-none px-3 lg:px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm lg:text-base"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button 
              onClick={handleSaveDraft}
              disabled={isLoading}
              className="flex-1 lg:flex-none px-3 lg:px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center justify-center text-sm lg:text-base"
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Draft'}
            </button>
          </div>
          <div className="flex items-center space-x-2 lg:space-x-3 w-full lg:w-auto">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className={`flex-1 lg:flex-none px-3 lg:px-4 py-2 border border-gray-300 rounded-md transition-colors flex items-center justify-center text-sm lg:text-base ${
                currentStep === 1
                  ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                  : 'text-gray-700 bg-white hover:bg-gray-50'
              }`}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </button>
            <button
              onClick={currentStep === 5 ? handlePublishTemplate : handleNext}
              disabled={isLoading || !validateCurrentStep()}
              className={`flex-1 lg:flex-none px-3 lg:px-4 py-2 rounded-md transition-colors flex items-center justify-center text-sm lg:text-base ${
                isLoading || !validateCurrentStep()
                  ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                  : currentStep === 5
                  ? 'text-white bg-green-600 hover:bg-green-700'
                  : 'text-white bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {currentStep === 5 ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {isLoading ? 'Publishing...' : 'Publish Template'}
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Step 1: Template Setup
const TemplateSetup: React.FC<{
  templateData: any
  setTemplateData: (data: any) => void
  categories: TemplateCategory[]
}> = ({ templateData, setTemplateData, categories }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Template Setup</h3>
        <p className="text-gray-600 mb-6">Define the basic information and category for your audit template.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template Name *
            </label>
            <input
              type="text"
              value={templateData.name}
              onChange={(e) => setTemplateData({ ...templateData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter unique template name"
            />
            <p className="text-xs text-gray-500 mt-1">This will be the unique identifier for your template</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Audit Category
            </label>
            <select
              value={templateData.category_id}
              onChange={(e) => setTemplateData({ ...templateData, category_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select category</option>
              {categories.map(cat => (
                <option key={cat.category_id} value={cat.category_id}>{cat.name}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Choose the most appropriate category</p>
          </div>
        </div>
        
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Template Description
          </label>
          <textarea
            value={templateData.description}
            onChange={(e) => setTemplateData({ ...templateData, description: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Provide a brief description of the template's purpose and scope"
          />
          <p className="text-xs text-gray-500 mt-1">Describe what this audit template will be used for</p>
        </div>
      </div>
    </div>
  )
}

// Step 2: Define Sections
const DefineSections: React.FC<{
  sections: Section[]
  setSections: (sections: Section[]) => void
}> = ({ sections, setSections }) => {
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingSection, setEditingSection] = useState<Section | null>(null)
  const [newSection, setNewSection] = useState({ title: '', description: '' })

  const addSection = () => {
    if (!newSection.title.trim()) return
    
    const section: Section = {
      section_id: `section_${Date.now()}`,
      title: newSection.title,
      description: newSection.description,
      order_index: sections.length,
      questions: []
    }
    setSections([...sections, section])
    setNewSection({ title: '', description: '' })
    setShowAddModal(false)
  }

  const removeSection = (index: number) => {
    if (window.confirm('Are you sure you want to delete this section?')) {
      setSections(sections.filter((_, i) => i !== index))
    }
  }

  const updateSection = (index: number, updates: Partial<Section>) => {
    setSections(sections.map((section, i) => 
      i === index ? { ...section, ...updates } : section
    ))
  }

  const moveSection = (fromIndex: number, toIndex: number) => {
    const newSections = [...sections]
    const [movedSection] = newSections.splice(fromIndex, 1)
    newSections.splice(toIndex, 0, movedSection)
    
    // Update order_index
    newSections.forEach((section, index) => {
      section.order_index = index
    })
    
    setSections(newSections)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Define Sections</h3>
          <p className="text-gray-600 mt-1">Organize your audit into logical sections</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Section
        </button>
      </div>

      <div className="space-y-4">
        {sections.map((section, index) => (
          <div key={section.section_id} className="border border-gray-200 rounded-lg p-4 bg-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="flex flex-col space-y-1">
                  <button
                    onClick={() => index > 0 && moveSection(index, index - 1)}
                    disabled={index === 0}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => index < sections.length - 1 && moveSection(index, index + 1)}
                    disabled={index === sections.length - 1}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  >
                    ↓
                  </button>
                </div>
                <div>
                  <h4 className="text-md font-medium text-gray-900">Section {index + 1}</h4>
                  <p className="text-sm text-gray-500">{section.questions.length} questions</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setEditingSection(section)}
                  className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                >
                  <Settings className="h-4 w-4" />
                </button>
                <button
                  onClick={() => removeSection(index)}
                  className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Section Title *
                </label>
                <input
                  type="text"
                  value={section.title}
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
                  value={section.order_index + 1}
                  onChange={(e) => updateSection(index, { order_index: parseInt(e.target.value) - 1 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                />
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={section.description}
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
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500">No sections created yet. Add your first section to get started.</p>
        </div>
      )}

      {/* Add Section Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h4 className="text-lg font-semibold mb-4">Add New Section</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Section Title *
                </label>
                <input
                  type="text"
                  value={newSection.title}
                  onChange={(e) => setNewSection({ ...newSection, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter section title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newSection.description}
                  onChange={(e) => setNewSection({ ...newSection, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe what this section covers"
                />
              </div>
            </div>
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={addSection}
                disabled={!newSection.title.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Add Section
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Step 3: Add Questions
const AddQuestions: React.FC<{
  sections: Section[]
  setSections: (sections: Section[]) => void
  selectedSectionIndex: number
  setSelectedSectionIndex: (index: number) => void
}> = ({ sections, setSections, selectedSectionIndex, setSelectedSectionIndex }) => {
  const [showAddModal, setShowAddModal] = useState(false)
  const [newQuestion, setNewQuestion] = useState<Partial<Question>>({
    text: '',
    type: 'text',
    options: [],
    validation: { mandatory: false }
  })

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

  const addQuestion = () => {
    if (!newQuestion.text?.trim()) return

    const question: Question = {
      question_id: `question_${Date.now()}`,
      text: newQuestion.text,
      type: newQuestion.type as any,
      options: newQuestion.options || [],
      validation: newQuestion.validation || { mandatory: false }
    }

    const updatedSections = [...sections]
    updatedSections[selectedSectionIndex].questions.push(question)
    setSections(updatedSections)
    
    setNewQuestion({
      text: '',
      type: 'text',
      options: [],
      validation: { mandatory: false }
    })
    setShowAddModal(false)
  }

  const removeQuestion = (questionIndex: number) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      const updatedSections = [...sections]
      updatedSections[selectedSectionIndex].questions.splice(questionIndex, 1)
      setSections(updatedSections)
    }
  }

  const updateQuestion = (questionIndex: number, updates: Partial<Question>) => {
    const updatedSections = [...sections]
    updatedSections[selectedSectionIndex].questions[questionIndex] = {
      ...updatedSections[selectedSectionIndex].questions[questionIndex],
      ...updates
    }
    setSections(updatedSections)
  }

  if (sections.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Please create sections first before adding questions.</p>
      </div>
    )
  }

  const selectedSection = sections[selectedSectionIndex]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Questions</h3>
        <p className="text-gray-600 mb-6">Configure questions for each section of your audit.</p>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Section
          </label>
          <select
            value={selectedSectionIndex}
            onChange={(e) => setSelectedSectionIndex(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {sections.map((section, index) => (
              <option key={section.section_id} value={index}>
                {section.title || `Section ${index + 1}`} ({section.questions.length} questions)
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
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Question
          </button>
        </div>

        {selectedSection?.questions.map((question, index) => (
          <div key={question.question_id} className="border border-gray-200 rounded-lg p-4 bg-white">
            <div className="flex items-center justify-between mb-4">
              <h5 className="text-sm font-medium text-gray-900">Question {index + 1}</h5>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {}}
                  className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                  title="Preview Question"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  onClick={() => removeQuestion(index)}
                  className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question Text *
                </label>
                <input
                  type="text"
                  value={question.text}
                  onChange={(e) => updateQuestion(index, { text: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter question text"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question Type
                </label>
                <select
                  value={question.type}
                  onChange={(e) => updateQuestion(index, { type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {questionTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {['single_choice', 'multiple_choice', 'dropdown'].includes(question.type) && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Options (one per line)
                </label>
                <textarea
                  value={(question.options || []).join('\n')}
                  onChange={(e) => updateQuestion(index, { 
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
                  onChange={(e) => updateQuestion(index, {
                    validation: { ...question.validation, mandatory: e.target.checked }
                  })}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Mandatory</span>
              </label>
              
              {question.type === 'numeric' && (
                <>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-700">Min:</label>
                    <input
                      type="number"
                      value={question.validation?.min_value || ''}
                      onChange={(e) => updateQuestion(index, {
                        validation: { 
                          ...question.validation, 
                          min_value: e.target.value ? parseFloat(e.target.value) : undefined 
                        }
                      })}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-700">Max:</label>
                    <input
                      type="number"
                      value={question.validation?.max_value || ''}
                      onChange={(e) => updateQuestion(index, {
                        validation: { 
                          ...question.validation, 
                          max_value: e.target.value ? parseFloat(e.target.value) : undefined 
                        }
                      })}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        ))}

        {selectedSection?.questions.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
            <p className="text-gray-500">No questions added yet. Add your first question to get started.</p>
          </div>
        )}
      </div>

      {/* Add Question Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <h4 className="text-lg font-semibold mb-4">Add New Question</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question Text *
                </label>
                <input
                  type="text"
                  value={newQuestion.text || ''}
                  onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter question text"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question Type
                </label>
                <select
                  value={newQuestion.type || 'text'}
                  onChange={(e) => setNewQuestion({ ...newQuestion, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {questionTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              {['single_choice', 'multiple_choice', 'dropdown'].includes(newQuestion.type || '') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Options (one per line)
                  </label>
                  <textarea
                    value={(newQuestion.options || []).join('\n')}
                    onChange={(e) => setNewQuestion({ 
                      ...newQuestion, 
                      options: e.target.value.split('\n').filter(o => o.trim()) 
                    })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Option 1&#10;Option 2&#10;Option 3"
                  />
                </div>
              )}

              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newQuestion.validation?.mandatory || false}
                    onChange={(e) => setNewQuestion({
                      ...newQuestion,
                      validation: { ...newQuestion.validation, mandatory: e.target.checked }
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Mandatory</span>
                </label>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={addQuestion}
                disabled={!newQuestion.text?.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Add Question
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Step 4: Configure Logic
const ConfigureLogic: React.FC<{
  sections: Section[]
  conditionalRules: ConditionalRule[]
  setConditionalRules: (rules: ConditionalRule[]) => void
}> = ({ sections, conditionalRules, setConditionalRules }) => {
  const [selectedQuestionId, setSelectedQuestionId] = useState('')

  const allQuestions = sections.flatMap(section => 
    section.questions.map(q => ({ ...q, sectionTitle: section.title }))
  )

  const operators = [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not Equals' },
    { value: 'less_than', label: 'Less Than' },
    { value: 'greater_than', label: 'Greater Than' },
    { value: 'contains', label: 'Contains' }
  ]

  const addConditionalRule = () => {
    const newRule: ConditionalRule = {
      id: `rule_${Date.now()}`,
      sourceQuestionId: '',
      condition: { operator: 'equals', value: '' },
      action: { type: 'show_question', targetId: '' }
    }
    setConditionalRules([...conditionalRules, newRule])
  }

  const updateRule = (ruleId: string, updates: Partial<ConditionalRule>) => {
    setConditionalRules(conditionalRules.map(rule => 
      rule.id === ruleId ? { ...rule, ...updates } : rule
    ))
  }

  const removeRule = (ruleId: string) => {
    setConditionalRules(conditionalRules.filter(rule => rule.id !== ruleId))
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Configure Logic</h3>
        <p className="text-gray-600 mb-6">Set up conditional logic to create dynamic audit flows based on responses.</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-md font-medium text-gray-900">Conditional Rules</h4>
          <button
            onClick={addConditionalRule}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Condition
          </button>
        </div>

        {conditionalRules.map((rule) => (
          <div key={rule.id} className="border border-gray-200 rounded-lg p-4 bg-white">
            <div className="flex items-center justify-between mb-4">
              <h5 className="text-sm font-medium text-gray-900">Conditional Rule</h5>
              <button
                onClick={() => removeRule(rule.id)}
                className="text-red-500 hover:text-red-700 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Source Question
                </label>
                <select
                  value={rule.sourceQuestionId}
                  onChange={(e) => updateRule(rule.id, { sourceQuestionId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select question...</option>
                  {allQuestions.map(q => (
                    <option key={q.question_id} value={q.question_id}>
                      {q.sectionTitle}: {q.text.substring(0, 30)}...
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Condition
                </label>
                <select
                  value={rule.condition.operator}
                  onChange={(e) => updateRule(rule.id, {
                    condition: { ...rule.condition, operator: e.target.value as any }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {operators.map(op => (
                    <option key={op.value} value={op.value}>{op.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Value
                </label>
                <input
                  type="text"
                  value={rule.condition.value}
                  onChange={(e) => updateRule(rule.id, {
                    condition: { ...rule.condition, value: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter value..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Action
                </label>
                <select
                  value={rule.action.type}
                  onChange={(e) => updateRule(rule.id, {
                    action: { ...rule.action, type: e.target.value as any }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="show_question">Show Question</option>
                  <option value="hide_question">Hide Question</option>
                  <option value="skip_to_section">Skip to Section</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target
              </label>
              <select
                value={rule.action.targetId}
                onChange={(e) => updateRule(rule.id, {
                  action: { ...rule.action, targetId: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select target...</option>
                {rule.action.type === 'skip_to_section' ? (
                  sections.map(section => (
                    <option key={section.section_id} value={section.section_id}>
                      {section.title}
                    </option>
                  ))
                ) : (
                  allQuestions.map(q => (
                    <option key={q.question_id} value={q.question_id}>
                      {q.sectionTitle}: {q.text.substring(0, 30)}...
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-700">
                <strong>Rule Summary:</strong> When "{allQuestions.find(q => q.question_id === rule.sourceQuestionId)?.text || 'source question'}" 
                {' '}{operators.find(op => op.value === rule.condition.operator)?.label.toLowerCase()} "{rule.condition.value}", 
                then {rule.action.type.replace('_', ' ')} "{allQuestions.find(q => q.question_id === rule.action.targetId)?.text || sections.find(s => s.section_id === rule.action.targetId)?.title || 'target'}"
              </p>
            </div>
          </div>
        ))}

        {conditionalRules.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
            <p className="text-gray-500">No conditional rules configured. Add rules to create dynamic audit flows.</p>
          </div>
        )}
      </div>

      {allQuestions.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h5 className="font-medium text-yellow-800 mb-2">Test Logic</h5>
          <p className="text-sm text-yellow-700 mb-3">
            You can test your conditional logic by simulating responses to verify the flow works as expected.
          </p>
          <button className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors">
            Test Logic Flow
          </button>
        </div>
      )}
    </div>
  )
}

// Step 5: Scoring and Publish
const ScoringAndPublish: React.FC<{
  templateData: any
  sections: Section[]
  scoringEnabled: boolean
  setScoringEnabled: (enabled: boolean) => void
  scoringRules: ScoringRule[]
  setScoringRules: (rules: ScoringRule[]) => void
  complianceThreshold: number
  setComplianceThreshold: (threshold: number) => void
  onPublish: () => void
  isLoading: boolean
}> = ({ 
  templateData, 
  sections, 
  scoringEnabled, 
  setScoringEnabled,
  scoringRules,
  setScoringRules,
  complianceThreshold,
  setComplianceThreshold,
  onPublish, 
  isLoading 
}) => {
  const allQuestions = sections.flatMap(section => 
    section.questions.map(q => ({ ...q, sectionTitle: section.title }))
  )

  const totalQuestions = allQuestions.length
  const totalWeight = scoringRules.reduce((sum, rule) => sum + rule.weight, 0)

  const updateScoringRule = (questionId: string, weight: number, isCritical: boolean) => {
    const existingRuleIndex = scoringRules.findIndex(rule => rule.questionId === questionId)
    
    if (existingRuleIndex >= 0) {
      const updatedRules = [...scoringRules]
      updatedRules[existingRuleIndex] = { questionId, weight, isCritical }
      setScoringRules(updatedRules)
    } else {
      setScoringRules([...scoringRules, { questionId, weight, isCritical }])
    }
  }

  const getScoringRule = (questionId: string) => {
    return scoringRules.find(rule => rule.questionId === questionId) || { weight: 0, isCritical: false }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Scoring & Publish</h3>
        <p className="text-gray-600 mb-6">Configure scoring rules and publish your template for use.</p>
      </div>

      {/* Template Summary */}
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

      {/* Scoring Configuration */}
      <div className="border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-md font-medium text-gray-900">Scoring Configuration</h4>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={scoringEnabled}
              onChange={(e) => setScoringEnabled(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Enable Scoring</span>
          </label>
        </div>

        {scoringEnabled && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Compliance Threshold (%)
              </label>
              <input
                type="number"
                value={complianceThreshold}
                onChange={(e) => setComplianceThreshold(parseInt(e.target.value))}
                min="0"
                max="100"
                className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Minimum score required to pass the audit</p>
            </div>

            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-3">Question Weights</h5>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {allQuestions.map((question) => {
                  const rule = getScoringRule(question.question_id)
                  return (
                    <div key={question.question_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {question.sectionTitle}: {question.text}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center">
                          <label className="text-xs text-gray-600 mr-2">Weight:</label>
                          <input
                            type="number"
                            value={rule.weight}
                            onChange={(e) => updateScoringRule(
                              question.question_id, 
                              parseInt(e.target.value) || 0, 
                              rule.isCritical
                            )}
                            min="0"
                            max="100"
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-xs"
                          />
                        </div>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={rule.isCritical}
                            onChange={(e) => updateScoringRule(
                              question.question_id, 
                              rule.weight, 
                              e.target.checked
                            )}
                            className="mr-1"
                          />
                          <span className="text-xs text-gray-600">Critical</span>
                        </label>
                      </div>
                    </div>
                  )
                })}
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-700">
                  <strong>Total Weight:</strong> {totalWeight}% 
                  {totalWeight !== 100 && (
                    <span className="text-orange-600 ml-2">
                      (Warning: Weights should sum to 100%)
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sections Overview */}
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-900">Sections Overview</h4>
        {sections.map((section, index) => (
          <div key={section.section_id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-medium text-gray-900">{section.title}</h5>
                <p className="text-sm text-gray-500">{section.description}</p>
              </div>
              <span className="text-sm text-gray-500">
                {section.questions.length} questions
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Publish Actions */}
      <div className="flex items-center justify-between pt-6 border-t">
        <div className="text-sm text-gray-600">
          <p>Ready to publish? This will make the template available for audit assignments.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={onPublish}
            disabled={isLoading || !templateData.name || sections.length === 0}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {isLoading ? 'Publishing...' : 'Publish Template'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default TemplateWizard