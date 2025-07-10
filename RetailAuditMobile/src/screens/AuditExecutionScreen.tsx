import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import * as Location from 'expo-location'
import { Audit, updateAuditResponse, submitAudit } from '../lib/supabase'

interface AuditExecutionScreenProps {
  route: {
    params: {
      audit: Audit
    }
  }
  navigation: any
}

const AuditExecutionScreen: React.FC<AuditExecutionScreenProps> = ({ route, navigation }) => {
  const { audit } = route.params
  const [currentSection, setCurrentSection] = useState(0)
  const [responses, setResponses] = useState<Record<string, any>>(audit.responses || {})
  const [location, setLocation] = useState<Location.LocationObject | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Sample sections for demonstration (same as web app)
  const sections = [
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
          question_id: 'q2',
          text: 'Estimate the stock quantity on display',
          type: 'numeric',
          validation: { mandatory: true, min_value: 0 }
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
          question_id: 'q5',
          text: 'How many facings does our product have?',
          type: 'numeric',
          validation: { mandatory: true, min_value: 1 }
        }
      ]
    }
  ]

  useEffect(() => {
    getLocation()
  }, [])

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required for audits')
        return
      }

      const location = await Location.getCurrentPositionAsync({})
      setLocation(location)
    } catch (error) {
      console.error('Error getting location:', error)
    }
  }

  const handleResponseChange = (questionId: string, value: any) => {
    const sectionId = sections[currentSection].section_id
    setResponses(prev => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        [questionId]: value
      }
    }))
  }

  const handleImagePicker = async (questionId: string) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Camera permission is required')
      return
    }

    Alert.alert(
      'Select Image',
      'Choose an option',
      [
        { text: 'Camera', onPress: () => openCamera(questionId) },
        { text: 'Gallery', onPress: () => openGallery(questionId) },
        { text: 'Cancel', style: 'cancel' }
      ]
    )
  }

  const openCamera = async (questionId: string) => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    })

    if (!result.canceled) {
      handleResponseChange(questionId, result.assets[0].uri)
    }
  }

  const openGallery = async (questionId: string) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    })

    if (!result.canceled) {
      handleResponseChange(questionId, result.assets[0].uri)
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

  const handleSaveProgress = async () => {
    try {
      await updateAuditResponse(audit.audit_id, responses)
      Alert.alert('Success', 'Progress saved successfully')
    } catch (error) {
      Alert.alert('Error', 'Failed to save progress')
    }
  }

  const calculateScore = () => {
    // Simple scoring logic - can be enhanced
    let totalQuestions = 0
    let answeredQuestions = 0

    sections.forEach(section => {
      section.questions.forEach(question => {
        totalQuestions++
        const sectionResponses = responses[section.section_id] || {}
        if (sectionResponses[question.question_id] !== undefined) {
          answeredQuestions++
        }
      })
    })

    return totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0
  }

  const handleSubmitAudit = async () => {
    setIsSubmitting(true)
    try {
      const score = calculateScore()
      await submitAudit(audit.audit_id, responses, score)
      Alert.alert(
        'Success',
        'Audit submitted successfully!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      )
    } catch (error) {
      Alert.alert('Error', 'Failed to submit audit')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderQuestion = (question: any) => {
    const sectionId = sections[currentSection].section_id
    const currentValue = responses[sectionId]?.[question.question_id] || ''

    switch (question.type) {
      case 'text':
        return (
          <TextInput
            style={styles.textInput}
            value={currentValue}
            onChangeText={(value) => handleResponseChange(question.question_id, value)}
            placeholder="Enter your response"
            multiline
          />
        )

      case 'numeric':
        return (
          <TextInput
            style={styles.textInput}
            value={currentValue.toString()}
            onChangeText={(value) => handleResponseChange(question.question_id, parseFloat(value) || 0)}
            placeholder="Enter number"
            keyboardType="numeric"
          />
        )

      case 'single_choice':
        return (
          <View style={styles.optionsContainer}>
            {question.options?.map((option: string, index: number) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton,
                  currentValue === option && styles.optionButtonSelected
                ]}
                onPress={() => handleResponseChange(question.question_id, option)}
              >
                <Text style={[
                  styles.optionText,
                  currentValue === option && styles.optionTextSelected
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )

      case 'file_upload':
        return (
          <View style={styles.fileUploadContainer}>
            <TouchableOpacity
              style={styles.imageButton}
              onPress={() => handleImagePicker(question.question_id)}
            >
              <Ionicons name="camera-outline" size={24} color="#3B82F6" />
              <Text style={styles.imageButtonText}>Take Photo</Text>
            </TouchableOpacity>
            {currentValue && (
              <Image source={{ uri: currentValue }} style={styles.previewImage} />
            )}
          </View>
        )

      default:
        return null
    }
  }

  const currentSectionObj = sections[currentSection]
  const progress = ((currentSection + 1) / sections.length) * 100

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Audit Execution</Text>
          <Text style={styles.headerSubtitle}>
            {currentSectionObj.title} - Section {currentSection + 1} of {sections.length}
          </Text>
        </View>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{currentSectionObj.title}</Text>
          <Text style={styles.sectionDescription}>{currentSectionObj.description}</Text>
        </View>

        {currentSectionObj.questions.map((question, index) => (
          <View key={question.question_id} style={styles.questionCard}>
            <Text style={styles.questionText}>
              {index + 1}. {question.text}
              {question.validation?.mandatory && (
                <Text style={styles.required}> *</Text>
              )}
            </Text>
            {renderQuestion(question)}
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSaveProgress}
        >
          <Ionicons name="save-outline" size={20} color="#6B7280" />
          <Text style={styles.saveButtonText}>Save Progress</Text>
        </TouchableOpacity>

        <View style={styles.navigationButtons}>
          <TouchableOpacity
            style={[styles.navButton, currentSection === 0 && styles.navButtonDisabled]}
            onPress={handlePrevious}
            disabled={currentSection === 0}
          >
            <Ionicons name="chevron-back" size={20} color={currentSection === 0 ? "#D1D5DB" : "#6B7280"} />
            <Text style={[styles.navButtonText, currentSection === 0 && styles.navButtonTextDisabled]}>
              Previous
            </Text>
          </TouchableOpacity>

          {currentSection < sections.length - 1 ? (
            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleNext}
            >
              <Text style={styles.nextButtonText}>Next</Text>
              <Ionicons name="chevron-forward" size={20} color="white" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmitAudit}
              disabled={isSubmitting}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color="white" />
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Submitting...' : 'Submit Audit'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
  },
  headerInfo: {
    marginLeft: 16,
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#DBEAFE',
    marginTop: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionHeader: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  sectionDescription: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
  },
  questionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  required: {
    color: '#EF4444',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
  },
  optionsContainer: {
    gap: 8,
  },
  optionButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#F9FAFB',
  },
  optionButtonSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EBF8FF',
  },
  optionText: {
    fontSize: 16,
    color: '#6B7280',
  },
  optionTextSelected: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  fileUploadContainer: {
    alignItems: 'center',
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF8FF',
    borderWidth: 1,
    borderColor: '#3B82F6',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  imageButtonText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
  },
  previewImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginTop: 12,
  },
  footer: {
    backgroundColor: 'white',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 8,
    marginBottom: 16,
  },
  saveButtonText: {
    color: '#6B7280',
    fontSize: 16,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    gap: 8,
    flex: 1,
  },
  navButtonDisabled: {
    backgroundColor: '#F9FAFB',
  },
  navButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  navButtonTextDisabled: {
    color: '#D1D5DB',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    padding: 12,
    gap: 8,
    flex: 1,
    justifyContent: 'center',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    borderRadius: 8,
    padding: 12,
    gap: 8,
    flex: 1,
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
})

export default AuditExecutionScreen