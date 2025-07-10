import React, { useState } from 'react'
import { Plus, X, ChevronDown, ChevronRight, Zap } from 'lucide-react'
import { ConditionalRule, ConditionalQuestion, RETAIL_CONDITIONAL_TEMPLATES } from '../../lib/conditionalLogic'

interface ConditionalLogicBuilderProps {
  questions: ConditionalQuestion[]
  onQuestionsChange: (questions: ConditionalQuestion[]) => void
}

const ConditionalLogicBuilder: React.FC<ConditionalLogicBuilderProps> = ({
  questions,
  onQuestionsChange
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set())

  const operators = [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not Equals' },
    { value: 'less_than', label: 'Less Than' },
    { value: 'less_than_or_equal', label: 'Less Than or Equal' },
    { value: 'greater_than', label: 'Greater Than' },
    { value: 'greater_than_or_equal', label: 'Greater Than or Equal' },
    { value: 'contains', label: 'Contains' },
    { value: 'not_contains', label: 'Does Not Contain' }
  ]

  const addConditionalRule = (questionId: string) => {
    const newRule: ConditionalRule = {
      id: `rule_${Date.now()}`,
      sourceQuestionId: '',
      condition: { operator: 'equals', value: '' },
      action: { type: 'show_question', targetQuestionId: '' }
    }

    const updatedQuestions = questions.map(q => {
      if (q.question_id === questionId) {
        return {
          ...q,
          conditionalRules: [...(q.conditionalRules || []), newRule]
        }
      }
      return q
    })

    onQuestionsChange(updatedQuestions)
  }

  const updateConditionalRule = (questionId: string, ruleId: string, updates: Partial<ConditionalRule>) => {
    const updatedQuestions = questions.map(q => {
      if (q.question_id === questionId) {
        return {
          ...q,
          conditionalRules: q.conditionalRules?.map(rule =>
            rule.id === ruleId ? { ...rule, ...updates } : rule
          )
        }
      }
      return q
    })

    onQuestionsChange(updatedQuestions)
  }

  const removeConditionalRule = (questionId: string, ruleId: string) => {
    const updatedQuestions = questions.map(q => {
      if (q.question_id === questionId) {
        return {
          ...q,
          conditionalRules: q.conditionalRules?.filter(rule => rule.id !== ruleId)
        }
      }
      return q
    })

    onQuestionsChange(updatedQuestions)
  }

  const applyTemplate = (templateKey: string) => {
    const template = RETAIL_CONDITIONAL_TEMPLATES[templateKey as keyof typeof RETAIL_CONDITIONAL_TEMPLATES]
    if (!template) return

    let newQuestions = [...questions]

    // Add source question if it doesn't exist
    const sourceExists = newQuestions.find(q => q.question_id === template.sourceQuestion.question_id)
    if (!sourceExists) {
      newQuestions.push(template.sourceQuestion as ConditionalQuestion)
    }

    // Add conditional question(s)
    if ('conditionalQuestion' in template) {
      const conditionalExists = newQuestions.find(q => q.question_id === template.conditionalQuestion.question_id)
      if (!conditionalExists) {
        newQuestions.push(template.conditionalQuestion)
      }
    }

    if ('conditionalQuestions' in template) {
      template.conditionalQuestions.forEach(conditionalQ => {
        const exists = newQuestions.find(q => q.question_id === conditionalQ.question_id)
        if (!exists) {
          newQuestions.push(conditionalQ)
        }
      })
    }

    onQuestionsChange(newQuestions)
    setSelectedTemplate('')
  }

  const toggleRuleExpansion = (ruleId: string) => {
    const newExpanded = new Set(expandedRules)
    if (newExpanded.has(ruleId)) {
      newExpanded.delete(ruleId)
    } else {
      newExpanded.add(ruleId)
    }
    setExpandedRules(newExpanded)
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Zap className="h-6 w-6 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-blue-900">Smart Question Templates</h3>
        </div>
        <p className="text-blue-700 mb-4">
          Apply pre-built conditional logic templates for common retail execution scenarios.
        </p>
        
        <div className="flex items-center space-x-3">
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            className="flex-1 px-3 py-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="">Select a template...</option>
            <option value="productAvailability">Product Availability Check</option>
            <option value="shelfPlacement">Shelf Placement Logic</option>
            <option value="stockQuantity">Stock Quantity Follow-up</option>
            <option value="competitorAnalysis">Competitor Analysis</option>
            <option value="pricingCompliance">Pricing Compliance</option>
          </select>
          <button
            onClick={() => selectedTemplate && applyTemplate(selectedTemplate)}
            disabled={!selectedTemplate}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Apply Template
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-md font-semibold text-gray-900">Question Logic Rules</h4>
        
        {questions.map((question) => (
          <div key={question.question_id} className="border border-gray-200 rounded-lg">
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-medium text-gray-900">{question.text}</h5>
                  <p className="text-sm text-gray-500">
                    Type: {question.type} | Rules: {question.conditionalRules?.length || 0}
                    {question.isConditional && (
                      <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        Conditional
                      </span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => addConditionalRule(question.question_id)}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-1 inline" />
                  Add Rule
                </button>
              </div>
            </div>

            {question.conditionalRules && question.conditionalRules.length > 0 && (
              <div className="p-4 space-y-3">
                {question.conditionalRules.map((rule) => (
                  <div key={rule.id} className="border border-gray-200 rounded-md">
                    <div className="p-3 bg-white">
                      <div className="flex items-center justify-between mb-3">
                        <button
                          onClick={() => toggleRuleExpansion(rule.id)}
                          className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900"
                        >
                          {expandedRules.has(rule.id) ? (
                            <ChevronDown className="h-4 w-4 mr-1" />
                          ) : (
                            <ChevronRight className="h-4 w-4 mr-1" />
                          )}
                          Rule Configuration
                        </button>
                        <button
                          onClick={() => removeConditionalRule(question.question_id, rule.id)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      {expandedRules.has(rule.id) && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Source Question
                              </label>
                              <select
                                value={rule.sourceQuestionId}
                                onChange={(e) => updateConditionalRule(question.question_id, rule.id, {
                                  sourceQuestionId: e.target.value
                                })}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                              >
                                <option value="">Select question...</option>
                                {questions.filter(q => q.question_id !== question.question_id).map(q => (
                                  <option key={q.question_id} value={q.question_id}>
                                    {q.text.substring(0, 30)}...
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Condition
                              </label>
                              <select
                                value={rule.condition.operator}
                                onChange={(e) => updateConditionalRule(question.question_id, rule.id, {
                                  condition: { ...rule.condition, operator: e.target.value as any }
                                })}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                              >
                                {operators.map(op => (
                                  <option key={op.value} value={op.value}>{op.label}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Value
                              </label>
                              <input
                                type="text"
                                value={rule.condition.value}
                                onChange={(e) => updateConditionalRule(question.question_id, rule.id, {
                                  condition: { ...rule.condition, value: e.target.value }
                                })}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                                placeholder="Enter value..."
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Action Type
                              </label>
                              <select
                                value={rule.action.type}
                                onChange={(e) => updateConditionalRule(question.question_id, rule.id, {
                                  action: { ...rule.action, type: e.target.value as any }
                                })}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                              >
                                <option value="show_question">Show Question</option>
                                <option value="hide_question">Hide Question</option>
                                <option value="skip_to_section">Skip to Section</option>
                                <option value="set_value">Set Value</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Target Question
                              </label>
                              <select
                                value={rule.action.targetQuestionId || ''}
                                onChange={(e) => updateConditionalRule(question.question_id, rule.id, {
                                  action: { ...rule.action, targetQuestionId: e.target.value }
                                })}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                              >
                                <option value="">Select target...</option>
                                {questions.filter(q => q.question_id !== question.question_id).map(q => (
                                  <option key={q.question_id} value={q.question_id}>
                                    {q.text.substring(0, 30)}...
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="p-2 bg-blue-50 rounded-md">
                            <p className="text-xs text-blue-700">
                              <strong>Rule Summary:</strong> When "{questions.find(q => q.question_id === rule.sourceQuestionId)?.text || 'source question'}" 
                              {' '}{operators.find(op => op.value === rule.condition.operator)?.label.toLowerCase()} "{rule.condition.value}", 
                              then {rule.action.type.replace('_', ' ')} "{questions.find(q => q.question_id === rule.action.targetQuestionId)?.text || 'target question'}"
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {questions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No questions available. Add questions in the previous step to configure conditional logic.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ConditionalLogicBuilder