import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function FallbackUI({
  errors = [],
  onReturnToForm,
  onRetry,
  message,
  preservedFieldCount = 0,
}) {
  const [showDetails, setShowDetails] = useState(false)
  const visibleErrors = errors.slice(0, 5)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="card max-w-lg mx-auto py-10 px-8 text-center rounded-3xl border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.03)] bg-white"
    >
      {/* Icon */}
      <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-2xl text-amber-600 shadow-sm">
        🛡️
      </div>

      <h2 className="text-xl font-bold text-gray-900 tracking-tight">
        Form Adaptation Paused
      </h2>

      <p className="text-xs text-gray-500 mt-2 max-w-sm mx-auto leading-relaxed">
        {message || "The AI response did not pass strict security and schema validation rules. Reverting safely to the standard form."}
      </p>

      {/* Data Preservation Guarantee Banner */}
      <div className="mt-5 p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-100 flex items-center gap-3 text-left">
        <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
          ✓
        </div>
        <div>
          <p className="text-xs font-semibold text-emerald-900">
            Your Entered Data is 100% Safe
          </p>
          <p className="text-[11px] text-emerald-700 leading-tight">
            All previously filled fields have been preserved and will be restored immediately.
          </p>
        </div>
      </div>

      {/* Diagnostics / Validation Errors */}
      {visibleErrors.length > 0 && (
        <div className="mt-4 text-left">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="text-[11px] font-medium text-gray-500 hover:text-gray-700 flex items-center gap-1.5 focus:outline-none"
          >
            <span>{showDetails ? '▼ Hide' : '▶ View'} Technical Diagnostics ({errors.length})</span>
          </button>

          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 p-3 rounded-xl bg-gray-50 border border-gray-200/80 text-[11px] font-mono text-gray-700 space-y-1 overflow-hidden"
              >
                {visibleErrors.map((err, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 text-rose-600">
                    <span className="shrink-0">•</span>
                    <span className="break-all">{err}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-6 flex flex-col sm:flex-row items-center gap-2.5">
        <button
          type="button"
          className="btn-primary w-full text-xs py-2.5"
          onClick={onReturnToForm}
        >
          Return to Original Form
        </button>

        {onRetry && (
          <button
            type="button"
            className="btn-secondary w-full text-xs py-2.5"
            onClick={onRetry}
          >
            Retry Transformation ↻
          </button>
        )}
      </div>

      <p className="text-[11px] text-gray-400 mt-4">
        AuraGen Self-Healing Architecture • Fallback Recovery System
      </p>
    </motion.div>
  )
}
