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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      className="max-w-lg mx-auto mt-16 p-8 bg-white rounded-2xl shadow-lg border border-red-100"
    >
      <div className="flex flex-col items-center text-center">
        <span className="text-5xl" role="img" aria-label="Warning">⚠️</span>

        <h2 className="text-xl font-bold text-gray-800 mt-4">We ran into a problem</h2>

        <p className="text-gray-500 mt-2">
          {message || "The AI couldn't generate a simplified form right now."}
        </p>

        {visibleErrors.length > 0 && (
          <ul className="mt-4 w-full text-left list-disc list-inside space-y-1">
            {visibleErrors.map((err, idx) => (
              <li key={idx} className="text-sm text-red-500">{err}</li>
            ))}
          </ul>
        )}

        <button
          className="btn-primary mt-6"
          onClick={onReturnToForm}
        >
          Return to Original Form
        </button>

        <p className="text-xs text-gray-400 mt-3">
          Your entered information has been preserved.
        </p>
      </div>
    </motion.div>
  )
}
