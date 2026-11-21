import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getComponent } from '../lib/ComponentRegistry'

const variants = {
  enter: (direction) => ({ x: direction > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (direction) => ({ x: direction > 0 ? -40 : 40, opacity: 0 }),
}
const transition = { duration: 0.28, ease: [0.4, 0, 0.2, 1] }

export default function FormWizard({ schema, preservedData, onComplete, onCancel, onStateChange }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [formData, setFormData]   = useState(() => ({ ...(preservedData || {}) }))
  const [stepErrors, setStepErrors] = useState({})
  const [direction, setDirection] = useState(1)
  const stepContainerRef = useRef(null)

  const steps      = useMemo(() => schema?.steps || [], [schema])
  const totalSteps = steps.length
  const currentStep = steps[currentStepIndex]
  const isFirstStep = currentStepIndex === 0
  const isLastStep  = currentStepIndex === totalSteps - 1
  const progressPct = totalSteps > 0 ? ((currentStepIndex + 1) / totalSteps) * 100 : 0

  // Auto-focus first input field on step change
  useEffect(() => {
    if (stepContainerRef.current) {
      const firstInput = stepContainerRef.current.querySelector('input:not([type=hidden]), select, textarea')
      if (firstInput) {
        firstInput.focus()
      }
    }
  }, [currentStepIndex])

  const handleFieldChange = useCallback((name, value) => {
    setFormData(prev => {
      const next = { ...prev, [name]: value }
      if (onStateChange) onStateChange(next)
      return next
    })
    setStepErrors(prev => {
      if (!prev[name]) return prev
      const next = { ...prev }; delete next[name]; return next
    })
  }, [onStateChange])

  const validateCurrentStep = useCallback(() => {
    const errors = {}
    for (const comp of currentStep?.components || []) {
      const val = formData[comp.name]
      const label = comp.label || comp.name

      // 1. Required field validation
      if (comp.required) {
        if (val === undefined || val === null || val === '') {
          errors[comp.name] = `${label} is required`
          continue
        }
        if (Array.isArray(val) && val.length === 0) {
          errors[comp.name] = `Please select at least one option for ${label}`
          continue
        }
      }

      // Skip format validation if field is empty and not required
      if (val === undefined || val === null || val === '') {
        continue
      }

      // 2. Email format validation
      if (comp.type === 'EmailInput' || comp.name === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(String(val).trim())) {
          errors[comp.name] = 'Please enter a valid email address'
          continue
        }
      }

      // 3. Phone format validation
      if (comp.type === 'PhoneInput' || comp.name === 'phone') {
        const cleanPhone = String(val).replace(/[\s-]/g, '')
        if (!/^\+?\d{10,13}$/.test(cleanPhone)) {
          errors[comp.name] = 'Please enter a valid phone number (at least 10 digits)'
          continue
        }
      }

      // 4. Number bounds validation (min / max)
      if (comp.type === 'NumberInput' || typeof comp.min === 'number' || typeof comp.max === 'number') {
        const num = Number(val)
        if (isNaN(num)) {
          errors[comp.name] = `${label} must be a valid number`
          continue
        }
        if (typeof comp.min === 'number' && num < comp.min) {
          errors[comp.name] = `${label} must be at least ${comp.min}`
          continue
        }
        if (typeof comp.max === 'number' && num > comp.max) {
          errors[comp.name] = `${label} cannot exceed ${comp.max}`
          continue
        }
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

  // Support Enter key for quick advancement
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault()
      handleNext()
    }
  }, [handleNext])

  return (
    <div
      className="min-h-[55vh] flex flex-col max-w-xl mx-auto w-full py-3 px-2.5 sm:py-6 sm:px-4"
      onKeyDown={handleKeyDown}
      role="form"
      aria-label="Conversational Application Wizard"
    >

      {/* ── Progress header ── */}
      <div className="mb-5 sm:mb-7" role="region" aria-label="Wizard Progress">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="step-chip text-[11px] sm:text-xs" aria-current="step">Step {currentStepIndex + 1} of {totalSteps}</span>
            {/* Step dot indicators (responsive) */}
            <div className="hidden sm:flex items-center gap-1.5 ml-2">
              {steps.map((_, idx) => (
                <span
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                    idx === currentStepIndex
                      ? 'bg-blue-600 scale-125'
                      : idx < currentStepIndex
                      ? 'bg-blue-300'
                      : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
          <span className="text-[11px] sm:text-xs font-semibold text-gray-400">{Math.round(progressPct)}%</span>
        </div>
        <div className="progress-track" role="progressbar" aria-valuenow={Math.round(progressPct)} aria-valuemin={0} aria-valuemax={100}>
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
          <div className="card p-5 sm:p-8" ref={stepContainerRef}>

            {/* Step heading */}
            {currentStep?.title && (
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 tracking-tight">
                {currentStep.title}
              </h2>
            )}
            {currentStep?.description && (
              <p className="text-xs sm:text-sm text-gray-400 mb-5 sm:mb-6 leading-relaxed">
                {currentStep.description}
              </p>
            )}

            {/* Fields */}
            <div aria-live="polite" className="space-y-1">
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

            {/* ── Navigation (Mobile Responsive) ── */}
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-0 pt-4 mt-3 border-t border-gray-100">
              <button
                type="button"
                className="btn-secondary min-h-[44px] sm:min-h-[38px] justify-center"
                onClick={handleBack}
                disabled={isFirstStep && !onCancel}
                aria-label={isFirstStep ? 'Exit conversational wizard' : 'Go to previous step'}
              >
                {isFirstStep ? '✕ Exit' : '← Back'}
              </button>

              <button
                type="button"
                className="btn-primary min-h-[44px] sm:min-h-[38px] justify-center"
                onClick={handleNext}
                aria-label={isLastStep ? 'Submit final application' : 'Continue to next step'}
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
