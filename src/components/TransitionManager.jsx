import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

function getCognitiveLoadStyle(score) {
  if (score <= 33) return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (score <= 66) return 'bg-amber-50 text-amber-700 border-amber-200'
  return 'bg-rose-50 text-rose-700 border-rose-200 ring-2 ring-rose-100 animate-pulse'
}

export default function TransitionManager({ mode, children, cognitiveScore, onModeChange }) {
  return (
    <div className="w-full">
      {cognitiveScore > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-full px-3.5 py-1.5 shadow-[0_2px_12px_rgba(0,0,0,0.06)] border text-xs font-semibold backdrop-blur-md ${getCognitiveLoadStyle(cognitiveScore)}`}
          title="Live Cognitive Load Score"
        >
          <span className="w-2 h-2 rounded-full bg-current opacity-70" />
          <span>Cognitive Load: {cognitiveScore}/100</span>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
