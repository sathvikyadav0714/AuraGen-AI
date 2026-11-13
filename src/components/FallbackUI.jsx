import React from 'react'
import { motion } from 'framer-motion'

export default function FallbackUI({
  errors = [],
  onReturnToForm,
  message,
}) {
  const visibleErrors = errors.slice(0, 3)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="card max-w-lg mx-auto py-10 px-8 text-center rounded-3xl border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.03)] bg-white"
    >
      <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-xl text-amber-600">
        ⚠️
      </div>

      <h2 className="text-lg font-bold text-gray-900 tracking-tight">
        Could not adapt form
      </h2>

      <p className="text-xs text-gray-500 mt-1.5 max-w-xs mx-auto leading-relaxed">
        {message || "The AI response didn't pass strict security validation. Reverting safely."}
      </p>

      {visibleErrors.length > 0 && (
        <div className="mt-5 p-3.5 rounded-xl bg-red-50/60 border border-red-100 text-left">
          <p className="text-[11px] font-semibold text-red-700 uppercase tracking-wide mb-1.5">
            Validation Issues
          </p>
          <ul className="space-y-1">
            {visibleErrors.map((err, idx) => (
              <li key={idx} className="text-xs text-red-600 flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-red-400 shrink-0" />
                <span>{err}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        className="btn-primary w-full mt-6 text-xs py-2.5"
        onClick={onReturnToForm}
      >
        Return to Original Form
      </button>

      <p className="text-[11px] text-gray-400 mt-3">
        Your previously entered data remains preserved.
      </p>
    </motion.div>
  )
}
