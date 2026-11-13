import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ASTValidator from '../lib/ASTValidator'
import { getComponent } from '../lib/ComponentRegistry'
import FormWizard from './FormWizard'
import FallbackUI from './FallbackUI'

const DynamicRenderer = ({
  uiSchema,
  preservedData,
  onComplete,
  onCancel,
  isLoading,
}) => {
  const [validationResult, setValidationResult] = useState({ valid: null, errors: [] })
  const [validatedSchema, setValidatedSchema] = useState(null)

  useEffect(() => {
    if (!uiSchema) {
      setValidatedSchema(null)
      return
    }

    const result = ASTValidator.validateUISchema(uiSchema)
    setValidationResult(result)

    if (result.valid) {
      setValidatedSchema(uiSchema)
    } else {
      setValidatedSchema(null)
      console.error('[DynamicRenderer] Schema validation errors:', result.errors)
    }
  }, [uiSchema])

  const renderContent = () => {
    if (isLoading) {
      return (
        <motion.div
          key="loading"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.3 }}
          className="card max-w-lg mx-auto py-16 px-8 flex flex-col items-center justify-center text-center shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-gray-100 rounded-3xl"
        >
          {/* Subtle soft pulsing circle */}
          <div className="relative mb-6">
            <motion.div
              animate={{
                scale: [1, 1.25, 1],
                opacity: [0.35, 0.05, 0.35],
              }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute -inset-2 rounded-full bg-blue-400 blur-sm"
            />
            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/25">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
                className="w-6 h-6 rounded-full border-2 border-white/20 border-t-white"
              />
            </div>
          </div>

          <p className="text-base font-semibold text-gray-900 tracking-tight mb-1">
            Adapting interface to your flow…
          </p>
          <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
            AuraGen detected high friction and is generating a step-by-step layout.
          </p>
        </motion.div>
      )
    }

    if (!uiSchema && !isLoading) {
      return null
    }

    if (validationResult.valid === false) {
      return (
        <FallbackUI
          errors={validationResult.errors}
          onReturnToForm={onCancel}
        />
      )
    }

    if (validatedSchema) {
      return (
        <FormWizard
          schema={validatedSchema}
          preservedData={preservedData}
          onComplete={onComplete}
          onCancel={onCancel}
        />
      )
    }

    return null
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="dynamic-renderer"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  )
}

export default DynamicRenderer
