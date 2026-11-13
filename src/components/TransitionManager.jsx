import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

function getCognitiveLoadStyle(score) {
  if (score <= 33) return 'bg-green-100 text-green-800'
  if (score <= 66) return 'bg-yellow-100 text-yellow-800'
  return 'bg-red-100 text-red-800 animate-pulse'
}

export default function TransitionManager({ mode, children, cognitiveScore, onModeChange }) {
  return (
    <div className="w-full">
      {cognitiveScore > 0 && (
        <div
          className={`fixed top-4 right-4 z-50 flex flex-col items-center rounded-full px-3 py-2 shadow-md text-sm font-semibold ${getCognitiveLoadStyle(cognitiveScore)}`}
          title="Cognitive Load Score"
        >
          <span>CL: {cognitiveScore}</span>
          <span className="text-xs font-normal">Cognitive Load</span>
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
