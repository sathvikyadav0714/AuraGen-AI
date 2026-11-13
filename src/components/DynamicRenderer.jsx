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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '300px',
            gap: '16px',
          }}
        >
          {/* Pulsing blue circle animation */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.7, 1, 0.7],
              boxShadow: [
                '0 0 0 0 rgba(59, 130, 246, 0.4)',
                '0 0 0 20px rgba(59, 130, 246, 0)',
                '0 0 0 0 rgba(59, 130, 246, 0)',
              ],
            }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                border: '3px solid rgba(255,255,255,0.3)',
                borderTopColor: '#fff',
              }}
            />
          </motion.div>

          <div style={{ textAlign: 'center' }}>
            <p
              style={{
                fontSize: '1.125rem',
                fontWeight: 600,
                color: '#1e293b',
                margin: 0,
              }}
            >
              AuraGen is analyzing your experience...
            </p>
            <p
              style={{
                fontSize: '0.875rem',
                color: '#64748b',
                marginTop: '6px',
              }}
            >
              Generating a personalized interface...
            </p>
          </div>
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
