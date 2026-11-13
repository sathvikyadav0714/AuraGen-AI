import React, { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getComponent } from '../lib/ComponentRegistry'

const variants = {
  enter: (direction) => ({ x: direction > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (direction) => ({ x: direction > 0 ? -40 : 40, opacity: 0 }),
}
const transition = { duration: 0.28, ease: [0.4, 0, 0.2, 1] }

export default function FormWizard({ schema, preservedData, onComplete, onCancel }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [formData, setFormData]   = useState(() => ({ ...(preservedData || {}) }))
  const [stepErrors, setStepErrors] = useState({})
  const [direction, setDirection] = useState(1)

  const steps      = useMemo(() => schema?.steps || [], [schema])
  const totalSteps = steps.length
  const currentStep = steps[currentStepIndex]
  const isFirstStep = currentStepIndex === 0
  const isLastStep  = currentStepIndex === totalSteps - 1
  const progressPct = totalSteps > 0 ? ((currentStepIndex + 1) / totalSteps) * 100 : 0

  const handleFieldChange = useCallback((name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }))
    setStepErrors(prev => {
      if (!prev[name]) return prev
      const next = { ...prev }; delete next[name]; return next
    })
  }, [])

  const validateCurrentStep = useCallback(() => {
    const errors = {}
    for (const comp of currentStep?.components || []) {
      if (comp.required) {
        const val = formData[comp.name]
        if (val === undefined || val === null || val === '')
          errors[comp.name] = `${comp.label || comp.name} is required`
      }
    }
    return errors
  }, [currentStep, formData])

  const handleNext = useCallback(() => {
    const errors = validateCurrentStep()
    if (Object.keys(errors).length > 0) { setStepErrors(errors); return }
    setStepErrors({})
    if (isLastStep) { onComplete?.(formData) }
    else { setDirection(1); setCurrentStepIndex(p => p + 1) }
  }, [validateCurrentStep, isLastStep, onComplete, formData])

  const handleBack = useCallback(() => {
    if (isFirstStep) { onCancel?.() }
    else { setDirection(-1); setCurrentStepIndex(p => p - 1); setStepErrors({}) }
  }, [isFirstStep, onCancel])

  return (
    <div className="min-h-[60vh] flex flex-col max-w-xl mx-auto w-full py-6 px-4">

      {/* ── Progress header ── */}
      <div className="mb-7">
        <div className="flex items-center justify-between mb-2.5">
          <span className="step-chip">Step {currentStepIndex + 1} of {totalSteps}</span>
          <span className="text-xs font-semibold text-gray-400">{Math.round(progressPct)}%</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {/* ── Animated step card ── */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentStepIndex}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={transition}
          className="flex-1"
        >
          <div className="card">

            {/* Step heading */}
            {currentStep?.title && (
              <h2 className="text-xl font-bold text-gray-900 mb-1 tracking-tight">
                {currentStep.title}
              </h2>
            )}
            {currentStep?.description && (
              <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                {currentStep.description}
              </p>
            )}

            {/* Fields */}
            <div>
              {(currentStep?.components || []).map((comp) => {
                const Component = getComponent(comp.type)
                if (!Component) return (
                  <div key={comp.id || comp.name}
                    className="text-xs text-gray-400 bg-gray-50 border border-dashed border-gray-200 rounded-lg p-3 mb-4">
                    Unknown component: <code>{comp.type}</code>
                  </div>
                )
                return (
                  <Component
                    key={comp.id || comp.name}
                    {...comp}
                    value={formData[comp.name] ?? ''}
                    onChange={(val) => handleFieldChange(comp.name, val)}
                    error={stepErrors[comp.name]}
                  />
                )
              })}
            </div>

            {/* ── Navigation ── */}
            <div className="flex items-center justify-between pt-4 mt-2 border-t border-gray-100">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleBack}
                disabled={isFirstStep && !onCancel}
              >
                {isFirstStep ? '✕ Exit' : '← Back'}
              </button>

              <button
                type="button"
                className="btn-primary"
                onClick={handleNext}
              >
                {isLastStep ? 'Submit Application ✓' : 'Continue →'}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
