import React, { useState } from 'react'
import { ChevronLeft, ChevronRight, Save, Eye, Plus, X } from 'lucide-react'
import { Template, Section, Question } from '../../lib/supabase'
import { ConditionalQuestion, EnhancedSection } from '../../lib/conditionalLogic'
import ConditionalLogicBuilder from './ConditionalLogicBuilder'

interface TemplateWizardProps {
  onClose: () => void
  template?: Template
}

const TemplateWizard: React.FC<TemplateWizardProps> = ({ onClose, template }) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [templateData, setTemplateData] = useState<Partial<Template>>({
    name: template?.name || '',
    description: template?.description || '',
    category: template?.category || '',
    sections: template?.sections || [] as EnhancedSection[],
    scoring_rules: template?.scoring_rules || {
      weights: {},
      threshold: 80,
      critical_questions: []
    }
  })

  const steps = [
    { id: 1, title: 'Basic Information', subtitle: 'Set up template details' },
    { id: 2, title: 'Create Sections', subtitle: 'Organize your audit structure' },
    { id: 3, title: 'Add Questions', subtitle: 'Define audit questions' },
    { id: 4, title: 'Configure Logic', subtitle: 'Set conditional rules' },
    { id: 5, title: 'Scoring & Publish', subtitle: 'Finalize and deploy' }
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

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <BasicInformation templateData={templateData} setTemplateData={setTemplateData} />
      case 2:
        return <CreateSections templateData={templateData} setTemplateData={setTemplateData} />
      case 3:
        return <AddQuestions templateData={templateData} setTemplateData={setTemplateData} />
      case 4:
        return <ConfigureLogic templateData={templateData} setTemplateData={setTemplateData} />
      case 5:
        return <ScoringAndPublish templateData={templateData} setTemplateData={setTemplateData} />
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
              <h2 className="text-2xl font-bold">Template Creation Wizard</h2>
              <p className="text-blue-100 mt-1">
                Step {currentStep} of 5: {steps[currentStep - 1].subtitle}
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
            >
              Cancel
            </button>
            <button className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
              <Save className="h-4 w-4 mr-2 inline" />
              Save Draft
            </button>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className={`px-4 py-2 border border-gray-300 rounded-md transition-colors ${
                currentStep === 1
                  ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                  : 'text-gray-700 bg-white hover:bg-gray-50'
              }`}
            >
              <ChevronLeft className="h-4 w-4 mr-2 inline" />
              Previous
            </button>
            <button
              onClick={handleNext}
              disabled={currentStep === 5}
              className={`px-4 py-2 rounded-md transition-colors ${
                currentStep === 5
                  ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                  : 'text-white bg-blue-600 hover:bg-blue-700'
              }`}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2 inline" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Step 1: Basic Information
const BasicInformation: React.FC<{
  templateData: Partial<Template>
  setTemplateData: (data: Partial<Template>) => void
}> = ({ templateData, setTemplateData }) => {
  const categories = [
    'Merchandising',
    'Stock Management',
    'Quality Control',
    'Competitor Analysis',
    'Pricing Compliance',
    'Brand Visibility'
  ]

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
              value={templateData.category || ''}
              onChange={(e) => setTemplateData({ ...templateData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
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

// Step 2: Create Sections
const CreateSections: React.FC<{
  templateData: Partial<Template>
  setTemplateData: (data: Partial<Template>) => void
}> = ({ templateData, setTemplateData }) => {
  const addSection = () => {
    const newSection: Section = {
      section_id: `section_${Date.now()}`,
      title: '',
      description: '',
      order_index: (templateData.sections?.length || 0) + 1,
      questions: []
    }
    setTemplateData({
      ...templateData,
      sections: [...(templateData.sections || []), newSection]
    })
  }

  const removeSection = (sectionId: string) => {
    setTemplateData({
      ...templateData,
      sections: templateData.sections?.filter(s => s.section_id !== sectionId) || []
    })
  }

  const updateSection = (sectionId: string, updates: Partial<Section>) => {
    setTemplateData({
      ...templateData,
      sections: templateData.sections?.map(s => 
        s.section_id === sectionId ? { ...s, ...updates } : s
      ) || []
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Create Sections</h3>
        <button
          onClick={addSection}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2 inline" />
          Add Section
        </button>
      </div>

      <div className="space-y-4">
        {templateData.sections?.map((section, index) => (
          <div key={section.section_id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-medium text-gray-900">Section {index + 1}</h4>
              <button
                onClick={() => removeSection(section.section_id)}
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
                  value={section.title}
                  onChange={(e) => updateSection(section.section_id, { title: e.target.value })}
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
                  value={section.order_index}
                  onChange={(e) => updateSection(section.section_id, { order_index: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={section.description}
                onChange={(e) => updateSection(section.section_id, { description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe what this section covers"
              />
            </div>
          </div>
        ))}
      </div>

      {(!templateData.sections || templateData.sections.length === 0) && (
        <div className="text-center py-8">
          <p className="text-gray-500">No sections created yet. Add your first section to get started.</p>
        </div>
      )}
    </div>
  )
}

// Step 3: Add Questions
const AddQuestions: React.FC<{
  templateData: Partial<Template>
  setTemplateData: (data: Partial<Template>) => void
}> = ({ templateData, setTemplateData }) => {
  const [selectedSectionId, setSelectedSectionId] = useState<string>('')

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

  const addQuestion = (sectionId: string) => {
    const newQuestion: Question = {
      question_id: `question_${Date.now()}`,
      text: '',
      type: 'text',
      options: [],
      validation: {
        mandatory: false
      }
    }

    setTemplateData({
      ...templateData,
      sections: templateData.sections?.map(section =>
        section.section_id === sectionId
          ? { ...section, questions: [...section.questions, newQuestion] }
          : section
      ) || []
    })
  }

  const removeQuestion = (sectionId: string, questionId: string) => {
    setTemplateData({
      ...templateData,
      sections: templateData.sections?.map(section =>
        section.section_id === sectionId
          ? { ...section, questions: section.questions.filter(q => q.question_id !== questionId) }
          : section
      ) || []
    })
  }

  const updateQuestion = (sectionId: string, questionId: string, updates: Partial<Question>) => {
    setTemplateData({
      ...templateData,
      sections: templateData.sections?.map(section =>
        section.section_id === sectionId
          ? {
              ...section,
              questions: section.questions.map(q =>
                q.question_id === questionId ? { ...q, ...updates } : q
              )
            }
          : section
      ) || []
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Questions</h3>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Section
          </label>
          <select
            value={selectedSectionId}
            onChange={(e) => setSelectedSectionId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select a section to add questions</option>
            {templateData.sections?.map(section => (
              <option key={section.section_id} value={section.section_id}>
                {section.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedSectionId && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-medium text-gray-900">
              Questions for: {templateData.sections?.find(s => s.section_id === selectedSectionId)?.title}
            </h4>
            <button
              onClick={() => addQuestion(selectedSectionId)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2 inline" />
              Add Question
            </button>
          </div>

          {templateData.sections?.find(s => s.section_id === selectedSectionId)?.questions.map((question, index) => (
            <div key={question.question_id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h5 className="text-sm font-medium text-gray-900">Question {index + 1}</h5>
                <button
                  onClick={() => removeQuestion(selectedSectionId, question.question_id)}
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
                    value={question.text}
                    onChange={(e) => updateQuestion(selectedSectionId, question.question_id, { text: e.target.value })}
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
                    onChange={(e) => updateQuestion(selectedSectionId, question.question_id, { type: e.target.value as any })}
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
                    value={question.options?.join('\n') || ''}
                    onChange={(e) => updateQuestion(selectedSectionId, question.question_id, { 
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
                    onChange={(e) => updateQuestion(selectedSectionId, question.question_id, {
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
                        onChange={(e) => updateQuestion(selectedSectionId, question.question_id, {
                          validation: { ...question.validation, min_value: parseFloat(e.target.value) }
                        })}
                        className="w-20 px-2 py-1 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <label className="text-sm text-gray-700">Max:</label>
                      <input
                        type="number"
                        value={question.validation?.max_value || ''}
                        onChange={(e) => updateQuestion(selectedSectionId, question.question_id, {
                          validation: { ...question.validation, max_value: parseFloat(e.target.value) }
                        })}
                        className="w-20 px-2 py-1 border border-gray-300 rounded-md"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Step 4: Configure Logic
const ConfigureLogic: React.FC<{
  templateData: Partial<Template>
  setTemplateData: (data: Partial<Template>) => void
}> = ({ templateData, setTemplateData }) => {
  const [selectedSectionId, setSelectedSectionId] = useState<string>('')

  const updateSectionQuestions = (sectionId: string, questions: ConditionalQuestion[]) => {
    setTemplateData({
      ...templateData,
      sections: templateData.sections?.map(section =>
        section.section_id === sectionId
          ? { ...section, questions }
          : section
      ) || []
    })
  }

  const selectedSection = templateData.sections?.find(s => s.section_id === selectedSectionId)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Configure Logic</h3>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Section to Configure Logic
          </label>
          <select
            value={selectedSectionId}
            onChange={(e) => setSelectedSectionId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select a section...</option>
            {templateData.sections?.map(section => (
              <option key={section.section_id} value={section.section_id}>
                {section.title}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {selectedSectionId && selectedSection ? (
        <ConditionalLogicBuilder
          questions={selectedSection.questions as ConditionalQuestion[]}
          onQuestionsChange={(questions) => updateSectionQuestions(selectedSectionId, questions)}
        />
      ) : (
        <div className="border border-gray-200 rounded-lg p-8 text-center">
          <h4 className="text-md font-medium text-gray-900 mb-2">Select a Section</h4>
          <p className="text-gray-500">
            Choose a section from the dropdown above to configure conditional logic for its questions.
          </p>
        </div>
      )}
    </div>
  )
}

// Step 5: Scoring and Publish
const ScoringAndPublish: React.FC<{
  templateData: Partial<Template>
  setTemplateData: (data: Partial<Template>) => void
}> = ({ templateData, setTemplateData }) => {
  const [scoringEnabled, setScoringEnabled] = useState(false)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Scoring & Publish</h3>
        
        <div className="mb-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={scoringEnabled}
              onChange={(e) => setScoringEnabled(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm font-medium text-gray-700">Enable Scoring</span>
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
                value={templateData.scoring_rules?.threshold || 80}
                onChange={(e) => setTemplateData({
                  ...templateData,
                  scoring_rules: {
                    ...templateData.scoring_rules,
                    threshold: parseInt(e.target.value)
                  }
                })}
                className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                max="100"
              />
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Section Weights</h4>
              <div className="space-y-2">
                {templateData.sections?.map(section => (
                  <div key={section.section_id} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{section.title}</span>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={templateData.scoring_rules?.weights?.[section.section_id] || 0}
                        onChange={(e) => setTemplateData({
                          ...templateData,
                          scoring_rules: {
                            ...templateData.scoring_rules,
                            weights: {
                              ...templateData.scoring_rules?.weights,
                              [section.section_id]: parseInt(e.target.value)
                            }
                          }
                        })}
                        className="w-16 px-2 py-1 border border-gray-300 rounded-md"
                        min="0"
                        max="100"
                      />
                      <span className="text-sm text-gray-500">%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-md font-medium text-gray-900 mb-2">Template Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Name:</span>
              <span className="ml-2 font-medium">{templateData.name}</span>
            </div>
            <div>
              <span className="text-gray-600">Category:</span>
              <span className="ml-2 font-medium">{templateData.category}</span>
            </div>
            <div>
              <span className="text-gray-600">Sections:</span>
              <span className="ml-2 font-medium">{templateData.sections?.length || 0}</span>
            </div>
            <div>
              <span className="text-gray-600">Total Questions:</span>
              <span className="ml-2 font-medium">
                {templateData.sections?.reduce((total, section) => total + section.questions.length, 0) || 0}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
            Publish Template
          </button>
          <button className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors">
            <Eye className="h-4 w-4 mr-2 inline" />
            Preview Template
          </button>
        </div>
      </div>
    </div>
  )
}

export default TemplateWizard