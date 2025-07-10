import React, { useState } from 'react'
import { ChevronLeft, ChevronRight, Save, Send, Camera, BarChart, CheckCircle } from 'lucide-react'
import { Audit, Question, Section } from '../../lib/supabase'
import { ConditionalLogicEngine, ConditionalQuestion, EnhancedSection } from '../../lib/conditionalLogic'

interface AuditExecutionProps {
  audit: Audit
  onClose: () => void
}

const AuditExecution: React.FC<AuditExecutionProps> = ({ audit, onClose }) => {
  const [currentSection, setCurrentSection] = useState(0)
  const [responses, setResponses] = useState<Record<string, any>>(audit.responses || {})
  const [isOffline, setIsOffline] = useState(false)

  // Enhanced sample sections with conditional logic for demonstration
  const sections: EnhancedSection[] = [
    {
      section_id: 'availability',
      title: 'Product Availability',
      description: 'Check product availability and stock levels',
      order_index: 1,
      questions: [
        {
          question_id: 'q1',
          text: 'Is our product available on the shelf?',
          type: 'single_choice',
          options: ['Yes', 'No'],
          validation: { mandatory: true }
        },
        {
          question_id: 'q1_followup',
          text: 'Why is the product unavailable?',
          type: 'single_choice',
          options: ['No stock', 'Not ordered', 'Delisted', 'Other'],
          validation: { mandatory: true },
          isConditional: true,
          parentQuestionId: 'q1',
          conditionalRules: [{
            id: 'show_unavailable_reason',
            sourceQuestionId: 'q1',
            condition: { operator: 'equals', value: 'No' },
            action: { type: 'show_question', targetQuestionId: 'q1_followup' }
          }]
        },
        {
          question_id: 'q2',
          text: 'Estimate the stock quantity on display',
          type: 'numeric',
          validation: { mandatory: true, min_value: 0 }
        },
        {
          question_id: 'q2_followup',
          text: 'Did you inform store staff to replenish?',
          type: 'single_choice',
          options: ['Yes', 'No', 'Staff not available'],
          validation: { mandatory: true },
          isConditional: true,
          parentQuestionId: 'q2',
          conditionalRules: [{
            id: 'show_replenish_question',
            sourceQuestionId: 'q2',
            condition: { operator: 'less_than_or_equal', value: 5 },
            action: { type: 'show_question', targetQuestionId: 'q2_followup' }
          }]
        },
        {
          question_id: 'q3',
          text: 'Upload a photo of the product shelf',
          type: 'file_upload',
          validation: { mandatory: false }
        }
      ]
    },
    {
      section_id: 'visibility',
      title: 'Shelf Visibility',
      description: 'Assess product placement and visibility',
      order_index: 2,
      questions: [
        {
          question_id: 'q4',
          text: 'Is the product placed at eye level or in a prime location?',
          type: 'single_choice',
          options: ['Eye Level', 'Mid-shelf', 'Bottom Shelf'],
          validation: { mandatory: true }
        },
        {
          question_id: 'q4_followup',
          text: 'Can the product be moved to a better shelf?',
          type: 'single_choice',
          options: ['Yes', 'No', 'Need permission'],
          validation: { mandatory: true },
          isConditional: true,
          parentQuestionId: 'q4',
          conditionalRules: [{
            id: 'show_move_shelf',
            sourceQuestionId: 'q4',
            condition: { operator: 'equals', value: 'Bottom Shelf' },
            action: { type: 'show_question', targetQuestionId: 'q4_followup' }
          }]
        },
        {
          question_id: 'q5',
          text: 'How many facings does our product have?',
          type: 'numeric',
          validation: { mandatory: true, min_value: 1 }
        },
        {
          question_id: 'q6',
          text: 'Is our POSM (posters, wobblers, shelf strips) properly placed and visible?',
          type: 'single_choice',
          options: ['Yes', 'No', 'Partially'],
          validation: { mandatory: true }
        }
      ]
    },
    {
      section_id: 'competition',
      title: 'Competitor Analysis',
      description: 'Track competitor products and pricing',
      order_index: 3,
      questions: [
        {
          question_id: 'q7',
          text: 'Which competitor products are present next to ours?',
          type: 'multiple_choice',
          options: ['Brand A', 'Brand B', 'Brand C', 'Brand D', 'None'],
          validation: { mandatory: true }
        },
        {
          question_id: 'q7_followup1',
          text: 'Are those competitor products on promotion?',
          type: 'single_choice',
          options: ['Yes', 'No', 'Some of them'],
          validation: { mandatory: true },
          isConditional: true,
          parentQuestionId: 'q7',
          conditionalRules: [{
            id: 'show_competitor_promotion',
            sourceQuestionId: 'q7',
            condition: { operator: 'not_contains', value: 'None' },
            action: { type: 'show_question', targetQuestionId: 'q7_followup1' }
          }]
        },
        {
          question_id: 'q7_followup2',
          text: 'Note competitor prices (separate multiple prices with commas)',
          type: 'text',
          validation: { mandatory: false },
          isConditional: true,
          parentQuestionId: 'q7',
          conditionalRules: [{
            id: 'show_competitor_prices',
            sourceQuestionId: 'q7',
            condition: { operator: 'not_contains', value: 'None' },
            action: { type: 'show_question', targetQuestionId: 'q7_followup2' }
          }]
        },
        {
          question_id: 'q8',
          text: 'Is the product being sold at the correct MRP?',
          type: 'single_choice',
          options: ['Yes', 'No - Higher', 'No - Lower'],
          validation: { mandatory: true }
        },
        {
          question_id: 'q8_followup',
          text: 'Enter the actual selling price displayed',
          type: 'numeric',
          validation: { mandatory: true, min_value: 0 },
          isConditional: true,
          parentQuestionId: 'q8',
          conditionalRules: [{
            id: 'show_actual_price',
            sourceQuestionId: 'q8',
            condition: { operator: 'not_equals', value: 'Yes' },
            action: { type: 'show_question', targetQuestionId: 'q8_followup' }
          }]
        },
        {
          question_id: 'q9',
          text: 'Rate the overall cleanliness of the outlet',
          type: 'single_choice',
          options: ['1 - Poor', '2 - Fair', '3 - Good', '4 - Very Good', '5 - Excellent'],
          validation: { mandatory: true }
        }
      ]
    }
  ]

  const handleResponseChange = (questionId: string, value: any) => {
    const sectionId = sections[currentSection].section_id
    const newResponses = {
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        [questionId]: value
      }
    }
    setResponses(newResponses)

    // Process any conditional actions
    const currentSectionObj = sections[currentSection]
    const question = currentSectionObj.questions.find(q => q.question_id === questionId) as ConditionalQuestion
    
    if (question?.conditionalRules) {
      question.conditionalRules.forEach(rule => {
        if (ConditionalLogicEngine.evaluateCondition(rule.condition, value)) {
          ConditionalLogicEngine.processConditionalActions(rule, newResponses, setResponses)
        }
      })
    }
  }

  const handleNext = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1)
    }
  }

  const handlePrevious = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1)
    }
  }

  const handleSaveProgress = () => {
    console.log('Saving progress...', responses)
    // Save to local storage if offline
    if (isOffline) {
      localStorage.setItem(`audit_${audit.audit_id}`, JSON.stringify(responses))
    }
  }

  const handleSubmitAudit = () => {
    console.log('Submitting audit...', responses)
    // Submit audit logic here
    onClose()
  }

  const renderQuestion = (question: ConditionalQuestion) => {
    const sectionId = sections[currentSection].section_id
    const currentValue = responses[sectionId]?.[question.question_id] || ''

    switch (question.type) {
      case 'text':
        return (
          <input
            type="text"
            value={currentValue}
            onChange={(e) => handleResponseChange(question.question_id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your response"
          />
        )

      case 'numeric':
        return (
          <input
            type="number"
            value={currentValue}
            onChange={(e) => handleResponseChange(question.question_id, parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter number"
            min={question.validation?.min_value}
            max={question.validation?.max_value}
          />
        )

      case 'single_choice':
        return (
          <div className="space-y-2">
            {question.options?.map((option, index) => (
              <label key={index} className="flex items-center">
                <input
                  type="radio"
                  name={question.question_id}
                  value={option}
                  checked={currentValue === option}
                  onChange={(e) => handleResponseChange(question.question_id, e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        )

      case 'multiple_choice':
        return (
          <div className="space-y-2">
            {question.options?.map((option, index) => (
              <label key={index} className="flex items-center">
                <input
                  type="checkbox"
                  value={option}
                  checked={(currentValue || []).includes(option)}
                  onChange={(e) => {
                    const newValue = [...(currentValue || [])]
                    if (e.target.checked) {
                      newValue.push(option)
                    } else {
                      const index = newValue.indexOf(option)
                      if (index > -1) newValue.splice(index, 1)
                    }
                    handleResponseChange(question.question_id, newValue)
                  }}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        )

      case 'dropdown':
        return (
          <select
            value={currentValue}
            onChange={(e) => handleResponseChange(question.question_id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select an option</option>
            {question.options?.map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </select>
        )

      case 'file_upload':
        return (
          <div className="space-y-2">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleResponseChange(question.question_id, e.target.files?.[0])}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="button"
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Camera className="h-4 w-4 mr-2" />
              Take Photo
            </button>
          </div>
        )

      case 'barcode':
        return (
          <div className="space-y-2">
            <input
              type="text"
              value={currentValue}
              onChange={(e) => handleResponseChange(question.question_id, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Scan or enter barcode"
            />
            <button
              type="button"
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <BarChart className="h-4 w-4 mr-2" />
              Scan Barcode
            </button>
          </div>
        )

      default:
        return null
    }
  }

  const currentSectionObj = sections[currentSection]
  
  // Get visible questions based on conditional logic
  const sectionResponses = responses[currentSectionObj.section_id] || {}
  const visibleQuestions = ConditionalLogicEngine.getVisibleQuestions(
    currentSectionObj.questions as ConditionalQuestion[],
    sectionResponses
  )
  
  const progress = ((currentSection + 1) / sections.length) * 100

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Audit Execution</h2>
              <p className="text-blue-100 mt-1">
                {currentSectionObj.title} - Section {currentSection + 1} of {sections.length}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {isOffline && (
                <div className="flex items-center px-3 py-1 bg-orange-500 rounded-full">
                  <span className="text-sm font-medium">Offline Mode</span>
                </div>
              )}
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-gray-200 h-2">
          <div 
            className="bg-blue-600 h-2 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {currentSectionObj.title}
            </h3>
            <p className="text-gray-600">{currentSectionObj.description}</p>
          </div>

          <div className="space-y-6">
            {visibleQuestions.map((question, index) => {
              const isConditional = question.isConditional
              return (
              <div key={question.question_id} className="border border-gray-200 rounded-lg p-4">
                {isConditional && (
                  <div className="mb-2">
                    <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      Conditional Question
                    </span>
                  </div>
                )}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {index + 1}. {question.text}
                    {question.validation?.mandatory && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </label>
                  {renderQuestion(question)}
                </div>
              </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleSaveProgress}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <Save className="h-4 w-4 mr-2 inline" />
              Save Progress
            </button>
            <span className="text-sm text-gray-500">
              Auto-save enabled
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrevious}
              disabled={currentSection === 0}
              className={`px-4 py-2 border border-gray-300 rounded-md transition-colors ${
                currentSection === 0
                  ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                  : 'text-gray-700 bg-white hover:bg-gray-50'
              }`}
            >
              <ChevronLeft className="h-4 w-4 mr-2 inline" />
              Previous
            </button>
            {currentSection < sections.length - 1 ? (
              <button
                onClick={handleNext}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2 inline" />
              </button>
            ) : (
              <button
                onClick={handleSubmitAudit}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <Send className="h-4 w-4 mr-2 inline" />
                Submit Audit
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuditExecution