import React, { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getComponent } from '../lib/ComponentRegistry'

const variants = {
  enter: (direction) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
}

const transition = { duration: 0.35, ease: 'easeInOut' }

export default function FormWizard({ schema, preservedData, onComplete, onCancel }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [formData, setFormData] = useState(() => ({ ...(preservedData || {}) }))
  const [stepErrors, setStepErrors] = useState({})
  const [direction, setDirection] = useState(1)

  const steps = useMemo(() => schema?.steps || [], [schema])
  const totalSteps = steps.length
  const currentStep = steps[currentStepIndex]
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === totalSteps - 1

  const handleFieldChange = useCallback((name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    setStepErrors((prev) => {
      if (!prev[name]) return prev
      const next = { ...prev }
      delete next[name]
      return next
    })
  }, [])

  const validateCurrentStep = useCallback(() => {
    const errors = {}
    if (!currentStep) return errors
    for (const comp of currentStep.components || []) {
      if (comp.required) {
        const val = formData[comp.name]
        if (val === undefined || val === null || val === '') {
          errors[comp.name] = `${comp.label || comp.name} is required.`
        }
      }
    }
    return errors
  }, [currentStep, formData])

  const handleNext = useCallback(() => {
    const errors = validateCurrentStep()
    if (Object.keys(errors).length > 0) {
      setStepErrors(errors)
      return
    }
    setStepErrors({})
    if (isLastStep) {
      onComplete && onComplete(formData)
    } else {
      setDirection(1)
      setCurrentStepIndex((prev) => prev + 1)
    }
  }, [validateCurrentStep, isLastStep, onComplete, formData])

  const handleBack = useCallback(() => {
    if (isFirstStep) {
      onCancel && onCancel()
    } else {
      setDirection(-1)
      setCurrentStepIndex((prev) => prev - 1)
      setStepErrors({})
    }
  }, [isFirstStep, onCancel])

  const progressPercent = totalSteps > 0 ? ((currentStepIndex + 1) / totalSteps) * 100 : 0

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-600">
            Step {currentStepIndex + 1} of {totalSteps}
          </span>
          <span className="text-sm text-gray-400">{Math.round(progressPercent)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-500 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Animated Step */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentStepIndex}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={transition}
        >
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl mx-auto">
            {/* Step Header */}
            {currentStep?.title && (
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{currentStep.title}</h2>
            )}
            {currentStep?.description && (
              <p className="text-gray-500 mb-6">{currentStep.description}</p>
            )}

            {/* Step Fields */}
            <div className="space-y-4">
              {(currentStep?.components || []).map((comp) => {
                const Component = getComponent(comp.type)
                if (!Component) {
                  return (
                    <div
                      key={comp.id || comp.name}
                      className="rounded-lg bg-gray-100 text-gray-400 p-3 text-sm"
                    >
                      Unsupported component: {comp.type}
                    </div>
                  )
                }
                return (
                  <Component
                    key={comp.id || comp.name}
                    {...comp}
                    value={formData[comp.name] || ''}
                    onChange={(val) => handleFieldChange(comp.name, val)}
                    error={stepErrors[comp.name]}
                  />
                )
              })}
            </div>

            {/* Navigation */}
            <div className="flex justify-between mt-8">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleBack}
                disabled={isFirstStep && !onCancel}
              >
                {isFirstStep ? '✕ Return to Form' : '← Back'}
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleNext}
              >
                {isLastStep ? 'Submit ✓' : 'Next →'}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
