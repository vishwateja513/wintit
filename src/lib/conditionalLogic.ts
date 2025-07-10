export interface ConditionalRule {
  id: string
  sourceQuestionId: string
  condition: {
    operator: 'equals' | 'not_equals' | 'less_than' | 'less_than_or_equal' | 'greater_than' | 'greater_than_or_equal' | 'contains' | 'not_contains'
    value: any
  }
  action: {
    type: 'show_question' | 'hide_question' | 'skip_to_section' | 'set_value'
    targetQuestionId?: string
    targetSectionId?: string
    value?: any
  }
}

export interface ConditionalQuestion extends Question {
  conditionalRules?: ConditionalRule[]
  isConditional?: boolean
  parentQuestionId?: string
}

export interface EnhancedSection extends Section {
  questions: ConditionalQuestion[]
}

// Predefined conditional logic templates for retail execution
export const RETAIL_CONDITIONAL_TEMPLATES = {
  productAvailability: {
    sourceQuestion: {
      question_id: 'product_available',
      text: 'Is our product available on the shelf?',
      type: 'single_choice' as const,
      options: ['Yes', 'No'],
      validation: { mandatory: true }
    },
    conditionalQuestion: {
      question_id: 'unavailable_reason',
      text: 'Why is the product unavailable?',
      type: 'single_choice' as const,
      options: ['No stock', 'Not ordered', 'Delisted', 'Other'],
      validation: { mandatory: true },
      isConditional: true,
      parentQuestionId: 'product_available',
      conditionalRules: [{
        id: 'show_unavailable_reason',
        sourceQuestionId: 'product_available',
        condition: { operator: 'equals', value: 'No' },
        action: { type: 'show_question', targetQuestionId: 'unavailable_reason' }
      }]
    }
  },
  
  shelfPlacement: {
    sourceQuestion: {
      question_id: 'shelf_placement',
      text: 'Is the product placed at eye level or in a prime location?',
      type: 'single_choice' as const,
      options: ['Eye Level', 'Mid-shelf', 'Bottom Shelf'],
      validation: { mandatory: true }
    },
    conditionalQuestion: {
      question_id: 'can_move_shelf',
      text: 'Can the product be moved to a better shelf?',
      type: 'single_choice' as const,
      options: ['Yes', 'No', 'Need permission'],
      validation: { mandatory: true },
      isConditional: true,
      parentQuestionId: 'shelf_placement',
      conditionalRules: [{
        id: 'show_move_shelf',
        sourceQuestionId: 'shelf_placement',
        condition: { operator: 'equals', value: 'Bottom Shelf' },
        action: { type: 'show_question', targetQuestionId: 'can_move_shelf' }
      }]
    }
  },

  stockQuantity: {
    sourceQuestion: {
      question_id: 'stock_quantity',
      text: 'Estimate the stock quantity on display',
      type: 'numeric' as const,
      validation: { mandatory: true, min_value: 0 }
    },
    conditionalQuestion: {
      question_id: 'informed_staff_replenish',
      text: 'Did you inform store staff to replenish?',
      type: 'single_choice' as const,
      options: ['Yes', 'No', 'Staff not available'],
      validation: { mandatory: true },
      isConditional: true,
      parentQuestionId: 'stock_quantity',
      conditionalRules: [{
        id: 'show_replenish_question',
        sourceQuestionId: 'stock_quantity',
        condition: { operator: 'less_than_or_equal', value: 5 },
        action: { type: 'show_question', targetQuestionId: 'informed_staff_replenish' }
      }]
    }
  },

  competitorAnalysis: {
    sourceQuestion: {
      question_id: 'competitor_products',
      text: 'Which competitor products are present next to ours?',
      type: 'multiple_choice' as const,
      options: ['Brand A', 'Brand B', 'Brand C', 'Brand D', 'None'],
      validation: { mandatory: true }
    },
    conditionalQuestions: [
      {
        question_id: 'competitor_promotion',
        text: 'Are those competitor products on promotion?',
        type: 'single_choice' as const,
        options: ['Yes', 'No', 'Some of them'],
        validation: { mandatory: true },
        isConditional: true,
        parentQuestionId: 'competitor_products',
        conditionalRules: [{
          id: 'show_competitor_promotion',
          sourceQuestionId: 'competitor_products',
          condition: { operator: 'not_contains', value: 'None' },
          action: { type: 'show_question', targetQuestionId: 'competitor_promotion' }
        }]
      },
      {
        question_id: 'competitor_prices',
        text: 'Note competitor prices (separate multiple prices with commas)',
        type: 'text' as const,
        validation: { mandatory: false },
        isConditional: true,
        parentQuestionId: 'competitor_products',
        conditionalRules: [{
          id: 'show_competitor_prices',
          sourceQuestionId: 'competitor_products',
          condition: { operator: 'not_contains', value: 'None' },
          action: { type: 'show_question', targetQuestionId: 'competitor_prices' }
        }]
      }
    ]
  },

  pricingCompliance: {
    sourceQuestion: {
      question_id: 'correct_mrp',
      text: 'Is the product being sold at the correct MRP?',
      type: 'single_choice' as const,
      options: ['Yes', 'No - Higher', 'No - Lower'],
      validation: { mandatory: true }
    },
    conditionalQuestion: {
      question_id: 'actual_selling_price',
      text: 'Enter the actual selling price displayed',
      type: 'numeric' as const,
      validation: { mandatory: true, min_value: 0 },
      isConditional: true,
      parentQuestionId: 'correct_mrp',
      conditionalRules: [{
        id: 'show_actual_price',
        sourceQuestionId: 'correct_mrp',
        condition: { operator: 'not_equals', value: 'Yes' },
        action: { type: 'show_question', targetQuestionId: 'actual_selling_price' }
      }]
    }
  }
}

export class ConditionalLogicEngine {
  static evaluateCondition(condition: ConditionalRule['condition'], responseValue: any): boolean {
    const { operator, value } = condition

    switch (operator) {
      case 'equals':
        return responseValue === value
      case 'not_equals':
        return responseValue !== value
      case 'less_than':
        return Number(responseValue) < Number(value)
      case 'less_than_or_equal':
        return Number(responseValue) <= Number(value)
      case 'greater_than':
        return Number(responseValue) > Number(value)
      case 'greater_than_or_equal':
        return Number(responseValue) >= Number(value)
      case 'contains':
        if (Array.isArray(responseValue)) {
          return responseValue.includes(value)
        }
        return String(responseValue).includes(String(value))
      case 'not_contains':
        if (Array.isArray(responseValue)) {
          return !responseValue.includes(value)
        }
        return !String(responseValue).includes(String(value))
      default:
        return false
    }
  }

  static getVisibleQuestions(
    questions: ConditionalQuestion[],
    responses: Record<string, any>
  ): ConditionalQuestion[] {
    const visibleQuestions: ConditionalQuestion[] = []

    questions.forEach(question => {
      // Always show non-conditional questions
      if (!question.isConditional) {
        visibleQuestions.push(question)
        return
      }

      // Check if conditional question should be shown
      if (question.conditionalRules) {
        const shouldShow = question.conditionalRules.some(rule => {
          const sourceResponse = responses[rule.sourceQuestionId]
          if (sourceResponse === undefined || sourceResponse === null || sourceResponse === '') {
            return false
          }
          return this.evaluateCondition(rule.condition, sourceResponse)
        })

        if (shouldShow) {
          visibleQuestions.push(question)
        }
      }
    })

    return visibleQuestions
  }

  static processConditionalActions(
    rule: ConditionalRule,
    responses: Record<string, any>,
    setResponses: (responses: Record<string, any>) => void
  ) {
    const { action } = rule

    switch (action.type) {
      case 'set_value':
        if (action.targetQuestionId && action.value !== undefined) {
          setResponses({
            ...responses,
            [action.targetQuestionId]: action.value
          })
        }
        break
      // Additional actions can be implemented here
    }
  }
}